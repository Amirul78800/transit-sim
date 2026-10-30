export function renderLoadTree(container, activeSetup, grossMass, grossWeight, activeWheels, totalWheels = 4) {
  const treeRoot = document.getElementById('treeRootVal');
  const grossTon = (grossMass / 1000).toFixed(2);
  treeRoot.innerText = `${grossTon}-Ton Gross Total / ${grossWeight.toFixed(2)} kN`;

  let html = '';

  if (activeSetup === 1) {
    const skateStatic_kN = (grossWeight * 0.50).toFixed(1);          // 38.9 kN
    const skateDyn_kN = (grossWeight * 0.60 * 1.20).toFixed(1);      // 56.1 kN
    const rollerStatic_kN = (skateStatic_kN / 4).toFixed(1);         // 9.7 kN
    const rollerDyn_kN = (grossWeight * 0.60 * 0.35 * 1.20).toFixed(1); // 19.6 kN

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--accent); font-weight:700;">[ Front Skate: 50% Nominal / 60% Bias ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Nominal: ${skateStatic_kN} kN | Peak Operational: ${skateDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">NOMINAL STATIC<strong>${rollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">PEAK OPERATIONAL<strong style="color:var(--fail);">${rollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--accent); font-weight:700;">[ Rear Skate: 50% Nominal / 60% Bias ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Nominal: ${skateStatic_kN} kN | Peak Operational: ${skateDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">NOMINAL STATIC<strong>${rollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">PEAK OPERATIONAL<strong style="color:var(--fail);">${rollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
    `;
  } else if (activeSetup === 2) {
    // MODE 2: 6-POINT RIG
    // Powered Skates (2 units at 2.2m ends, 1/6 nominal each)
    const pStatic_kN = (grossWeight / 6).toFixed(1);
    const pDyn_kN = (pStatic_kN * 1.20).toFixed(1);
    const pRollerStatic_kN = (pStatic_kN / 4).toFixed(1);
    const pRollerDyn_kN = (pDyn_kN / 4).toFixed(1);

    // Corner Follower Skates (4 units at corners)
    const cStatic_kN = (grossWeight / 6).toFixed(1);
    const cDyn_kN = (grossWeight * 0.25 * 1.20).toFixed(1);
    const cWheelStatic_kN = (cStatic_kN / totalWheels).toFixed(1);
    const cWheelDyn_kN = (cDyn_kN / activeWheels).toFixed(1);

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--accent); font-weight:700;">[ 2x Powered Drive Skates: 33.3% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Nominal: ${pStatic_kN} kN | Peak Operational: ${pDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">NOMINAL STATIC<strong>${pRollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">PEAK OPERATIONAL<strong>${pRollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--pass); font-weight:700;">[ 4x Corner Follower Skates: 66.7% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Nominal: ${cStatic_kN} kN | Peak Rocking Pivot: ${cDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">NOMINAL STATIC<strong>${cWheelStatic_kN} kN / wheel</strong></div>
          <div class="tree-leaf">PEAK OPERATIONAL<strong style="${cWheelDyn_kN > 7.0 ? 'color:var(--fail);' : ''}">${cWheelDyn_kN} kN / wheel</strong></div>
        </div>
      </div>
    `;
  } else if (activeSetup === 3) {
    // MODE 3: DIAMOND 4-POINT RIG
    // Powered Skates (2 units at 2.2m ends, 1/4 nominal each)
    const pStatic_kN = (grossWeight / 4).toFixed(1);
    const pDyn_kN = (pStatic_kN * 1.20).toFixed(1);
    const pRollerStatic_kN = (pStatic_kN / 4).toFixed(1);
    const pRollerDyn_kN = (pDyn_kN / 4).toFixed(1);

    // Centerline Swivel Bogies (2 units at front/rear)
    const fStatic_kN = (grossWeight / 4).toFixed(1);
    const fDyn_kN = (grossWeight * 0.35 * 1.20).toFixed(1);
    const fWheelStatic_kN = (fStatic_kN / totalWheels).toFixed(1);
    const fWheelDyn_kN = (fDyn_kN / activeWheels).toFixed(1);

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--accent); font-weight:700;">[ 2x Center Powered Units: 50.0% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Nominal: ${pStatic_kN} kN | Peak Operational: ${pDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">NOMINAL STATIC<strong>${pRollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">PEAK OPERATIONAL<strong>${pRollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--pass); font-weight:700;">[ 2x Swivel Bogies (Front/Rear): 50.0% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Nominal: ${fStatic_kN} kN | Peak Pitching Pivot: ${fDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">NOMINAL STATIC<strong>${fWheelStatic_kN} kN / wheel</strong></div>
          <div class="tree-leaf">PEAK OPERATIONAL<strong style="${fWheelDyn_kN > 7.0 ? 'color:var(--fail);' : ''}">${fWheelDyn_kN} kN / wheel</strong></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

export function drawFrontElevation(canvas, params, isDark = true) {
  const ctx = canvas.getContext('2d');
  const { D, numWheels, F_skate, F_wheel, hSlab, plateOn, B, t, isRigid, isCurling, t_req, Beff, bottomSpread, plateMat, mRiser = 180 } = params;
  
  // High-DPI / Retina Crisp Scaling
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const logicalW = 940;
  const logicalH = 360;

  if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalW, logicalH);
  const cx = logicalW / 2;
  const scale = 0.44;

  const slabTopY = 175;
  const slabH_px = hSlab * scale;
  const slabBotY = slabTopY + slabH_px;

  // Theme-aware colors
  const slabFill = isDark ? "#1e293b" : "#e2e8f0";
  const slabStroke = isDark ? "#475569" : "#94a3b8";
  const primaryText = isDark ? "#f8fafc" : "#0f172a";
  const secondaryText = isDark ? "#94a3b8" : "#475569";
  const chassisFill = isDark ? "#334155" : "#cbd5e1";
  const riserFill = isDark ? "#475569" : "#94a3b8";

  // 1. Concrete Slab
  ctx.fillStyle = slabFill;
  ctx.fillRect(40, slabTopY, logicalW - 80, slabH_px);
  ctx.strokeStyle = slabStroke;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, slabTopY, logicalW - 80, slabH_px);

  ctx.fillStyle = secondaryText;
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Concrete Slab (Depth h = ${hSlab.toFixed(0)} mm)`, 55, slabTopY + slabH_px / 2 + 4);

  // 2. 45 Degree Dispersion Lines
  const topHalf = (Beff * scale) / 2;
  const botHalf = (bottomSpread * scale) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - topHalf, slabTopY);
  ctx.lineTo(cx + topHalf, slabTopY);
  ctx.lineTo(cx + botHalf, slabBotY);
  ctx.lineTo(cx - botHalf, slabBotY);
  ctx.closePath();

  ctx.fillStyle = (!isCurling && bottomSpread > 2 * hSlab) ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";
  ctx.fill();
  ctx.strokeStyle = (!isCurling && bottomSpread > 2 * hSlab) ? "#16a34a" : "#dc2626";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = primaryText;
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Slab Spread Base = ${bottomSpread.toFixed(0)} mm`, cx, slabBotY + 28);

  ctx.strokeStyle = secondaryText;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - botHalf, slabBotY + 12);
  ctx.lineTo(cx + botHalf, slabBotY + 12);
  ctx.stroke();

  // 3. Spreader Plate
  let skateBaseY = slabTopY;
  if (plateOn) {
    const pW = Math.min(B * scale, logicalW - 140);
    const pH = Math.max(8, t * scale);
    const pTopY = slabTopY - pH;
    skateBaseY = pTopY;

    if (isRigid) {
      ctx.fillStyle = isDark ? "#7e22ce" : "#a855f7";
      ctx.fillRect(cx - pW / 2, pTopY, pW, pH);
      ctx.strokeStyle = isDark ? "#c084fc" : "#7e22ce";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - pW / 2, pTopY, pW, pH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10.5px sans-serif";
      ctx.fillText(`${B}mm Wide ${plateMat.name} Runway (t = ${t}mm)`, cx, pTopY + pH / 2 + 3.5);
    } else {
      const lift = Math.min(22, 14 * ((t_req - t) / t_req));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - pW / 2, pTopY - lift);
      ctx.quadraticCurveTo(cx, pTopY + 2, cx + pW / 2, pTopY - lift);
      ctx.lineTo(cx + pW / 2, slabTopY - lift);
      ctx.quadraticCurveTo(cx, slabTopY, cx - pW / 2, slabTopY - lift);
      ctx.closePath();
      ctx.fillStyle = "#dc2626";
      ctx.fill();
      ctx.strokeStyle = "#fca5a5";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("▲ AISC EDGE LIFT-OFF (POTATO-CHIP)", cx - pW / 2 + 10, slabTopY - lift - 5);
      ctx.fillText("▲ LIFT-OFF", cx + pW / 2 - 10, slabTopY - lift - 5);
    }
  }

  // 4. Wheels & Chassis
  const numAxles = Math.ceil(numWheels / 2);
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

  const hasRiser = mRiser > 0;
  const riserH = hasRiser ? 20 : 0;
  const riserY = chassisY - riserH;
  if (hasRiser) {
    ctx.fillStyle = riserFill;
    ctx.fillRect(cx - 36, riserY, 72, riserH);
    ctx.strokeStyle = slabStroke;
    ctx.strokeRect(cx - 36, riserY, 72, riserH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9.5px sans-serif";
    ctx.fillText(`${mRiser}kg Riser`, cx, riserY + 13);
  }
  
  for (let i = 0; i < numAxles; i++) {
    const ax = startX + i * axleSpacing * scale;
    ctx.beginPath();
    ctx.arc(ax, wy, r, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "#ef4444";
    ctx.fillStyle = "#ef4444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(ax, wy - r - 16);
    ctx.lineTo(ax, wy - r - 2);
    ctx.stroke();
  }

  const arrowTopY = 28;
  const arrowColor = isDark ? "#38bdf8" : "#0284c7";
  ctx.strokeStyle = arrowColor;
  ctx.fillStyle = arrowColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx, arrowTopY);
  ctx.lineTo(cx, riserY - 2);
  ctx.stroke();

  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`Peak Operational F_skate = ${F_skate.toFixed(2)} kN (${numWheels}w @ ${F_wheel.toFixed(2)} kN/w)`, cx, arrowTopY - 8);
}

export function drawTopPlan(canvas, activeSetup, nomLoad, peakLoad, plateOn, B, L, isDark = true) {
  const ctx = canvas.getContext('2d');

  // High-DPI / Retina Crisp Scaling
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const logicalW = 940;
  const logicalH = 230;

  if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalW, logicalH);
  const cx = logicalW / 2;

  // Balanced visual layout with ample clearances
  const skidW_px = 580;
  const skidH_px = 120;
  const skidX = cx - skidW_px / 2;
  const skidY = 50; // top border at y=50, bottom border at y=170
  const cy = skidY + skidH_px / 2; // y=110

  // Theme-aware colors
  const skidFill = isDark ? "#1e293b" : "#e2e8f0";
  const skidStroke = isDark ? "#475569" : "#94a3b8";
  const accentColor = isDark ? "#38bdf8" : "#0284c7";
  const labelColor = isDark ? "#cbd5e1" : "#334155";
  const legendColor = isDark ? "#94a3b8" : "#64748b";

  // 1. Skid Frame
  ctx.fillStyle = skidFill;
  ctx.fillRect(skidX, skidY, skidW_px, skidH_px);
  ctx.strokeStyle = skidStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(skidX, skidY, skidW_px, skidH_px);

  // Top Length Dimension Arrow (positioned at y=24, safely clear of skid and runway)
  ctx.fillStyle = accentColor;
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("◄─────────────────────── 3.80 m Shipping Skid Length ───────────────────────►", cx, 24);

  // Left Width Dimension Arrow
  ctx.save();
  ctx.translate(skidX - 16, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = labelColor;
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("2.20 m Width", 0, 0);
  ctx.restore();

  // 2. Skates positioning
  const edgePadX = 22;
  const edgePadY = 18;
  const skates = [
    { id: "P1", x: skidX + edgePadX, y: cy, isPowered: true },
    { id: "P2", x: skidX + skidW_px - edgePadX, y: cy, isPowered: true }
  ];

  if (activeSetup === 2) {
    skates.push({ id: "C1", x: skidX + edgePadX, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: "C2", x: skidX + edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
    skates.push({ id: "C3", x: skidX + skidW_px - edgePadX, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: "C4", x: skidX + skidW_px - edgePadX, y: skidY + skidH_px - edgePadY, isPowered: false });
  } else if (activeSetup === 3) {
    skates.push({ id: "F1", x: cx, y: skidY + edgePadY, isPowered: false });
    skates.push({ id: "F2", x: cx, y: skidY + skidH_px - edgePadY, isPowered: false });
  }

  // 3. Draw Runway Plates if Enabled
  if (plateOn) {
    ctx.fillStyle = isDark ? "rgba(126, 34, 206, 0.35)" : "rgba(168, 85, 247, 0.22)";
    ctx.strokeStyle = isDark ? "#c084fc" : "#9333ea";
    ctx.lineWidth = 1.5;

    // Physically proportional track width (B mm vs 2200 mm skid width)
    const trackH_px = Math.max(26, Math.min(48, (B / 2200) * skidH_px));
    const trackW_px = skidW_px + 36; // extends 18px past skid ends

    if (activeSetup === 2) {
      // Top continuous runner track centered on C1-C3
      const topTrackY = (skidY + edgePadY) - trackH_px / 2;
      ctx.fillRect(skidX - 18, topTrackY, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 18, topTrackY, trackW_px, trackH_px);

      // Bottom continuous runner track centered on C2-C4
      const botTrackY = (skidY + skidH_px - edgePadY) - trackH_px / 2;
      ctx.fillRect(skidX - 18, botTrackY, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 18, botTrackY, trackW_px, trackH_px);

      // Dedicated spreader pads under Powered Units P1 & P2
      const padW = Math.max(44, Math.min(80, (L / 3800) * 110));
      const padH = trackH_px;
      ctx.fillRect(skates[0].x - padW / 2, cy - padH / 2, padW, padH);
      ctx.strokeRect(skates[0].x - padW / 2, cy - padH / 2, padW, padH);
      ctx.fillRect(skates[1].x - padW / 2, cy - padH / 2, padW, padH);
      ctx.strokeRect(skates[1].x - padW / 2, cy - padH / 2, padW, padH);
    } else {
      // Individual spreader pads under active skates for Mode 1 & Mode 3
      const padW = Math.max(46, Math.min(85, (L / 3800) * 120));
      const padH = trackH_px;
      skates.forEach(sk => {
        ctx.fillRect(sk.x - padW / 2, sk.y - padH / 2, padW, padH);
        ctx.strokeRect(sk.x - padW / 2, sk.y - padH / 2, padW, padH);
      });
    }
  }

  // 4. Draw Skate Bogies & Annotated Values
  const skateW = 34;
  const skateH = 22;

  skates.forEach(sk => {
    // Bogie Body
    ctx.fillStyle = sk.isPowered ? (isDark ? "#0284c7" : "#0284c7") : (isDark ? "#15803d" : "#16a34a");
    ctx.fillRect(sk.x - skateW / 2, sk.y - skateH / 2, skateW, skateH);
    ctx.strokeStyle = sk.isPowered ? (isDark ? "#38bdf8" : "#38bdf8") : (isDark ? "#4ade80" : "#22c55e");
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sk.x - skateW / 2, sk.y - skateH / 2, skateW, skateH);

    // Bogie ID
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sk.id, sk.x, sk.y + 3);

    // Load Text
    let loadStr = `${nomLoad.toFixed(1)} kN`;
    if (activeSetup === 1) loadStr = `${nomLoad.toFixed(1)} kN`;
    if (activeSetup === 2 && sk.id === "C1") loadStr = `Peak: ${peakLoad.toFixed(1)} kN`;
    if (activeSetup === 3 && sk.id === "F1") loadStr = `Peak: ${peakLoad.toFixed(1)} kN`;

    // Position load text cleanly inside skid with pill background
    let labelY = sk.y;
    if (sk.y < cy) {
      labelY = sk.y + skateH / 2 + 12; // below top skates, safely inside skid
    } else if (sk.y > cy) {
      labelY = sk.y - skateH / 2 - 4;  // above bottom skates, safely inside skid
    } else {
      labelY = sk.y - skateH / 2 - 4;  // above center powered skates
    }

    ctx.save();
    ctx.font = "bold 9px sans-serif";
    const txtW = ctx.measureText(loadStr).width;
    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(sk.x - txtW / 2 - 4, labelY - 8, txtW + 8, 11);
    ctx.fillStyle = labelColor;
    ctx.textAlign = "center";
    ctx.fillText(loadStr, sk.x, labelY);
    ctx.restore();
  });

  // 5. Footer Legend (positioned at y = 196)
  ctx.fillStyle = legendColor;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  const legY = skidY + skidH_px + 26;
  ctx.fillText("■ Blue: TS-10T Powered Skates (Center of 2.20 m ends)", skidX, legY);
  ctx.fillText("■ Green: Passive Follower Skates", skidX + 310, legY);
  if (plateOn) {
    ctx.fillText("■ Purple: Continuous Runway Tracks & Pads", skidX + 510, legY);
  }
}
