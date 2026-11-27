import { CASTER_PRESETS } from './data.js?v=12';
import { runMobileBaseCalculations } from './physics.js?v=12';
import { renderCasterLoadTree, drawFrontElevation, drawCasterTopPlan } from './renderer.js?v=12';
import {
  optNum, initTheme, bindPresetGroup, setCardStatus,
  readSharedSlabInputs, updateSharedSlabOutputs
} from './ui_common.js?v=12';

let numCasters = 6;
let wheelsPerCaster = 2; // 1=Single, 2=Twin-Wheel
let phiDynamic = 1.30;
let designCode = 'BS8110';
let getTheme = () => 'dark';
let cachedInputs = null;
let cachedResults = null;

const dom = {
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  inputPlatL: document.getElementById('inputPlatL'),
  inputPlatW: document.getElementById('inputPlatW'),
  inputCasterBias: document.getElementById('inputCasterBias'),
  selectCasterPreset: document.getElementById('selectCasterPreset'),
  inputCasterWeight: document.getElementById('inputCasterWeight'),
  inputCasterDia: document.getElementById('inputCasterDia'),
  inputCasterWidth: document.getElementById('inputCasterWidth'),
  selectCasterMat: document.getElementById('selectCasterMat'),
  inputShoreA: document.getElementById('inputShoreA'),
  shoreAGroup: document.getElementById('shoreAGroup'),
  inputPnmMass: document.getElementById('inputPnmMass'),
  inputFrameMass: document.getElementById('inputFrameMass'),
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
  lblCasterBias: document.getElementById('lblCasterBias'),
  lblCasterWeight: document.getElementById('lblCasterWeight'),
  lblCasterDia: document.getElementById('lblCasterDia'),
  lblCasterWidth: document.getElementById('lblCasterWidth'),
  lblShoreA: document.getElementById('lblShoreA'),
  lblPnmMass: document.getElementById('lblPnmMass'),
  lblFrameMass: document.getElementById('lblFrameMass'),
  lblCasterMassSum: document.getElementById('lblCasterMassSum'),
  lblTotalWheelsSum: document.getElementById('lblTotalWheelsSum'),
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

  cardCasterLoad: document.getElementById('cardCasterLoad'),
  valCasterLoad: document.getElementById('valCasterLoad'),
  subCasterLoad: document.getElementById('subCasterLoad'),
  badgeCasterLoad: document.getElementById('badgeCasterLoad'),

  cardWheelLoad: document.getElementById('cardWheelLoad'),
  valWheelLoad: document.getElementById('valWheelLoad'),
  subWheelLoad: document.getElementById('subWheelLoad'),
  badgeWheelLoad: document.getElementById('badgeWheelLoad'),

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

function syncCasterPreset(presetKey) {
  const spec = CASTER_PRESETS[presetKey];
  if (spec) {
    dom.inputCasterDia.value = spec.dia;
    dom.inputCasterWidth.value = spec.width;
    dom.inputCasterWeight.value = spec.unitMass;
  }
}

function setCasterCount(count) {
  numCasters = count;
  [4, 6, 8].forEach((c) => {
    const btn = document.getElementById(`btnCaster${c}`);
    btn.className = 'setup-btn' + (c === count ? ' active' : '');
    btn.setAttribute('aria-selected', c === count ? 'true' : 'false');
  });

  const defaultBias = count === 4 ? 35 : (count === 6 ? 25 : 20);
  dom.inputCasterBias.value = defaultBias;
  dom.lblSetupSummary.innerText = `${count}-Caster`;
  dom.lblTreeModeTag.innerText = `${count}-CASTER MOBILE BASE`;
  update();
}

function bindEvents() {
  dom.selectCasterPreset.addEventListener('change', () => {
    syncCasterPreset(dom.selectCasterPreset.value);
    update();
  });

  const liveInputs = [
    dom.inputPlatL, dom.inputPlatW, dom.inputCasterBias,
    dom.inputCasterWeight, dom.inputCasterDia, dom.inputCasterWidth,
    dom.selectCasterMat, dom.inputShoreA,
    dom.inputPnmMass, dom.inputFrameMass,
    dom.checkPlateEnable, dom.inputPlateWidth, dom.inputPlateLength, dom.inputPlateThick,
    dom.selectPlateSteel, dom.inputUdlLimit, dom.selectConcreteGrade,
    dom.inputSlabDepth, dom.inputRhoL, dom.inputSpanL, dom.inputFloorStress
  ];

  liveInputs.forEach((el) => el.addEventListener('input', () => {
    if (el === dom.inputCasterDia || el === dom.inputCasterWidth) {
      dom.selectCasterPreset.value = 'CUSTOM';
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

  [4, 6, 8].forEach((c) => {
    document.getElementById(`btnCaster${c}`).addEventListener('click', () => setCasterCount(c));
  });

  bindPresetGroup('#btnGroupPlatform', (btn) => {
    dom.inputPlatL.value = btn.getAttribute('data-l');
    dom.inputPlatW.value = btn.getAttribute('data-w');
    update();
  });
  bindPresetGroup('#btnGroupWheelType', (btn) => {
    wheelsPerCaster = parseInt(btn.getAttribute('data-wpc'), 10);
    update();
  });
  bindPresetGroup('#btnGroupPhi', (btn) => {
    phiDynamic = parseFloat(btn.getAttribute('data-phi'));
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

  window.addEventListener('resize', () => requestAnimationFrame(() => {
    if (cachedInputs && cachedResults) renderCanvases(cachedInputs, cachedResults, getTheme() === 'dark');
  }));
  window.addEventListener('beforeprint', () => {
    if (cachedInputs && cachedResults) renderCanvases(cachedInputs, cachedResults, false);
  });
  window.addEventListener('afterprint', update);
}

function renderCanvases(inputs, res, isDark) {
  drawFrontElevation(dom.frontCanvas, {
    D: inputs.dCaster,
    numWheels: inputs.wheelsPerCaster,
    numAxles: 1,
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
    addLoadPerFollower: 0,
    isSpreadOK: res.isSpreadOK,
    punchPass: res.isMode2Pass
  }, isDark);

  drawCasterTopPlan(
    dom.topCanvas,
    res.numCasters,
    res.wheelsPerCaster,
    res.plat.length,
    res.plat.width,
    res.nominalCasterLoad_kN,
    res.peakCasterLoad_kN,
    inputs.plateEnabled,
    inputs.B_plate,
    inputs.L_plate,
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
    mFrame: parseFloat(dom.inputFrameMass.value),
    numCasters,
    wheelsPerCaster,
    casterUnitMass: parseFloat(dom.inputCasterWeight.value),
    dCaster: parseFloat(dom.inputCasterDia.value),
    wCaster: parseFloat(dom.inputCasterWidth.value),
    matKey: dom.selectCasterMat.value,
    shoreA: parseFloat(dom.inputShoreA.value),
    casterBiasPct: parseFloat(dom.inputCasterBias.value),
    phiDynamic,
    ...shared
  };

  dom.lblCasterBias.innerText = `${inputs.casterBiasPct.toFixed(0)}%`;
  dom.lblCasterWeight.innerText = `${inputs.casterUnitMass.toFixed(0)} kg`;
  dom.lblCasterDia.innerText = `${inputs.dCaster} mm`;
  dom.lblCasterWidth.innerText = `${inputs.wCaster} mm`;
  dom.lblShoreA.innerText = `${inputs.shoreA} A`;
  dom.shoreAGroup.style.display = inputs.matKey === 'pu' ? 'block' : 'none';
  dom.lblPnmMass.innerText = `${inputs.mPnm.toLocaleString()} kg`;
  dom.lblFrameMass.innerText = `${inputs.mFrame.toLocaleString()} kg`;

  const res = runMobileBaseCalculations(inputs);
  cachedInputs = inputs;
  cachedResults = res;

  dom.lblCasterMassSum.innerText = `${res.casterUnitMass.toFixed(0)} kg/ea · ${res.totalCasterMass.toFixed(0)} kg`;
  dom.lblTotalWheelsSum.innerText = `${res.totalWheels} (${res.wheelsPerCaster === 2 ? 'Twin' : 'Single'})`;
  dom.lblTotalGrossMass.innerText = `${res.grossMass.toLocaleString('en-US', { maximumFractionDigits: 0 })} kg`;
  dom.lblTotalGrossWeight.innerText = `${res.grossWeight_kN.toFixed(2)} kN`;

  // Cards 1–2
  dom.valCasterLoad.innerText = `${res.peakCasterLoad_kN.toFixed(2)} kN`;
  dom.subCasterLoad.innerText = `Static: ${res.nominalCasterLoad_kN.toFixed(2)} kN | Φ = ${res.phiDynamic.toFixed(2)}`;
  setCardStatus(dom.cardCasterLoad, dom.badgeCasterLoad, 'info', `${res.numCasters} CASTERS`);

  dom.valWheelLoad.innerText = `${res.peakWheelLoad_kN.toFixed(2)} kN`;
  dom.subWheelLoad.innerText = `Static: ${res.staticWheelLoad_kN.toFixed(2)} kN | Peak: ${res.peakWheelLoad_kN.toFixed(2)} kN`;
  setCardStatus(dom.cardWheelLoad, dom.badgeWheelLoad, 'info', res.wheelsPerCaster === 2 ? 'TWIN-WHEEL' : 'SINGLE WHEEL');

  updateSharedSlabOutputs(dom, inputs, res);

  dom.lblFrontElevationSub.innerText = `Ø${inputs.dCaster}×${inputs.wCaster} mm ${inputs.wheelsPerCaster === 2 ? 'Twin' : 'Single'} Caster`;
  dom.lblTopPlanTitle.innerText = `TOP PLAN: ${res.plat.label}`;
  dom.lblTopPlanSub.innerText = `${res.numCasters} Casters (${res.totalWheels} Wheels)`;

  renderCasterLoadTree(dom.treeBranchWrap, res);
  renderCanvases(inputs, res, isDark);
}

window.onload = () => {
  getTheme = initTheme(dom.btnThemeToggle, () => update());
  bindEvents();
  syncCasterPreset(dom.selectCasterPreset.value);
  setCasterCount(6);
};
