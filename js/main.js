import { CATALOG_MODELS } from './data.js?v=12';
import { runPhysicsCalculations } from './physics.js?v=12';
import { renderLoadTree, drawFrontElevation, drawTopPlan, drawSfdBmdChart, renderAmrFormulaSteps } from './renderer.js?v=12';
import {
  optNum, initTheme, bindPresetGroup, setCardStatus,
  readSharedSlabInputs, updateSharedSlabOutputs
} from './ui_common.js?v=12';

let activeSetup = 3; // 1=Preset 1 (2-Skate), 2=4-Point, 3=Preset 2 (6-Skate), 4=8-Point, 5=10-Point
let designCode = 'BS8110';
let beMode = 'bs8110';
let nuPU = 0.49;
let calcModel = 'report';
let spanAlign = 'transverse3';
let lastNonZeroBase = 1500;
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
  checkBaseEnable: document.getElementById('checkBaseEnable'),
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
  checkMeLoad: document.getElementById('checkMeLoad'),

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

  cardDeflection: document.getElementById('cardDeflection'),
  valDeflection: document.getElementById('valDeflection'),
  subDeflection: document.getElementById('subDeflection'),
  badgeDeflection: document.getElementById('badgeDeflection'),

  lblTreeModeTag: document.getElementById('lblTreeModeTag'),
  treeBranchWrap: document.getElementById('treeBranchWrap'),
  lblSfdBmdSub: document.getElementById('lblSfdBmdSub'),
  lblFrontElevationSub: document.getElementById('lblFrontElevationSub'),
  lblTopPlanTitle: document.getElementById('lblTopPlanTitle'),
  lblTopPlanSub: document.getElementById('lblTopPlanSub'),
  sfdBmdCanvas: document.getElementById('sfdBmdCanvas'),
  frontCanvas: document.getElementById('frontCanvas'),
  topCanvas: document.getElementById('topCanvas'),
  formulaStepsWrap: document.getElementById('formulaStepsWrap')
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

  if (dom.checkBaseEnable) {
    dom.checkBaseEnable.addEventListener('change', () => {
      if (dom.checkBaseEnable.checked) {
        dom.inputBaseMass.value = lastNonZeroBase > 0 ? lastNonZeroBase : 1500;
      } else {
        const cur = parseFloat(dom.inputBaseMass.value);
        if (cur > 0) lastNonZeroBase = cur;
        dom.inputBaseMass.value = 0;
      }
      update();
    });
  }

  const liveInputs = [
    dom.inputPlatL, dom.inputPlatW,
    dom.selectPoweredModel, dom.inputSkateBias,
    dom.inputFollowerWeight, dom.inputFollowerWheels, dom.inputFollowerDia, dom.inputFollowerWidth,
    dom.selectFollowerMat, dom.inputShoreA,
    dom.inputPnmMass, dom.inputBaseMass, dom.inputAddLoad,
    dom.checkPlateEnable, dom.inputPlateWidth, dom.inputPlateLength, dom.inputPlateThick,
    dom.selectPlateSteel, dom.inputUdlLimit, dom.selectConcreteGrade,
    dom.inputSlabDepth, dom.inputRhoL, dom.inputSpanL, dom.inputFloorStress,
    dom.checkMeLoad
  ].filter(Boolean);
  liveInputs.forEach((el) => el.addEventListener('input', () => {
    if (el === dom.inputFollowerWheels || el === dom.inputFollowerDia || el === dom.inputFollowerWidth) {
      dom.selectFollowerModel.value = 'CUSTOM';
    }
    if (el === dom.inputBaseMass && dom.checkBaseEnable) {
      const mVal = parseFloat(dom.inputBaseMass.value) || 0;
      if (mVal > 0) lastNonZeroBase = mVal;
      dom.checkBaseEnable.checked = mVal > 0;
    }
    if (el === dom.inputSkateBias) {
      const bVal = parseFloat(dom.inputSkateBias.value);
      document.querySelectorAll('#btnGroupBias .btn-preset').forEach((b) => {
        b.classList.toggle('active', parseFloat(b.getAttribute('data-bias')) === bVal);
      });
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
  bindPresetGroup('#btnGroupBias', (btn) => {
    dom.inputSkateBias.value = btn.getAttribute('data-bias');
    update();
  });
  bindPresetGroup('#btnGroupNu', (btn) => {
    nuPU = parseFloat(btn.getAttribute('data-nu'));
    update();
  });
  bindPresetGroup('#btnGroupBeMode', (btn) => {
    beMode = btn.getAttribute('data-be');
    update();
  });
  bindPresetGroup('#btnGroupCalcModel', (btn) => {
    calcModel = btn.getAttribute('data-model');
    update();
  });
  bindPresetGroup('#btnGroupSpanAlign', (btn) => {
    spanAlign = btn.getAttribute('data-align');
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
    1: { summary: 'Preset 1: 2× TS-10T', tree: 'PRESET 1 · 2-SKATE (TS-10T)', bias: 60, followerActive: false },
    2: { summary: '4-Point', tree: '4-POINT', bias: 35, followerActive: true },
    3: { summary: 'Preset 2: 6-Skate', tree: 'PRESET 2 · 6-SKATE (2×TS + 4×CRQ-8)', bias: 20, followerActive: true },
    4: { summary: '8-Point', tree: '8-POINT', bias: 20, followerActive: true },
    5: { summary: '10-Point', tree: '10-POINT', bias: 19, followerActive: true }
  }[mode];

  dom.lblSetupSummary.innerText = modeMeta.summary;
  dom.lblTreeModeTag.innerText = modeMeta.tree;
  dom.inputSkateBias.value = modeMeta.bias;
  document.querySelectorAll('#btnGroupBias .btn-preset').forEach((b) => {
    b.classList.toggle('active', parseFloat(b.getAttribute('data-bias')) === modeMeta.bias);
  });

  dom.panelFollower.style.opacity = modeMeta.followerActive ? '1' : '0.5';
  dom.panelFollower.style.pointerEvents = modeMeta.followerActive ? 'auto' : 'none';
  dom.biasGroup.style.opacity = mode === 1 ? '0.6' : '1';
  dom.inputSkateBias.disabled = mode === 1;

  update();
}

function renderCanvases(inputs, res, isDark) {
  if (dom.sfdBmdCanvas) {
    drawSfdBmdChart(
      dom.sfdBmdCanvas,
      res.beam,
      inputs.spanL,
      res.M_UDL_benchmark,
      res.V_UDL_benchmark,
      isDark,
      { mDes: res.M_des_kNm, mUlt: res.M_ult_kNm }
    );
  }

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
    isDark,
    {
      calcModel: res.calcModel,
      peData: res.peData,
      followerName: res.followerSpec ? res.followerSpec.name : 'Followers'
    }
  );
}

function update() {
  const isDark = getTheme() === 'dark';
  const shared = readSharedSlabInputs(dom, designCode);

  const inputs = {
    platL: optNum(dom.inputPlatL) || 3.80,
    platW: optNum(dom.inputPlatW) || 2.20,
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
    nuPU,
    skateBiasPct: parseFloat(dom.inputSkateBias.value),
    beMode,
    calcModel,
    spanAlign,
    meLoadOn: !!(dom.checkMeLoad && dom.checkMeLoad.checked),
    ...shared,
    activeSetup
  };

  dom.lblSkateBias.innerText = `${inputs.skateBiasPct.toFixed(0)}%`;
  dom.lblFollowerWeight.innerText = `${inputs.followerUnitWeight.toFixed(0)} kg`;
  dom.lblFollowerWheels.innerText = `${inputs.nFollowerWheels}`;
  dom.lblFollowerDia.innerText = `${inputs.dFollower} mm`;
  dom.lblFollowerWidth.innerText = `${inputs.wFollower} mm`;
  dom.lblShoreA.innerText = `${inputs.shoreA} A · ν=${nuPU.toFixed(2)}`;
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
  if (res.calcModel === 'pe' && res.peData && Array.isArray(res.peData.reactions)) {
    const r = res.peData.reactions;
    const govSk = Math.max(...r);
    dom.valSkateLoad.innerText = `${govSk.toFixed(2)} kN`;
    dom.subSkateLoad.innerText = r.length >= 6
      ? `PE Frame (${res.peData.totalLoad_kN.toFixed(1)} kN): F-Psv ${r[2].toFixed(2)} | R-Psv ${r[4].toFixed(2)} | Pwr ${r[0].toFixed(2)}/${r[1].toFixed(2)} kN`
      : `PE Frame (${res.peData.totalLoad_kN.toFixed(1)} kN): ${r[0].toFixed(2)} kN/skate`;
    setCardStatus(dom.cardSkateLoad, dom.badgeSkateLoad, 'info', 'PE J2-ANA-1-1');
  } else {
    dom.valSkateLoad.innerText = `${res.peakSkateLoad_kN.toFixed(2)} kN`;
    dom.subSkateLoad.innerText = `Static: ${res.nominalSkateLoad_kN.toFixed(2)} kN | Peak: ${res.peakSkateLoad_kN.toFixed(2)} kN`;
    setCardStatus(dom.cardSkateLoad, dom.badgeSkateLoad, 'info', `${res.totalSkates} SKATES`);
  }

  dom.valPowWheel.innerText = `${res.powEval.peakWheel_kN.toFixed(2)} kN`;
  dom.subPowWheel.innerText = `Stat: ${res.powEval.staticWheel_kN.toFixed(2)} kN | P_mean: ${res.powEval.hertzStatic.p_mean.toFixed(2)}→${res.powEval.hertz.p_mean.toFixed(2)} MPa`;
  setCardStatus(dom.cardPowWheel, dom.badgePowWheel, 'info', res.poweredSpec.name.split('(')[0].trim());

  if (res.calcModel === 'pe' && res.peData && res.folEval) {
    dom.valFolWheel.innerText = `${res.peData.govWheelPeak_kN.toFixed(2)} kN`;
    dom.subFolWheel.innerText = `PE Gov Wheel (17.43×0.35×1.20) | ForkStat/Pk: ${res.folEval.staticFork_kN.toFixed(2)}/${res.folEval.peakFork_kN.toFixed(2)} kN`;
    const folTag = res.followerSpec ? res.followerSpec.name.split('(')[0].trim() : 'PE CRQ-8';
    setCardStatus(dom.cardFolWheel, dom.badgeFolWheel, 'info', `${folTag} (PE ${res.peData.govWheelPeak_kN.toFixed(1)} kN)`);
  } else if (res.folEval) {
    dom.valFolWheel.innerText = `${res.folEval.peakWheel_kN.toFixed(2)} / ${res.folEval.peakFork_kN.toFixed(2)} kN`;
    dom.subFolWheel.innerText = `Wheel Stat: ${res.folEval.staticWheel_kN.toFixed(2)} | Fork Stat: ${res.folEval.staticFork_kN.toFixed(2)} | P_mean: ${res.folEval.hertzStatic.p_mean.toFixed(2)}→${res.folEval.hertz.p_mean.toFixed(2)}`;
    const folTag = res.followerSpec ? res.followerSpec.name.split('(')[0].trim() : 'CUSTOM';
    setCardStatus(dom.cardFolWheel, dom.badgeFolWheel, 'info', `${folTag} (Lw=${res.folEval.width})`);
  } else {
    dom.valFolWheel.innerText = 'N/A';
    dom.subFolWheel.innerText = 'No follower skates in 2-Skate mode';
    setCardStatus(dom.cardFolWheel, dom.badgeFolWheel, 'info', 'NO FOLLOWERS');
  }

  updateSharedSlabOutputs(dom, inputs, res);

  if (dom.lblSfdBmdSub) {
    dom.lblSfdBmdSub.innerText = res.beam
      ? `${res.bendingOrientation} · L = ${inputs.spanL.toFixed(2)} m · be = ${res.b_e_governing.toFixed(2)} m`
      : 'Pending Span L';
  }

  dom.lblFrontElevationSub.innerText = res.governingIsPowered
    ? res.poweredSpec.name
    : (res.followerSpec ? res.followerSpec.name : 'Custom Follower');
  dom.lblTopPlanTitle.innerText = `TOP PLAN: ${res.plat.label}`;
  dom.lblTopPlanSub.innerText = `${res.totalSkates} Skates · Base ${inputs.mBase > 0 ? `${inputs.mBase} kg` : 'Removed (0 kg)'}`;

  renderLoadTree(dom.treeBranchWrap, res);
  renderAmrFormulaSteps(dom.formulaStepsWrap, inputs, res);
  renderCanvases(inputs, res, isDark);
}

window.onload = () => {
  getTheme = initTheme(dom.btnThemeToggle, () => update());
  bindEvents();
  syncFollowerCatalogInputs(dom.selectFollowerModel.value);
  setMode(3);
};
