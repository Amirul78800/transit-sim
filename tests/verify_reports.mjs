import assert from 'node:assert/strict';
import {
  gentModulusMPa,
  hertzLineContact,
  runPhysicsCalculations,
  runMobileBaseCalculations
} from '../js/physics.js';
import { CATALOG_MODELS } from '../js/data.js';

const approx = (actual, expected, tol = 0.015, label = '') => {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected} ± ${tol}, got ${actual}`
  );
};

const fol = CATALOG_MODELS['SRS-6'];
const s2Base = {
  platL: 3.80,
  platW: 2.20,
  mPnm: 6000,
  mBase: 1500,
  poweredModelKey: 'TS-10T',
  followerModelKey: 'SRS-6',
  followerUnitWeight: fol.unitTare,
  nFollowerWheels: fol.wheels,
  dFollower: fol.dia,
  wFollower: fol.width,
  matKey: 'pu',
  shoreA: 95,
  nuPU: 0.50,
  plateEnabled: false,
  B_plate: 610,
  L_plate: 2440,
  t_plate: 10,
  plateMatKey: 'ss400',
  concreteGradeKey: 'C25/30',
  hSlab: 150,
  dSlab: 120,
  rhoL: null,
  designCode: 'BS8110',
  spanL: 2.80,
  pAllowFloor: 12.0,
  udlLimit_kPa: 7.50,
  beMode: '45deg'
};

// 1. Gent Modulus & E*
const E_pu = gentModulusMPa(95);
approx(E_pu, 43.83, 0.01, 'Gent E (95A)');
const hz50 = hertzLineContact(3397.5, 130, 85, 'pu', 95, 0.50);
const hz49 = hertzLineContact(3397.5, 130, 85, 'pu', 95, 0.49);
approx(hz50.E_star, 58.44, 0.01, 'E* (nu=0.50)');
approx(hz49.E_star, 57.68, 0.01, 'E* (nu=0.49)');

// 2. Preset A — 2 Powered Skates (2x TS-10T rev.02)
const presetA = runPhysicsCalculations({ ...s2Base, activeSetup: 1, addLoadPerFollower: 0, skateBiasPct: 60 });
approx(presetA.grossMass, 7940, 0.1, 'Preset A grossMass');
approx(presetA.grossWeight_kN, 77.89, 0.01, 'Preset A F_total');
approx(presetA.udl_kPa, 9.32, 0.01, 'Preset A UDL');
approx(presetA.nominalSkateLoad_kN, 38.95, 0.01, 'Preset A static skate');
approx(presetA.powEval.staticWheel_kN, 9.74, 0.01, 'Preset A static wheel');
approx(presetA.powEval.peakWheel_kN, 19.63, 0.01, 'Preset A peak wheel');
approx(presetA.M_UDL_benchmark, 7.35, 0.01, 'S2 L=2.80 M_ref');
approx(presetA.V_UDL_benchmark, 10.50, 0.01, 'S2 L=2.80 V_ref');
approx(presetA.beam.V_max_kNm, 21.64, 0.01, 'Preset A V_max (45deg)');
approx(presetA.beam.M_max_kNm, 30.30, 0.015, 'Preset A M_max (45deg)');

const presetALong = runPhysicsCalculations({ ...s2Base, activeSetup: 1, addLoadPerFollower: 0, skateBiasPct: 60, spanL: 11.70 });
approx(presetALong.M_UDL_benchmark, 128.33, 0.01, 'S2 L=11.70 M_ref');
approx(presetALong.V_UDL_benchmark, 43.88, 0.01, 'S2 L=11.70 V_ref');

// Yellow base removal toggle on Preset A
const presetANoBase = runPhysicsCalculations({ ...s2Base, activeSetup: 1, addLoadPerFollower: 0, skateBiasPct: 60, mBase: 0 });
approx(presetANoBase.grossMass, 6440, 0.1, 'Preset A noBase mass');
approx(presetANoBase.udl_kPa, 7.56, 0.01, 'Preset A noBase UDL');

// 3. Preset B — 6-Skate Perimeter (2x TS-10T + 4x SRS-6 rev.00) @ 20% (60/40 x 1/3)
const presetB = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 12, skateBiasPct: 20 });
approx(presetB.grossMass, 8312, 0.1, 'Preset B grossMass');
approx(presetB.grossWeight_kN, 81.54, 0.01, 'Preset B F_total');
approx(presetB.udl_kPa, 9.75, 0.01, 'Preset B UDL');
approx(presetB.nominalSkateLoad_kN, 13.59, 0.01, 'Preset B static skate');
approx(presetB.powEval.staticWheel_kN, 3.40, 0.01, 'Preset B TS-10T static wh');
approx(presetB.folEval.staticWheel_kN, 1.70, 0.01, 'Preset B SRS-6 static wh');
approx(presetB.folEval.staticFork_kN, 3.40, 0.01, 'Preset B SRS-6 static fork');
approx(presetB.powEval.peakWheel_kN, 6.85, 0.01, 'Preset B TS-10T peak wh (20%)');
approx(presetB.folEval.peakWheel_kN, 3.42, 0.01, 'Preset B SRS-6 peak wh (20%)');
approx(presetB.folEval.peakFork_kN, 6.85, 0.01, 'Preset B SRS-6 peak fork (20%)');
assert.equal(presetB.isMode2QkPass, true, 'Preset B @20% passes Qk=7.0 kN');

// Mode 1 Own Lw check
approx(presetB.powEval.hertzStatic.p_mean, 2.66, 0.01, 'Preset B TS-10T static P_mean');
approx(presetB.powEval.hertz.p_mean, 3.77, 0.01, 'Preset B TS-10T peak P_mean');
approx(presetB.folEval.hertzStatic.p_mean, 3.36, 0.01, 'Preset B SRS-6 static P_mean');
approx(presetB.folEval.hertz.p_mean, 4.77, 0.01, 'Preset B SRS-6 peak P_mean');
approx(presetB.folEval.hertzStatic.area_mm2, 505.4, 0.5, 'Preset B SRS-6 static A_Hertz');
approx(presetB.folEval.hertz.area_mm2, 717.5, 0.5, 'Preset B SRS-6 peak A_Hertz');

// Mode 3 Multi-point Solver (45 deg dispersion)
approx(presetB.beam.V_max_kNm, 21.14, 0.01, 'Preset B V_max (45deg)');
approx(presetB.beam.V_mid_kNm, 7.55, 0.01, 'Preset B V_mid (45deg)');
approx(presetB.beam.knotMoments[0].M_kNm, 6.34, 0.01, 'Preset B M(0.30)');
approx(presetB.beam.M_max_kNm, 14.65, 0.01, 'Preset B M_max(1.40) (45deg)');

// Mode 3 BS 8110 Cl. 3.5.2.2 Toggle
const presetBBs = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 12, skateBiasPct: 20, beMode: 'bs8110' });
approx(presetBBs.b_e_governing, 2.28, 0.01, 'Preset B BS8110 be_mid');
approx(presetBBs.beam.V_max_kNm, 16.57, 0.01, 'Preset B BS8110 V_max');
approx(presetBBs.beam.M_max_kNm, 8.25, 0.01, 'Preset B BS8110 M_max');

// Sensitivity toggles: 25% & 30% bias + Base removed
const presetB25 = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 12, skateBiasPct: 25 });
approx(presetB25.powEval.peakWheel_kN, 8.56, 0.01, 'Preset B @25% TS-10T peak');
approx(presetB25.folEval.peakWheel_kN, 4.28, 0.01, 'Preset B @25% SRS-6 wheel');
assert.equal(presetB25.isMode2QkPass, false, 'Preset B @25% exceeds Qk=7.0 kN');

const presetB30 = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 12, skateBiasPct: 30 });
approx(presetB30.powEval.peakWheel_kN, 10.27, 0.01, 'Preset B @30% TS-10T peak');
approx(presetB30.folEval.peakWheel_kN, 5.14, 0.01, 'Preset B @30% SRS-6 wheel');

const presetBNoBase = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 12, skateBiasPct: 20, mBase: 0 });
approx(presetBNoBase.grossMass, 6812, 0.1, 'Preset B noBase mass');
approx(presetBNoBase.udl_kPa, 7.99, 0.01, 'Preset B noBase UDL');

// 4. Mobile Base regression sanity check
const mb = runMobileBaseCalculations({
  mPnm: 6000, mFrame: 700, numCasters: 6, wheelsPerCaster: 2,
  platL: 3.80, platW: 2.40, hSlab: 150, dSlab: 120,
  concreteGradeKey: 'C25/30', rhoL: 0.0033, spanL: 3.0, pAllowFloor: 12.0, udlLimit_kPa: 7.50
});
approx(mb.grossMass, 6844, 0.1, 'Mobile Base 6-caster mass');
approx(mb.udl_kPa, 7.36, 0.01, 'Mobile Base 6-caster UDL');

console.log('ALL REPORT PARITY & REGRESSION CHECKS PASSED!');
