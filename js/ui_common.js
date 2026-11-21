import { CONFIRMED_UDL_KPA } from './data.js?v=11';

export const optNum = (el) => {
  const v = parseFloat(el.value);
  return Number.isFinite(v) && v > 0 ? v : null;
};

export function initTheme(btnEl, onChange) {
  let theme = localStorage.getItem('transit_sim_theme');
  if (!theme) {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  const apply = (t) => {
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (btnEl) btnEl.innerHTML = '🌙 Dark Mode';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (btnEl) btnEl.innerHTML = '☀️ Light Mode';
    }
  };
  apply(theme);
  if (btnEl) {
    btnEl.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('transit_sim_theme', theme);
      apply(theme);
      if (onChange) onChange(theme);
    });
  }
  return () => theme;
}

export function bindPresetGroup(selector, callback) {
  const buttons = document.querySelectorAll(`${selector} .btn-preset`);
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      if (btn.innerText.trim().toLowerCase() !== 'clear') btn.classList.add('active');
      callback(btn);
    });
  });
}

export function setCardStatus(card, badge, state, badgeText) {
  card.className = `dash-card card-${state}`;
  badge.className = `status-badge status-${state}`;
  badge.innerText = badgeText;
}

export function readSharedSlabInputs(dom, designCode) {
  const hSlab = optNum(dom.inputSlabDepth);
  const rhoPct = optNum(dom.inputRhoL);
  const spanL = optNum(dom.inputSpanL);
  const pAllowFloor = optNum(dom.inputFloorStress);
  const udlLimit_kPa = optNum(dom.inputUdlLimit) || CONFIRMED_UDL_KPA;

  return {
    plateEnabled: dom.checkPlateEnable.checked,
    B_plate: parseFloat(dom.inputPlateWidth.value),
    L_plate: parseFloat(dom.inputPlateLength.value),
    t_plate: parseFloat(dom.inputPlateThick.value),
    plateMatKey: dom.selectPlateSteel.value,
    concreteGradeKey: dom.selectConcreteGrade.value || null,
    pAllowFloor,
    hSlab,
    dSlab: hSlab ? Math.max(20, hSlab - 30) : null,
    rhoL: rhoPct ? rhoPct / 100.0 : null,
    designCode,
    spanL,
    udlLimit_kPa
  };
}

export function updateSharedSlabOutputs(dom, inputs, res) {
  dom.lblHeaderSub.innerText = `Floor Load Rating: ${inputs.udlLimit_kPa.toFixed(2)} kN/m²`;
  dom.lblPlateWidth.innerText = `${inputs.B_plate} mm`;
  dom.lblPlateLength.innerText = `${inputs.L_plate.toLocaleString()} mm`;
  dom.lblPlateThick.innerText = `${inputs.t_plate} mm`;
  dom.plateControls.style.display = inputs.plateEnabled ? 'block' : 'none';

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

  // Mode 1: Surface Bearing Pressure (Gent + Hertz, BS 8110-1 Cl. 5.2.3.4 fb = 0.4 * fcu)
  dom.valPressure.innerText = `${res.contactPressure_mean_MPa.toFixed(2)} MPa`;
  const statStr = res.contactPressure_static_mean_MPa != null
    ? `Stat: ${res.contactPressure_static_mean_MPa.toFixed(2)} | Max: ${res.contactPressure_max_MPa.toFixed(2)}`
    : `Max: ${res.contactPressure_max_MPa.toFixed(2)}`;
  if (res.mode1Limit_MPa !== null) {
    dom.subPressure.innerText = `${statStr} | Limit: ${res.mode1Limit_MPa.toFixed(1)} MPa`;
    setCardStatus(dom.cardPressure, dom.badgePressure, res.isMode1Pass ? 'pass' : 'fail', res.isMode1Pass ? 'PASS' : 'FAIL');
  } else {
    dom.subPressure.innerText = `${statStr} MPa | Limit: —`;
    setCardStatus(dom.cardPressure, dom.badgePressure, 'info', 'PENDING LIMIT');
  }

  // Mode 2: Concentrated Point Load Qk (4.5 / 7.0 kN) + Punching Shear
  dom.tagPunchCode.innerText = `${res.punch.code} (${res.punch.perimeterLabel})`;
  if (res.qkPeakVal_kN != null) {
    dom.valPunch.innerText = `${res.qkPeakVal_kN.toFixed(2)} kN`;
    const shearStr = (res.hasHSlab && res.punch.v_Ed_1 != null)
      ? ` | v1: ${res.punch.v_Ed_1.toFixed(3)} MPa`
      : '';
    dom.subPunch.innerText = `Static: ${res.qkStaticVal_kN.toFixed(2)}/${res.qkStaticLimit_kN.toFixed(1)} | Qk: ${res.qkPeakLimit_kN.toFixed(1)} kN${shearStr}`;
    if (res.isMode2Pass === false) {
      const why = res.isMode2QkPass === false ? `FAIL (> ${res.qkPeakLimit_kN.toFixed(1)} kN)` : 'FAIL (SHEAR)';
      setCardStatus(dom.cardPunch, dom.badgePunch, 'fail', why);
    } else {
      const pct = (res.qkPeakVal_kN / res.qkPeakLimit_kN) * 100;
      setCardStatus(dom.cardPunch, dom.badgePunch, 'pass', `PASS (${pct.toFixed(0)}% Qk)`);
    }
  } else if (!res.hasHSlab) {
    dom.valPunch.innerText = '—';
    dom.subPunch.innerText = 'Enter slab h to compute v_Ed';
    setCardStatus(dom.cardPunch, dom.badgePunch, 'info', 'PENDING h');
  }

  // Mode 3: Slab Bending & Strip Shear (per 1.0 m strip)
  if (!res.hasSpanL) {
    dom.valBending.innerText = '—';
    dom.subBending.innerText = 'Enter span L to compute';
    setCardStatus(dom.cardBending, dom.badgeBending, 'info', 'PENDING SPAN L');
  } else {
    dom.valBending.innerText = `${res.M_imposed_max.toFixed(2)} kNm/m`;
    const vText = (res.V_imposed_max != null && res.V_UDL_benchmark != null)
      ? ` | V: ${res.V_imposed_max.toFixed(2)}/${res.V_UDL_benchmark.toFixed(2)} kN/m`
      : '';
    dom.subBending.innerText = `M_ref: ${res.M_UDL_benchmark.toFixed(2)}${vText} (${res.bendingOrientation})`;
    const pctM = (res.M_imposed_max / res.M_UDL_benchmark) * 100;
    setCardStatus(
      dom.cardBending, dom.badgeBending,
      res.isMode3Pass ? 'pass' : 'fail',
      res.isMode3Pass ? `PASS (${pctM.toFixed(0)}%)` : `FAIL (+${(pctM - 100).toFixed(0)}%)`
    );
  }

  // Floor UDL
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

  // Spreader Plate
  if (!inputs.plateEnabled) {
    dom.valRigidity.innerText = 'OFF';
    dom.subRigidity.innerText = 'Bare wheels on floor';
    setCardStatus(dom.cardRigidity, dom.badgeRigidity, 'info', 'NO PLATE');
  } else if (res.isPlateUndersized) {
    dom.valRigidity.innerText = 'UNDERSIZED';
    dom.subRigidity.innerText = `Plate < unit (${res.governing.chassisW}×${res.governing.chassisL})`;
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

  // Overall Result
  const failed = [];
  const pending = [];
  if (res.isUdlPass === false) failed.push('UDL');
  if (res.isMode1Pass === false) failed.push('Surface'); else if (res.isMode1Pass === null) pending.push('Surface');
  if (res.isMode2Pass === false) failed.push('Shear'); else if (res.isMode2Pass === null) pending.push('Shear');
  if (res.isMode3Pass === false) failed.push('Bending'); else if (res.isMode3Pass === null) pending.push('Bending');

  if (failed.length > 0) {
    dom.valVerdict.innerText = `FAIL (${failed.join(', ')})`;
    dom.subVerdict.innerText = pending.length > 0 ? `Pending: ${pending.join(', ')}` : 'Exceeds limit';
    setCardStatus(dom.cardVerdict, dom.badgeVerdict, 'fail', 'FAIL');
  } else if (pending.length > 0) {
    dom.valVerdict.innerText = 'UDL PASS';
    dom.subVerdict.innerText = `Pending: ${pending.join(', ')}`;
    setCardStatus(dom.cardVerdict, dom.badgeVerdict, 'warn', 'PENDING INPUT');
  } else {
    dom.valVerdict.innerText = 'ALL PASS';
    dom.subVerdict.innerText = 'All checks pass';
    setCardStatus(dom.cardVerdict, dom.badgeVerdict, 'pass', 'PASS');
  }
}
