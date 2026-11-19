export function renderLoadTree(container, res) {
  const treeRoot = document.getElementById('treeRootVal');
  const grossTon = (res.grossMass / 1000).toFixed(2);
  treeRoot.innerText = `${grossTon} t / ${res.grossWeight_kN.toFixed(2)} kN`;

  const powNom = res.powEval.nomSkate_kN;
  const powPeak = res.powEval.peakSkate_kN;
  const powWheelStatic = res.powEval.staticWheel_kN;
  const powWheelPeak = res.powEval.peakWheel_kN;

  let html = `
    <div class="tree-branch-col">
      <span style="font-size:10px; color:var(--accent); font-weight:700;">2× ${res.poweredSpec.name}</span>
      <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
        Skate: ${powNom.toFixed(2)} static | ${powPeak.toFixed(2)} kN peak
      </div>
      <div class="tree-leaf-grid">
        <div class="tree-leaf">STATIC WHEEL<strong>${powWheelStatic.toFixed(2)} kN</strong></div>
        <div class="tree-leaf">PEAK WHEEL<strong>${powWheelPeak.toFixed(2)} kN</strong></div>
      </div>
    </div>
  `;

  if (res.numFollowers > 0 && res.folEval) {
    const folName = res.followerSpec ? res.followerSpec.name : 'Custom Follower';
    const folNom = res.folEval.nomSkate_kN;
    const folPeak = res.folEval.peakSkate_kN;
    const folWheelStatic = res.folEval.staticWheel_kN;
    const folWheelPeak = res.folEval.peakWheel_kN;

    html += `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--pass); font-weight:700;">${res.numFollowers}× ${folName}</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Skate: ${folNom.toFixed(2)} static | ${folPeak.toFixed(2)} kN peak
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC WHEEL<strong>${folWheelStatic.toFixed(2)} kN</strong></div>
          <div class="tree-leaf">PEAK WHEEL<strong>${folWheelPeak.toFixed(2)} kN</strong></div>
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
  const numAxles = Math.max(2, Math.ceil(numWheels / 2));
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

// Mode order: 1=2-Skates, 2=4-Point, 3=6-Point, 4=8-Point, 5=10-Point
export function drawTopPlan(canvas, activeSetup, platLength, platWidth, nomLoad, peakLoad, plateOn, B, L, poweredName, isDark = true) {
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

  const skidW_px = Math.min(680, Math.max(400, platLength * 145));
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
  const skates = [];

  if (activeSetup === 1) {
    skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
  } else if (activeSetup === 2) {
    // 4-Point Diamond
    skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'F1', x: cx, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: 'F2', x: cx, y: skidY + skidH_px - edgePadY, isPowered: false });
  } else if (activeSetup === 3) {
    // 6-Point Perimeter
    skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'C1', x: skidX + edgePadX, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: 'C2', x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
    skates.push({ id: 'C3', x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: 'C4', x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
  } else if (activeSetup === 4) {
    // 8-Point (P1/P2 at short-edge centers consistent with all setups; 6 followers at corners + mid-rails)
    skates.push({ id: 'P1', x: skidX + edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'P2', x: skidX + skidW_px - edgePadX, y: cy, isPowered: true });
    skates.push({ id: 'S1', x: skidX + edgePadX, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: 'S2', x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
    skates.push({ id: 'M1', x: cx, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: 'M2', x: cx, y: skidY + skidH_px - edgePadY, isPowered: false });
    skates.push({ id: 'S3', x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: 'S4', x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
  } else {
    // 10-Point
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

  if (plateOn) {
    ctx.fillStyle = isDark ? 'rgba(126, 34, 206, 0.35)' : 'rgba(168, 85, 247, 0.22)';
    ctx.strokeStyle = isDark ? '#c084fc' : '#9333ea';
    ctx.lineWidth = 1.5;

    const trackH_px = Math.max(24, Math.min(46, (B / (platWidth * 1000)) * skidH_px));
    const trackW_px = skidW_px + 36;
    const isRunwaySheet = activeSetup >= 3 && L >= 1500;

    if (isRunwaySheet) {
      ctx.fillRect(skidX - 18, (skidY + edgePadY) - trackH_px / 2, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 18, (skidY + edgePadY) - trackH_px / 2, trackW_px, trackH_px);
      ctx.fillRect(skidX - 18, (skidY + skidH_px - edgePadY) - trackH_px / 2, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 18, (skidY + skidH_px - edgePadY) - trackH_px / 2, trackW_px, trackH_px);

      const padW = Math.max(44, Math.min(80, (L / (platLength * 1000)) * 110));
      skates.filter((s) => Math.abs(s.y - cy) < 2).forEach((s) => {
        ctx.fillRect(s.x - padW / 2, cy - trackH_px / 2, padW, trackH_px);
        ctx.strokeRect(s.x - padW / 2, cy - trackH_px / 2, padW, trackH_px);
      });
    } else {
      const padW = Math.max(38, Math.min(110, (L / (platLength * 1000)) * skidW_px));
      skates.forEach((sk) => {
        ctx.fillRect(sk.x - padW / 2, sk.y - trackH_px / 2, padW, trackH_px);
        ctx.strokeRect(sk.x - padW / 2, sk.y - trackH_px / 2, padW, trackH_px);
      });
    }
  }

  const skateW = 32;
  const skateH = 20;

  skates.forEach((sk, idx) => {
    ctx.fillStyle = sk.isPowered ? '#0284c7' : (isDark ? '#15803d' : '#16a34a');
    ctx.fillRect(sk.x - skateW / 2, sk.y - skateH / 2, skateW, skateH);
    ctx.strokeStyle = sk.isPowered ? '#38bdf8' : (isDark ? '#4ade80' : '#22c55e');
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sk.x - skateW / 2, sk.y - skateH / 2, skateW, skateH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sk.id, sk.x, sk.y + 3);

    const isPeakHighlight = (activeSetup === 1 && idx === 0) || (activeSetup > 1 && idx === 2);
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
      textX = sk.x + skateW / 2 + 8;
      pillX = textX - 4;
    } else if (isRightEdge) {
      align = 'right';
      textX = sk.x - skateW / 2 - 8;
      pillX = textX - txtW - 4;
    } else {
      align = 'center';
      textX = sk.x;
      textY = sk.y < cy ? (sk.y + skateH / 2 + 14) : (sk.y - skateH / 2 - 6);
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
  ctx.fillText(`■ Blue: ${poweredName.split('(')[0].trim()}`, skidX, legY);
  ctx.fillText('■ Green: Followers', skidX + 180, legY);
  if (plateOn) ctx.fillText('■ Purple: Spreader Plates', skidX + 330, legY);
}
