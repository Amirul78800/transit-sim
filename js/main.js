import { CATALOG_MODELS } from './data.js?v=10';
import { runPhysicsCalculations } from './physics.js?v=10';
import { renderLoadTree, drawFrontElevation, drawTopPlan } from './renderer.js?v=10';
import {
  optNum, initTheme, bindPresetGroup, setCardStatus,
  readSharedSlabInputs, updateSharedSlabOutputs
} from './ui_common.js?v=10';

let activeSetup = 4; // 1=2-Skates, 2=4-Point, 3=6-Point, 4=8-Point, 5=10-Point
let designCode = 'BS8110';
let getTheme = () => 'dark';
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

  lblHeaderSub: document.getElementById('lblHeaderSub'),
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
    if (el === dom.inputFollowerWheels || el === dom.inputFollowerDia || el === dom.inputFollowerWidth) {
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

  bindPresetGroup('#btnGroupPlatform', (btn) => {
    dom.inputPlatL.value = btn.getAttribute('data-l');
    dom.inputPlatW.value = btn.getAttribute('data-w');
    update();
  });
  bindPresetGroup('#btnGroupPlates', (btn) => {
    dom.inputPlateWidth.value = btn.getAttribute('data-w');
    dom.inputPlateLength.value = btn.getAttribute('data-l');
    update();
  });
  bindPresetGroup('#btnGroupCode', (btn) => { designCode = btn.getAttribute('data-code'); update(); });
  bindPresetGroup('#btnGroupSlab', (btn) => { dom.inputSlabDepth.value = btn.getAttribute('data-h'); update(); });
  bindPresetGroup('#btnGroupSpan', (btn) => { dom.inputSpanL.value = btn.getAttribute('data-span'); update(); });
  bindPresetGroup('#btnGroupStress', (btn) => { dom.inputFloorStress.value = btn.getAttribute('data-stress'); update(); });

  [1, 2, 3, 4, 5].forEach((m) => {
    document.getElementById(`btnSetup${m}`).addEventListener('click', () => setMode(m));
  });

  window.addEventListener('resize', () => requestAnimationFrame(() => {
    if (cachedInputs && cachedResults) renderCanvases(cachedInputs, cachedResults, getTheme() === 'dark');
  }));
  window.addEventListener('beforeprint', () => {
    if (cachedInputs && cachedResults) renderCanvases(cachedInputs, cachedResults, false);
  });
  window.addEventListener('afterprint', update);
}

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

function update() {
  const isDark = getTheme() === 'dark';
  const shared = readSharedSlabInputs(dom, designCode);

  const inputs = {
    platL: optNum(dom.inputPlatL) || 3.80,
    platW: optNum(dom.inputPlatW) || 2.40,
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
    ...shared,
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

  const res = runPhysicsCalculations(inputs);
  cachedInputs = inputs;
  cachedResults = res;

  dom.lblPoweredWeightSum.innerText = `${res.totalPoweredTare.toFixed(0)} kg`;
  dom.lblFollowerWeightSum.innerText = res.numFollowers > 0
    ? `${res.unitFollowerMass.toFixed(0)} kg/ea · ${res.totalFollowerTare.toFixed(0)} kg`
    : '0 kg (None)';
  dom.lblAddLoadSum.innerText = res.numFollowers > 0
    ? `${res.addLoadPerFollower.toFixed(0)} kg/ea · ${res.totalAdditionalLoad.toFixed(0)} kg`
    : '0 kg (None)';
  dom.lblTotalGrossMass.innerText = `${res.grossMass.toLocaleString('en-US', { maximumFractionDigits: 0 })} kg`;
  dom.lblTotalGrossWeight.innerText = `${res.grossWeight_kN.toFixed(2)} kN`;

  // Cards 1–3
  dom.valSkateLoad.innerText = `${res.peakSkateLoad_kN.toFixed(2)} kN`;
  dom.subSkateLoad.innerText = `Static: ${res.nominalSkateLoad_kN.toFixed(2)} kN | Peak: ${res.peakSkateLoad_kN.toFixed(2)} kN`;
  setCardStatus(dom.cardSkateLoad, dom.badgeSkateLoad, 'info', `${res.totalSkates} SKATES`);

  dom.valPowWheel.innerText = `${res.powEval.peakWheel_kN.toFixed(2)} kN`;
  dom.subPowWheel.innerText = `Static: ${res.powEval.staticWheel_kN.toFixed(2)} kN | Peak: ${res.powEval.peakWheel_kN.toFixed(2)} kN`;
  setCardStatus(dom.cardPowWheel, dom.badgePowWheel, 'info', res.poweredSpec.name.split('(')[0].trim());

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

  updateSharedSlabOutputs(dom, inputs, res);

  dom.lblFrontElevationSub.innerText = res.governingIsPowered
    ? res.poweredSpec.name
    : (res.followerSpec ? res.followerSpec.name : 'Custom Follower');
  dom.lblTopPlanTitle.innerText = `TOP PLAN: ${res.plat.label}`;
  dom.lblTopPlanSub.innerText = `${res.totalSkates} Skates`;

  renderLoadTree(dom.treeBranchWrap, res);
  renderCanvases(inputs, res, isDark);
}

window.onload = () => {
  getTheme = initTheme(dom.btnThemeToggle, () => update());
  bindEvents();
  syncFollowerCatalogInputs(dom.selectFollowerModel.value);
  setMode(4);
};
