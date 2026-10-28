export function renderLoadTree(container, activeSetup, grossMass, grossWeight, activeWheels) {
  const treeRoot = document.getElementById('treeRootVal');
  const grossTon = (grossMass / 1000).toFixed(2);
  treeRoot.innerText = `${grossTon}-Ton Gross Total / ${grossWeight.toFixed(2)} kN`;

  let html = '';
  if (activeSetup === 1) {
    const skateTon = (grossTon / 2).toFixed(2);
    const skateStatic_kN = (grossWeight / 2).toFixed(1);
    const skateDyn_kN = (skateStatic_kN * 1.30).toFixed(1);
    const rollerStatic_kN = (skateStatic_kN / 4).toFixed(1);
    const rollerDyn_kN = (skateDyn_kN / 4).toFixed(1);

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:#38bdf8; font-weight:700;">[ Front Skate: 50% ]</span>
        <div style="font-weight:700; color:#fff; font-size:13px; margin:2px 0;">${skateTon} t (${skateStatic_kN} kN)</div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${rollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong style="color:#ef4444;">${rollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:#38bdf8; font-weight:700;">[ Rear Skate: 50% ]</span>
        <div style="font-weight:700; color:#fff; font-size:13px; margin:2px 0;">${skateTon} t (${skateStatic_kN} kN)</div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${rollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong style="color:#ef4444;">${rollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
    `;
  } else if (activeSetup === 2) {
    const pStatic_kN = (grossWeight / 6).toFixed(1);
    const pRoller_kN = (pStatic_kN / 4).toFixed(1);
    const cStatic_kN = (grossWeight / 6).toFixed(1);
    const cWheelStatic_kN = (cStatic_kN / activeWheels).toFixed(1);
    const cDyn_kN = (grossWeight * 0.25 * 1.20).toFixed(1);
    const cWheelDyn_kN = (cDyn_kN / activeWheels).toFixed(1);

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:#38bdf8; font-weight:700;">[ 2x Powered Drive Skates: 33.3% ]</span>
        <div style="font-weight:700; color:#fff; font-size:13px; margin:2px 0;">16.7% each (${pStatic_kN} kN/skate)</div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC ROLLER<strong>${pRoller_kN} kN / roller</strong></div>
          <div class="tree-leaf">TURNING DRIVE<strong>Traction Safe</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:#4ade80; font-weight:700;">[ 4x Corner Follower Skates: 66.7% ]</span>
        <div style="font-weight:700; color:#fff; font-size:13px; margin:2px 0;">Nominal: ${cStatic_kN} kN | Rocking Peak: ${cDyn_kN} kN</div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC WHEEL<strong>${cWheelStatic_kN} kN / wheel</strong></div>
          <div class="tree-leaf">ROCKING PEAK<strong>${cWheelDyn_kN} kN / wheel</strong></div>
        </div>
      </div>
    `;
  } else if (activeSetup === 3) {
    const pStatic_kN = (grossWeight / 4).toFixed(1);
    const pRoller_kN = (pStatic_kN / 4).toFixed(1);
    const fStatic_kN = (grossWeight / 4).toFixed(1);
    const fWheelStatic_kN = (fStatic_kN / activeWheels).toFixed(1);
    const fDyn_kN = (grossWeight * 0.35 * 1.20).toFixed(1);
    const fWheelDyn_kN = (fDyn_kN / activeWheels).toFixed(1);

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:#38bdf8; font-weight:700;">[ 2x Center Powered Units: 50% ]</span>
        <div style="font-weight:700; color:#fff; font-size:13px; margin:2px 0;">25% each (${pStatic_kN} kN/skate)</div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC ROLLER<strong>${pRoller_kN} kN / roller</strong></div>
          <div class="tree-leaf">360° SPIN ZERO-TURN<strong>Differential Drive</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:#4ade80; font-weight:700;">[ 2x Swivel Bogies (Front/Rear): 50% ]</span>
        <div style="font-weight:700; color:#fff; font-size:13px; margin:2px 0;">Nominal: ${fStatic_kN} kN | Pitch Peak: ${fDyn_kN} kN</div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC WHEEL<strong>${fWheelStatic_kN} kN / wheel</strong></div>
          <div class="tree-leaf">PITCHING PEAK<strong>${fWheelDyn_kN} kN / wheel</strong></div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

export function drawFrontElevation(canvas, params) {
  const ctx = canvas.getContext('2d');
  const { D, numWheels, F_skate, F_wheel, hSlab, plateOn, B, t, isRigid, isCurling, t_req, Beff, bottomSpread, plateMat } = params;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const scale = 0.44;

  const slabTopY = 175;
  const slabH_px = hSlab * scale;
  const slabBotY = slabTopY + slabH_px;

  // 1. Concrete Slab
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(40, slabTopY, canvas.width - 80, slabH_px);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, slabTopY, canvas.width - 80, slabH_px);

  ctx.fillStyle = "#94a3b8";
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

  ctx.fillStyle = (!isCurling && bottomSpread > 2 * hSlab) ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.14)";
  ctx.fill();
  ctx.strokeStyle = (!isCurling && bottomSpread > 2 * hSlab) ? "#22c55e" : "#ef4444";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Slab Spread Base = ${bottomSpread.toFixed(0)} mm`, cx, slabBotY + 28);

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - botHalf, slabBotY + 12);
  ctx.lineTo(cx + botHalf, slabBotY + 12);
  ctx.stroke();

  // 3. Spreader Plate
  let skateBaseY = slabTopY;
  if (plateOn) {
    const pW = Math.min(B * scale, canvas.width - 140);
    const pH = Math.max(8, t * scale);
    const pTopY = slabTopY - pH;
    skateBaseY = pTopY;

    if (isRigid) {
      ctx.fillStyle = "#7e22ce";
      ctx.fillRect(cx - pW / 2, pTopY, pW, pH);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - pW / 2, pTopY, pW, pH);

      ctx.fillStyle = "#f3e8ff";
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

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("▲ LIFT-OFF (POTATO-CHIP)", cx - pW / 2 + 10, slabTopY - lift - 5);
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

  ctx.fillStyle = "#334155";
  ctx.fillRect(cx - chassisW / 2, chassisY, chassisW, chassisH);
  ctx.strokeStyle = "#94a3b8";
  ctx.strokeRect(cx - chassisW / 2, chassisY, chassisW, chassisH);

  const riserH = 20;
  const riserY = chassisY - riserH;
  ctx.fillStyle = "#475569";
  ctx.fillRect(cx - 36, riserY, 72, riserH);
  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(cx - 36, riserY, 72, riserH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9.5px sans-serif";
  ctx.fillText("150mm Riser", cx, riserY + 13);

  for (let i = 0; i < numAxles; i++) {
    const ax = startX + i * axleSpacing * scale;
    ctx.beginPath();
    ctx.arc(ax, wy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
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
  ctx.strokeStyle = "#38bdf8";
  ctx.fillStyle = "#38bdf8";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx, arrowTopY);
  ctx.lineTo(cx, riserY - 2);
  ctx.stroke();

  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`Peak F_skate = ${F_skate.toFixed(2)} kN (${numWheels}w @ ${F_wheel.toFixed(2)} kN/w)`, cx, arrowTopY - 8);
}

export function drawTopPlan(canvas, activeSetup, nomLoad, peakLoad, plateOn, B, L) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 - 8;

  const skidW_px = 560;
  const skidH_px = 125;
  const skidX = cx - skidW_px / 2;
  const skidY = cy - skidH_px / 2;

  // 1. Skid Frame
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(skidX, skidY, skidW_px, skidH_px);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(skidX, skidY, skidW_px, skidH_px);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("◄─────────────────────── 3.80 m Shipping Skid Length ───────────────────────►", cx, skidY - 10);

  ctx.save();
  ctx.translate(skidX - 14, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("2.20 m Width", 0, 0);
  ctx.restore();

  // 2. Skates
  const edgePad = 12;
  const skates = [
    { id: "P1", x: skidX + edgePad, y: cy, isPowered: true },
    { id: "P2", x: skidX + skidW_px - edgePad, y: cy, isPowered: true }
  ];

  if (activeSetup === 2) {
    skates.push({ id: "C1", x: skidX + edgePad, y: skidY + edgePad, isPowered: false });
    skates.push({ id: "C2", x: skidX + edgePad, y: skidY + skidH_px - edgePad, isPowered: false });
    skates.push({ id: "C3", x: skidX + skidW_px - edgePad, y: skidY + edgePad, isPowered: false });
    skates.push({ id: "C4", x: skidX + skidW_px - edgePad, y: skidY + skidH_px - edgePad, isPowered: false });
  } else if (activeSetup === 3) {
    skates.push({ id: "F1", x: cx, y: skidY + edgePad, isPowered: false });
    skates.push({ id: "F2", x: cx, y: skidY + skidH_px - edgePad, isPowered: false });
  }

  // Draw Continuous Runway Tracks if Plate is Enabled
  if (plateOn) {
    ctx.fillStyle = "rgba(126, 34, 206, 0.4)";
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 1.5;

    const trackH_px = Math.max(20, Math.min(50, (B / 2200) * skidH_px * 2.2));
    const trackW_px = Math.min(skidW_px + 60, Math.max(skidW_px, (L / 3800) * skidW_px));

    if (activeSetup === 2) {
      ctx.fillRect(skidX - 20, skidY - trackH_px / 4, trackW_px, trackH_px);
      ctx.strokeRect(skidX - 20, skidY - trackH_px / 4, trackW_px, trackH_px);
      ctx.fillRect(skidX - 20, skidY + skidH_px - (trackH_px * 3 / 4), trackW_px, trackH_px);
      ctx.strokeRect(skidX - 20, skidY + skidH_px - (trackH_px * 3 / 4), trackW_px, trackH_px);
    } else {
      skates.forEach(sk => {
        const pBoxW = Math.max(28, (L / 3800) * 120);
        const pBoxH = Math.max(24, (B / 2200) * 80);
        ctx.fillRect(sk.x - pBoxW / 2, sk.y - pBoxH / 2, pBoxW, pBoxH);
        ctx.strokeRect(sk.x - pBoxW / 2, sk.y - pBoxH / 2, pBoxW, pBoxH);
      });
    }
  }

  // Draw Skates
  const skateW = 34;
  const skateH = 22;

  skates.forEach(sk => {
    ctx.fillStyle = sk.isPowered ? "#0284c7" : "#15803d";
    ctx.fillRect(sk.x - skateW / 2, sk.y - skateH / 2, skateW, skateH);
    ctx.strokeStyle = sk.isPowered ? "#38bdf8" : "#4ade80";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sk.x - skateW / 2, sk.y - skateH / 2, skateW, skateH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sk.id, sk.x, sk.y + 3);

    let loadStr = `${nomLoad.toFixed(1)} kN`;
    if (activeSetup === 2 && sk.id === "C1") loadStr = `Peak: ${peakLoad.toFixed(1)} kN`;
    if (activeSetup === 3 && sk.id === "F1") loadStr = `Peak: ${peakLoad.toFixed(1)} kN`;

    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    const labelY = (sk.y < cy) ? sk.y - 14 : sk.y + 22;
    ctx.fillText(loadStr, sk.x, labelY);
  });

  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("■ Blue: TS-10T Powered Skates (Center of 2.20 m ends)", skidX, skidY + skidH_px + 22);
  ctx.fillText("■ Green: Passive Follower Skates", skidX + 310, skidY + skidH_px + 22);
  if (plateOn) {
    ctx.fillText("■ Purple: Continuous Runway Track", skidX + 500, skidY + skidH_px + 22);
  }
}