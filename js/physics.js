import {
  G, CONFIRMED_UDL_KPA, MAT_DATA, PLATE_MAT_DATA,
  POWERED_MODELS, CATALOG_MODELS, CONCRETE_GRADES
} from './data.js?v=10';

const isPosNum = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function gentModulusMPa(shoreA) {
  const s = Math.min(99, Math.max(20, shoreA));
  return (0.0981 * (56.0 + 7.62336 * s)) / (0.137505 * (254.0 - 2.54 * s));
}

export function hertzLineContact(F_N, dia_mm, width_mm, matKey, shoreA = 95) {
  const R_mm = dia_mm / 2.0;
  const nu_c = 0.20;
  const E_c = 30000.0;

  let E_w, nu_w;
  if (matKey === 'pu') {
    E_w = gentModulusMPa(shoreA);
    nu_w = MAT_DATA.pu.nu;
  } else {
    E_w = MAT_DATA[matKey].E;
    nu_w = MAT_DATA[matKey].nu;
  }

  const E_star = 1.0 / ((1 - nu_w * nu_w) / E_w + (1 - nu_c * nu_c) / E_c);
  const b_mm = Math.sqrt((4.0 * F_N * R_mm) / (Math.PI * width_mm * E_star));
  const area_mm2 = 2.0 * b_mm * width_mm;
  const p_mean = F_N / area_mm2;
  const p_max = (2.0 * F_N) / (Math.PI * b_mm * width_mm);

  return { E_w, E_star, b_mm, contactWidth_mm: 2.0 * b_mm, area_mm2, p_mean, p_max };
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

function evaluateSkateUnit({ nomSkate_kN, peakSkate_kN, nWheels, wheelsPerFork = 1, dia, width, pairWidth, matKey, shoreA, chassisW, chassisL }) {
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

  const hertz = hertzLineContact(peakWheel_kN * 1000, dia, width, matKey, shoreA);
  const patchW_mm = Math.max(50, pairWidth || width);
  const patchL_mm = Math.max(50, hertz.contactWidth_mm);

  return {
    nomSkate_kN,
    peakSkate_kN,
    staticFork_kN,
    peakFork_kN,
    staticWheel_kN,
    peakWheel_kN,
    hertz,
    patchW_mm,
    patchL_mm,
    chassisW,
    chassisL
  };
}

// Shared Spreader Plate + Modes 1, 2, 3 + UDL Evaluator
function evaluateSlabChecks({
  plat, grossMass, grossWeight_kN, phiDynamic,
  peakSupportLoad_kN, maxForkLoad_kN, governing,
  plateEnabled, B_plate, L_plate, t_plate, plateMat,
  pAllowFloor, hSlab, dSlab, concrete, rhoL, designCode, spanL, udlLimit_kPa,
  baseCoords
}) {
  const hasHSlab = isPosNum(hSlab);
  const effectiveDSlab = isPosNum(dSlab) ? Math.min(hSlab || dSlab, dSlab) : (hasHSlab ? Math.max(20, hSlab - 30) : null);
  const hasRhoL = isPosNum(rhoL);
  const hasSpanL = isPosNum(spanL);
  const hasPAllow = isPosNum(pAllowFloor);
  const hasUdlLimit = isPosNum(udlLimit_kPa);

  const gammaULS = designCode === 'EC2' ? 1.50 : 1.60;
  const singlePlateMass = (B_plate / 1000) * (L_plate / 1000) * (t_plate / 1000) * plateMat.rho;

  // UDL Check
  const udl_kPa = grossWeight_kN / plat.area;
  const udl_ton = (grossMass / 1000) / plat.area;
  const udlLimit_ton = hasUdlLimit ? udlLimit_kPa / G : null;
  const isUdlPass = hasUdlLimit ? (udl_kPa <= udlLimit_kPa) : null;

  // Spreader Plate
  const B_code_min = hasHSlab ? 2 * hSlab : null;
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

  // Mode 1: Surface Contact Stress
  let contactPressure_mean_MPa, contactPressure_max_MPa;
  if (plateEnabled && isRigid) {
    contactPressure_mean_MPa = (peakSupportLoad_kN * 1000) / (Beff * plateContactL);
    contactPressure_max_MPa = contactPressure_mean_MPa;
  } else {
    contactPressure_mean_MPa = governing.hertz.p_mean;
    contactPressure_max_MPa = governing.hertz.p_max;
  }

  const concreteDryBearing_MPa = concrete ? 0.4 * concrete.f_cu : null;
  const mode1Limit_MPa =
    hasPAllow && concreteDryBearing_MPa !== null ? Math.min(pAllowFloor, concreteDryBearing_MPa) :
    hasPAllow ? pAllowFloor :
    concreteDryBearing_MPa !== null ? concreteDryBearing_MPa : null;
  const isMode1Pass = mode1Limit_MPa !== null ? (contactPressure_max_MPa <= mode1Limit_MPa) : null;

  // Mode 2: Punching Shear
  const shearLoad_ULS_N = (plateEnabled && isRigid)
    ? (peakSupportLoad_kN * 1000 * gammaULS)
    : (maxForkLoad_kN * 1000 * gammaULS);
  const shearA1 = (plateEnabled && isRigid) ? Beff : governing.patchW_mm;
  const shearA2 = (plateEnabled && isRigid) ? plateContactL : governing.patchL_mm;

  const punch = punchingShearCheck({
    V_Ed_N: shearLoad_ULS_N,
    a1_mm: shearA1,
    a2_mm: shearA2,
    d_mm: effectiveDSlab,
    f_ck: concrete ? concrete.f_ck : null,
    f_cu: concrete ? concrete.f_cu : null,
    rho_l: hasRhoL ? rhoL : null,
    code: designCode,
    beta: 1.0
  });

  const isMode2Pass =
    (punch.pass_u0 === false || punch.pass_u1 === false) ? false :
    (punch.pass_u0 === true && punch.pass_u1 === true) ? true : null;

  const isSpreadOK = plateEnabled
    ? (hasHSlab ? (isRigid && B_plate >= B_code_min) : null)
    : false;
  const shearTopW_mm = (plateEnabled && !isPlateUndersized) ? Beff : governing.patchW_mm;
  const bottomSpread_mm = hasHSlab ? (shearTopW_mm + 2 * hSlab) : null;

  // Mode 3: Method B Slab Bending
  const M_UDL_benchmark = (hasSpanL && hasUdlLimit) ? (udlLimit_kPa * 1.0 * spanL * spanL) / 8.0 : null;
  let M_imposed_max = null;
  let M_raw_max = null;
  let b_e_governing = null;
  let bendingOrientation = null;

  if (hasSpanL) {
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
  }

  const isMode3Pass = (M_imposed_max !== null && M_UDL_benchmark !== null)
    ? (M_imposed_max <= M_UDL_benchmark)
    : null;

  const gates = [isUdlPass, isMode1Pass, isMode2Pass, isMode3Pass];
  const allPass = gates.some((g) => g === false) ? false : gates.every((g) => g === true) ? true : null;

  return {
    hasHSlab, effectiveDSlab, hasRhoL, hasSpanL, hasPAllow,
    singlePlateMass, udl_kPa, udl_ton, udlLimit_kPa, udlLimit_ton, isUdlPass,
    gammaULS, B_code_min, t_req, isRigid, isCurling, isPlateUndersized, Beff, shearTopW_mm,
    contactPressure_mean_MPa, contactPressure_max_MPa,
    concreteDryBearing_MPa, mode1Limit_MPa,
    punch, shearLoad_ULS_N, bottomSpread_mm, isSpreadOK,
    M_UDL_benchmark, M_imposed_max, M_raw_max, b_e_governing, bendingOrientation,
    isMode1Pass, isMode2Pass, isMode3Pass, allPass
  };
}

// AMR / Skate coordinates (1=2-Skates, 2=4-Point, 3=6-Point, 4=8-Point, 5=10-Point)
function buildSkateCoords(activeSetup, platL, platW, poweredChassisW, followerChassisW) {
  const coords = [];
  if (activeSetup === 1) {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
  } else if (activeSetup === 2) {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL / 2, y: 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL / 2, y: platW - 0.25, b: followerChassisW / 1000 });
  } else if (activeSetup === 3) {
    coords.push({ x: 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW / 2, b: poweredChassisW / 1000 });
    coords.push({ x: 0.30, y: 0.25, b: followerChassisW / 1000 });
    coords.push({ x: 0.30, y: platW - 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: 0.25, b: followerChassisW / 1000 });
    coords.push({ x: platL - 0.30, y: platW - 0.25, b: followerChassisW / 1000 });
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
    followerUnitWeight, nFollowerWheels, dFollower, wFollower, matKey, shoreA,
    platL = 3.80, platW = 2.40, skateBiasPct,
    plateEnabled, B_plate, L_plate, t_plate, plateMatKey,
    pAllowFloor, hSlab, dSlab, concreteGradeKey, rhoL, designCode,
    spanL, udlLimit_kPa = CONFIRMED_UDL_KPA,
    activeSetup
  } = inputs;

  const safePlatL = isPosNum(platL) ? Math.max(0.90, platL) : 3.80;
  const safePlatW = isPosNum(platW) ? Math.max(0.60, platW) : 2.40;
  const platArea = safePlatL * safePlatW;
  const plat = { length: safePlatL, width: safePlatW, area: platArea, label: `${safePlatL.toFixed(2)} × ${safePlatW.toFixed(2)} m (${platArea.toFixed(2)} m²)` };

  const poweredSpec = POWERED_MODELS[poweredModelKey] || POWERED_MODELS['TS-10T'];
  const followerSpec = CATALOG_MODELS[followerModelKey] || null;
  const concrete = (concreteGradeKey && CONCRETE_GRADES[concreteGradeKey]) || null;
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
    : (followerSpec ? followerSpec.unitTare : 50);
  const totalFollowerTare = unitFollowerMass * numFollowers;
  const totalAdditionalLoad = (Number.isFinite(addLoadPerFollower) ? addLoadPerFollower : 0) * numFollowers;

  const grossMass = mPnm + mBase + totalPoweredTare + totalFollowerTare + totalAdditionalLoad;
  const grossWeight_kN = (grossMass * G) / 1000;

  const nominalSkateLoad_kN = grossWeight_kN / totalSkates;
  const minBias = 1.0 / totalSkates;
  const defaultBias =
    activeSetup === 1 ? 0.60 :
    activeSetup === 2 ? 0.35 :
    activeSetup === 3 ? 0.25 :
    activeSetup === 4 ? 0.20 : 0.19;

  const effectiveBias = Math.max(minBias, skateBiasPct ? skateBiasPct / 100 : defaultBias);
  const peakSkateLoad_kN = grossWeight_kN * effectiveBias * phiDynamic;

  const powEval = evaluateSkateUnit({
    nomSkate_kN: nominalSkateLoad_kN,
    peakSkate_kN: peakSkateLoad_kN,
    nWheels: poweredSpec.wheels,
    wheelsPerFork: poweredSpec.wheelsPerFork,
    dia: poweredSpec.dia,
    width: poweredSpec.width,
    pairWidth: poweredSpec.wheelsPerFork === 2 ? poweredSpec.width * 2 : poweredSpec.width,
    matKey: 'pu',
    shoreA: poweredSpec.shoreA,
    chassisW: poweredSpec.chassisW,
    chassisL: poweredSpec.chassisL
  });

  let folEval = null;
  if (numFollowers > 0) {
    folEval = evaluateSkateUnit({
      nomSkate_kN: nominalSkateLoad_kN,
      peakSkate_kN: peakSkateLoad_kN,
      nWheels: nFollowerWheels,
      wheelsPerFork: followerSpec ? followerSpec.wheelsPerFork : 1,
      dia: dFollower,
      width: wFollower,
      pairWidth: followerSpec ? followerSpec.pairWidth : wFollower,
      matKey,
      shoreA,
      chassisW: followerSpec ? followerSpec.chassisW : 520,
      chassisL: followerSpec ? followerSpec.chassisL : 600
    });
  }

  let governing = powEval;
  let governingIsPowered = true;
  if (folEval && (folEval.peakWheel_kN > powEval.peakWheel_kN || folEval.hertz.p_max > powEval.hertz.p_max)) {
    governing = folEval;
    governingIsPowered = false;
  }
  const maxWheelLoad_kN = folEval ? Math.max(powEval.peakWheel_kN, folEval.peakWheel_kN) : powEval.peakWheel_kN;
  const maxForkLoad_kN = folEval ? Math.max(powEval.peakFork_kN, folEval.peakFork_kN) : powEval.peakFork_kN;

  const baseCoords = buildSkateCoords(
    activeSetup, plat.length, plat.width,
    poweredSpec.chassisW, followerSpec ? followerSpec.chassisW : 520
  );

  const slab = evaluateSlabChecks({
    plat, grossMass, grossWeight_kN, phiDynamic,
    peakSupportLoad_kN: peakSkateLoad_kN,
    maxForkLoad_kN,
    governing,
    plateEnabled, B_plate, L_plate, t_plate, plateMat,
    pAllowFloor, hSlab, dSlab, concrete, rhoL, designCode, spanL, udlLimit_kPa,
    baseCoords
  });

  return {
    plat, poweredSpec, followerSpec, concrete, plateMat,
    grossMass, grossWeight_kN, totalPoweredTare,
    unitFollowerMass, totalFollowerTare,
    addLoadPerFollower: Number.isFinite(addLoadPerFollower) ? addLoadPerFollower : 0,
    totalAdditionalLoad,
    numFollowers, totalSkates,
    effectiveBias, phiDynamic,
    nominalSkateLoad_kN, peakSkateLoad_kN,
    powEval, folEval, governing, governingIsPowered,
    maxWheelLoad_kN, maxForkLoad_kN,
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
  const hertz = hertzLineContact(peakWheelLoad_kN * 1000, dCaster, wCaster, matKey, shoreA);
  const forkSpanW_mm = wheelsPerCaster === 2 ? (2 * wCaster + 20) : wCaster;
  const patchW_mm = Math.max(50, forkSpanW_mm);
  const patchL_mm = Math.max(50, hertz.contactWidth_mm);

  const chassisW_mm = Math.max(120, forkSpanW_mm + 40);
  const chassisL_mm = Math.max(180, dCaster + 40);

  const governing = {
    peakSkate_kN: peakCasterLoad_kN,
    peakFork_kN: peakCasterLoad_kN,
    peakWheel_kN: peakWheelLoad_kN,
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
    maxForkLoad_kN: peakCasterLoad_kN,
    governing,
    plateEnabled, B_plate, L_plate, t_plate, plateMat,
    pAllowFloor, hSlab, dSlab, concrete, rhoL, designCode, spanL, udlLimit_kPa,
    baseCoords
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
