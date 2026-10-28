import { CATALOG_MODELS } from './data.js';
import { runPhysicsCalculations } from './physics.js';
import { renderLoadTree, drawFrontElevation, drawTopPlan } from './renderer.js';

// Application State
let activeSetup = 2;
let currentTheme = 'dark'; // 'dark' | 'light'

// DOM Cache
const dom = {
  // Theme Toggle Button
  btnThemeToggle: document.getElementById('btnThemeToggle'),

  // Inputs
  inputPnmMass: document.getElementById('inputPnmMass'),
  inputSkidMass: document.getElementById('inputSkidMass'),
  inputPoweredTare: document.getElementById('inputPoweredTare'),
  inputRiserMass: document.getElementById('inputRiserMass'),
  inputFollowerWheels: document.getElementById('inputFollowerWheels'),
  inputFollowerDia: document.getElementById('inputFollowerDia'),
  inputFollowerWidth: document.getElementById('inputFollowerWidth'),
  selectFollowerMat: document.getElementById('selectFollowerMat'),
  checkPlateEnable: document.getElementById('checkPlateEnable'),
  inputPlateWidth: document.getElementById('inputPlateWidth'),
  inputPlateLength: document.getElementById('inputPlateLength'),
  inputPlateThick: document.getElementById('inputPlateThick'),
  selectPlateSteel: document.getElementById('selectPlateSteel'),
  inputFloorStress: document.getElementById('inputFloorStress'),
  inputSlabDepth: document.getElementById('inputSlabDepth'),

  // Labels
  lblPnmMass: document.getElementById('lblPnmMass'),
  lblSkidMass: document.getElementById('lblSkidMass'),
  lblPoweredTare: document.getElementById('lblPoweredTare'),
  lblRiserMass: document.getElementById('lblRiserMass'),
  lblTotalGrossMass: document.getElementById('lblTotalGrossMass'),
  lblTotalGrossWeight: document.getElementById('lblTotalGrossWeight'),
  lblFollowerWheels: document.getElementById('lblFollowerWheels'),
  lblFollowerDia: document.getElementById('lblFollowerDia'),
  lblFollowerWidth: document.getElementById('lblFollowerWidth'),
  lblPlateWidth: document.getElementById('lblPlateWidth'),
  lblPlateLength: document.getElementById('lblPlateLength'),
  lblPlateThick: document.getElementById('lblPlateThick'),
  lblPlateHandlingWeight: document.getElementById('lblPlateHandlingWeight'),
  lblHandlingBadge: document.getElementById('lblHandlingBadge'),
  lblRecWidth: document.getElementById('lblRecWidth'),
  lblRecThick: document.getElementById('lblRecThick'),
  lblFloorStress: document.getElementById('lblFloorStress'),
  lblSlabDepth: document.getElementById('lblSlabDepth'),
  plateControls: document.getElementById('plateControls'),
  plateDisabledMsg: document.getElementById('plateDisabledMsg'),
  lblSetupSummary: document.getElementById('lblSetupSummary'),
  setupDesc: document.getElementById('setupDesc'),
  panelFollower: document.getElementById('panelFollower'),

  // Metric Cards
  valSkateLoad: document.getElementById('valSkateLoad'),
  subSkateLoad: document.getElementById('subSkateLoad'),
  badgeSkateLoad: document.getElementById('badgeSkateLoad'),
  cardSkateLoad: document.getElementById('cardSkateLoad'),

  valWheelLoad: document.getElementById('valWheelLoad'),
  subWheelLoad: document.getElementById('subWheelLoad'),
  badgeWheelLoad: document.getElementById('badgeWheelLoad'),
  cardWheelLoad: document.getElementById('cardWheelLoad'),

  valPressure: document.getElementById('valPressure'),
  subPressure: document.getElementById('subPressure'),
  badgePressure: document.getElementById('badgePressure'),
  cardPressure: document.getElementById('cardPressure'),

  valDispersion: document.getElementById('valDispersion'),
  badgeDispersion: document.getElementById('badgeDispersion'),
  cardDispersion: document.getElementById('cardDispersion'),

  valUdl: document.getElementById('valUdl'),
  badgeUdl: document.getElementById('badgeUdl'),

  valRigidity: document.getElementById('valRigidity'),
  subRigidity: document.getElementById('subRigidity'),
  badgeRigidity: document.getElementById('badgeRigidity'),
  cardRigidity: document.getElementById('cardRigidity'),

  // Visuals
  treeBranchWrap: document.getElementById('treeBranchWrap'),
  frontCanvas: document.getElementById('frontCanvas'),
  topCanvas: document.getElementById('topCanvas')
};

// Theme Management
function initTheme() {
  const saved = localStorage.getItem('transit_sim_theme');
  if (saved) {
    currentTheme = saved;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    currentTheme = 'light';
  } else {
    currentTheme = 'dark';
  }
  applyTheme(currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('transit_sim_theme', currentTheme);
  applyTheme(currentTheme);
  update(); // re-draw canvases with new theme colors
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

// Event Bindings
function bindEvents() {
  // Theme toggle
  dom.btnThemeToggle.addEventListener('click', toggleTheme);

  // Range sliders & selects
  const liveInputs = [
    dom.inputPnmMass, dom.inputSkidMass, dom.inputPoweredTare, dom.inputRiserMass,
    dom.inputFollowerWheels, dom.inputFollowerDia, dom.inputFollowerWidth, dom.selectFollowerMat,
    dom.checkPlateEnable, dom.inputPlateWidth, dom.inputPlateLength, dom.inputPlateThick,
    dom.selectPlateSteel, dom.inputFloorStress, dom.inputSlabDepth
  ];
  liveInputs.forEach(el => el.addEventListener('input', update));

  // Follower model presets
  document.querySelectorAll('#btnGroupModels .btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#btnGroupModels .btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const model = btn.getAttribute('data-model');
      if (CATALOG_MODELS[model]) {
        dom.inputFollowerWheels.value = CATALOG_MODELS[model].wheels;
        dom.inputFollowerDia.value = CATALOG_MODELS[model].dia;
        dom.inputFollowerWidth.value = CATALOG_MODELS[model].width;
      }
      update();
    });
  });

  // Plate size presets
  document.querySelectorAll('#btnGroupPlates .btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#btnGroupPlates .btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dom.inputPlateWidth.value = btn.getAttribute('data-w');
      dom.inputPlateLength.value = btn.getAttribute('data-l');
      update();
    });
  });

  // Stress presets
  document.querySelectorAll('#btnGroupStress .btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#btnGroupStress .btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dom.inputFloorStress.value = btn.getAttribute('data-stress');
      update();
    });
  });

  // Slab presets
  document.querySelectorAll('#btnGroupSlab .btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#btnGroupSlab .btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dom.inputSlabDepth.value = btn.getAttribute('data-h');
      update();
    });
  });

  // Setup mode toggles
  document.getElementById('btnSetup1').addEventListener('click', () => setMode(1));
  document.getElementById('btnSetup2').addEventListener('click', () => setMode(2));
  document.getElementById('btnSetup3').addEventListener('click', () => setMode(3));
}

function setMode(mode) {
  activeSetup = mode;
  document.getElementById('btnSetup1').className = "setup-btn" + (mode === 1 ? " active" : "");
  document.getElementById('btnSetup2').className = "setup-btn" + (mode === 2 ? " active" : "");
  document.getElementById('btnSetup3').className = "setup-btn" + (mode === 3 ? " active" : "");

  if (mode === 1) {
    dom.lblSetupSummary.innerText = "Mode 1: 2-Skates Only (Baseline)";
    dom.setupDesc.innerHTML = "<strong style='color:var(--fail);'>Baseline Mode:</strong> 2 powered skates at the center of the 2.20 m ends carry 100% of the load (50% each). High wheel loads (>10 kN) cause severe slab punching risk.";
    dom.panelFollower.style.opacity = "0.5";
    dom.panelFollower.style.pointerEvents = "none";
  } else if (mode === 2) {
    dom.lblSetupSummary.innerText = "Mode 2: 6-Point Perimeter Rig";
    dom.setupDesc.innerHTML = "<strong>6-Point Perimeter Rig:</strong> 2 center-edge powered drive units (P1, P2) at the 2.20 m ends + 4 corner follower skids. Symmetrical load division with 3-point floor rocking simulation.";
    dom.panelFollower.style.opacity = "1";
    dom.panelFollower.style.pointerEvents = "auto";
  } else {
    dom.lblSetupSummary.innerText = "Mode 3: Diamond 4-Point Rig";
    dom.setupDesc.innerHTML = "<strong style='color:var(--accent);'>360° Zero-Turn Rig:</strong> 2 center-edge powered units (P1, P2) at the 2.20 m ends + 2 centerline swivel bogies (F1, F2). Pure center spin with zero floor scrubbing.";
    dom.panelFollower.style.opacity = "1";
    dom.panelFollower.style.pointerEvents = "auto";
  }
  update();
}

// Main Orchestrator
function update() {
  const isDark = currentTheme === 'dark';

  const inputs = {
    mPnm: parseFloat(dom.inputPnmMass.value),
    mSkid: parseFloat(dom.inputSkidMass.value),
    mPoweredTare: parseFloat(dom.inputPoweredTare.value),
    mRiser: parseFloat(dom.inputRiserMass.value),
    nFollowerWheels: parseInt(dom.inputFollowerWheels.value),
    dFollower: parseFloat(dom.inputFollowerDia.value),
    wFollower: parseFloat(dom.inputFollowerWidth.value),
    matKey: dom.selectFollowerMat.value,
    plateEnabled: dom.checkPlateEnable.checked,
    B_plate: parseFloat(dom.inputPlateWidth.value),
    L_plate: parseFloat(dom.inputPlateLength.value),
    t_plate: parseFloat(dom.inputPlateThick.value),
    plateMatKey: dom.selectPlateSteel.value,
    pAllowFloor: parseFloat(dom.inputFloorStress.value),
    hSlab: parseFloat(dom.inputSlabDepth.value),
    activeSetup
  };

  // Synchronize Text Labels
  dom.lblPnmMass.innerText = inputs.mPnm.toLocaleString() + " kg";
  dom.lblSkidMass.innerText = inputs.mSkid.toLocaleString() + " kg";
  dom.lblPoweredTare.innerText = inputs.mPoweredTare.toLocaleString() + " kg";
  dom.lblRiserMass.innerText = inputs.mRiser.toLocaleString() + " kg";
  dom.lblFollowerWheels.innerText = inputs.nFollowerWheels + " wheels";
  dom.lblFollowerDia.innerText = inputs.dFollower + " mm";
  dom.lblFollowerWidth.innerText = inputs.wFollower + " mm";
  dom.lblPlateWidth.innerText = inputs.B_plate + " mm";
  dom.lblPlateLength.innerText = inputs.L_plate.toLocaleString() + " mm";
  dom.lblPlateThick.innerText = inputs.t_plate + " mm";
  dom.lblFloorStress.innerText = inputs.pAllowFloor.toFixed(1) + " MPa";
  dom.lblSlabDepth.innerText = inputs.hSlab.toFixed(0) + " mm";

  dom.plateControls.style.display = inputs.plateEnabled ? 'block' : 'none';
  dom.plateDisabledMsg.style.display = inputs.plateEnabled ? 'none' : 'block';

  // Run Calculations
  const res = runPhysicsCalculations(inputs);

  // Update Section 2 Summary
  dom.lblTotalGrossMass.innerText = `${res.grossMass.toLocaleString('en-US', {maximumFractionDigits:0})} kg`;
  dom.lblTotalGrossWeight.innerText = `${res.grossWeight_kN.toFixed(2)} kN`;

  // Update Handling Weight
  dom.lblPlateHandlingWeight.innerText = `${res.singlePlateMass.toFixed(1)} kg`;
  if (res.singlePlateMass <= 20) {
    dom.lblHandlingBadge.innerText = "🟢 Easy 1-Man Carry (Very High Mobility)";
    dom.lblHandlingBadge.style.color = "var(--pass)";
  } else if (res.singlePlateMass <= 45) {
    dom.lblHandlingBadge.innerText = "🟡 2-Man Lift Required (Standard Rigging Track)";
    dom.lblHandlingBadge.style.color = "var(--warn)";
  } else {
    dom.lblHandlingBadge.innerText = "🔴 Heavy / Forklift Required (High Labor Penalty!)";
    dom.lblHandlingBadge.style.color = "var(--fail)";
  }

  // Update Recommendations
  dom.lblRecWidth.innerText = `${res.B_code_min.toFixed(0)} mm`;
  dom.lblRecThick.innerText = `${res.t_req.toFixed(1)} mm`;

  // Update Dashboard Cards
  dom.valSkateLoad.innerText = `${res.nominalSkateLoad_kN.toFixed(2)} kN`;
  dom.subSkateLoad.innerText = `Dynamic Peak: ${res.peakSkateLoad_kN.toFixed(2)} kN`;
  if (res.isSpreadOK) {
    dom.badgeSkateLoad.className = "status-badge status-pass";
    dom.badgeSkateLoad.innerText = "SPREAD BY RUNWAY (ZONE 3)";
    dom.cardSkateLoad.className = "dash-card card-pass";
  } else if (activeSetup === 1) {
    dom.badgeSkateLoad.className = "status-badge status-fail";
    dom.badgeSkateLoad.innerText = "OVERLOADED (50% SHARE)";
    dom.cardSkateLoad.className = "dash-card card-fail";
  } else {
    dom.badgeSkateLoad.className = "status-badge status-pass";
    dom.badgeSkateLoad.innerText = "SAFE GROUP SHARE";
    dom.cardSkateLoad.className = "dash-card card-pass";
  }

  dom.valWheelLoad.innerText = `${res.wheelLoad_kN.toFixed(2)} kN`;
  if (res.isSpreadOK) {
    dom.badgeWheelLoad.className = "status-badge status-pass";
    dom.badgeWheelLoad.innerText = "PASS (SPREAD BY RUNWAY)";
    dom.subWheelLoad.innerText = "Load bridged by wide track (No local punch)";
    dom.cardWheelLoad.className = "dash-card card-pass";
  } else {
    dom.subWheelLoad.innerText = "Limit: Static 4.5 kN | Dyn 7.0 kN";
    if (res.wheelLoad_kN <= 4.50) {
      dom.badgeWheelLoad.className = "status-badge status-pass";
      dom.badgeWheelLoad.innerText = "PASS (STATIC & DYN)";
      dom.cardWheelLoad.className = "dash-card card-pass";
    } else if (res.wheelLoad_kN <= 7.00) {
      dom.badgeWheelLoad.className = "status-badge status-warn";
      dom.badgeWheelLoad.innerText = "PASS (< 7.0 kN DYN)";
      dom.cardWheelLoad.className = "dash-card card-warn";
    } else {
      dom.badgeWheelLoad.className = "status-badge status-fail";
      dom.badgeWheelLoad.innerText = "FAIL (> 7.0 kN LIMIT)";
      dom.cardWheelLoad.className = "dash-card card-fail";
    }
  }

  dom.valPressure.innerText = `${res.contactPressure_MPa.toFixed(2)} MPa`;
  dom.subPressure.innerText = `Floor Limit: ${inputs.pAllowFloor.toFixed(1)} MPa`;
  if (res.contactPressure_MPa <= inputs.pAllowFloor) {
    dom.badgePressure.className = "status-badge status-pass";
    dom.badgePressure.innerText = "PASS (COATING SAFE)";
    dom.cardPressure.className = "dash-card card-pass";
  } else {
    dom.badgePressure.className = "status-badge status-fail";
    dom.badgePressure.innerText = "FAIL (COATING CRUSH RISK)";
    dom.cardPressure.className = "dash-card card-fail";
  }

  dom.valDispersion.innerText = `${res.bottomSpread_mm.toFixed(0)} mm`;
  const zone3Min = 2 * inputs.hSlab;
  if (res.bottomSpread_mm > zone3Min && !res.isCurling) {
    dom.badgeDispersion.className = "status-badge status-pass";
    dom.badgeDispersion.innerText = `ZONE 3: DISTRIBUTED (> ${zone3Min.toFixed(0)}mm)`;
    dom.cardDispersion.className = "dash-card card-pass";
  } else if (res.bottomSpread_mm >= (2/3 * inputs.hSlab) && !res.isCurling) {
    dom.badgeDispersion.className = "status-badge status-warn";
    dom.badgeDispersion.innerText = "ZONE 2: TRANSITION";
    dom.cardDispersion.className = "dash-card card-warn";
  } else {
    dom.badgeDispersion.className = "status-badge status-fail";
    dom.badgeDispersion.innerText = "ZONE 1: POINT PUNCH";
    dom.cardDispersion.className = "dash-card card-fail";
  }

  dom.valUdl.innerText = `${res.udl_ton.toFixed(2)} ton/m²`;
  if (res.udl_ton <= 1.00) {
    dom.badgeUdl.className = "status-badge status-pass";
    dom.badgeUdl.innerText = `${((1.00 - res.udl_ton) * 100).toFixed(0)}% SAFETY MARGIN`;
  } else {
    dom.badgeUdl.className = "status-badge status-fail";
    dom.badgeUdl.innerText = "EXCEEDS 1.00 T/M² LIMIT";
  }

  if (!inputs.plateEnabled) {
    dom.valRigidity.innerText = "BARE SKATES";
    dom.subRigidity.innerText = "Rolling directly on floor";
    dom.badgeRigidity.className = "status-badge status-warn";
    dom.badgeRigidity.innerText = "NO SPREADER PLATE";
    dom.cardRigidity.className = "dash-card card-warn";
  } else if (res.isRigid) {
    dom.valRigidity.innerText = "RIGID RUNWAY";
    dom.subRigidity.innerText = `t = ${inputs.t_plate} mm ≥ t_req (${res.t_req.toFixed(1)} mm)`;
    dom.badgeRigidity.className = "status-badge status-pass";
    dom.badgeRigidity.innerText = "PASS (RUNWAY STIFF)";
    dom.cardRigidity.className = "dash-card card-pass";
  } else {
    dom.valRigidity.innerText = "FLEXIBLE / CURLING";
    dom.subRigidity.innerText = `t = ${inputs.t_plate} mm < t_req (${res.t_req.toFixed(1)} mm)`;
    dom.badgeRigidity.className = "status-badge status-fail";
    dom.badgeRigidity.innerText = "POTATO-CHIP LIFT-OFF";
    dom.cardRigidity.className = "dash-card card-fail";
  }

  // Render Visuals with current theme awareness
  renderLoadTree(dom.treeBranchWrap, activeSetup, res.grossMass, res.grossWeight_kN, res.activeFollowerWheels);

  drawFrontElevation(dom.frontCanvas, {
    D: res.wheelDia,
    numWheels: res.governingIsPowered ? 4 : inputs.nFollowerWheels,
    F_skate: res.peakSkateLoad_kN,
    F_wheel: res.wheelLoad_kN,
    hSlab: inputs.hSlab,
    plateOn: inputs.plateEnabled,
    B: inputs.B_plate,
    t: inputs.t_plate,
    isRigid: res.isRigid,
    isCurling: res.isCurling,
    t_req: res.t_req,
    Beff: res.Beff,
    bottomSpread: res.bottomSpread_mm,
    plateMat: res.plateMat
  }, isDark);

  drawTopPlan(dom.topCanvas, activeSetup, res.nominalSkateLoad_kN, res.peakSkateLoad_kN, inputs.plateEnabled, inputs.B_plate, inputs.L_plate, isDark);
}

// Initial Boot
window.onload = () => {
  initTheme();
  bindEvents();
  update();
};
