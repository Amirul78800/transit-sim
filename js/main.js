import { CATALOG_MODELS, CONFIRMED_UDL_KPA } from './data.js?v=6';
import { runPhysicsCalculations } from './physics.js?v=6';
import { renderLoadTree, drawFrontElevation, drawTopPlan } from './renderer.js?v=6';

let activeSetup = 4; // 1=2-Skates, 2=4-Point, 3=6-Point, 4=8-Point, 5=10-Point
let designCode = 'BS8110';
let currentTheme = 'dark';
let cachedInputs = null;
let cachedResults = null;

const dom = {
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  inputPlatL: document.getElementById('inputPlatL'),
  inputPlatW: document.getElementById('inputPlatW'),
  selectPoweredModel: document.getElementById('selectPoweredModel'),
  inputSkateBias: document.getElementById('inputSkateBias'),
  selectFollowerModel: document.getElementById('selectFollowerModel'),
  inputFollowerWeight: document.getElementById('inputFollowerWeight'),
  inputFollowerWheels: document.getElementById('inputFollowerWheels'),
  inputFollowerDia: document.getElementById('inputFollowerDia'),
  inputFollowerWidth: document.getElementById('inputFollowerWidth'),
  selectFollowerMat: document.getElementById('selectFollowerMat'),
  inputShoreA: document.getElementById('inputShoreA'),
  shoreAGroup: document.getElementById('shoreAGroup'),
  inputPnmMass: document.getElementById('inputPnmMass'),
  inputBaseMass: document.getElementById('inputBaseMass'),
  inputAddLoad: document.getElementById('inputAddLoad'),
  checkPlateEnable: document.getElementById('checkPlateEnable'),
  inputPlateWidth: document.getElementById('inputPlateWidth'),
  inputPlateLength: document.getElementById('inputPlateLength'),
  inputPlateThick: document.getElementById('inputPlateThick'),
  selectPlateSteel: document.getElementById('selectPlateSteel'),
  inputUdlLimit: document.getElementById('inputUdlLimit'),
  selectConcreteGrade: document.getElementById('selectConcreteGrade'),
  inputSlabDepth: document.getElementById('inputSlabDepth'),
  inputRhoL: document.getElementById('inputRhoL'),
  inputSpanL: document.getElementById('inputSpanL'),
  inputFloorStress: document.getElementById('inputFloorStress'),

  lblSetupSummary: document.getElementById('lblSetupSummary'),
  lblSkateBias: document.getElementById('lblSkateBias'),
  biasGroup: document.getElementById('biasGroup'),
  lblFollowerWeight: document.getElementById('lblFollowerWeight'),
  lblFollowerWheels: document.getElementById('lblFollowerWheels'),
  lblFollowerDia: document.getElementById('lblFollowerDia'),
  lblFollowerWidth: document.getElementById('lblFollowerWidth'),
  lblShoreA: document.getElementById('lblShoreA'),
  lblPnmMass: document.getElementById('lblPnmMass'),
  lblBaseMass: document.getElementById('lblBaseMass'),
  lblAddLoad: document.getElementById('lblAddLoad'),
  lblPoweredWeightSum: document.getElementById('lblPoweredWeightSum'),
  lblFollowerWeightSum: document.getElementById('lblFollowerWeightSum'),
  lblAddLoadSum: document.getElementById('lblAddLoadSum'),
  lblTotalGrossMass: document.getElementById('lblTotalGrossMass'),
  lblTotalGrossWeight: document.getElementById('lblTotalGrossWeight'),
  lblPlateWidth: document.getElementById('lblPlateWidth'),
  lblPlateLength: document.getElementById('lblPlateLength'),
  lblPlateThick: document.getElementById('lblPlateThick'),
  lblPlateHandlingWeight: document.getElementById('lblPlateHandlingWeight'),
  lblHandlingBadge: document.getElementById('lblHandlingBadge'),
  lblRecWidth: document.getElementById('lblRecWidth'),
  lblRecThick: document.getElementById('lblRecThick'),
  plateControls: document.getElementById('plateControls'),
  panelFollower: document.getElementById('panelFollower'),

  cardSkateLoad: document.getElementById('cardSkateLoad'),
  valSkateLoad: document.getElementById('valSkateLoad'),
  subSkateLoad: document.getElementById('subSkateLoad'),
  badgeSkateLoad: document.getElementById('badgeSkateLoad'),

  cardPowWheel: document.getElementById('cardPowWheel'),
  valPowWheel: document.getElementById('valPowWheel'),
  subPowWheel: document.getElementById('subPowWheel'),
  badgePowWheel: document.getElementById('badgePowWheel'),

  cardFolWheel: document.getElementById('cardFolWheel'),
  valFolWheel: document.getElementById('valFolWheel'),
  subFolWheel: document.getElementById('subFolWheel'),
  badgeFolWheel: document.getElementById('badgeFolWheel'),

  cardPressure: document.getElementById('cardPressure'),
  valPressure: document.getElementById('valPressure'),
  subPressure: document.getElementById('subPressure'),
  badgePressure: document.getElementById('badgePressure'),

  cardPunch: document.getElementById('cardPunch'),
  tagPunchCode: document.getElementById('tagPunchCode'),
  valPunch: document.getElementById('valPunch'),
  subPunch: document.getElementById('subPunch'),
  badgePunch: document.getElementById('badgePunch'),

  cardBending: document.getElementById('cardBending'),
  valBending: document.getElementById('valBending'),
  subBending: document.getElementById('subBending'),
  badgeBending: document.getElementById('badgeBending'),

  cardUdl: document.getElementById('cardUdl'),
  tagUdlArea: document.getElementById('tagUdlArea'),
  valUdl: document.getElementById('valUdl'),
  subUdl: document.getElementById('subUdl'),
  badgeUdl: document.getElementById('badgeUdl'),

  cardRigidity: document.getElementById('cardRigidity'),
  valRigidity: document.getElementById('valRigidity'),
  subRigidity: document.getElementById('subRigidity'),
  badgeRigidity: document.getElementById('badgeRigidity'),

  cardVerdict: document.getElementById('cardVerdict'),
  valVerdict: document.getElementById('valVerdict'),
  subVerdict: document.getElementById('subVerdict'),
  badgeVerdict: document.getElementById('badgeVerdict'),

  lblTreeModeTag: document.getElementById('lblTreeModeTag'),
  treeBranchWrap: document.getElementById('treeBranchWrap'),
  lblFrontElevationSub: document.getElementById('lblFrontElevationSub'),
  lblTopPlanTitle: document.getElementById('lblTopPlanTitle'),
  lblTopPlanSub: document.getElementById('lblTopPlanSub'),
  frontCanvas: document.getElementById('frontCanvas'),
  topCanvas: document.getElementById('topCanvas')
};

const optNum = (el) => {
  const v = parseFloat(el.value);
  return Number.isFinite(v) && v > 0 ? v : null;
};

function initTheme() {
  const saved = localStorage.getItem('transit_sim_theme');
  if (saved) currentTheme = saved;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) currentTheme = 'light';
  applyTheme(currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('transit_sim_theme', currentTheme);
  applyTheme(currentTheme);
  update();
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    dom.btnThemeToggle.innerHTML = '🌙 Dark Mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    dom.btnThemeToggle.innerHTML = '☀️ Light Mode';
  }
}

function bindGroup(selector, callback) {
  const buttons = document.querySelectorAll(`${selector} .btn-preset`);
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      if (btn.innerText.trim().toLowerCase() !== 'clear') btn.classList.add('active');
      callback(btn);
      update();
    });
  });
}

function syncFollowerCatalogInputs(modelKey) {
  const spec = CATALOG_MODELS[modelKey];
  if (spec) {
    dom.inputFollowerWeight.value = spec.unitTare;
    dom.inputFollowerWheels.value = spec.wheels;
    dom.inputFollowerDia.value = spec.dia;
    dom.inputFollowerWidth.value = spec.width;
  }
}

function bindEvents() {
  dom.btnThemeToggle.addEventListener('click', toggleTheme);

  dom.selectFollowerModel.addEventListener('change', () => {
    syncFollowerCatalogInputs(dom.selectFollowerModel.value);
    update();
  });

  const liveInputs = [
    dom.inputPlatL, dom.inputPlatW,
    dom.selectPoweredModel, dom.inputSkateBias,
    dom.inputFollowerWeight, dom.inputFollowerWheels, dom.inputFollowerDia, dom.inputFollowerWidth,
    dom.selectFollowerMat, dom.inputShoreA,
    dom.inputPnmMass, dom.inputBaseMass, dom.inputAddLoad,
    dom.checkPlateEnable, dom.inputPlateWidth, dom.inputPlateLength, dom.inputPlateThick,
    dom.selectPlateSteel, dom.inputUdlLimit, dom.selectConcreteGrade,
    dom.inputSlabDepth, dom.inputRhoL, dom.inputSpanL, dom.inputFloorStress
  ];
  liveInputs.forEach((el) => el.addEventListener('input', () => {
    if (el === dom.inputFollowerWeight || el === dom.inputFollowerWheels || el === dom.inputFollowerDia || el === dom.inputFollowerWidth) {
      dom.selectFollowerModel.value = 'CUSTOM';
    }
    if (el === dom.inputPlatL || el === dom.inputPlatW) {
      document.querySelectorAll('#btnGroupPlatform .btn-preset').forEach((b) => b.classList.remove('active'));
    }
    if (el === dom.inputSlabDepth) {
      document.querySelectorAll('#btnGroupSlab .btn-preset').forEach((b) => b.classList.remove('active'));
    }
    if (el === dom.inputSpanL) {
      document.querySelectorAll('#btnGroupSpan .btn-preset').forEach((b) => b.classList.remove('active'));
    }
    if (el === dom.inputFloorStress) {
      document.querySelectorAll('#btnGroupStress .btn-preset').forEach((b) => b.classList.remove('active'));
    }
    update();
  }));

  bindGroup('#btnGroupPlatform', (btn) => {
    dom.inputPlatL.value = btn.getAttribute('data-l');
    dom.inputPlatW.value = btn.getAttribute('data-w');
  });

  bindGroup('#btnGroupPlates', (btn) => {
    dom.inputPlateWidth.value = btn.getAttribute('data-w');
    dom.inputPlateLength.value = btn.getAttribute('data-l');
  });

  bindGroup('#btnGroupCode', (btn) => { designCode = btn.getAttribute('data-code'); });
  bindGroup('#btnGroupSlab', (btn) => { dom.inputSlabDepth.value = btn.getAttribute('data-h'); });
  bindGroup('#btnGroupSpan', (btn) => { dom.inputSpanL.value = btn.getAttribute('data-span'); });
  bindGroup('#btnGroupStress', (btn) => { dom.inputFloorStress.value = btn.getAttribute('data-stress'); });

  [1, 2, 3, 4, 5].forEach((m) => {
    document.getElementById(`btnSetup${m}`).addEventListener('click', () => setMode(m));
  });

  window.addEventListener('resize', () => requestAnimationFrame(update));
  window.addEventListener('beforeprint', () => {
    if (cachedInputs && cachedResults) renderCanvases(cachedInputs, cachedResults, false);
  });
  window.addEventListener('afterprint', update);
}

// Mode order: 1=2-Skates, 2=4-Point, 3=6-Point, 4=8-Point, 5=10-Point
function setMode(mode) {
  activeSetup = mode;
  [1, 2, 3, 4, 5].forEach((m) => {
    const btn = document.getElementById(`btnSetup${m}`);
    btn.className = 'setup-btn' + (m === mode ? ' active' : '');
    btn.setAttribute('aria-selected', m === mode ? 'true' : 'false');
  });

  const modeMeta = {
    1: { summary: '2-Skates', tree: '2-SKATES', bias: 60, followerActive: false },
    2: { summary: '4-Point', tree: '4-POINT', bias: 35, followerActive: true },
    3: { summary: '6-Point', tree: '6-POINT', bias: 25, followerActive: true },
    4: { summary: '8-Point', tree: '8-POINT', bias: 20, followerActive: true },
    5: { summary: '10-Point', tree: '10-POINT', bias: 19, followerActive: true }
  }[mode];

  dom.lblSetupSummary.innerText = modeMeta.summary;
  dom.lblTreeModeTag.innerText = modeMeta.tree;
  dom.inputSkateBias.value = modeMeta.bias;

  dom.panelFollower.style.opacity = modeMeta.followerActive ? '1' : '0.5';
  dom.panelFollower.style.pointerEvents = modeMeta.followerActive ? 'auto' : 'none';
  dom.biasGroup.style.opacity = mode === 1 ? '0.6' : '1';
  dom.inputSkateBias.disabled = mode === 1;

  update();
}

function renderCanvases(inputs, res, isDark) {
  drawFrontElevation(dom.frontCanvas, {
    D: res.governingIsPowered ? res.poweredSpec.dia : inputs.dFollower,
    numWheels: res.governingIsPowered ? res.poweredSpec.wheels : inputs.nFollowerWheels,
    hSlab: inputs.hSlab,
    dSlab: res.effectiveDSlab,
    plateOn: inputs.plateEnabled,
    B: inputs.B_plate,
    t: inputs.t_plate,
    isRigid: res.isRigid,
    isCurling: res.isCurling,
    isPlateUndersized: res.isPlateUndersized,
    t_req: res.t_req,
    shearTopW: res.shearTopW_mm,
    bottomSpread: res.bottomSpread_mm,
    plateMat: res.plateMat,
    addLoadPerFollower: inputs.addLoadPerFollower,
    isSpreadOK: res.isSpreadOK,
    punchPass: res.isMode2Pass
  }, isDark);

  drawTopPlan(
    dom.topCanvas,
    activeSetup,
    res.plat.length,
    res.plat.width,
    res.nominalSkateLoad_kN,
    res.peakSkateLoad_kN,
    inputs.plateEnabled,
    inputs.B_plate,
    inputs.L_plate,
    res.poweredSpec.name,
    isDark
  );
}

function setCardStatus(card, badge, state, badgeText) {
  card.className = `dash-card card-${state}`;
  badge.className = `status-badge status-${state}`;
  badge.innerText = badgeText;
}

function update() {
  const isDark = currentTheme === 'dark';
  const hSlab = optNum(dom.inputSlabDepth);
  const rhoPct = optNum(dom.inputRhoL);
  const spanL = optNum(dom.inputSpanL);
  const pAllowFloor = optNum(dom.inputFloorStress);
  const udlLimit = optNum(dom.inputUdlLimit) || CONFIRMED_UDL_KPA;
  const platL = optNum(dom.inputPlatL) || 3.80;
  const platW = optNum(dom.inputPlatW) || 2.40;

  const inputs = {
    platL,
    platW,
    mPnm: parseFloat(dom.inputPnmMass.value),
    mBase: parseFloat(dom.inputBaseMass.value),
    addLoadPerFollower: parseFloat(dom.inputAddLoad.value) || 0,
    poweredModelKey: dom.selectPoweredModel.value,
    followerModelKey: dom.selectFollowerModel.value,
    followerUnitWeight: parseFloat(dom.inputFollowerWeight.value),
    nFollowerWheels: parseInt(dom.inputFollowerWheels.value, 10),
    dFollower: parseFloat(dom.inputFollowerDia.value),
    wFollower: parseFloat(dom.inputFollowerWidth.value),
    matKey: dom.selectFollowerMat.value,
    shoreA: parseFloat(dom.inputShoreA.value),
    skateBiasPct: parseFloat(dom.inputSkateBias.value),
    plateEnabled: dom.checkPlateEnable.checked,
    B_plate: parseFloat(dom.inputPlateWidth.value),
    L_plate: parseFloat(dom.inputPlateLength.value),
    t_plate: parseFloat(dom.inputPlateThick.value),
    plateMatKey: dom.selectPlateSteel.value,
    concreteGradeKey: dom.selectConcreteGrade.value || null,
    pAllowFloor,
    hSlab,
    dSlab: hSlab ? Math.max(80, hSlab - 30) : null,
    rhoL: rhoPct ? rhoPct / 100.0 : null,
    designCode,
    spanL,
    udlLimit_kPa: udlLimit,
    activeSetup
  };

  dom.lblSkateBias.innerText = `${inputs.skateBiasPct.toFixed(0)}%`;
  dom.lblFollowerWeight.innerText = `${inputs.followerUnitWeight.toFixed(0)} kg`;
  dom.lblFollowerWheels.innerText = `${inputs.nFollowerWheels}`;
  dom.lblFollowerDia.innerText = `${inputs.dFollower} mm`;
  dom.lblFollowerWidth.innerText = `${inputs.wFollower} mm`;
  dom.lblShoreA.innerText = `${inputs.shoreA} A`;
  dom.shoreAGroup.style.display = inputs.matKey === 'pu' ? 'block' : 'none';
  dom.lblPnmMass.innerText = `${inputs.mPnm.toLocaleString()} kg`;
  dom.lblBaseMass.innerText = `${inputs.mBase.toLocaleString()} kg`;
  dom.lblAddLoad.innerText = `${inputs.addLoadPerFollower.toFixed(0)} kg/ea`;
  dom.lblPlateWidth.innerText = `${inputs.B_plate} mm`;
  dom.lblPlateLength.innerText = `${inputs.L_plate.toLocaleString()} mm`;
  dom.lblPlateThick.innerText = `${inputs.t_plate} mm`;
  dom.plateControls.style.display = inputs.plateEnabled ? 'block' : 'none';

  const res = runPhysicsCalculations(inputs);
  cachedInputs = inputs;
  cachedResults = res;

  // Mass summary
  dom.lblPoweredWeightSum.innerText = `${res.totalPoweredTare.toFixed(0)} kg`;
  dom.lblFollowerWeightSum.innerText = res.numFollowers > 0
    ? `${res.unitFollowerMass.toFixed(0)} kg/ea · ${res.totalFollowerTare.toFixed(0)} kg`
    : '0 kg (None)';
  dom.lblAddLoadSum.innerText = res.numFollowers > 0
    ? `${res.addLoadPerFollower.toFixed(0)} kg/ea · ${res.totalAdditionalLoad.toFixed(0)} kg`
    : '0 kg (None)';
  dom.lblTotalGrossMass.innerText = `${res.grossMass.toLocaleString('en-US', { maximumFractionDigits: 0 })} kg`;
  dom.lblTotalGrossWeight.innerText = `${res.grossWeight_kN.toFixed(2)} kN`;

  // Spreader Plate sidebar summary
  dom.lblRecWidth.innerText = res.B_code_min ? `${res.B_code_min.toFixed(0)} mm` : 'Pending h';
  dom.lblRecThick.innerText = `${res.t_req.toFixed(1)} mm`;
  dom.lblPlateHandlingWeight.innerText = `${res.singlePlateMass.toFixed(1)} kg`;
  if (res.singlePlateMass <= 20) {
    dom.lblHandlingBadge.innerText = '1-Man Carry';
    dom.lblHandlingBadge.style.color = 'var(--pass)';
  } else if (res.singlePlateMass <= 45) {
    dom.lblHandlingBadge.innerText = '2-Man Lift';
    dom.lblHandlingBadge.style.color = 'var(--warn)';
  } else {
    dom.lblHandlingBadge.innerText = 'Forklift Required';
    dom.lblHandlingBadge.style.color = 'var(--fail)';
  }

  // Card 1: Skate Load (Static & Peak)
  dom.valSkateLoad.innerText = `${res.peakSkateLoad_kN.toFixed(2)} kN`;
  dom.subSkateLoad.innerText = `Static: ${res.nominalSkateLoad_kN.toFixed(2)} kN | Peak: ${res.peakSkateLoad_kN.toFixed(2)} kN`;
  setCardStatus(dom.cardSkateLoad, dom.badgeSkateLoad, 'info', `${res.totalSkates} SKATES`);

  // Card 2: Powered Skate Wheel (Static & Peak)
  dom.valPowWheel.innerText = `${res.powEval.peakWheel_kN.toFixed(2)} kN`;
  dom.subPowWheel.innerText = `Static: ${res.powEval.staticWheel_kN.toFixed(2)} kN | Peak: ${res.powEval.peakWheel_kN.toFixed(2)} kN`;
  setCardStatus(dom.cardPowWheel, dom.badgePowWheel, 'info', res.poweredSpec.name.split('(')[0].trim());

  // Card 3: Follower Skate Wheel (Static & Peak)
  if (res.folEval) {
    dom.valFolWheel.innerText = `${res.folEval.peakWheel_kN.toFixed(2)} kN`;
    dom.subFolWheel.innerText = `Static: ${res.folEval.staticWheel_kN.toFixed(2)} kN | Fork Peak: ${res.folEval.peakFork_kN.toFixed(2)} kN`;
    const folTag = res.followerSpec ? res.followerSpec.name.split('(')[0].trim() : 'CUSTOM';
    setCardStatus(dom.cardFolWheel, dom.badgeFolWheel, 'info', folTag);
  } else {
    dom.valFolWheel.innerText = 'N/A';
    dom.subFolWheel.innerText = 'No follower skates in 2-Skate mode';
    setCardStatus(dom.cardFolWheel, dom.badgeFolWheel, 'info', 'NO FOLLOWERS');
  }

  // Card 4: Mode 1 Surface
  dom.valPressure.innerText = `${res.contactPressure_max_MPa.toFixed(2)} MPa`;
  if (res.mode1Limit_MPa !== null) {
    dom.subPressure.innerText = `p_mean: ${res.contactPressure_mean_MPa.toFixed(2)} | Limit: ${res.mode1Limit_MPa.toFixed(1)} MPa`;
    setCardStatus(dom.cardPressure, dom.badgePressure, res.isMode1Pass ? 'pass' : 'fail', res.isMode1Pass ? 'PASS' : 'FAIL');
  } else {
    dom.subPressure.innerText = `p_mean: ${res.contactPressure_mean_MPa.toFixed(2)} MPa | Limit: —`;
    setCardStatus(dom.cardPressure, dom.badgePressure, 'info', 'PENDING CE LIMIT');
  }

  // Card 5: Mode 2 Shear
  dom.tagPunchCode.innerText = `${res.punch.code} (${res.punch.perimeterLabel})`;
  if (!res.hasHSlab) {
    dom.valPunch.innerText = '—';
    dom.subPunch.innerText = 'Enter slab h to compute v_Ed';
    setCardStatus(dom.cardPunch, dom.badgePunch, 'info', 'PENDING h');
  } else {
    dom.valPunch.innerText = `${res.punch.v_Ed_1.toFixed(3)} MPa`;
    if (res.isMode2Pass !== null) {
      dom.subPunch.innerText = `v_Rd,c: ${res.punch.v_Rd_c.toFixed(3)} | u0: ${res.punch.v_Ed_0.toFixed(2)}/${res.punch.v_Rd_max.toFixed(2)}`;
      setCardStatus(
        dom.cardPunch, dom.badgePunch,
        res.isMode2Pass ? 'pass' : 'fail',
        res.isMode2Pass ? `PASS (${(res.punch.utilization * 100).toFixed(0)}%)` : 'FAIL'
      );
    } else {
      dom.subPunch.innerText = `u0 v_Ed: ${res.punch.v_Ed_0.toFixed(2)} MPa | v_Rd: —`;
      setCardStatus(dom.cardPunch, dom.badgePunch, 'info', 'PENDING GRADE/ρ_l');
    }
  }

  // Card 6: Mode 3 Bending
  if (!res.hasSpanL) {
    dom.valBending.innerText = '—';
    dom.subBending.innerText = 'Enter span L to compute';
    setCardStatus(dom.cardBending, dom.badgeBending, 'info', 'PENDING SPAN L');
  } else {
    dom.valBending.innerText = `${res.M_imposed_max.toFixed(2)} kNm/m`;
    dom.subBending.innerText = `Benchmark: ${res.M_UDL_benchmark.toFixed(2)} kNm/m (${res.bendingOrientation})`;
    setCardStatus(
      dom.cardBending, dom.badgeBending,
      res.isMode3Pass ? 'pass' : 'fail',
      res.isMode3Pass ? `PASS (${((res.M_imposed_max / res.M_UDL_benchmark) * 100).toFixed(0)}%)` : 'FAIL'
    );
  }

  // Card 7: Footprint UDL
  dom.tagUdlArea.innerText = `${res.plat.area.toFixed(2)} m²`;
  dom.valUdl.innerText = `${res.udl_kPa.toFixed(2)} kN/m²`;
  dom.subUdl.innerText = `${res.udl_ton.toFixed(2)} t/m² (Rating: ${res.udlLimit_kPa.toFixed(2)} kN/m²)`;
  if (res.isUdlPass) {
    const margin = ((res.udlLimit_kPa - res.udl_kPa) / res.udlLimit_kPa) * 100;
    setCardStatus(dom.cardUdl, dom.badgeUdl, 'pass', `PASS (${margin.toFixed(0)}% MARGIN)`);
  } else {
    const over = ((res.udl_kPa - res.udlLimit_kPa) / res.udlLimit_kPa) * 100;
    setCardStatus(dom.cardUdl, dom.badgeUdl, 'fail', `FAIL (+${over.toFixed(1)}%)`);
  }

  // Card 8: Spreader Plate
  if (!inputs.plateEnabled) {
    dom.valRigidity.innerText = 'OFF';
    dom.subRigidity.innerText = 'Bare wheels on floor';
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'info', 'NO PLATE');
  } else if (res.isPlateUndersized) {
    dom.valRigidity.innerText = 'UNDERSIZED';
    dom.subRigidity.innerText = `Plate < skate (${res.governing.chassisW}×${res.governing.chassisL})`;
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'fail', 'PLATE TOO SMALL');
  } else if (res.isCurling) {
    dom.valRigidity.innerText = 'CURLING';
    dom.subRigidity.innerText = `t = ${inputs.t_plate} < ${res.t_req.toFixed(1)} mm`;
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'fail', 'EDGE LIFT-OFF');
  } else if (res.isSpreadOK === true) {
    dom.valRigidity.innerText = 'RIGID';
    dom.subRigidity.innerText = `t ≥ ${res.t_req.toFixed(1)} mm | Spread ${res.bottomSpread_mm.toFixed(0)} mm`;
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'pass', 'PASS (≥ 2h)');
  } else if (res.isSpreadOK === false) {
    dom.valRigidity.innerText = 'NARROW';
    dom.subRigidity.innerText = `B = ${inputs.B_plate} < 2h (${res.B_code_min} mm)`;
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'warn', 'BELOW 2h');
  } else {
    dom.valRigidity.innerText = 'RIGID';
    dom.subRigidity.innerText = `t = ${inputs.t_plate} ≥ ${res.t_req.toFixed(1)} mm`;
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'info', 'PENDING h');
  }

  // Card 9: Evaluation
  const failed = [];
  const pending = [];
  if (res.isUdlPass === false) failed.push('UDL');
  if (res.isMode1Pass === false) failed.push('Mode 1'); else if (res.isMode1Pass === null) pending.push('M1');
  if (res.isMode2Pass === false) failed.push('Mode 2'); else if (res.isMode2Pass === null) pending.push('M2');
  if (res.isMode3Pass === false) failed.push('Mode 3'); else if (res.isMode3Pass === null) pending.push('M3');

  if (failed.length > 0) {
    dom.valVerdict.innerText = `FAIL (${failed.join(', ')})`;
    dom.subVerdict.innerText = pending.length > 0 ? `Pending CE: ${pending.join(', ')}` : 'Exceeds limit';
    setCardStatus(dom.cardVerdict, dom.badgeVerdict, 'fail', 'FAIL');
  } else if (pending.length > 0) {
    dom.valVerdict.innerText = 'UDL PASS';
    dom.subVerdict.innerText = `Pending CE: ${pending.join(', ')}`;
    setCardStatus(dom.cardVerdict, dom.badgeVerdict, 'warn', 'PENDING CE INPUT');
  } else {
    dom.valVerdict.innerText = 'ALL PASS';
    dom.subVerdict.innerText = 'UDL + Modes 1–3 compliant';
    setCardStatus(dom.cardVerdict, dom.badgeVerdict, 'pass', 'PASS');
  }

  dom.lblFrontElevationSub.innerText = res.governingIsPowered
    ? res.poweredSpec.name
    : (res.followerSpec ? res.followerSpec.name : 'Custom Follower');
  dom.lblTopPlanTitle.innerText = `TOP PLAN: ${res.plat.label}`;
  dom.lblTopPlanSub.innerText = `${res.totalSkates} Skates`;

  renderLoadTree(dom.treeBranchWrap, res);
  renderCanvases(inputs, res, isDark);
}

window.onload = () => {
  initTheme();
  bindEvents();
  syncFollowerCatalogInputs(dom.selectFollowerModel.value);
  setMode(4);
};
