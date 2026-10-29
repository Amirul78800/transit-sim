export function renderLoadTree(container, activeSetup, grossMass, grossWeight, activeWheels, totalWheels = 4) {
  const treeRoot = document.getElementById('treeRootVal');
  const grossTon = (grossMass / 1000).toFixed(2);
  treeRoot.innerText = `${grossTon}-Ton Gross Total / ${grossWeight.toFixed(2)} kN`;

  let html = '';

  if (activeSetup === 1) {
    // MODE 1: 2-SKATES ONLY (50% each)
    const skateTon = (grossTon / 2).toFixed(2);
    const skateStatic_kN = (grossWeight / 2).toFixed(1);
    const skateDyn_kN = (skateStatic_kN * 1.30).toFixed(1);
    const rollerStatic_kN = (skateStatic_kN / 4).toFixed(1);
    const rollerDyn_kN = (skateDyn_kN / 4).toFixed(1);

    html = `
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--accent); font-weight:700;">[ Front Skate: 50% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Static: ${skateStatic_kN} kN | Dynamic Peak: ${skateDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${rollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong style="color:var(--fail);">${rollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--accent); font-weight:700;">[ Rear Skate: 50% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Static: ${skateStatic_kN} kN | Dynamic Peak: ${skateDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${rollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong style="color:var(--fail);">${rollerDyn_kN} kN / roller</strong></div>
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
          Static: ${pStatic_kN} kN | Dynamic Peak: ${pDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${pRollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong>${pRollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--pass); font-weight:700;">[ 4x Corner Follower Skates: 66.7% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Static: ${cStatic_kN} kN | Dynamic Peak: ${cDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${cWheelStatic_kN} kN / wheel</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong style="${cWheelDyn_kN > 7.0 ? 'color:var(--fail);' : ''}">${cWheelDyn_kN} kN / wheel</strong></div>
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
          Static: ${pStatic_kN} kN | Dynamic Peak: ${pDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${pRollerStatic_kN} kN / roller</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong>${pRollerDyn_kN} kN / roller</strong></div>
        </div>
      </div>
      <div class="tree-branch-col">
        <span style="font-size:10px; color:var(--pass); font-weight:700;">[ 2x Swivel Bogies (Front/Rear): 50.0% ]</span>
        <div style="font-weight:700; color:var(--text-primary); font-size:12px; margin:2px 0;">
          Static: ${fStatic_kN} kN | Dynamic Peak: ${fDyn_kN} kN
        </div>
        <div class="tree-leaf-grid">
          <div class="tree-leaf">STATIC LOAD<strong>${fWheelStatic_kN} kN / wheel</strong></div>
          <div class="tree-leaf">DYNAMIC PEAK<strong style="${fWheelDyn_kN > 7.0 ? 'color:var(--fail);' : ''}">${fWheelDyn_kN} kN / wheel</strong></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}
