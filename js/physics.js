import { G, PLAT_AREA, MAT_DATA, PLATE_MAT_DATA } from './data.js';

export function runPhysicsCalculations(inputs) {
  const {
    mPnm, mSkid, mPoweredTare, mRiser,
    nFollowerWheels, dFollower, wFollower, matKey,
    plateEnabled, B_plate, L_plate, t_plate, plateMatKey,
    pAllowFloor, hSlab, activeSetup
  } = inputs;

  const plateMat = PLATE_MAT_DATA[plateMatKey];

  // 1. Follower tare estimation
  const followerUnitTare = (activeSetup === 1) ? 0 : (12 + nFollowerWheels * 1.5 * (dFollower / 80));
  const numFollowers = (activeSetup === 1) ? 0 : (activeSetup === 2 ? 4 : 2);
  const totalFollowerTare = followerUnitTare * numFollowers;

  // 2. Stable gross mass (plates rest on floor, decoupled from cargo payload)
  const grossMass = mPnm + mSkid + mPoweredTare + mRiser + totalFollowerTare;
  const grossWeight_kN = (grossMass * G) / 1000;

  // 3. Runway sheet mass for ergonomic handling
  const singlePlateMass = (B_plate / 1000) * (L_plate / 1000) * (t_plate / 1000) * plateMat.rho;

  // 4. Transit deck UDL
  const udl_ton = (grossMass / 1000) / PLAT_AREA;

  // 5. Load distribution per setup
  let nominalSkateLoad_kN = 0;
  let peakSkateLoad_kN = 0;
  let wheelLoad_kN = 0;
  let wheelDia = 0;
  let wheelWidth = 0;
  let activeFollowerWheels = nFollowerWheels;
  let governingIsPowered = false;

  if (activeSetup === 1) {
    // Mode 1: Dual-Skate Configuration (rev.01 Report)
    nominalSkateLoad_kN = grossWeight_kN * 0.50; // 38.95 kN
    peakSkateLoad_kN = grossWeight_kN * 0.60 * 1.20; // 56.08 kN (60% CG bias x 1.20 inertia)
    
    // 3-Point Rocking Peak Wheel: 60% CG bias x 35% rocking x 1.20 inertia = 19.63 kN
    wheelLoad_kN = grossWeight_kN * 0.60 * 0.35 * 1.20;
    wheelDia = 140;
    wheelWidth = 85;
    governingIsPowered = true;
  } else if (activeSetup === 2) {
    // Mode 2: 6-Point Perimeter Rig
    nominalSkateLoad_kN = grossWeight_kN / 6;
    peakSkateLoad_kN = grossWeight_kN * 0.25 * 1.20;
    activeFollowerWheels = Math.max(2, Math.floor(nFollowerWheels * 0.50));
    wheelLoad_kN = peakSkateLoad_kN / activeFollowerWheels;
    wheelDia = dFollower;
    wheelWidth = wFollower;
    governingIsPowered = false;
  } else if (activeSetup === 3) {
    // Mode 3: Diamond 4-Point Rig
    nominalSkateLoad_kN = grossWeight_kN / 4;
    peakSkateLoad_kN = grossWeight_kN * 0.35 * 1.20;
    activeFollowerWheels = Math.max(2, Math.floor(nFollowerWheels * 0.75));
    wheelLoad_kN = peakSkateLoad_kN / activeFollowerWheels;
    wheelDia = dFollower;
    wheelWidth = wFollower;
    governingIsPowered = false;
  }

  // 6. AISC Cantilever Spreader Plate Mechanics
  const B_code_min = 2 * hSlab;
  const bogieWidth = governingIsPowered ? 240 : 200;
  const structuralB = Math.max(B_code_min, Math.min(B_plate, B_code_min * 1.5));
  const cantilever_c = plateEnabled ? Math.max(0, (structuralB - bogieWidth) / 2) : 0;
  const pNominal_MPa = (peakSkateLoad_kN * 1000) / (structuralB * structuralB);

  let t_req = 0;
  if (plateEnabled && cantilever_c > 0) {
    t_req = cantilever_c * Math.sqrt((3 * pNominal_MPa) / plateMat.sigma_allow);
  }
  const isRigid = plateEnabled && (t_plate >= t_req);
  const isCurling = plateEnabled && (t_plate < t_req);

  // Effective bearing width Beff
  let Beff = 0;
  if (!plateEnabled) {
    Beff = bogieWidth;
  } else if (isRigid) {
    Beff = Math.min(B_plate, structuralB);
  } else {
    const stiffnessRatio = Math.max(0.05, Math.min(1.0, t_plate / t_req));
    Beff = bogieWidth + (2 * cantilever_c * Math.pow(stiffnessRatio, 1.5));
  }

  // 7. Contact Stress
  let contactPressure_MPa = 0;
  if (plateEnabled) {
    contactPressure_MPa = (peakSkateLoad_kN * 1000) / (Beff * Beff);
  } else {
    if (governingIsPowered && matKey === 'pu') {
      // 85 mm roller width x 20 mm flat contact = 1,700 mm² patch (rev.01 Report)
      contactPressure_MPa = (wheelLoad_kN * 1000) / 1700; // 19.63 kN / 1,700 mm² = 11.55 MPa
    } else {
      const mat = MAT_DATA[matKey];
      const lc = mat.flat_base * Math.sqrt(wheelDia / 80) * Math.pow(wheelLoad_kN / 2.5, 0.35);
      const wheelContactArea = wheelWidth * lc;
      contactPressure_MPa = (wheelLoad_kN * 1000) / wheelContactArea;
    }
  }

  // 8. Slab Dispersion Base
  const bottomSpread_mm = Beff + 2 * hSlab;
  const isSpreadOK = plateEnabled && isRigid && (B_plate >= B_code_min);

  return {
    grossMass,
    grossWeight_kN,
    singlePlateMass,
    udl_ton,
    nominalSkateLoad_kN,
    peakSkateLoad_kN,
    wheelLoad_kN,
    wheelDia,
    wheelWidth,
    activeFollowerWheels,
    governingIsPowered,
    B_code_min,
    t_req,
    isRigid,
    isCurling,
    Beff,
    contactPressure_MPa,
    bottomSpread_mm,
    isSpreadOK,
    plateMat
  };
}
