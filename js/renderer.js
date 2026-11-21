export function renderCasterLoadTree(container, res) {
  const treeRoot = document.getElementById('treeRootVal');
  const grossTon = (res.grossMass / 1000).toFixed(2);
  treeRoot.innerText = `${grossTon} t / ${res.grossWeight_kN.toFixed(2)} kN`;

  const wheelType = res.wheelsPerCaster === 2 ? 'Twin-Wheel' : 'Single-Wheel';
  container.innerHTML = `
    <div class="tree-branch-col">
      <span style="font-size:10px; color:var(--accent); font-weight:700;">${res.numCasters}× ${wheelType} Casters (${res.totalWheels} Wheels)</span>
      <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
        Caster: ${res.nominalCasterLoad_kN.toFixed(2)} kN static | ${res.peakCasterLoad_kN.toFixed(2)} kN peak
      </div>
      <div class="tree-leaf-grid">
        <div class="tree-leaf">STATIC WHEEL<strong>${res.staticWheelLoad_kN.toFixed(2)} kN</strong></div>
        <div class="tree-leaf">PEAK WHEEL<strong>${res.peakWheelLoad_kN.toFixed(2)} kN</strong></div>
      </div>
    </div>
  `;
}

export function renderLoadTree(container, res) {
  const treeRoot = document.getElementById('treeRootVal');
  const grossTon = (res.grossMass / 1000).toFixed(2);
  treeRoot.innerText = `${grossTon} t / ${res.grossWeight_kN.toFixed(2)} kN`;

  const powNom = res.powEval.nomSkate_kN;
  const powPeak = res.powEval.peakSkate_kN;
  const powWheelStatic = res.powEval.staticWheel_kN;
  const powWheelPeak = res.powEval.peakWheel_kN;
  const powPmeanStat = res.powEval.hertzStatic.p_mean;
  const powPmeanPeak = res.powEval.hertz.p_mean;

  let html = `
    <div class="tree-branch-col">
      <span style="font-size:10px; color:var(--accent); font-weight:700;">2× ${res.poweredSpec.name} (Lw=${res.poweredSpec.width} mm)</span>
      <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
        Skate: ${powNom.toFixed(2)} static | ${powPeak.toFixed(2)} kN peak
      </div>
      <div class="tree-leaf-grid">
        <div class="tree-leaf">STATIC WHEEL<strong>${powWheelStatic.toFixed(2)} kN</strong></div>
        <div class="tree-leaf">PEAK WHEEL<strong>${powWheelPeak.toFixed(2)} kN</strong></div>
        <div class="tree-leaf">HERTZ P_mean (STAT)<strong>${powPmeanStat.toFixed(2)} MPa</strong></div>
        <div class="tree-leaf">HERTZ P_mean (PEAK)<strong>${powPmeanPeak.toFixed(2)} MPa</strong></div>
      </div>
    </div>
  `;

  if (res.numFollowers > 0 && res.folEval) {
    const folName = res.followerSpec ? res.followerSpec.name : 'Custom Follower';
    const folNom = res.folEval.nomSkate_kN;
    const folPeak = res.folEval.peakSkate_kN;
    const folWheelStatic = res.folEval.staticWheel_kN;
    const folWheelPeak = res.folEval.peakWheel_kN;
    const folForkStatic = res.folEval.staticFork_kN;
    const folForkPeak = res.folEval.peakFork_kN;
    const folPmeanStat = res.folEval.hertzStatic.p_mean;
    const folPmeanPeak = res.folEval.hertz.p_mean;

    html += `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--pass); font-weight:700;">${res.numFollowers}× ${folName} (Lw=${res.folEval.width} mm)</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Skate: ${folNom.toFixed(2)} static | ${folPeak.toFixed(2)} kN peak
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">WHEEL (STAT / PEAK)<strong>${folWheelStatic.toFixed(2)} / ${folWheelPeak.toFixed(2)} kN</strong></div>
          <div class="tree-leaf">FORK CONE (STAT / PEAK)<strong>${folForkStatic.toFixed(2)} / ${folForkPeak.toFixed(2)} kN</strong></div>
          <div class="tree-leaf">HERTZ P_mean (STAT)<strong>${folPmeanStat.toFixed(2)} MPa</strong></div>
          <div class="tree-leaf">HERTZ P_mean (PEAK)<strong>${folPmeanPeak.toFixed(2)} MPa</strong></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

export function drawFrontElevation(canvas, params, isDark = true) {
  const ctx = canvas.getContext('2d');
  const {
    D, numWheels, hSlab, dSlab,
    plateOn, B, t, isRigid, isCurling, isPlateUndersized, t_req, shearTopW, bottomSpread,
    plateMat, addLoadPerFollower, isSpreadOK, punchPass
  } = params;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const logicalW = 940;
  const logicalH = 340;

  if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalW, logicalH);
  const cx = logicalW / 2;
  const scale = 0.44;

  const visualH = hSlab || 150;
  const visualD = dSlab || 120;
  const slabTopY = 165;
  const slabH_px = visualH * scale;
  const slabD_px = visualD * scale;
  const slabBotY = slabTopY + slabH_px;

  const slabFill = isDark ? '#1e293b' : '#e2e8f0';
  const slabStroke = isDark ? '#475569' : '#94a3b8';
  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#475569';
  const chassisFill = isDark ? '#334155' : '#cbd5e1';
  const riserFill = isDark ? '#475569' : '#94a3b8';

  // 1. Concrete Slab
  ctx.fillStyle = slabFill;
  ctx.fillRect(40, slabTopY, logicalW - 80, slabH_px);
  ctx.strokeStyle = slabStroke;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, slabTopY, logicalW - 80, slabH_px);

  if (hSlab) {
    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(45, slabTopY + slabD_px);
    ctx.lineTo(logicalW - 45, slabTopY + slabD_px);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = secondaryText;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    hSlab ? `Slab h = ${hSlab.toFixed(0)} mm (d = ${visualD.toFixed(0)} mm)` : 'Slab h = Pending input',
    55,
    slabTopY + slabH_px / 2 + 4
  );

  // 2. Downward-Expanding Punching Shear Cone (topW = contact/plate width, botW = topW + 2h)
  const coneTopW = shearTopW;
  const coneBotW = bottomSpread || (coneTopW + 2 * visualH);
  const topHalf = (coneTopW * scale) / 2;
  const botHalf = (coneBotW * scale) / 2;

  let coneFill = 'rgba(56, 189, 248, 0.14)';
  let coneStroke = '#0284c7';
  if (isCurling || isPlateUndersized || punchPass === false) {
    coneFill = 'rgba(239, 68, 68, 0.15)';
    coneStroke = '#dc2626';
  } else if (punchPass === true || (punchPass === null && isSpreadOK === true)) {
    coneFill = 'rgba(34, 197, 94, 0.15)';
    coneStroke = '#16a34a';
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - topHalf, slabTopY);
  ctx.lineTo(cx + topHalf, slabTopY);
  ctx.lineTo(cx + botHalf, slabBotY);
  ctx.lineTo(cx - botHalf, slabBotY);
  ctx.closePath();
  ctx.fillStyle = coneFill;
  ctx.fill();
  ctx.strokeStyle = coneStroke;
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = primaryText;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  const spreadTxt = bottomSpread
    ? `45° Cone: ${coneTopW.toFixed(0)} mm → ${coneBotW.toFixed(0)} mm`
    : `Contact Width = ${coneTopW.toFixed(0)} mm (Cone Base Pending h)`;
  ctx.fillText(spreadTxt, cx, slabBotY + 26);

  ctx.strokeStyle = secondaryText;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - botHalf, slabBotY + 11);
  ctx.lineTo(cx + botHalf, slabBotY + 11);
  ctx.stroke();

  // 3. Spreader Plate
  let skateBaseY = slabTopY;
  if (plateOn) {
    const pW = Math.min(B * scale, logicalW - 140);
    const pH = Math.max(8, t * scale);
    const pTopY = slabTopY - pH;
    skateBaseY = pTopY;

    if (isRigid) {
      ctx.fillStyle = isDark ? '#7e22ce' : '#a855f7';
      ctx.fillRect(cx - pW / 2, pTopY, pW, pH);
      ctx.strokeStyle = isDark ? '#c084fc' : '#7e22ce';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - pW / 2, pTopY, pW, pH);
      const plateLabel = `${B} mm ${plateMat.name.split('(')[0].trim()} (t = ${t} mm)`;
      ctx.font = 'bold 10px sans-serif';
      const labelW = ctx.measureText(plateLabel).width;
      if (labelW + 12 <= pW) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(plateLabel, cx, pTopY + pH / 2 + 3.5);
      } else {
        ctx.fillStyle = isDark ? '#e9d5ff' : '#6b21a8';
        ctx.textAlign = 'left';
        ctx.fillText(plateLabel, cx + pW / 2 + 8, pTopY + pH / 2 + 3.5);
        ctx.textAlign = 'center';
      }
    } else if (isPlateUndersized) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - pW / 2, pTopY, pW, pH);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('UNDERSIZED PLATE (< SKATE)', cx + pW / 2 + 8, pTopY + pH / 2 + 3.5);
      ctx.textAlign = 'center';
    } else {
      const lift = Math.min(20, 14 * ((t_req - t) / Math.max(1, t_req)));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - pW / 2, pTopY - lift);
      ctx.quadraticCurveTo(cx, pTopY + 2, cx + pW / 2, pTopY - lift);
      ctx.lineTo(cx + pW / 2, slabTopY - lift);
      ctx.quadraticCurveTo(cx, slabTopY, cx - pW / 2, slabTopY - lift);
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('EDGE CURLING', cx + pW / 2 + 8, slabTopY - lift + 3);
      ctx.textAlign = 'center';
    }
  }

  // 4. Wheels & Chassis
  const numAxles = params.numAxles || Math.max(2, Math.ceil(numWheels / 2));
  const axleSpacing = D + 20;
  const bogieSpan = (numAxles - 1) * axleSpacing;
  const startX = cx - (bogieSpan * scale) / 2;

  const r = (D * scale) / 2;
  const wy = skateBaseY - r;
  const chassisH = 14;
  const chassisY = wy - r - chassisH;
  const chassisW = (numAxles - 1) * axleSpacing * scale + (D * scale) + 24;

  ctx.fillStyle = chassisFill;
  ctx.fillRect(cx - chassisW / 2, chassisY, chassisW, chassisH);
  ctx.strokeStyle = slabStroke;
  ctx.strokeRect(cx - chassisW / 2, chassisY, chassisW, chassisH);

  const hasRiser = addLoadPerFollower > 0;
  const riserH = hasRiser ? 18 : 0;
  const riserY = chassisY - riserH;
  if (hasRiser) {
    ctx.fillStyle = riserFill;
    ctx.fillRect(cx - 34, riserY, 68, riserH);
    ctx.strokeStyle = slabStroke;
    ctx.strokeRect(cx - 34, riserY, 68, riserH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.fillText(`${addLoadPerFollower} kg`, cx, riserY + 12);
  }

  for (let i = 0; i < numAxles; i++) {
    const ax = startX + i * axleSpacing * scale;
    ctx.beginPath();
    ctx.arc(ax, wy, r, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const arrowColor = isDark ? '#38bdf8' : '#0284c7';
  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx, 24);
  ctx.lineTo(cx, riserY - 3);
  ctx.stroke();
}

// Shared Top-Down Plan Renderer
function renderPlanCanvas(canvas, { platLength, platWidth, buildUnits, nomLoad, peakLoad, peakIndex, plateOn, B, L, allowRunwayTracks, legendItems, isDark }) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const logicalW = 940;
  const logicalH = 260;

  if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalW, logicalH);
  const cx = logicalW / 2;

  const skidW_px = Math.min(680, Math.max(400, platLength * 92));
  const skidH_px = Math.min(156, Math.max(120, platWidth * 58));
  const skidX = cx - skidW_px / 2;
  const skidY = 44;
  const cy = skidY + skidH_px / 2;

  const skidFill = isDark ? '#1e293b' : '#e2e8f0';
  const skidStroke = isDark ? '#475569' : '#94a3b8';
  const accentColor = isDark ? '#38bdf8' : '#0284c7';
  const labelColor = isDark ? '#cbd5e1' : '#334155';
  const legendColor = isDark ? '#94a3b8' : '#64748b';

  ctx.fillStyle = skidFill;
  ctx.fillRect(skidX, skidY, skidW_px, skidH_px);
  ctx.strokeStyle = skidStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(skidX, skidY, skidW_px, skidH_px);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(skidX, 22);
  ctx.lineTo(skidX + skidW_px, 22);
  ctx.stroke();

  ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
  ctx.fillRect(cx - 40, 13, 80, 16);
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${platLength.toFixed(2)} m`, cx, 25);

  ctx.save();
  ctx.translate(skidX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = labelColor;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${platWidth.toFixed(2)} m`, 0, 0);
  ctx.restore();

  const edgePadX = 26;
  const edgePadY = 20;
  const units = buildUnits({ skidX, skidY, skidW_px, skidH_px, cx, cy, edgePadX, edgePadY });

  if (plateOn) {
    ctx.fillStyle = isDark ? 'rgba(126, 34, 206, 0.35)' : 'rgba(168, 85, 247, 0.22)';
    ctx.strokeStyle = isDark ? '#c084fc' : '#9333ea';
    ctx.lineWidth = 1.5;

    const trackH_px = Math.max(24, Math.min(46, (B / (platWidth * 1000)) * skidH_px));
    const trackW_px = skidW_px + 36;
    const isRunwaySheet = allowRunwayTracks && L >= 1500;

    if (isRunwaySheet) {
      ctx.fillRect(skidX - 18, (skidY + edgePadY) - trackH_px / 2, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 18, (skidY + edgePadY) - trackH_px / 2, trackW_px, trackH_px);
      ctx.fillRect(skidX - 18, (skidY + skidH_px - edgePadY) - trackH_px / 2, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 18, (skidY + skidH_px - edgePadY) - trackH_px / 2, trackW_px, trackH_px);

      const padW = Math.max(44, Math.min(80, (L / (platLength * 1000)) * 110));
      units.filter((s) => Math.abs(s.y - cy) < 2).forEach((s) => {
        ctx.fillRect(s.x - padW / 2, cy - trackH_px / 2, padW, trackH_px);
        ctx.strokeRect(s.x - padW / 2, cy - trackH_px / 2, padW, trackH_px);
      });
    } else {
      const padW = Math.max(38, Math.min(110, (L / (platLength * 1000)) * skidW_px));
      units.forEach((sk) => {
        ctx.fillRect(sk.x - padW / 2, sk.y - trackH_px / 2, padW, trackH_px);
        ctx.strokeRect(sk.x - padW / 2, sk.y - trackH_px / 2, padW, trackH_px);
      });
    }
  }

  const boxW = 32;
  const boxH = 20;

  units.forEach((sk, idx) => {
    ctx.fillStyle = sk.color || (sk.isPowered ? '#0284c7' : (isDark ? '#15803d' : '#16a34a'));
    ctx.fillRect(sk.x - boxW / 2, sk.y - boxH / 2, boxW, boxH);
    ctx.strokeStyle = sk.stroke || (sk.isPowered ? '#38bdf8' : (isDark ? '#4ade80' : '#22c55e'));
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sk.x - boxW / 2, sk.y - boxH / 2, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sk.id, sk.x, sk.y + 3);

    const isPeakHighlight = idx === peakIndex;
    const loadStr = isPeakHighlight ? `Peak: ${peakLoad.toFixed(1)} kN` : `${nomLoad.toFixed(1)} kN`;

    ctx.save();
    ctx.font = 'bold 9px sans-serif';
    const txtW = ctx.measureText(loadStr).width;
    const isLeftEdge = sk.x <= skidX + 45;
    const isRightEdge = sk.x >= skidX + skidW_px - 45;

    let pillX, textX, align;
    let textY = sk.y + 3;

    if (isLeftEdge) {
      align = 'left';
      textX = sk.x + boxW / 2 + 8;
      pillX = textX - 4;
    } else if (isRightEdge) {
      align = 'right';
      textX = sk.x - boxW / 2 - 8;
      pillX = textX - txtW - 4;
    } else {
      align = 'center';
      textX = sk.x;
      textY = sk.y < cy ? (sk.y + boxH / 2 + 14) : (sk.y - boxH / 2 - 6);
      pillX = textX - txtW / 2 - 4;
    }

    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)';
    ctx.fillRect(pillX, textY - 9, txtW + 8, 12);
    ctx.fillStyle = isPeakHighlight ? '#f59e0b' : labelColor;
    ctx.textAlign = align;
    ctx.fillText(loadStr, textX, textY);
    ctx.restore();
  });

  ctx.fillStyle = legendColor;
  ctx.font = '10.5px sans-serif';
  ctx.textAlign = 'left';
  const legY = skidY + skidH_px + 24;
  legendItems.forEach((item, i) => {
    ctx.fillText(item, skidX + i * 185, legY);
  });
}

// Mode order: 1=2-Skates, 2=4-Point, 3=6-Point, 4=8-Point, 5=10-Point
export function drawTopPlan(canvas, activeSetup, platLength, platWidth, nomLoad, peakLoad, plateOn, B, L, poweredName, isDark = true) {
  const legendItems = [
    `■ Blue: ${poweredName.split('(')[0].trim()}`,
    '■ Green: Followers'
  ];
  if (activeSetup === 3) {
    const cSpacing = (platWidth / 2).toFixed(2);
    legendItems.push(`End c/c: ${cSpacing} m (${platWidth.toFixed(2)} m width)`);
  }
  if (plateOn) legendItems.push('■ Purple: Spreader Plates');

  renderPlanCanvas(canvas, {
    platLength, platWidth, nomLoad, peakLoad,
    peakIndex: activeSetup === 1 ? 0 : 2,
    plateOn, B, L,
    allowRunwayTracks: activeSetup >= 3,
    legendItems,
    isDark,
    buildUnits: ({ skidX, skidY, skidW_px, skidH_px, cx, cy, edgePadX, edgePadY }) => {
      const skates = [];
      if (activeSetup === 1) {
        skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
      } else if (activeSetup === 2) {
        skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'F1', x: cx, y: skidY + edgePadY, isPowered: false });
        skates.push({ id: 'F2', x: cx, y: skidY + skidH_px - edgePadY, isPowered: false });
      } else if (activeSetup === 3) {
        skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'C1', x: skidX + edgePadX, y: skidY + edgePadY, isPowered: false });
        skates.push({ id: 'C2', x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
        skates.push({ id: 'C3', x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, isPowered: false });
        skates.push({ id: 'C4', x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
      } else if (activeSetup === 4) {
        skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'S1', x: skidX + edgePadX, y: skidY + edgePadY, isPowered: false });
        skates.push({ id: 'S2', x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
        skates.push({ id: 'M1', x: cx, y: skidY + edgePadY, isPowered: false });
        skates.push({ id: 'M2', x: cx, y: skidY + skidH_px - edgePadY, isPowered: false });
        skates.push({ id: 'S3', x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, isPowered: false });
        skates.push({ id: 'S4', x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
      } else {
        skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
        skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
        const spanX = skidW_px - 2 * edgePadX - 40;
        const startRailX = skidX + edgePadX + 20;
        for (let i = 0; i < 4; i++) {
          const px = startRailX + (i * spanX) / 3;
          skates.push({ id: `F${i * 2 + 1}`, x: px, y: skidY + edgePadY, isPowered: false });
          skates.push({ id: `F${i * 2 + 2}`, x: px, y: skidY + skidH_px - edgePadY, isPowered: false });
        }
      }
      return skates;
    }
  });
}

export function drawCasterTopPlan(canvas, numCasters, wheelsPerCaster, platLength, platWidth, nomLoad, peakLoad, plateOn, B, L, isDark = true) {
  const wheelLabel = wheelsPerCaster === 2 ? 'Twin-Wheel Casters' : 'Single-Wheel Casters';
  const legendItems = [`■ Amber: ${numCasters}× ${wheelLabel}`];
  if (plateOn) legendItems.push('■ Purple: Spreader Plates');

  renderPlanCanvas(canvas, {
    platLength, platWidth, nomLoad, peakLoad,
    peakIndex: 0,
    plateOn, B, L,
    allowRunwayTracks: numCasters >= 6,
    legendItems,
    isDark,
    buildUnits: ({ skidX, skidY, skidW_px, skidH_px, cx, edgePadX, edgePadY }) => {
      const casters = [];
      const color = isDark ? '#d97706' : '#f59e0b';
      const stroke = '#fbbf24';
      if (numCasters === 4) {
        casters.push({ id: 'C1', x: skidX + edgePadX, y: skidY + edgePadY, color, stroke });
        casters.push({ id: 'C2', x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, color, stroke });
        casters.push({ id: 'C3', x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, color, stroke });
        casters.push({ id: 'C4', x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, color, stroke });
      } else if (numCasters === 6) {
        casters.push({ id: 'C1', x: skidX + edgePadX, y: skidY + edgePadY, color, stroke });
        casters.push({ id: 'C2', x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, color, stroke });
        casters.push({ id: 'C3', x: cx, y: skidY + edgePadY, color, stroke });
        casters.push({ id: 'C4', x: cx, y: skidY + skidH_px - edgePadY, color, stroke });
        casters.push({ id: 'C5', x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, color, stroke });
        casters.push({ id: 'C6', x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, color, stroke });
      } else {
        const spanX = skidW_px - 2 * edgePadX;
        for (let i = 0; i < 4; i++) {
          const px = skidX + edgePadX + (i * spanX) / 3;
          casters.push({ id: `C${i * 2 + 1}`, x: px, y: skidY + edgePadY, color, stroke });
          casters.push({ id: `C${i * 2 + 2}`, x: px, y: skidY + skidH_px - edgePadY, color, stroke });
        }
      }
      return casters;
    }
  });
}

// Multi-Point Simply Supported Beam SFD V(x) & BMD M(x) Renderer
export function drawSfdBmdChart(canvas, beamRes, spanL, mRef, vRef, isDark = true) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const logicalW = 940;
  const logicalH = 340;

  if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalW, logicalH);

  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#475569';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#475569' : '#94a3b8';
  const refColor = isDark ? '#f59e0b' : '#d97706';

  if (!beamRes || !spanL || beamRes.activeLoads.length === 0) {
    ctx.fillStyle = secondaryText;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Enter Span L to plot Multi-Point SFD V(x) & BMD M(x)', logicalW / 2, logicalH / 2);
    return;
  }

  const plotX0 = 90;
  const plotW = logicalW - 150;
  const toX = (x) => plotX0 + (x / spanL) * plotW;

  // TOP: SFD V(x) [y: 36..146, mid=91]
  const sfdMidY = 91;
  const sfdHalfH = 48;
  const maxVScale = Math.max(beamRes.V_max_kNm || 1, vRef || 1, 1) * 1.18;
  const toVy = (v) => sfdMidY - (v / maxVScale) * sfdHalfH;

  ctx.fillStyle = primaryText;
  ctx.font = 'bold 11.5px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SHEAR FORCE V(x) [kN/m] — V_max = ${beamRes.V_max_kNm.toFixed(2)} vs Ref ±${(vRef || 0).toFixed(2)} kN/m`, plotX0, 20);

  // Zero axis + grid
  ctx.strokeStyle = axisStroke;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(plotX0, sfdMidY);
  ctx.lineTo(plotX0 + plotW, sfdMidY);
  ctx.stroke();

  if (vRef) {
    ctx.save();
    ctx.strokeStyle = refColor;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.3;
    [vRef, -vRef].forEach((vr) => {
      const ry = toVy(vr);
      ctx.beginPath();
      ctx.moveTo(plotX0, ry);
      ctx.lineTo(plotX0 + plotW, ry);
      ctx.stroke();
    });
    ctx.fillStyle = refColor;
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`+V_ref (${vRef.toFixed(2)})`, plotX0 - 8, toVy(vRef) + 3);
    ctx.fillText(`-V_ref`, plotX0 - 8, toVy(-vRef) + 3);
    ctx.restore();
  }

  // SFD polygon fill & stroke
  ctx.save();
  ctx.beginPath();
  beamRes.sfdPoints.forEach(([x, v], idx) => {
    const px = toX(x);
    const py = toVy(v);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.16)';
  ctx.fill();
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();

  // SFD end values & step labels
  ctx.fillStyle = isDark ? '#38bdf8' : '#0369a1';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`+${beamRes.RA_kNm.toFixed(2)}`, plotX0 + 4, toVy(beamRes.RA_kNm) - 5);
  ctx.textAlign = 'right';
  ctx.fillText(`-${beamRes.RB_kNm.toFixed(2)}`, plotX0 + plotW - 4, toVy(-beamRes.RB_kNm) + 12);

  if (beamRes.knotMoments.length >= 3) {
    const k0 = beamRes.knotMoments[0];
    const kLast = beamRes.knotMoments[beamRes.knotMoments.length - 1];
    ctx.textAlign = 'center';
    ctx.fillText(`+${k0.V_after.toFixed(2)}`, toX((k0.x_m + beamRes.x_Mmax_m) / 2), toVy(k0.V_after) - 5);
    ctx.fillText(`${kLast.V_before.toFixed(2)}`, toX((kLast.x_m + beamRes.x_Mmax_m) / 2), toVy(kLast.V_before) + 12);
  }

  // BOTTOM: BMD M(x) [y: 192..308, base=308]
  const bmdBaseY = 308;
  const bmdH = 104;
  const maxMScale = Math.max(beamRes.M_max_kNm || 1, mRef || 1, 1) * 1.18;
  const toMy = (m) => bmdBaseY - (m / maxMScale) * bmdH;

  ctx.fillStyle = primaryText;
  ctx.font = 'bold 11.5px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`BENDING MOMENT M(x) [kNm/m] — M_max = ${beamRes.M_max_kNm.toFixed(2)} vs Ref ${(mRef || 0).toFixed(2)} kNm/m`, plotX0, 178);

  // Base zero line
  ctx.strokeStyle = axisStroke;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(plotX0, bmdBaseY);
  ctx.lineTo(plotX0 + plotW, bmdBaseY);
  ctx.stroke();

  if (mRef) {
    const mry = toMy(mRef);
    ctx.save();
    ctx.strokeStyle = refColor;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(plotX0, mry);
    ctx.lineTo(plotX0 + plotW, mry);
    ctx.stroke();
    ctx.fillStyle = refColor;
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`M_ref (${mRef.toFixed(2)})`, plotX0 - 8, mry + 3);
    ctx.restore();
  }

  // BMD fill & curve
  ctx.save();
  ctx.beginPath();
  beamRes.bmdPoints.forEach(([x, m], idx) => {
    const px = toX(x);
    const py = toMy(m);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  const isMOver = mRef && beamRes.M_max_kNm > mRef;
  ctx.fillStyle = isMOver
    ? (isDark ? 'rgba(239, 68, 68, 0.22)' : 'rgba(220, 38, 38, 0.14)')
    : (isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(22, 163, 74, 0.15)');
  ctx.fill();
  ctx.strokeStyle = isMOver ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#4ade80' : '#16a34a');
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();

  // Knot points & vertical load guides
  ctx.save();
  ctx.font = 'bold 9.5px sans-serif';
  ctx.textAlign = 'center';
  beamRes.knotMoments.forEach((km) => {
    const kx = toX(km.x_m);
    const ky = toMy(km.M_kNm);

    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(kx, 34);
    ctx.lineTo(kx, bmdBaseY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(kx, ky, 4, 0, Math.PI * 2);
    ctx.fillStyle = isMOver ? '#ef4444' : '#22c55e';
    ctx.fill();

    ctx.fillStyle = primaryText;
    ctx.fillText(`${km.M_kNm.toFixed(2)}`, kx, ky - 8);
    ctx.fillStyle = secondaryText;
    ctx.fillText(`x=${km.x_m.toFixed(2)}m (${km.pEff_kNm.toFixed(1)} kN/m)`, kx, bmdBaseY + 14);
  });
  ctx.fillStyle = secondaryText;
  ctx.textAlign = 'left';
  ctx.fillText('0.00 m', plotX0 - 4, bmdBaseY + 14);
  ctx.textAlign = 'right';
  ctx.fillText(`${spanL.toFixed(2)} m`, plotX0 + plotW + 4, bmdBaseY + 14);
  ctx.restore();
}

const ffrac = (num, den) => `<span class="frac"><span class="num">${num}</span><span class="den">${den}</span></span>`;
const fradic = (inner) => `<span class="radic">&radic;<span class="rad-over">${inner}</span></span>`;
const passCls = (flag) => (flag === true ? 'pass' : flag === false ? 'fail' : '');

// Live Textbook Calculation Steps Renderer (Formula -> Substitution -> Result -> Card Check)
export function renderAmrFormulaSteps(container, inputs, res) {
  if (!container) return;

  const pName = res.poweredSpec.name.split('(')[0].trim();
  const fName = res.followerSpec ? res.followerSpec.name.split('(')[0].trim() : 'Follower';
  const mPow = res.poweredSpec.unitTare;
  const biasPct = (res.effectiveBias * 100).toFixed(0);
  const biasDec = res.effectiveBias.toFixed(2);

  // Block 1 values
  const grossExpr = res.numFollowers > 0
    ? `${inputs.mPnm} + ${inputs.mBase} + 2(${mPow}) + ${res.numFollowers}(${res.unitFollowerMass.toFixed(0)} + ${res.addLoadPerFollower.toFixed(0)})`
    : `${inputs.mPnm} + ${inputs.mBase} + 2(${mPow})`;

  const powStat = res.powEval.staticWheel_kN;
  const powPeak = res.powEval.peakWheel_kN;
  const powW = res.poweredSpec.wheels;
  const powWfork = res.poweredSpec.wheelsPerFork;

  let eq14Fol = '';
  if (res.folEval) {
    const fStat = res.folEval.staticWheel_kN;
    const fPeak = res.folEval.peakWheel_kN;
    const fForkPk = res.folEval.peakFork_kN;
    const nw = res.folEval.nWheels;
    const wf = res.folEval.wheelsPerFork;
    eq14Fol = `
      <div class="eq-row">
        <span class="math"><b>${fName}:</b> <i>F</i><sub>wh,stat</sub> = ${ffrac(`${res.nominalSkateLoad_kN.toFixed(2)}`, `${nw}`)} = <b>${fStat.toFixed(2)} kN</b>, &nbsp; <i>F</i><sub>fork,pk</sub> = 0.35(${res.peakSkateLoad_kN.toFixed(2)}) = <b>${fForkPk.toFixed(2)} kN</b>, &nbsp; <i>F</i><sub>wh,pk</sub> = ${ffrac(`${fForkPk.toFixed(2)}`, `${wf}`)} = <span class="eq-res">${fPeak.toFixed(2)} kN</span></span>
        <span class="eq-num"><span class="eq-card-ref">Card 3</span>(1.4b)</span>
      </div>`;
  }

  // Block 2 values (Gent + Hertz with governing unit + secondary unit)
  const govUnit = res.governing;
  const govLabel = res.governingIsPowered ? pName : fName;
  const secUnit = res.folEval ? (res.governingIsPowered ? res.folEval : res.powEval) : null;
  const secLabel = res.governingIsPowered ? fName : pName;

  const isPU = inputs.matKey === 'pu' || res.governingIsPowered;
  const activeSA = res.governingIsPowered ? res.poweredSpec.shoreA : inputs.shoreA;
  const gentNum = 56 + 7.62336 * activeSA;
  const gentDen = 254 - 2.54 * activeSA;
  const hzPeak = govUnit.hertz;
  const hzStat = govUnit.hertzStatic;
  const govR = govUnit.dia / 2.0;
  const govLw = govUnit.width;
  const govFpkN = Math.round(govUnit.peakWheel_kN * 1000);
  const govFstN = Math.round(govUnit.staticWheel_kN * 1000);

  const gentRow = isPU ? `
    <div class="eq-row">
      <span class="math"><i>E</i><sub>PU</sub> = ${ffrac(`0.0981(56 + 7.62336&middot;<i>S</i><sub>A</sub>)`, `0.137505(254 &minus; 2.54&middot;<i>S</i><sub>A</sub>)`)} = ${ffrac(`0.0981 &times; ${gentNum.toFixed(2)}`, `0.137505 &times; ${gentDen.toFixed(2)}`)} = <span class="eq-res">${hzPeak.E_w.toFixed(2)} MPa</span> <small class="eq-note">(at S<sub>A</sub>=${activeSA})</small></span>
      <span class="eq-num">(2.1)</span>
    </div>
    <div class="eq-row">
      <span class="math">${ffrac(`1`, `<i>E</i>*`)} = ${ffrac(`1 &minus; &nu;<sup>2</sup>`, `<i>E</i>`)} &rArr; <i>E</i>* = ${ffrac(`${hzPeak.E_w.toFixed(2)}`, `1 &minus; ${hzPeak.nu_w.toFixed(2)}<sup>2</sup>`)} = ${ffrac(`${hzPeak.E_w.toFixed(2)}`, `${(1 - hzPeak.nu_w * hzPeak.nu_w).toFixed(4)}`)} = <span class="eq-res">${hzPeak.E_star.toFixed(2)} MPa</span></span>
      <span class="eq-num">(2.2)</span>
    </div>` : `
    <div class="eq-row">
      <span class="math">${ffrac(`1`, `<i>E</i>*`)} = ${ffrac(`1 &minus; &nu;<sub>w</sub><sup>2</sup>`, `<i>E</i><sub>w</sub>`)} + ${ffrac(`1 &minus; 0.20<sup>2</sup>`, `30000`)} &rArr; <i>E</i>* = <span class="eq-res">${hzPeak.E_star.toFixed(1)} MPa</span></span>
      <span class="eq-num">(2.1)</span>
    </div>`;

  let hertzContactRow;
  if (inputs.plateEnabled && res.isRigid) {
    hertzContactRow = `
      <div class="eq-row">
        <span class="math"><i>p</i><sub>plate</sub> = ${ffrac(`<i>F</i><sub>skate,pk</sub>`, `<i>B</i><sub>eff</sub> &middot; <i>L</i><sub>c</sub>`)} = ${ffrac(`${(res.peakSkateLoad_kN * 1000).toFixed(0)} N`, `${res.Beff.toFixed(0)} &times; ${Math.min(inputs.L_plate, Math.max(govUnit.chassisL, res.B_code_min || 0)).toFixed(0)} mm²`)} = <span class="eq-res ${passCls(res.isMode1Pass)}">${res.contactPressure_mean_MPa.toFixed(2)} MPa</span> <small class="eq-note">(Limit: ${res.mode1Limit_MPa ? res.mode1Limit_MPa.toFixed(1) : '—'} MPa)</small></span>
        <span class="eq-num"><span class="eq-card-ref">Card 4</span>(2.3)</span>
      </div>`;
  } else {
    const secNote = secUnit
      ? `<br><small class="eq-note">Secondary (${secLabel}, Lw=${secUnit.width} mm): A<sub>Hertz</sub>=${secUnit.hertzStatic.area_mm2.toFixed(0)}→${secUnit.hertz.area_mm2.toFixed(0)} mm² &rArr; P<sub>mean</sub> = <b>${secUnit.hertzStatic.p_mean.toFixed(2)}</b> (Stat) / <b>${secUnit.hertz.p_mean.toFixed(2)} MPa</b> (Peak)</small>`
      : '';
    hertzContactRow = `
      <div class="eq-row">
        <span class="math"><b>Governing (${govLabel}, R=${govR} mm, L<sub>w</sub>=${govLw} mm):</b><br>
        <i>b</i><sub>pk</sub> = ${fradic(ffrac(`4 &middot; ${govFpkN} &middot; ${govR}`, `&pi; &middot; ${govLw} &middot; ${hzPeak.E_star.toFixed(2)}`))} = <b>${hzPeak.b_mm.toFixed(2)} mm</b>, &nbsp; <i>A</i><sub>Hertz</sub> = 2<i>bL</i><sub>w</sub> = <b>${hzPeak.area_mm2.toFixed(1)} mm²</b> <small class="eq-note">(Stat A: ${hzStat.area_mm2.toFixed(1)} mm²)</small><br>
        <i>P</i><sub>mean,stat</sub> = ${ffrac(`${govFstN}`, `${hzStat.area_mm2.toFixed(1)}`)} = <b>${hzStat.p_mean.toFixed(2)} MPa</b>, &nbsp; <i>P</i><sub>mean,pk</sub> = ${ffrac(`${govFpkN}`, `${hzPeak.area_mm2.toFixed(1)}`)} = <span class="eq-res ${passCls(res.isMode1Pass)}">${hzPeak.p_mean.toFixed(2)} MPa</span> &le; ${res.mode1Limit_MPa ? `${res.mode1Limit_MPa.toFixed(1)} MPa` : 'Pending'} <small class="eq-note">(P<sub>max</sub>=${hzPeak.p_max.toFixed(2)})</small>${secNote}</span>
        <span class="eq-num"><span class="eq-card-ref">Card 4</span>(2.3)</span>
      </div>`;
  }

  // Block 3 values (Mode 2 Qk + Punching Shear)
  const p = res.punch;
  const dEff = res.effectiveDSlab ? res.effectiveDSlab.toFixed(0) : '—';
  const vEdkN = (res.shearLoad_ULS_N / 1000).toFixed(2);
  const punchFormula = p.code === 'EC2'
    ? `<i>u</i><sub>1</sub> = <i>u</i><sub>0</sub> + 4&pi;<i>d</i> = ${p.u0_mm.toFixed(0)} + 4&pi;(${dEff}) = <b>${p.u1_mm ? p.u1_mm.toFixed(1) : '—'} mm</b>`
    : `<i>u</i><sub>1</sub> = <i>u</i><sub>0</sub> + 12<i>d</i> = ${p.u0_mm.toFixed(0)} + 12(${dEff}) = <b>${p.u1_mm ? p.u1_mm.toFixed(0) : '—'} mm</b>`;
  const punchStress = p.v_Ed_1 != null
    ? `<i>v</i><sub>Ed,1</sub> = ${ffrac(`${res.shearLoad_ULS_N.toFixed(0)} N`, `${p.u1_mm.toFixed(0)} &times; ${dEff}`)} = <span class="eq-res">${p.v_Ed_1.toFixed(3)} MPa</span>` +
      (p.v_Rd_c != null ? ` &le; <i>v</i><sub>c</sub> = <b>${p.v_Rd_c.toFixed(3)} MPa</b>` : ' <small class="eq-note">(enter &rho;<sub>l</sub> for v<sub>c</sub>)</small>')
    : `Pending slab <i>h</i>`;

  // Block 4 values (Mode 3 Multi-Point SFD/BMD + Plate)
  let mode3Rows;
  if (res.hasSpanL && res.beam) {
    const b = res.beam;
    const L = inputs.spanL;
    const loadList = b.activeLoads
      .map((ld) => `${ld.id} @ ${ld.x_m.toFixed(2)} m: ${ffrac(`${ld.P_kN.toFixed(2)}`, `${ld.be_m.toFixed(2)}`)} = <b>${ld.pEff_kNm.toFixed(2)} kN/m</b>`)
      .join(' &nbsp;|&nbsp; ');
    const sumPeffExpr = b.activeLoads.map((ld) => ld.pEff_kNm.toFixed(2)).join(' + ');

    const leftKnots = b.knotMoments.filter((k) => k.x_m < b.x_Mmax_m - 1e-5);
    let momentSub = `${b.RA_kNm.toFixed(2)}(${b.x_Mmax_m.toFixed(2)})`;
    let momentParts = `${(b.RA_kNm * b.x_Mmax_m).toFixed(2)}`;
    if (leftKnots.length > 0) {
      leftKnots.forEach((lk) => {
        const dx = b.x_Mmax_m - lk.x_m;
        momentSub += ` &minus; ${lk.pEff_kNm.toFixed(2)}(${b.x_Mmax_m.toFixed(2)} &minus; ${lk.x_m.toFixed(2)})`;
        momentParts += ` &minus; ${(lk.pEff_kNm * dx).toFixed(2)}`;
      });
    }

    mode3Rows = `
      <div class="eq-row">
        <span class="math"><i>M</i><sub>ref</sub> = ${ffrac(`${inputs.udlLimit_kPa.toFixed(1)} &times; ${L.toFixed(2)}<sup>2</sup>`, `8`)} = <b>${res.M_UDL_benchmark.toFixed(2)} kNm/m</b>, &nbsp; <i>V</i><sub>ref</sub> = ${ffrac(`${inputs.udlLimit_kPa.toFixed(1)} &times; ${L.toFixed(2)}`, `2`)} = <b>${res.V_UDL_benchmark.toFixed(2)} kN/m</b></span>
        <span class="eq-num">(4.1)</span>
      </div>
      <div class="eq-row">
        <span class="math"><b>Strip Loads (${res.bendingOrientation}):</b> ${loadList}</span>
        <span class="eq-num">(4.2)</span>
      </div>
      <div class="eq-row">
        <span class="math"><i>R</i><sub>A</sub> = <i>V</i><sub>max</sub> = ${ffrac(sumPeffExpr, `2`)} = <span class="eq-res ${passCls(res.isMode3ShearPass)}">${b.V_max_kNm.toFixed(2)} kN/m</span> <small class="eq-note">(V<sub>mid</sub> = &plusmn;${b.V_mid_kNm.toFixed(2)} kN/m)</small><br>
        <i>M</i><sub>max</sub>(<i>x</i>=${b.x_Mmax_m.toFixed(2)} m) = ${momentSub} = ${momentParts} = <span class="eq-res ${passCls(res.isMode3MomentPass)}">${b.M_max_kNm.toFixed(2)} kNm/m</span></span>
        <span class="eq-num"><span class="eq-card-ref">Card 6</span>(4.3)</span>
      </div>`;
  } else {
    mode3Rows = `
      <div class="eq-row">
        <span class="math"><i>M</i><sub>ref</sub> = ${ffrac(`<i>w</i> <i>L</i><sup>2</sup>`, `8`)}, &nbsp; <i>V</i><sub>ref</sub> = ${ffrac(`<i>w</i> <i>L</i>`, `2`)} &nbsp; &mdash; <small class="eq-note">Enter S2 Span L to compute live SFD &amp; BMD</small></span>
        <span class="eq-num"><span class="eq-card-ref">Card 6</span>(4.1)</span>
      </div>`;
  }

  const plateRow = inputs.plateEnabled
    ? `<div class="eq-row">
         <span class="math"><i>c</i> = ${ffrac(`<i>B</i><sub>cap</sub> &minus; ${govUnit.chassisW}`, `2`)}, &nbsp; <i>t</i><sub>req</sub> = <b>${res.t_req.toFixed(1)} mm</b> vs. <i>t</i> = ${inputs.t_plate} mm &rArr; <span class="eq-res ${res.isRigid ? 'pass' : 'fail'}">${res.isPlateUndersized ? 'UNDERSIZED' : res.isRigid ? 'RIGID' : 'CURLING'}</span> <small class="eq-note">(Cone spread: ${res.bottomSpread_mm ? res.bottomSpread_mm.toFixed(0) : '—'} mm)</small></span>
         <span class="eq-num"><span class="eq-card-ref">Card 8</span>(4.4)</span>
       </div>`
    : `<div class="eq-row">
         <span class="math">Spreader Plates: <span class="eq-res">OFF</span> <small class="eq-note">(bare wheels directly on floor; enable Sec. 4 to evaluate t<sub>req</sub>)</small></span>
         <span class="eq-num"><span class="eq-card-ref">Card 8</span>(4.4)</span>
       </div>`;

  container.innerHTML = `
    <article class="formula-block">
      <div class="formula-head">
        <strong>1. Load Accumulation, Footprint UDL &amp; 3-Point Rocking</strong>
        <span class="std-ref">EN 1991-1-1 §6.3 · EN 1991-3 · TR34 / ASTM E1155</span>
      </div>
      <div class="eq-card">
        <div class="eq-row">
          <span class="math"><i>M</i><sub>gross</sub> = ${grossExpr} = <span class="eq-res">${res.grossMass.toLocaleString()} kg</span> &rArr; <i>W</i><sub>gross</sub> = ${ffrac(`${res.grossMass} &times; 9.81`, `1000`)} = <span class="eq-res">${res.grossWeight_kN.toFixed(2)} kN</span></span>
          <span class="eq-num">(1.1)</span>
        </div>
        <div class="eq-row">
          <span class="math">UDL = ${ffrac(`<i>W</i><sub>gross</sub>`, `<i>L</i> &middot; <i>W</i>`)} = ${ffrac(`${res.grossWeight_kN.toFixed(2)}`, `${res.plat.length.toFixed(2)} &times; ${res.plat.width.toFixed(2)}`)} = ${ffrac(`${res.grossWeight_kN.toFixed(2)}`, `${res.plat.area.toFixed(2)}`)} = <span class="eq-res ${passCls(res.isUdlPass)}">${res.udl_kPa.toFixed(2)} kN/m²</span> &le; ${res.udlLimit_kPa.toFixed(2)} kN/m²</span>
          <span class="eq-num"><span class="eq-card-ref">Card 7</span>(1.2)</span>
        </div>
        <div class="eq-row">
          <span class="math"><i>F</i><sub>skate,stat</sub> = ${ffrac(`${res.grossWeight_kN.toFixed(2)}`, `${res.totalSkates}`)} = <b>${res.nominalSkateLoad_kN.toFixed(2)} kN</b>, &nbsp; <i>F</i><sub>skate,pk</sub> = ${res.grossWeight_kN.toFixed(2)} &times; ${biasDec} <small class="eq-note">(${biasPct}%)</small> &times; 1.20 = <span class="eq-res">${res.peakSkateLoad_kN.toFixed(2)} kN</span></span>
          <span class="eq-num"><span class="eq-card-ref">Card 1</span>(1.3)</span>
        </div>
        <div class="eq-row">
          <span class="math"><b>${pName}:</b> <i>F</i><sub>wh,stat</sub> = ${ffrac(`${res.nominalSkateLoad_kN.toFixed(2)}`, `${powW}`)} = <b>${powStat.toFixed(2)} kN</b>, &nbsp; <i>F</i><sub>wh,pk</sub> = ${ffrac(`0.35(${res.peakSkateLoad_kN.toFixed(2)})`, `${powWfork}`)} = <span class="eq-res">${powPeak.toFixed(2)} kN</span></span>
          <span class="eq-num"><span class="eq-card-ref">Card 2</span>(1.4a)</span>
        </div>
        ${eq14Fol}
      </div>
    </article>

    <article class="formula-block">
      <div class="formula-head">
        <strong>2. Mode 1 — Surface Bearing Pressure (Gent + Hertz)</strong>
        <span class="std-ref">Gent (1958) / ASTM D2240 · BS 8110-1 Cl. 5.2.3.4 (fb = 0.4·fcu)</span>
      </div>
      <div class="eq-card">
        ${gentRow}
        ${hertzContactRow}
      </div>
    </article>

    <article class="formula-block">
      <div class="formula-head">
        <strong>3. Mode 2 — Concentrated Point Load (Qk) &amp; Punching Shear</strong>
        <span class="std-ref">EN 1991-1-1 / BS 6399 · BS 8110-1 Cl. 3.7.7 · EC2 Cl. 6.4</span>
      </div>
      <div class="eq-card">
        <div class="eq-row">
          <span class="math"><i>Q</i><sub>k,stat</sub> = <b>${res.qkStaticVal_kN.toFixed(2)} kN</b> &le; 4.5 kN (${res.isQkStaticPass ? 'PASS' : 'FAIL'}), &nbsp; <i>Q</i><sub>k,pk</sub> = <span class="eq-res ${passCls(res.isMode2Pass)}">${res.qkPeakVal_kN.toFixed(2)} kN</span> &le; 7.0 kN (${res.isQkPeakPass ? 'PASS' : 'FAIL'})</span>
          <span class="eq-num"><span class="eq-card-ref">Card 5</span>(3.1)</span>
        </div>
        <div class="eq-row">
          <span class="math"><b>${p.code}:</b> <i>V</i><sub>Ed</sub> = ${res.gammaULS.toFixed(2)}(${res.plateEnabled && res.isRigid ? res.peakSkateLoad_kN.toFixed(2) : res.maxForkLoad_kN.toFixed(2)}) = <b>${vEdkN} kN</b>, &nbsp; ${punchFormula}, &nbsp; ${punchStress}</span>
          <span class="eq-num">(3.2)</span>
        </div>
      </div>
    </article>

    <article class="formula-block">
      <div class="formula-head">
        <strong>4. Mode 3 — Strip Width b<sub>e</sub>, Multi-Point SFD/BMD &amp; Spreader Plate</strong>
        <span class="std-ref">BS 5400 / EC2 45° · BS 8110-1 Cl. 3.5.2.2 · AISC Design Guide 1</span>
      </div>
      <div class="eq-card">
        ${mode3Rows}
        ${plateRow}
      </div>
    </article>
  `;
}
