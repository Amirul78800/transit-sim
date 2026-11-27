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

const crq = CATALOG_MODELS['CRQ-8'];
const s2Base = {
  platL: 3.80,
  platW: 2.20,
  mPnm: 6000,
  mBase: 1500,
  poweredModelKey: 'TS-10T',
  followerModelKey: 'CRQ-8',
  followerUnitWeight: crq.unitTare,
  nFollowerWheels: crq.wheels,
  dFollower: crq.dia,
  wFollower: crq.width,
  matKey: 'pu',
  shoreA: 95,
  nuPU: 0.49,
  plateEnabled: false,
  B_plate: 610,
  L_plate: 2440,
  t_plate: 10,
  plateMatKey: 'ss400',
  concreteGradeKey: 'C25/30',
  hSlab: 150,
  dSlab: null,
  rhoL: null,
  designCode: 'BS8110',
  spanL: 2.80,
  pAllowFloor: 12.0,
  udlLimit_kPa: 7.50,
  beMode: 'bs8110',
  calcModel: 'report',
  meLoadOn: false,
  spanAlign: 'transverse3'
};

// 1. Gent Modulus & Poisson Ratio E*
const E_pu = gentModulusMPa(95);
approx(E_pu, 43.83, 0.01, 'Gent E (95A)');
const hz49 = hertzLineContact(3385, 130, 85, 'pu', 95, 0.49);
const hz50 = hertzLineContact(3385, 130, 85, 'pu', 95, 0.50);
approx(hz49.E_star, 57.68, 0.01, 'E* (nu=0.49)');
approx(hz50.E_star, 58.44, 0.01, 'E* (nu=0.50)');

// 2. Preset 2 Primary — 6-Skate Perimeter (2x TS-10T + 4x CRQ-8, rev.00.1)
const rep = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 0, skateBiasPct: 20 });
approx(rep.grossMass, 8280, 0.1, 'Report grossMass');
approx(rep.grossWeight_kN, 81.23, 0.01, 'Report F_total');
approx(rep.udl_kPa, 9.72, 0.01, 'Report skid UDL');
approx(rep.overallUdl_kPa, 5.06, 0.01, 'Report PNM overall UDL (16.06 m^2)');
approx(rep.overallAllow_kN, 120.45, 0.01, 'Report PNM overall allowable load');
assert.equal(rep.isUdlPass, true, 'Report overall UDL PASS');

approx(rep.nominalSkateLoad_kN, 13.54, 0.01, 'Report equal 1/6 skate load');
approx(rep.powEval.staticWheel_kN, 3.38, 0.01, 'Report TS-10T static wheel');
approx(rep.powEval.peakWheel_kN, 6.82, 0.01, 'Report TS-10T peak wheel');
approx(rep.folEval.staticWheel_kN, 1.69, 0.01, 'Report CRQ-8 static wheel');
approx(rep.folEval.peakWheel_kN, 3.41, 0.01, 'Report CRQ-8 peak wheel');
approx(rep.folEval.peakFork_kN, 6.82, 0.01, 'Report CRQ-8 dual fork cluster');

// Mode 1: Gent + Hertz + 1.6x ULS (TS-10T 65/85 & CRQ-8 57.5/60)
approx(rep.powEval.hertzStatic.area_mm2, 1285, 2.0, 'TS-10T static A_Hertz');
approx(rep.powEval.hertz.area_mm2, 1824, 2.0, 'TS-10T peak A_Hertz');
approx(rep.powEval.hertzStatic.p_mean, 2.63, 0.015, 'TS-10T static P_mean');
approx(rep.powEval.hertz.p_mean, 3.74, 0.015, 'TS-10T peak P_mean');
approx(rep.powEval.hertz.p_mean * 1.6, 5.98, 0.02, 'TS-10T 1.6x ULS P_mean');

approx(rep.folEval.hertzStatic.area_mm2, 718, 2.0, 'CRQ-8 static A_Hertz');
approx(rep.folEval.hertz.area_mm2, 1019, 2.0, 'CRQ-8 peak A_Hertz');
approx(rep.folEval.hertzStatic.p_mean, 2.36, 0.015, 'CRQ-8 static P_mean');
approx(rep.folEval.hertz.p_mean, 3.35, 0.015, 'CRQ-8 peak P_mean');
approx(rep.folEval.hertz.p_mean * 1.6, 5.36, 0.02, 'CRQ-8 1.6x ULS P_mean');
approx(rep.rigidPatch_unfactored_MPa, 4.01, 0.02, 'Report Rigid Patch (85x20) unfactored');
approx(rep.rigidPatch_uls_MPa, 6.42, 0.02, 'Report Rigid Patch (85x20) 1.6x ULS');
assert.equal(rep.isMode1Pass, true, 'Report Mode 1 PASS');

// Mode 2: BS 8110-1 Cl. 3.7.7 (d_v = 130 mm)
approx(rep.effectiveDSlab, 130, 0.1, 'BS 8110 d_v = 130 mm');
approx(rep.F_ult_wheel_N / 1000, 10.92, 0.02, 'Report Mode 2 F_ult');
approx(rep.v_face_MPa, 0.40, 0.015, 'Report Mode 2 Face Shear (0.40 MPa)');
approx(rep.punch.v_Ed_1, 0.047, 0.002, 'Report Mode 2 1.5d Single Wheel (0.047 MPa)');
approx(rep.v_overlap_MPa, 0.098, 0.002, 'Report Mode 2 1.5d Adjacent Overlap (0.098 MPa)');
approx(rep.punch.v_Rd_c, 0.59, 0.01, 'Report vc (0.59 MPa)');
approx(rep.halfVc_MPa, 0.30, 0.01, 'Report 0.5*vc (0.30 MPa)');
assert.equal(rep.isMode2Pass, true, 'Report Mode 2 PASS');

// Mode 3: BS 8110-1 Cl. 3.5.2.2 + 1.4 DL + 1.6 LL + BRC Mesh B7
approx(rep.b_e_governing, 2.28, 0.01, 'BS 8110 be_mid (2.28 m)');
approx(rep.beam.V_max_kNm, 14.64, 0.015, 'Report Mode 3 V_LL');
approx(rep.beam.M_max_kNm, 7.66, 0.015, 'Report Mode 3 M_LL');
approx(rep.M_DL_kNm, 3.53, 0.01, 'Report Mode 3 M_DL (3.60 kPa)');
approx(rep.M_des_kNm, 17.20, 0.015, 'Report Mode 3 M_des');
approx(rep.M_ult_kNm, 18.50, 0.015, 'BRC Mesh B7 M_ult');
approx(rep.As_req_mm2_m, 357.8, 0.25, 'BRC Mesh B7 As_req');
assert.equal(rep.isMode3Pass, true, 'Report Mode 3 PASS');

// Deflection: BS 8110-1 Part 2
approx(rep.deflection.EI_kNm2, 7312.5, 0.5, 'Slab EI');
approx(rep.deflection.delta_DL_mm, 0.39, 0.01, 'Report delta_DL');
approx(rep.deflection.delta_LL_mm, 0.83, 0.015, 'Report delta_LL');
approx(rep.deflection.delta_total_mm, 1.22, 0.015, 'Report delta_total');
assert.equal(rep.isDeflectionPass, true, 'Report Deflection PASS');
assert.equal(rep.allPass, true, 'Report Overall ALL PASS');

// 3. PE Structural Report Model (J2-ANA-1-1)
const pe = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 0, skateBiasPct: 20, calcModel: 'pe' });
approx(pe.peData.totalLoad_kN, 83.0, 0.1, 'PE Frame Load (83 kN)');
approx(pe.overallUdl_kPa, 5.17, 0.01, 'PE Overall UDL');
approx(pe.maxWheelLoad_kN, 7.40, 0.01, 'PE Governing Wheel (7.4 kN)');
approx(pe.rigidPatch_uls_MPa, 9.87, 0.02, 'PE Rigid Patch (60x20, 1.6x)');
approx(pe.v_face_MPa, 0.57, 0.03, 'PE Mode 2 Face Shear (~0.57/0.6 MPa)');
approx(pe.punch.v_Ed_1, 0.053, 0.002, 'PE Mode 2 1.5d Shear (~0.053 MPa)');
approx(pe.M_des_kNm, 15.30, 0.01, 'PE Mode 3 FEA M_des');
approx(pe.As_req_mm2_m, 319, 1.5, 'PE Mode 3 As_req');
assert.equal(pe.allPass, true, 'PE Model ALL PASS');

// 4. Toggles (+1.0 kPa M&E Hanging Load, 45deg, Longitudinal, Typ Bay 3.40 m, Preset 1, SRS-6)
const withMe = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 0, skateBiasPct: 20, meLoadOn: true });
approx(withMe.w_DL_kPa, 4.60, 0.01, 'M&E Hanging Load w_DL = 4.60');
approx(withMe.M_DL_kNm, 4.51, 0.01, 'M&E M_DL');
assert.equal(withMe.isMode3MomentPass, false, '+1.0 kPa M&E pushes 2.8m M_des slightly over B7 M_ult');

const deg45 = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 0, skateBiasPct: 20, beMode: '45deg' });
approx(deg45.b_e_governing, 0.90, 0.01, '45deg TS-10T be = 0.90 m');

const bay34 = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 0, skateBiasPct: 20, spanL: 3.40 });
assert.equal(bay34.hasSpanL, true, '3.40 m Typical Bay computes');

const longAlign = runPhysicsCalculations({ ...s2Base, activeSetup: 3, addLoadPerFollower: 0, skateBiasPct: 20, spanAlign: 'longitudinal', spanL: 3.40 });
assert.equal(longAlign.beam.activeLoads.length, 4, 'Longitudinal alignment on 3.40 m span has 4 axle stations');

// Preset 1 — 2 Powered Skates (2x TS-10T) + Yellow Base Toggle
const preset1 = runPhysicsCalculations({ ...s2Base, activeSetup: 1, addLoadPerFollower: 0, skateBiasPct: 60 });
approx(preset1.grossMass, 7940, 0.1, 'Preset 1 grossMass');
approx(preset1.powEval.staticWheel_kN, 9.74, 0.01, 'Preset 1 static wheel');
approx(preset1.powEval.peakWheel_kN, 19.63, 0.01, 'Preset 1 peak wheel');
const preset1NoBase = runPhysicsCalculations({ ...s2Base, activeSetup: 1, addLoadPerFollower: 0, skateBiasPct: 60, mBase: 0 });
approx(preset1NoBase.grossMass, 6440, 0.1, 'Preset 1 noBase mass');

// SRS-6 own Lw = 30 mm regression check
const srs = CATALOG_MODELS['SRS-6'];
const srsRun = runPhysicsCalculations({
  ...s2Base, activeSetup: 3, followerModelKey: 'SRS-6',
  followerUnitWeight: srs.unitTare, nFollowerWheels: srs.wheels, dFollower: srs.dia, wFollower: srs.width,
  addLoadPerFollower: 12, skateBiasPct: 20, nuPU: 0.50
});
approx(srsRun.grossMass, 8312, 0.1, 'SRS-6 grossMass');
approx(srsRun.folEval.hertzStatic.p_mean, 3.36, 0.015, 'SRS-6 static P_mean (Lw=30)');
approx(srsRun.folEval.hertz.p_mean, 4.77, 0.015, 'SRS-6 peak P_mean (Lw=30)');

// 5. Mobile Base Regression Check (uses own plat.area, not 16.06 m^2 PNM exemption)
const mb = runMobileBaseCalculations({
  mPnm: 6000, mFrame: 700, numCasters: 6, wheelsPerCaster: 2,
  platL: 3.80, platW: 2.40, hSlab: 150, dSlab: null,
  concreteGradeKey: 'C25/30', rhoL: 0.0033, spanL: 3.0, pAllowFloor: 12.0, udlLimit_kPa: 7.50
});
approx(mb.grossMass, 6844, 0.1, 'Mobile Base 6-caster mass');
approx(mb.udl_kPa, 7.36, 0.01, 'Mobile Base 6-caster UDL (uses 9.12 m^2)');
assert.equal(mb.isUdlPass, true, 'Mobile Base UDL PASS');

console.log('ALL LEVEL 2 S2 (REV.00.1 + PE J2-ANA-1-1) & REGRESSION CHECKS PASSED!');
