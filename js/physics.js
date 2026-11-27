import {
  G, CONFIRMED_UDL_KPA, S2_DEFAULTS, PE_BENCHMARK, MAT_DATA, PLATE_MAT_DATA,
  POWERED_MODELS, CATALOG_MODELS, CONCRETE_GRADES
} from './data.js?v=12';

const isPosNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const round2 = (v) => Math.round(v * 100) / 100;

export function gentModulusMPa(shoreA) {
  const s = Math.min(99, Math.max(20, shoreA));
  return (0.0981 * (56.0 + 7.62336 * s)) / (0.137505 * (254.0 - 2.54 * s));
}

export function hertzLineContact(F_N, dia_mm, width_mm, matKey, shoreA = 95, nuOverride = null) {
  const R_mm = dia_mm / 2.0;
  const nu_c = 0.20;
  const E_c = 30000.0;

  let E_w, nu_w, E_star;
  if (matKey === 'pu') {
    E_w = gentModulusMPa(shoreA);
    nu_w = isPosNum(nuOverride) ? nuOverride : MAT_DATA.pu.nu;
    // Elastomer on concrete (E_c >> E_w): report standard uses rigid-substrate form E* = E / (1 - nu^2)
    E_star = E_w / (1.0 - nu_w * nu_w);
  } else {
    E_w = MAT_DATA[matKey].E;
    nu_w = MAT_DATA[matKey].nu;
    E_star = 1.0 / ((1 - nu_w * nu_w) / E_w + (1 - nu_c * nu_c) / E_c);
  }

  const b_mm = F_N > 0 ? Math.sqrt((4.0 * F_N * R_mm) / (Math.PI * width_mm * E_star)) : 0;
  const area_mm2 = 2.0 * b_mm * width_mm;
  const p_mean = area_mm2 > 0 ? F_N / area_mm2 : 0;
  const p_max = area_mm2 > 0 ? (2.0 * F_N) / (Math.PI * b_mm * width_mm) : 0;

  return { E_w, nu_w, E_star, b_mm, contactWidth_mm: 2.0 * b_mm, area_mm2, p_mean, p_max };
}

export function punchingShearCheck({ V_Ed_N, a1_mm, a2_mm, d_mm, f_ck, f_cu, rho_l, code = 'BS8110', beta = 1.0 }) {
  const u0_mm = 2.0 * (a1_mm + a2_mm);
  const hasD = isPosNum(d_mm);
  const hasConcrete = isPosNum(f_ck) && isPosNum(f_cu);
  const hasRho = isPosNum(rho_l);

  const v_Ed_0 = hasD ? (beta * V_Ed_N) / (u0_mm * d_mm) : null;
  let u1_mm = null;
  let v_Ed_1 = null;
  let v_Rd_max = null;
  let v_Rd_c = null;

  if (code === 'EC2') {
    if (hasD) {
      u1_mm = u0_mm + 4.0 * Math.PI * d_mm;
      v_Ed_1 = (beta * V_Ed_N) / (u1_mm * d_mm);
    }
    if (hasConcrete) {
      const nu = 0.6 * (1.0 - f_ck / 250.0);
      const f_cd = (0.85 * f_ck) / 1.5;
      v_Rd_max = 0.4 * nu * f_cd;
      if (hasD && hasRho) {
        const rho_eff = Math.min(0.02, rho_l);
        const k = Math.min(1.0 + Math.sqrt(200.0 / d_mm), 2.0);
        const v_min = 0.035 * Math.pow(k, 1.5) * Math.sqrt(f_ck);
        v_Rd_c = Math.max(0.12 * k * Math.pow(100.0 * rho_eff * f_ck, 1 / 3), v_min);
      }
    }
  } else {
    if (hasD) {
      u1_mm = u0_mm + 12.0 * d_mm;
      v_Ed_1 = (beta * V_Ed_N) / (u1_mm * d_mm);
    }
    if (hasConcrete) {
      v_Rd_max = Math.min(0.8 * Math.sqrt(f_cu), 5.0);
      if (hasD && hasRho) {
        const pct = Math.min(3.0, Math.max(0.15, rho_l * 100.0));
        const f_cu_eff = Math.min(40.0, f_cu);
        const depthFactor = Math.max(0.67, Math.pow(400.0 / d_mm, 0.25));
        v_Rd_c = ((0.79 * Math.pow(pct, 1 / 3) * depthFactor) / 1.25) * Math.pow(f_cu_eff / 25.0, 1 / 3);
      }
    }
  }

  const pass_u0 = (v_Ed_0 !== null && v_Rd_max !== null) ? (v_Ed_0 <= v_Rd_max) : null;
  const pass_u1 = (v_Ed_1 !== null && v_Rd_c !== null) ? (v_Ed_1 <= v_Rd_c) : null;
  const utilization = (v_Ed_0 !== null && v_Ed_1 !== null && v_Rd_max !== null && v_Rd_c !== null)
    ? Math.max(v_Ed_0 / v_Rd_max, v_Ed_1 / v_Rd_c)
    : null;

  return {
    code,
    perimeterLabel: code === 'EC2' ? '2.0d' : '1.5d',
    u0_mm, u1_mm,
    v_Ed_0, v_Rd_max, pass_u0,
    v_Ed_1, v_Rd_c, pass_u1,
    utilization
  };
}

export function methodBBending(loads_kN_pos_m, L_m) {
  const active = loads_kN_pos_m
    .filter(([, a]) => a > 1e-6 && a < L_m - 1e-6)
    .sort((x, y) => x[1] - y[1]);

  if (active.length === 0) return { RA_kN: 0, RB_kN: 0, a_crit_m: L_m / 2, M_max_kNm: 0 };

  const totalP = active.reduce((s, [p]) => s + p, 0);
  const RB = active.reduce((s, [p, a]) => s + p * a, 0) / L_m;
  const RA = totalP - RB;

  let bestA = L_m / 2;
  let bestM = 0;
  for (let i = 0; i < active.length; i++) {
    const [, a] = active[i];
    let mHere = RA * a;
    for (let j = 0; j < i; j++) mHere -= active[j][0] * (a - active[j][1]);
    if (mHere > bestM) {
      bestM = mHere;
      bestA = a;
    }
  }
  return { RA_kN: RA, RB_kN: RB, a_crit_m: bestA, M_max_kNm: bestM };
}

// General Multi-Point Simply Supported Beam Solver (SFD + BMD per 1.0 m strip)
export function solveMultiPointBeam(loads, L_m) {
  const active = loads
    .filter((l) => l.x_m > 1e-6 && l.x_m < L_m - 1e-6 && l.pEff_kNm > 0)
    .sort((a, b) => a.x_m - b.x_m);

  if (active.length === 0 || !isPosNum(L_m)) {
    return {
      L_m: L_m || 0,
      RA_kNm: 0,
      RB_kNm: 0,
      V_max_kNm: 0,
      V_mid_kNm: 0,
      M_max_kNm: 0,
      x_Mmax_m: (L_m || 0) / 2,
      activeLoads: [],
      knotMoments: [],
      sfdPoints: [[0, 0], [L_m || 1, 0]],
      bmdPoints: [[0, 0], [L_m || 1, 0]]
    };
  }

  const totalP = active.reduce((s, l) => s + l.pEff_kNm, 0);
  const RB_kNm = active.reduce((s, l) => s + l.pEff_kNm * l.x_m, 0) / L_m;
  const RA_kNm = totalP - RB_kNm;

  // Group nearly-coincident positions so SFD drops cleanly once per x-coordinate
  const groups = [];
  for (const l of active) {
    const last = groups[groups.length - 1];
    if (last && Math.abs(last.x_m - l.x_m) < 1e-5) {
      last.pEff_kNm += l.pEff_kNm;
      last.P_kN += l.P_kN;
      last.items.push(l);
    } else {
      groups.push({ x_m: l.x_m, pEff_kNm: l.pEff_kNm, P_kN: l.P_kN, id: l.id, items: [l] });
    }
  }

  const sfdPoints = [[0, 0], [0, RA_kNm]];
  const bmdPoints = [[0, 0]];
  const knotMoments = [];

  let vCurr = RA_kNm;
  let mCurr = 0;
  let prevX = 0;
  let V_max_kNm = Math.max(Math.abs(RA_kNm), Math.abs(RB_kNm));
  let M_max_kNm = 0;
  let x_Mmax_m = L_m / 2;

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    mCurr += vCurr * (g.x_m - prevX);
    sfdPoints.push([g.x_m, vCurr]);
    bmdPoints.push([g.x_m, mCurr]);
    knotMoments.push({ x_m: g.x_m, M_kNm: mCurr, V_before: vCurr, V_after: vCurr - g.pEff_kNm, id: g.id, pEff_kNm: g.pEff_kNm });

    if (mCurr > M_max_kNm) {
      M_max_kNm = mCurr;
      x_Mmax_m = g.x_m;
    }

    vCurr -= g.pEff_kNm;
    sfdPoints.push([g.x_m, vCurr]);
    V_max_kNm = Math.max(V_max_kNm, Math.abs(vCurr));
    prevX = g.x_m;
  }

  mCurr += vCurr * (L_m - prevX);
  sfdPoints.push([L_m, vCurr], [L_m, 0]);
  bmdPoints.push([L_m, 0]);

  // Mid-segment interior shear (e.g., between outer SRS-6 and center TS-10T)
  let V_mid_kNm = 0;
  if (knotMoments.length >= 3) {
    V_mid_kNm = Math.max(Math.abs(knotMoments[0].V_after), Math.abs(knotMoments[knotMoments.length - 1].V_before));
  } else if (knotMoments.length === 1) {
    V_mid_kNm = Math.abs(knotMoments[0].V_before);
  }

  return {
    L_m,
    RA_kNm,
    RB_kNm,
    V_max_kNm,
    V_mid_kNm,
    M_max_kNm,
    x_Mmax_m,
    activeLoads: active,
    knotMoments,
    sfdPoints,
    bmdPoints
  };
}

function evaluateSkateUnit({ nomSkate_kN, peakSkate_kN, nWheels, wheelsPerFork = 1, dia, width, pairWidth, matKey, shoreA, nuPU, chassisW, chassisL }) {
  const staticWheel_kN = nomSkate_kN / nWheels;
  const staticFork_kN = staticWheel_kN * wheelsPerFork;

  let peakFork_kN, peakWheel_kN;
  if (wheelsPerFork >= 2) {
    peakFork_kN = peakSkate_kN * 0.35;
    peakWheel_kN = peakFork_kN / wheelsPerFork;
  } else if (nWheels === 4) {
    peakFork_kN = peakSkate_kN * 0.35;
    peakWheel_kN = peakFork_kN;
  } else {
    const activeRollers = Math.max(2, Math.floor(nWheels * 0.50));
    peakWheel_kN = peakSkate_kN / activeRollers;
    peakFork_kN = peakWheel_kN;
  }

  const hertzStatic = hertzLineContact(staticWheel_kN * 1000, dia, width, matKey, shoreA, nuPU);
  const hertz = hertzLineContact(peakWheel_kN * 1000, dia, width, matKey, shoreA, nuPU);
  const patchW_mm = Math.max(50, pairWidth || width);
  const patchL_mm = Math.max(50, hertz.contactWidth_mm);

  return {
    nomSkate_kN,
    peakSkate_kN,
    staticFork_kN,
    peakFork_kN,
    staticWheel_kN,
    peakWheel_kN,
    nWheels,
    wheelsPerFork,
    dia,
    width,
    hertzStatic,
    hertz,
    patchW_mm,
    patchL_mm,
    chassisW,
    chassisL
  };
}

// Shared Spreader Plate + Modes 1, 2, 3, BRC B7 & Deflection Evaluator
function evaluateSlabChecks({
  plat, grossMass, grossWeight_kN, phiDynamic,
  peakSupportLoad_kN, maxForkStatic_kN, maxForkLoad_kN, maxWheelStatic_kN, maxWheelLoad_kN, governing,
  plateEnabled, B_plate, L_plate, t_plate, plateMat,
  pAllowFloor, hSlab, dSlab, concrete, rhoL, designCode, spanL, udlLimit_kPa,
  baseCoords, beMode = 'bs8110', mode3Spec = null,
  calcModel = 'report', meLoadOn = false, peData = null, useOverallUdl = true
}) {
  const hasHSlab = isPosNum(hSlab);
  const h_mm = hasHSlab ? hSlab : S2_DEFAULTS.hSlab;
  const hSlab_m = h_mm / 1000.0;
  const cover_mm = S2_DEFAULTS.cover_mm;
  const barDia_mm = S2_DEFAULTS.barDia_mm;
  // BS 8110-1 As-Built: d_v = h - c (130 mm), flexural d = h - c - bar/2 (126.5 mm)
  const effectiveDSlab = isPosNum(dSlab) ? Math.min(h_mm, dSlab) : (hasHSlab ? Math.max(20, h_mm - cover_mm) : null);
  const dFlex_mm = hasHSlab ? Math.max(20, h_mm - cover_mm - barDia_mm / 2.0) : null;
  const zMax_mm = dFlex_mm ? Math.floor(0.95 * dFlex_mm * 10) / 10 : null; // 120.1 mm on 150 mm S2
  const asProv_mm2_m = S2_DEFAULTS.asProv_mm2_m; // 385 mm^2/m (BRC B7)
  const fy_MPa = S2_DEFAULTS.fy_MPa;             // 460 MPa

  const hasRhoL = isPosNum(rhoL);
  const effectiveRhoL = hasRhoL ? rhoL : (effectiveDSlab ? (asProv_mm2_m / (1000.0 * effectiveDSlab)) : S2_DEFAULTS.rhoL);
  const hasSpanL = isPosNum(spanL);
  const hasPAllow = isPosNum(pAllowFloor);
  const hasUdlLimit = isPosNum(udlLimit_kPa);

  const gammaULS = designCode === 'EC2' ? 1.50 : 1.60;
  const singlePlateMass = (B_plate / 1000) * (L_plate / 1000) * (t_plate / 1000) * plateMat.rho;

  // UDL Checks: Skid Platform (8.36 m^2) + Overall PNM Footprint (7.30 x 2.20 = 16.06 m^2)
  const activeWeight_kN = peData ? peData.totalLoad_kN : grossWeight_kN;
  const udl_kPa = activeWeight_kN / plat.area;
  const udl_ton = (grossMass / 1000) / plat.area;
  const udlLimit_ton = hasUdlLimit ? udlLimit_kPa / G : null;
  const isSkidUdlPass = hasUdlLimit ? (udl_kPa <= udlLimit_kPa) : null;

  const overallArea_m2 = S2_DEFAULTS.pnmOverallArea;
  const overallUdl_kPa = activeWeight_kN / overallArea_m2;
  const overallAllow_kN = hasUdlLimit ? (overallArea_m2 * udlLimit_kPa) : null;
  const isOverallUdlPass = hasUdlLimit ? (overallUdl_kPa <= udlLimit_kPa) : null;
  // Facility main beams/columns exemption governed by Overall Footprint UDL (16.06 m^2 <= 120.45 kN) for PNM skate presets
  const isUdlPass = useOverallUdl ? isOverallUdlPass : isSkidUdlPass;

  // Spreader Plate
  const B_code_min = hasHSlab ? 2 * h_mm : null;
  const bogieWidth = governing.chassisW;
  const isPlateUndersized = plateEnabled && (B_plate < bogieWidth || L_plate < governing.chassisL);
  const plateCapLimitW = hasHSlab ? Math.max(bogieWidth, B_code_min * 1.5) : B_plate;
  const effectivePlateCapW = Math.min(B_plate, plateCapLimitW);
  const plateContactL = Math.min(L_plate, Math.max(governing.chassisL, hasHSlab ? B_code_min : 0));

  const cantilever_c = (plateEnabled && !isPlateUndersized)
    ? Math.max(0, (effectivePlateCapW - bogieWidth) / 2)
    : 0;
  const pNominal_MPa = (peakSupportLoad_kN * 1000) / (effectivePlateCapW * plateContactL);

  let t_req = 0;
  if (plateEnabled && cantilever_c > 0) {
    t_req = cantilever_c * Math.sqrt((3 * pNominal_MPa) / plateMat.sigma_allow);
  }
  const isRigid = plateEnabled && !isPlateUndersized && (t_plate >= t_req);
  const isCurling = plateEnabled && !isPlateUndersized && (t_plate < t_req);

  let Beff = bogieWidth;
  if (plateEnabled && !isPlateUndersized) {
    if (isRigid) {
      Beff = effectivePlateCapW;
    } else {
      const sr = t_req > 0 ? Math.max(0.05, Math.min(1.0, t_plate / t_req)) : 1.0;
      Beff = bogieWidth + 2 * cantilever_c * Math.pow(sr, 1.5);
    }
  }

  // Mode 1: Local Compression (Gent + Hertz + 1.6x ULS & Rigid Patch)
  let contactPressure_static_mean_MPa, contactPressure_mean_MPa, contactPressure_max_MPa;
  if (plateEnabled && isRigid) {
    const pStaticPlate = ((activeWeight_kN / Math.max(1, baseCoords.length)) * 1000) / (Beff * plateContactL);
    contactPressure_static_mean_MPa = pStaticPlate;
    contactPressure_mean_MPa = (peakSupportLoad_kN * 1000) / (Beff * plateContactL);
    contactPressure_max_MPa = contactPressure_mean_MPa;
  } else {
    contactPressure_static_mean_MPa = governing.hertzStatic ? governing.hertzStatic.p_mean : governing.hertz.p_mean;
    contactPressure_mean_MPa = governing.hertz.p_mean;
    contactPressure_max_MPa = governing.hertz.p_max;
  }
  const contactPressure_uls_MPa = gammaULS * contactPressure_mean_MPa;

  // Rigid Patch Benchmark (Report: gov Lw x 20 mm; PE J2-ANA-1-1: 60 x 20 = 1,200 mm^2 @ F_wheel)
  const rigidPatchW_mm = (calcModel === 'pe' && peData) ? 60 : (governing.width || 85);
  const rigidPatchL_mm = 20;
  const rigidPatchArea_mm2 = rigidPatchW_mm * rigidPatchL_mm;
  const rigidWheel_kN = (calcModel === 'pe' && peData) ? peData.govWheelPeak_kN : (governing.peakWheel_kN || maxWheelLoad_kN);
  const rigidPatch_unfactored_MPa = (plateEnabled && isRigid)
    ? contactPressure_mean_MPa
    : ((rigidWheel_kN * 1000) / rigidPatchArea_mm2);
  const rigidPatch_uls_MPa = gammaULS * rigidPatch_unfactored_MPa;

  const fcuVal = concrete ? concrete.f_cu : S2_DEFAULTS.fcu;
  const concreteDryBearing_MPa = 0.4 * fcuVal;  // 12.0 MPa strict
  const concreteUlsBearing_MPa = 0.6 * fcuVal;  // 18.0 MPa ULS
  const mode1Limit_MPa = hasPAllow ? Math.min(pAllowFloor, concreteDryBearing_MPa) : concreteDryBearing_MPa;
  const mode1UlsLimit_MPa = concreteUlsBearing_MPa;

  const activeMode1CheckVal = (calcModel === 'pe' && peData && !plateEnabled)
    ? rigidPatch_uls_MPa
    : contactPressure_mean_MPa;
  const isMode1Pass = (activeMode1CheckVal <= mode1Limit_MPa) && (contactPressure_uls_MPa <= mode1UlsLimit_MPa);
  const isMode1MaxPass = contactPressure_max_MPa <= mode1Limit_MPa;

  // Mode 2: BS 8110-1 Cl. 3.7.7 Punching Shear + EN 1991-1-1 Qk Reference
  const qkStaticLimit_kN = S2_DEFAULTS.qkStatic_kN;
  const qkPeakLimit_kN = S2_DEFAULTS.qkPeak_kN;
  const qkStaticVal_kN = isPosNum(maxForkStatic_kN) ? maxForkStatic_kN : (isPosNum(maxWheelStatic_kN) ? maxWheelStatic_kN : 0);
  const qkPeakVal_kN = (calcModel === 'pe' && peData) ? peData.govWheelPeak_kN : maxForkLoad_kN;
  const isQkStaticPass = qkStaticVal_kN <= qkStaticLimit_kN;
  const isQkPeakPass = qkPeakVal_kN <= qkPeakLimit_kN;
  const isMode2QkPass = (plateEnabled && isRigid) ? true : (isQkStaticPass && isQkPeakPass);

  // Mode 2 Cl. 3.7.7 Single-Wheel & Overlap Checks (d_v = 130 mm)
  const punchPatchW_mm = (plateEnabled && isRigid) ? Beff : rigidPatchW_mm;
  const punchPatchL_mm = (plateEnabled && isRigid) ? plateContactL : rigidPatchL_mm;
  const shearWheelLoad_kN = (plateEnabled && isRigid) ? peakSupportLoad_kN : rigidWheel_kN;
  const F_ult_wheel_N = gammaULS * shearWheelLoad_kN * 1000;

  const P_face_mm = 2.0 * (punchPatchW_mm + punchPatchL_mm);
  const v_face_MPa = effectiveDSlab ? (F_ult_wheel_N / (P_face_mm * effectiveDSlab)) : null;

  const punch = punchingShearCheck({
    V_Ed_N: F_ult_wheel_N,
    a1_mm: punchPatchW_mm,
    a2_mm: punchPatchL_mm,
    d_mm: effectiveDSlab,
    f_ck: concrete ? concrete.f_ck : 25,
    f_cu: fcuVal,
    rho_l: effectiveRhoL,
    code: designCode,
    beta: 1.0
  });

  // Adjacent two-wheel overlapping 1.5d perimeter u_overlap = 1,720 mm
  const u_overlap_mm = effectiveDSlab ? (2.0 * (rigidPatchL_mm + 3.0 * effectiveDSlab) + 2.0 * (60 + 3.0 * effectiveDSlab)) : null;
  const v_overlap_MPa = (effectiveDSlab && u_overlap_mm) ? ((2.0 * F_ult_wheel_N) / (u_overlap_mm * effectiveDSlab)) : null;
  const halfVc_MPa = punch.v_Rd_c !== null ? (0.5 * punch.v_Rd_c) : null;

  const isMode2FacePass = (v_face_MPa !== null && punch.v_Rd_max !== null) ? (v_face_MPa <= punch.v_Rd_max) : true;
  const isMode2PerimPass = (punch.v_Ed_1 !== null && halfVc_MPa !== null) ? (punch.v_Ed_1 <= halfVc_MPa) : true;
  const isMode2Pass = (plateEnabled && isRigid)
    ? (isMode2FacePass && punch.pass_u1 !== false)
    : (calcModel === 'pe' ? (isMode2FacePass && isMode2PerimPass) : (isMode2FacePass && isMode2PerimPass && isMode2QkPass));

  const isSpreadOK = plateEnabled
    ? (hasHSlab ? (isRigid && B_plate >= B_code_min) : null)
    : false;
  const shearTopW_mm = (plateEnabled && !isPlateUndersized) ? Beff : governing.patchW_mm;
  const bottomSpread_mm = hasHSlab ? (shearTopW_mm + 2 * h_mm) : null;

  // Mode 3: Bending, Shear, BRC B7 Rebar Check & Deflection (L = 2.80 m / Span L)
  const w_DL_kPa = (hSlab_m * 24.0) + (meLoadOn ? S2_DEFAULTS.meHanging_kPa : 0.0);
  const M_DL_kNm = hasSpanL ? (w_DL_kPa * spanL * spanL) / 8.0 : null;
  const M_UDL_benchmark = (hasSpanL && hasUdlLimit) ? (udlLimit_kPa * 1.0 * spanL * spanL) / 8.0 : null;
  const V_UDL_benchmark = (hasSpanL && hasUdlLimit) ? (udlLimit_kPa * 1.0 * spanL) / 2.0 : null;

  let M_imposed_max = null;
  let V_imposed_max = null;
  let M_des_kNm = null;
  let M_ult_kNm = null;
  let K_flex = null;
  let z_flex_mm = zMax_mm;
  let As_req_mm2_m = null;
  let M_raw_max = null;
  let b_e_governing = null;
  let bendingOrientation = null;
  let beam = null;
  let beamAlt = null;
  let deflection = null;

  if (dFlex_mm && zMax_mm) {
    M_ult_kNm = (0.87 * fy_MPa * asProv_mm2_m * zMax_mm) / 1e6; // 18.50 kNm/m on BRC B7
  }

  if (hasSpanL && mode3Spec) {
    const buildBeamLoads = (mode) => mode3Spec.rawLoads.map((ld) => {
      let be_m;
      if (ld.fixedBe_m) {
        be_m = ld.fixedBe_m;
      } else if (mode === 'bs8110') {
        be_m = round2(ld.b_skate_m + 2.4 * ld.x_m * Math.max(0, 1.0 - ld.x_m / spanL));
      } else {
        be_m = round2(ld.b_skate_m + 2.0 * hSlab_m);
      }
      return {
        ...ld,
        be_m,
        pEff_kNm: ld.P_kN / be_m
      };
    });

    const primaryLoads = buildBeamLoads(beMode);
    const altLoads = buildBeamLoads(beMode === 'bs8110' ? '45deg' : 'bs8110');
    beam = solveMultiPointBeam(primaryLoads, spanL);
    beamAlt = solveMultiPointBeam(altLoads, spanL);

    M_imposed_max = beam.M_max_kNm;
    V_imposed_max = beam.V_max_kNm;
    const midLoad = primaryLoads.find((l) => l.isPrimaryMid) || primaryLoads[0];
    b_e_governing = midLoad ? midLoad.be_m : 1.0;
    M_raw_max = M_imposed_max * b_e_governing;
    bendingOrientation = beMode === 'bs8110' ? 'BS 8110 Cl. 3.5.2.2' : '45° Dispersion';

    if (calcModel === 'pe' && peData && peData.feaMdes_kNm) {
      M_des_kNm = peData.feaMdes_kNm;
    } else if (M_DL_kNm !== null) {
      M_des_kNm = 1.4 * M_DL_kNm + 1.6 * M_imposed_max;
    }

    if (M_des_kNm !== null && dFlex_mm) {
      K_flex = (M_des_kNm * 1e6) / (fcuVal * 1000.0 * dFlex_mm * dFlex_mm);
      const leverArmRaw = dFlex_mm * (0.5 + Math.sqrt(Math.max(0.0, 0.25 - K_flex / 0.9)));
      z_flex_mm = Math.min(zMax_mm, leverArmRaw);
      As_req_mm2_m = (M_des_kNm * 1e6) / (0.87 * fy_MPa * z_flex_mm);
    }

    // Serviceability Deflection (BS 8110-1 Part 2)
    const Ec_MPa = 20000 + 200 * fcuVal;
    const I_mm4 = (1000.0 * Math.pow(h_mm, 3)) / 12.0;
    const EI_kNm2 = (Ec_MPa * 1e3) * (I_mm4 * 1e-12); // 7,312.5 kNm^2 on 150 mm, C25/30
    const delta_DL_mm = ((5.0 * w_DL_kPa * Math.pow(spanL, 4)) / (384.0 * EI_kNm2)) * 1000.0;
    let delta_LL_mm = 0;
    beam.activeLoads.forEach((ld) => {
      const a = Math.min(ld.x_m, spanL - ld.x_m);
      delta_LL_mm += ((ld.pEff_kNm * a * (3.0 * spanL * spanL - 4.0 * a * a)) / (48.0 * EI_kNm2)) * 1000.0;
    });
    const delta_total_mm = delta_DL_mm + delta_LL_mm;
    const limitLL_mm = (spanL * 1000.0) / 500.0;
    const limitTotal_mm = (spanL * 1000.0) / 250.0;
    deflection = {
      Ec_MPa,
      I_mm4,
      EI_kNm2,
      delta_DL_mm,
      delta_LL_mm,
      delta_total_mm,
      limitLL_mm,
      limitTotal_mm,
      isLLPass: delta_LL_mm <= limitLL_mm,
      isTotalPass: delta_total_mm <= limitTotal_mm,
      isPass: (delta_LL_mm <= limitLL_mm) && (delta_total_mm <= limitTotal_mm)
    };
  } else if (hasSpanL) {
    M_imposed_max = 0;
    M_raw_max = 0;
    b_e_governing = 1.0;
    bendingOrientation = 'Longitudinal';

    const totalDyn = grossWeight_kN * phiDynamic;
    const remLoad = Math.max(0, totalDyn - peakSupportLoad_kN) / Math.max(1, baseCoords.length - 1);

    for (let peakIdx = 0; peakIdx < baseCoords.length; peakIdx++) {
      const layout = baseCoords.map((c, idx) => ({
        ...c,
        P: idx === peakIdx ? peakSupportLoad_kN : remLoad
      }));

      for (let shift = -plat.length; shift <= spanL + 0.1; shift += 0.10) {
        const res = methodBBending(layout.map((c) => [c.P, c.x + shift]), spanL);
        if (res.M_max_kNm > 0) {
          const b_e = plat.width + 2.4 * res.a_crit_m * (1 - res.a_crit_m / spanL);
          const mStrip = res.M_max_kNm / b_e;
          if (mStrip > M_imposed_max) {
            M_imposed_max = mStrip; M_raw_max = res.M_max_kNm; b_e_governing = b_e;
            bendingOrientation = 'Longitudinal';
          }
        }
      }

      const railGroups = [
        { list: layout.filter((c) => c.y < plat.width / 2 - 1e-6), label: 'Single Rail' },
        { list: layout.filter((c) => Math.abs(c.y - plat.width / 2) <= 1e-6), label: 'Centerline' }
      ];
      for (const grp of railGroups) {
        if (grp.list.length === 0) continue;
        for (let shift = -plat.length; shift <= spanL + 0.1; shift += 0.10) {
          const res = methodBBending(grp.list.map((c) => [c.P, c.x + shift]), spanL);
          if (res.M_max_kNm > 0) {
            const b_load = grp.list[0].b;
            const b_e = Math.min(plat.width, b_load + 2.4 * res.a_crit_m * (1 - res.a_crit_m / spanL));
            const mStrip = res.M_max_kNm / b_e;
            if (mStrip > M_imposed_max) {
              M_imposed_max = mStrip; M_raw_max = res.M_max_kNm; b_e_governing = b_e;
              bendingOrientation = grp.label;
            }
          }
        }
      }

      for (let shift = -plat.width; shift <= spanL + 0.1; shift += 0.10) {
        const res = methodBBending(layout.map((c) => [c.P, c.y + shift]), spanL);
        if (res.M_max_kNm > 0) {
          const b_e = plat.length + 2.4 * res.a_crit_m * (1 - res.a_crit_m / spanL);
          const mStrip = res.M_max_kNm / b_e;
          if (mStrip > M_imposed_max) {
            M_imposed_max = mStrip; M_raw_max = res.M_max_kNm; b_e_governing = b_e;
            bendingOrientation = 'Transverse';
          }
        }
      }
    }
    V_imposed_max = M_imposed_max > 0 ? (M_imposed_max * 4.0) / spanL : 0;
  }

  const isMode3MomentPass = (M_des_kNm !== null && M_ult_kNm !== null)
    ? (M_des_kNm <= M_ult_kNm)
    : ((M_imposed_max !== null && M_UDL_benchmark !== null) ? (M_imposed_max <= M_UDL_benchmark) : null);
  const isMode3RebarPass = (As_req_mm2_m !== null) ? (As_req_mm2_m <= asProv_mm2_m) : true;
  const isMode3ShearPass = (V_imposed_max !== null && V_UDL_benchmark !== null)
    ? (V_imposed_max <= V_UDL_benchmark)
    : null;
  const isMode3Pass = (isMode3MomentPass !== null)
    ? (isMode3MomentPass && isMode3RebarPass)
    : null;

  const isDeflectionPass = deflection ? deflection.isPass : null;
  const gates = [isUdlPass, isMode1Pass, isMode2Pass, isMode3Pass, isDeflectionPass];
  const allPass = gates.some((g) => g === false) ? false : gates.every((g) => g === true) ? true : null;

  return {
    hasHSlab, effectiveDSlab, dFlex_mm, zMax_mm, asProv_mm2_m, fy_MPa, hasRhoL, hasSpanL, hasPAllow,
    singlePlateMass, udl_kPa, udl_ton, udlLimit_kPa, udlLimit_ton,
    isSkidUdlPass, overallArea_m2, overallUdl_kPa, overallAllow_kN, isOverallUdlPass, isUdlPass,
    gammaULS, B_code_min, t_req, isRigid, isCurling, isPlateUndersized, Beff, shearTopW_mm,
    contactPressure_static_mean_MPa, contactPressure_mean_MPa, contactPressure_max_MPa, contactPressure_uls_MPa,
    rigidPatchW_mm, rigidPatchL_mm, rigidPatchArea_mm2, rigidPatch_unfactored_MPa, rigidPatch_uls_MPa,
    concreteDryBearing_MPa, concreteUlsBearing_MPa, mode1Limit_MPa, mode1UlsLimit_MPa, isMode1MaxPass,
    qkStaticLimit_kN, qkPeakLimit_kN, qkStaticVal_kN, qkPeakVal_kN,
    isQkStaticPass, isQkPeakPass, isMode2QkPass,
    punch, F_ult_wheel_N, P_face_mm, v_face_MPa, u_overlap_mm, v_overlap_MPa, halfVc_MPa,
    isMode2FacePass, isMode2PerimPass,
    shearLoad_ULS_N: F_ult_wheel_N, bottomSpread_mm, isSpreadOK,
    w_DL_kPa, M_DL_kNm, M_UDL_benchmark, V_UDL_benchmark, M_imposed_max, V_imposed_max,
    M_des_kNm, M_ult_kNm, K_flex, z_flex_mm, As_req_mm2_m,
    M_raw_max, b_e_governing, bendingOrientation, beam, beamAlt, beMode, deflection,
    isMode1Pass, isMode2Pass, isMode3MomentPass, isMode3RebarPass, isMode3ShearPass, isMode3Pass, isDeflectionPass, allPass
  };
}

// AMR / Skate coordinates (1=2-Skates, 2=4-Point, 3=6-Point CRQ-8 CAD, 4=8-Point, 5=10-Point)
function buildSkateCoords(activeSetup, platL, platW, poweredChassisW, followerChassisW) {
  const coords = [];
  if (activeSetup === 1) {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
  } else if (activeSetup === 2) {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL / 2, y: 0.26, b: followerChassisW / 1000 });
    coords.push({ x: platL / 2, y: platW - 0.26, b: followerChassisW / 1000 });
  } else if (activeSetup === 3) {
    // CAD Plan Layout (Figure 1d/1e & PE J2-ANA-1-1):
    // 2x TS-10T centered on front & rear 2.20 m ends; 4x passive CRQ-8 along 3.80 m longitudinal side rails
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000, role: 'frontPwr' });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000, role: 'rearPwr' });
    // Front passive offset 330 mm behind front powered edge (0.60 + 0.33 = 0.93 m); Rear passive 650 mm inboard
    const frontPsvX = Math.min(platL * 0.42, 0.93);
    const rearPsvX = Math.max(platL * 0.58, platL - 0.65);
    coords.push({ x: frontPsvX, y: 0.26, b: followerChassisW / 1000, role: 'frontPsv' });
    coords.push({ x: frontPsvX, y: platW - 0.26, b: followerChassisW / 1000, role: 'frontPsv' });
    coords.push({ x: rearPsvX, y: 0.26, b: followerChassisW / 1000, role: 'rearPsv' });
    coords.push({ x: rearPsvX, y: platW - 0.26, b: followerChassisW / 1000, role: 'rearPsv' });
  } else if (activeSetup === 4) {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: 0.30, y: 0.25, b: followerChassisW / 1000 });
    coords.push({ x: 0.30, y: platW - 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL / 2, y: 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL / 2, y: platW - 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW - 0.25, b: followerChassisW / 1000 });
  } else {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    const xs = [0.45, 0.45 + (platL - 0.90) / 3, 0.45 + (2 * (platL - 0.90)) / 3, platL - 0.45];
    xs.forEach((xp) => {
      coords.push({ x: xp, y: 0.25, b: followerChassisW / 1000 });
      coords.push({ x: xp, y: platW - 0.25, b: followerChassisW / 1000 });
    });
  }
  return coords;
}

// Mobile Base Caster coordinates (numCasters = 4, 6, or 8)
function buildCasterCoords(numCasters, platL, platW, casterWidthM) {
  const coords = [];
  if (numCasters === 4) {
    coords.push({ x: 0.30, y: 0.25, b: casterWidthM });
    coords.push({ x: 0.30, y: platW - 0.25, b: casterWidthM });
    coords.push({ x: platL - 0.30, y: 0.25, b: casterWidthM });
    coords.push({ x: platL - 0.30, y: platW - 0.25, b: casterWidthM });
  } else if (numCasters === 6) {
    coords.push({ x: 0.30, y: 0.25, b: casterWidthM });
    coords.push({ x: 0.30, y: platW - 0.25, b: casterWidthM });
    coords.push({ x: platL / 2, y: 0.25, b: casterWidthM });
    coords.push({ x: platL / 2, y: platW - 0.25, b: casterWidthM });
    coords.push({ x: platL - 0.30, y: 0.25, b: casterWidthM });
    coords.push({ x: platL - 0.30, y: platW - 0.25, b: casterWidthM });
  } else {
    const xs = [0.35, 0.35 + (platL - 0.70) / 3, 0.35 + (2 * (platL - 0.70)) / 3, platL - 0.35];
    xs.forEach((xp) => {
      coords.push({ x: xp, y: 0.25, b: casterWidthM });
      coords.push({ x: xp, y: platW - 0.25, b: casterWidthM });
    });
  }
  return coords;
}

export function runPhysicsCalculations(inputs) {
  const {
    mPnm, mBase, addLoadPerFollower = 0,
    poweredModelKey, followerModelKey,
    followerUnitWeight, nFollowerWheels, dFollower, wFollower, matKey, shoreA, nuPU = null,
    platL = 3.80, platW = 2.20, skateBiasPct,
    plateEnabled, B_plate, L_plate, t_plate, plateMatKey,
    pAllowFloor, hSlab, dSlab, concreteGradeKey, rhoL, designCode,
    spanL, udlLimit_kPa = CONFIRMED_UDL_KPA, beMode = 'bs8110',
    calcModel = 'report', meLoadOn = false, spanAlign = 'transverse3',
    activeSetup
  } = inputs;

  const safePlatL = isPosNum(platL) ? Math.max(0.90, platL) : 3.80;
  const safePlatW = isPosNum(platW) ? Math.max(0.60, platW) : 2.20;
  const platArea = safePlatL * safePlatW;
  const plat = { length: safePlatL, width: safePlatW, area: platArea, label: `${safePlatL.toFixed(2)} × ${safePlatW.toFixed(2)} m (${platArea.toFixed(2)} m²)` };

  const poweredSpec = POWERED_MODELS[poweredModelKey] || POWERED_MODELS['TS-10T'];
  const followerSpec = CATALOG_MODELS[followerModelKey] || null;
  const concrete = (concreteGradeKey && CONCRETE_GRADES[concreteGradeKey]) || CONCRETE_GRADES['C25/30'];
  const plateMat = PLATE_MAT_DATA[plateMatKey] || PLATE_MAT_DATA.ss400;

  const phiDynamic = 1.20;

  const totalPoweredTare = 2 * poweredSpec.unitTare;
  const numFollowers =
    activeSetup === 1 ? 0 :
    activeSetup === 2 ? 2 :
    activeSetup === 3 ? 4 :
    activeSetup === 4 ? 6 : 8;
  const totalSkates = 2 + numFollowers;

  const unitFollowerMass = Number.isFinite(followerUnitWeight) && followerUnitWeight >= 0
    ? followerUnitWeight
    : (followerSpec ? followerSpec.unitTare : 85);
  const totalFollowerTare = unitFollowerMass * numFollowers;
  const totalAdditionalLoad = (Number.isFinite(addLoadPerFollower) ? addLoadPerFollower : 0) * numFollowers;

  const grossMass = mPnm + mBase + totalPoweredTare + totalFollowerTare + totalAdditionalLoad;
  const grossWeight_kN = (grossMass * G) / 1000;

  // Report vs PE J2-ANA-1-1 Reaction Data
  let peData = null;
  if (calcModel === 'pe') {
    if (activeSetup === 1) {
      const peScale = grossWeight_kN / 77.8914;
      peData = {
        totalLoad_kN: PE_BENCHMARK.grossLoad8_kN * peScale,
        govWheelPeak_kN: 20.0 * peScale,
        reactions: [40.0 * peScale, 40.0 * peScale],
        feaMdes_kNm: null
      };
    } else if (activeSetup === 3) {
      const peScale = grossWeight_kN / 81.2268;
      const r = PE_BENCHMARK.reactions6_kN;
      peData = {
        totalLoad_kN: PE_BENCHMARK.grossLoad6_kN * peScale,
        govWheelPeak_kN: PE_BENCHMARK.govCornerPeak_kN * peScale,
        reactions: [
          r.frontPwr * peScale, r.rearPwr * peScale,
          r.frontPsv * peScale, r.frontPsv * peScale,
          r.rearPsv * peScale, r.rearPsv * peScale
        ],
        feaMdes_kNm: PE_BENCHMARK.mode3FeaMdes_kNm * peScale,
        feaAsReq_mm2: PE_BENCHMARK.mode3FeaAsReq_mm2 * peScale
      };
    }
  }

  const nominalSkateLoad_kN = grossWeight_kN / totalSkates;
  const minBias = 1.0 / totalSkates;
  const defaultBias =
    activeSetup === 1 ? 0.60 :
    activeSetup === 2 ? 0.35 :
    activeSetup === 3 ? 0.20 :
    activeSetup === 4 ? 0.20 : 0.19;

  const effectiveBias = Math.max(minBias, skateBiasPct ? skateBiasPct / 100 : defaultBias);
  const peakSkateLoad_kN = (calcModel === 'pe' && peData && activeSetup === 3)
    ? (Math.max(...peData.reactions) * phiDynamic)
    : (grossWeight_kN * effectiveBias * phiDynamic);

  const powEval = evaluateSkateUnit({
    nomSkate_kN: nominalSkateLoad_kN,
    peakSkate_kN: grossWeight_kN * effectiveBias * phiDynamic,
    nWheels: poweredSpec.wheels,
    wheelsPerFork: poweredSpec.wheelsPerFork,
    dia: poweredSpec.dia,
    width: poweredSpec.width,
    pairWidth: poweredSpec.wheelsPerFork === 2 ? poweredSpec.width * 2 : poweredSpec.width,
    matKey: 'pu',
    shoreA: poweredSpec.shoreA,
    nuPU,
    chassisW: poweredSpec.chassisW,
    chassisL: poweredSpec.chassisL
  });

  let folEval = null;
  if (numFollowers > 0) {
    const folPeakSk = (calcModel === 'pe' && peData && activeSetup === 3)
      ? (Math.max(...peData.reactions) * phiDynamic)
      : (grossWeight_kN * effectiveBias * phiDynamic);
    folEval = evaluateSkateUnit({
      nomSkate_kN: nominalSkateLoad_kN,
      peakSkate_kN: folPeakSk,
      nWheels: nFollowerWheels,
      wheelsPerFork: followerSpec ? followerSpec.wheelsPerFork : 1,
      dia: dFollower,
      width: wFollower,
      pairWidth: followerSpec ? followerSpec.pairWidth : wFollower,
      matKey,
      shoreA,
      nuPU,
      chassisW: followerSpec ? followerSpec.chassisW : 520,
      chassisL: followerSpec ? followerSpec.chassisL : 810
    });
  }

  let governing = powEval;
  let governingIsPowered = true;
  if (folEval && (folEval.peakWheel_kN > powEval.peakWheel_kN || folEval.hertz.p_max > powEval.hertz.p_max)) {
    governing = folEval;
    governingIsPowered = false;
  }
  const maxWheelStatic_kN = folEval ? Math.max(powEval.staticWheel_kN, folEval.staticWheel_kN) : powEval.staticWheel_kN;
  const maxWheelLoad_kN = (calcModel === 'pe' && peData)
    ? peData.govWheelPeak_kN
    : (folEval ? Math.max(powEval.peakWheel_kN, folEval.peakWheel_kN) : powEval.peakWheel_kN);
  const maxForkStatic_kN = folEval ? Math.max(powEval.staticFork_kN, folEval.staticFork_kN) : powEval.staticFork_kN;
  const maxForkLoad_kN = folEval ? Math.max(powEval.peakFork_kN, folEval.peakFork_kN) : powEval.peakFork_kN;

  const baseCoords = buildSkateCoords(
    activeSetup, plat.length, plat.width,
    poweredSpec.chassisW, followerSpec ? followerSpec.chassisW : 520
  );

  // Mode 3 Governing Span Line-up ('transverse3' conservative 0.30/1.40/2.50 m envelope or 'longitudinal' CAD rails)
  let mode3Spec = null;
  if (isPosNum(spanL)) {
    const midX = spanL / 2.0;
    const halfSpanSide = plat.width / 2.0; // 1.10 m on 3.80 x 2.20 m
    const powWidth_m = poweredSpec.chassisW / 1000.0; // 0.60 m for TS-10T
    const psvWidth_m = followerSpec ? (followerSpec.chassisW / 1000.0) : 0.52; // 0.52 m for CRQ-8
    const psvBeFixed_m = (followerSpec && followerSpec.series === 'SRS') ? (followerSpec.beFallback_m || 1.00) : null;
    const fSkate = round2(nominalSkateLoad_kN); // 13.54 kN in rev.00.1, 38.95 kN in Preset 1
    const rawLoads = [];

    if (activeSetup === 1) {
      rawLoads.push({
        id: 'P1', label: 'TS-10T', x_m: midX, P_kN: fSkate,
        b_skate_m: powWidth_m, isPrimaryMid: true
      });
    } else if (spanAlign === 'longitudinal') {
      // Center longitudinal platform (3.80 m) onto span L
      const shiftX = (spanL - plat.length) / 2.0;
      const frontPsvX = Math.min(plat.length * 0.42, 0.93) + shiftX;
      const rearPsvX = Math.max(plat.length * 0.58, plat.length - 0.65) + shiftX;
      rawLoads.push(
        { id: 'P1', label: 'TS-10T', x_m: 0.30 + shiftX, P_kN: fSkate, b_skate_m: plat.width },
        { id: 'C1+C2', label: '2× CRQ-8', x_m: frontPsvX, P_kN: 2 * fSkate, b_skate_m: plat.width, isPrimaryMid: true },
        { id: 'C3+C4', label: '2× CRQ-8', x_m: rearPsvX, P_kN: 2 * fSkate, b_skate_m: plat.width },
        { id: 'P2', label: 'TS-10T', x_m: (plat.length - 0.30) + shiftX, P_kN: fSkate, b_skate_m: plat.width }
      );
    } else if (activeSetup === 2) {
      rawLoads.push({
        id: 'F1', label: 'Follower', x_m: midX - halfSpanSide, P_kN: fSkate,
        b_skate_m: psvWidth_m, fixedBe_m: psvBeFixed_m
      });
      rawLoads.push({
        id: 'F2', label: 'Follower', x_m: midX + halfSpanSide, P_kN: fSkate,
        b_skate_m: psvWidth_m, fixedBe_m: psvBeFixed_m, isPrimaryMid: true
      });
    } else {
      rawLoads.push({
        id: 'C1', label: followerSpec ? followerSpec.series : 'CRQ-8',
        x_m: midX - halfSpanSide, P_kN: fSkate,
        b_skate_m: psvWidth_m, fixedBe_m: psvBeFixed_m
      });
      rawLoads.push({
        id: 'P1', label: poweredModelKey || 'TS-10T',
        x_m: midX, P_kN: fSkate,
        b_skate_m: powWidth_m, isPrimaryMid: true
      });
      rawLoads.push({
        id: 'C2', label: followerSpec ? followerSpec.series : 'CRQ-8',
        x_m: midX + halfSpanSide, P_kN: fSkate,
        b_skate_m: psvWidth_m, fixedBe_m: psvBeFixed_m
      });
    }
    mode3Spec = { rawLoads };
  }

  const slab = evaluateSlabChecks({
    plat, grossMass, grossWeight_kN, phiDynamic,
    peakSupportLoad_kN: peakSkateLoad_kN,
    maxForkStatic_kN,
    maxForkLoad_kN,
    maxWheelStatic_kN,
    maxWheelLoad_kN,
    governing,
    plateEnabled, B_plate, L_plate, t_plate, plateMat,
    pAllowFloor, hSlab, dSlab, concrete, rhoL, designCode, spanL, udlLimit_kPa,
    baseCoords, beMode, mode3Spec,
    calcModel, meLoadOn, peData
  });

  return {
    plat, poweredSpec, followerSpec, concrete, plateMat,
    grossMass, grossWeight_kN, totalPoweredTare,
    unitFollowerMass, totalFollowerTare,
    addLoadPerFollower: Number.isFinite(addLoadPerFollower) ? addLoadPerFollower : 0,
    totalAdditionalLoad,
    numFollowers, totalSkates,
    effectiveBias, phiDynamic, calcModel, meLoadOn, spanAlign, peData,
    nominalSkateLoad_kN, peakSkateLoad_kN,
    powEval, folEval, governing, governingIsPowered,
    maxWheelStatic_kN, maxWheelLoad_kN, maxForkStatic_kN, maxForkLoad_kN,
    ...slab
  };
}

export function runMobileBaseCalculations(inputs) {
  const {
    mPnm, mFrame,
    numCasters = 6,
    wheelsPerCaster = 2, // 1 = Single, 2 = Twin-Wheel
    casterUnitMass = 24,
    dCaster = 200,
    wCaster = 50,
    matKey = 'pu',
    shoreA = 95,
    nuPU = null,
    platL = 3.80,
    platW = 2.40,
    casterBiasPct,
    phiDynamic = 1.30,
    plateEnabled, B_plate, L_plate, t_plate, plateMatKey,
    pAllowFloor, hSlab, dSlab, concreteGradeKey, rhoL, designCode,
    spanL, udlLimit_kPa = CONFIRMED_UDL_KPA
  } = inputs;

  const safePlatL = isPosNum(platL) ? Math.max(0.90, platL) : 3.80;
  const safePlatW = isPosNum(platW) ? Math.max(0.60, platW) : 2.40;
  const platArea = safePlatL * safePlatW;
  const plat = { length: safePlatL, width: safePlatW, area: platArea, label: `${safePlatL.toFixed(2)} × ${safePlatW.toFixed(2)} m (${platArea.toFixed(2)} m²)` };

  const concrete = (concreteGradeKey && CONCRETE_GRADES[concreteGradeKey]) || null;
  const plateMat = PLATE_MAT_DATA[plateMatKey] || PLATE_MAT_DATA.ss400;

  const totalCasterMass = numCasters * casterUnitMass;
  const grossMass = mPnm + mFrame + totalCasterMass;
  const grossWeight_kN = (grossMass * G) / 1000;
  const totalWheels = numCasters * wheelsPerCaster;

  // Caster Load Sharing
  const nominalCasterLoad_kN = grossWeight_kN / numCasters;
  const staticWheelLoad_kN = nominalCasterLoad_kN / wheelsPerCaster;

  const minBias = 1.0 / numCasters;
  const defaultBias = numCasters === 4 ? 0.35 : (numCasters === 6 ? 0.25 : 0.20);
  const effectiveBias = Math.max(minBias, casterBiasPct ? casterBiasPct / 100 : defaultBias);

  const peakCasterLoad_kN = grossWeight_kN * effectiveBias * phiDynamic;
  const peakWheelLoad_kN = peakCasterLoad_kN / wheelsPerCaster;

  // Mode 1 Hertz contact on single wheel; Mode 2 punching shear on combined fork patch
  const hertzStatic = hertzLineContact(staticWheelLoad_kN * 1000, dCaster, wCaster, matKey, shoreA, nuPU);
  const hertz = hertzLineContact(peakWheelLoad_kN * 1000, dCaster, wCaster, matKey, shoreA, nuPU);
  const forkSpanW_mm = wheelsPerCaster === 2 ? (2 * wCaster + 20) : wCaster;
  const patchW_mm = Math.max(50, forkSpanW_mm);
  const patchL_mm = Math.max(50, hertz.contactWidth_mm);

  const chassisW_mm = Math.max(120, forkSpanW_mm + 40);
  const chassisL_mm = Math.max(180, dCaster + 40);

  const governing = {
    peakSkate_kN: peakCasterLoad_kN,
    peakFork_kN: peakCasterLoad_kN,
    peakWheel_kN: peakWheelLoad_kN,
    hertzStatic,
    hertz,
    patchW_mm,
    patchL_mm,
    chassisW: chassisW_mm,
    chassisL: chassisL_mm
  };

  const baseCoords = buildCasterCoords(numCasters, plat.length, plat.width, chassisW_mm / 1000);

  const slab = evaluateSlabChecks({
    plat, grossMass, grossWeight_kN, phiDynamic,
    peakSupportLoad_kN: peakCasterLoad_kN,
    maxForkStatic_kN: nominalCasterLoad_kN,
    maxForkLoad_kN: peakCasterLoad_kN,
    maxWheelStatic_kN: staticWheelLoad_kN,
    maxWheelLoad_kN: peakWheelLoad_kN,
    governing,
    plateEnabled, B_plate, L_plate, t_plate, plateMat,
    pAllowFloor, hSlab, dSlab, concrete, rhoL, designCode, spanL, udlLimit_kPa,
    baseCoords, useOverallUdl: false
  });

  return {
    plat, concrete, plateMat,
    numCasters, wheelsPerCaster, totalWheels,
    casterUnitMass, totalCasterMass,
    grossMass, grossWeight_kN,
    effectiveBias, phiDynamic,
    nominalCasterLoad_kN, peakCasterLoad_kN,
    staticWheelLoad_kN, peakWheelLoad_kN,
    governing,
    ...slab
  };
}
