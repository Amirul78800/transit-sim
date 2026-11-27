// Physical Constants & Platform Geometry
export const PLATFORM_PRESETS = {
  '3.80x2.20': { length: 3.80, width: 2.20, label: '3.80 × 2.20 m' },
  '3.80x2.40': { length: 3.80, width: 2.40, label: '3.80 × 2.40 m' },
  '4.40x2.20': { length: 4.40, width: 2.20, label: '4.40 × 2.20 m' }
};

export const MOBILE_BASE_PRESETS = {
  '3.80x2.40': { length: 3.80, width: 2.40, label: '3.80 × 2.40 m (Skid Zone)' },
  '7.30x2.34': { length: 7.30, width: 2.34, label: '7.30 × 2.34 m (Full PNM)' }
};

export const G = 9.81;
export const CONFIRMED_UDL_KPA = 7.50;

export const S2_DEFAULTS = {
  hSlab: 150,
  cover_mm: 20,
  barDia_mm: 7,
  dShear_mm: 130,     // h - c
  dFlex_mm: 126.5,    // h - c - barDia/2
  zMax_mm: 120.1,     // 0.95 * dFlex rounded per rev.00.1 hand check
  asProv_mm2_m: 385,  // BRC Mesh B7 (7 mm @ 100 mm c/c)
  fy_MPa: 460,
  fcu: 30,
  concreteGradeKey: 'C25/30',
  rhoL: 0.385 / 130,  // 385 / (1000 * 130) = 0.002962
  dlSlab_kPa: 3.60,   // 0.15 m * 24 kN/m^3
  meHanging_kPa: 1.00,// optional ceiling & M&E hanging load
  udlLimit_kPa: 7.50,
  pnmOverallL: 7.30,
  pnmOverallW: 2.20,
  pnmOverallArea: 16.06,
  pAllowFloor: 12.0,  // BS 8110-1 strict 0.4 * fcu
  pAllowUls_MPa: 18.0,// BS 8110-1 factored 0.6 * fcu
  qkStatic_kN: 4.5,
  qkPeak_kN: 7.0,
  shortSpanL: 2.80,
  typBayL: 3.40,
  longSpanL: 11.70
};

export const PE_BENCHMARK = {
  grossLoad8_kN: 80.0,
  grossLoad6_kN: 83.0,
  // Frame support reactions on 83 kN (J2-ANA-1-1): [P1_front, C1_fp, C2_fp, C3_rp, C4_rp, P2_rear]
  reactions6_kN: { frontPwr: 12.97, frontPsv: 17.43, rearPsv: 13.66, rearPwr: 7.85 },
  govCornerPeak_kN: 7.4,        // 17.43 * 0.35 * 1.2 = 7.32 -> 7.4 kN
  patch_mm: [60, 20],
  mode1Uls_MPa: 9.9,            // 1.6 * 7400 / 1200 = 9.87 -> 9.9 MPa
  mode2Fult_kN: 11.9,           // 1.6 * 7.4 = 11.84 -> 11.9 kN
  mode2Face_MPa: 0.6,           // 11840 / (160 * 130) = 0.57 -> 0.6 MPa
  mode2Perim_MPa: 0.04,         // PE reported 0.04 (exact 11840 / (1720*130) = 0.053)
  mode3FeaMdes_kNm: 15.3,       // PE FEA with +1.0 kPa M&E
  mode3FeaAsReq_mm2: 319
};

// Roller / Wheel Materials
export const MAT_DATA = {
  pu:    { name: 'Polyurethane (PU / Vulkollan)', color: '#f59e0b', nu: 0.49 },
  nylon: { name: 'Nylon PA6',                     color: '#e2e8f0', E: 2800,   nu: 0.40 },
  steel: { name: 'Cast Steel / Iron',             color: '#94a3b8', E: 210000, nu: 0.30 }
};

// Concrete Grades (f_ck = cylinder, f_cu = cube)
export const CONCRETE_GRADES = {
  'C20/25': { name: 'C20/25 (f_cu = 25 MPa)', f_ck: 20, f_cu: 25 },
  'C25/30': { name: 'C25/30 (f_cu = 30 MPa)', f_ck: 25, f_cu: 30 },
  'C30/37': { name: 'C30/37 (f_cu = 37 MPa)', f_ck: 30, f_cu: 37 }
};

// Spreader Plate Material Database (Full Engineering Names)
export const PLATE_MAT_DATA = {
  ss400:     { name: 'SS400 / S275JR Mild Steel (fy 275 MPa)',             fy: 275,  sigma_allow: 180, rho: 7850, E: 205000 },
  s355:      { name: 'S355J2 / A572-50 High-Strength Steel (fy 355 MPa)',  fy: 355,  sigma_allow: 235, rho: 7850, E: 210000 },
  strenx700: { name: 'Strenx 700 Structural Steel (fy 700 MPa)',          fy: 700,  sigma_allow: 450, rho: 7850, E: 210000 },
  hardox450: { name: 'Hardox 450 Abrasion-Resistant Steel (fy 1,200 MPa)',fy: 1200, sigma_allow: 600, rho: 7850, E: 210000 },
  al6061:    { name: 'Aluminum 6061-T6 Alloy (fy 276 MPa)',               fy: 276,  sigma_allow: 165, rho: 2700, E: 69000 },
  al7075:    { name: 'Aluminum 7075-T6 Aerospace Alloy (fy 505 MPa)',     fy: 505,  sigma_allow: 320, rho: 2810, E: 72000 },
  cfrp:      { name: 'Carbon Fiber Composite CFRP (fy 600 MPa)',          fy: 600,  sigma_allow: 350, rho: 1550, E: 85000 },
  g10:       { name: 'G10 / FR-4 Fiberglass Epoxy (fy 340 MPa)',          fy: 340,  sigma_allow: 200, rho: 1850, E: 24000 },
  uhmwpe:    { name: 'UHMWPE Polymer Sheet (fy 25 MPa)',                  fy: 25,   sigma_allow: 14,  rho: 960,  E: 1100 },
  plywood:   { name: 'Phenolic Birch Plywood (fy 35 MPa)',                fy: 35,   sigma_allow: 20,  rho: 750,  E: 9500 }
};

// Powered Drive Unit Catalog (AMR / Skates)
export const POWERED_MODELS = {
  'TS-10T': {
    name: 'TS-10T (4w, 220 kg)',
    wheels: 4,
    dia: 130,
    width: 85,
    shoreA: 95,
    unitTare: 220,
    wheelsPerFork: 1,
    forks: 4,
    chassisL: 1200,
    chassisW: 600
  },
  'TC-30T': {
    name: 'TC 30Ton (8w, 385 kg)',
    wheels: 8,
    dia: 140,
    width: 85,
    shoreA: 95,
    unitTare: 385,
    wheelsPerFork: 2,
    forks: 4,
    chassisL: 1327,
    chassisW: 930
  }
};

// Follower Skate Catalog Specs (GST, SRS, CRQ series)
export const CATALOG_MODELS = {
  'GST-8':  { series: 'GST', name: 'GST-8 (6w, 28 kg)',       wheels: 6, dia: 80,  width: 70, pairWidth: 70,  unitTare: 28, wheelsPerFork: 1, forks: 6, chassisL: 360, chassisW: 200 },
  'GST-12': { series: 'GST', name: 'GST-12 (8w, 38 kg)',      wheels: 8, dia: 80,  width: 70, pairWidth: 70,  unitTare: 38, wheelsPerFork: 1, forks: 8, chassisL: 420, chassisW: 220 },
  'SRS-6':  { series: 'SRS', name: 'SRS-6 (8w coax, 81 kg)',  wheels: 8, dia: 115, width: 30, pairWidth: 60,  unitTare: 81, wheelsPerFork: 2, forks: 4, chassisL: 600, chassisW: 600, beFallback_m: 1.00 },
  'SRS-10': { series: 'SRS', name: 'SRS-10 (4w, 95 kg)',      wheels: 4, dia: 115, width: 75, pairWidth: 75,  unitTare: 95, wheelsPerFork: 1, forks: 4, chassisL: 600, chassisW: 600 },
  'CRQ-8':  { series: 'CRQ', name: 'CRQ-8 (12T coax, 85 kg)', wheels: 8, dia: 115, width: 60, pairWidth: 120, unitTare: 85, wheelsPerFork: 2, forks: 4, chassisL: 810, chassisW: 520, height_mm: 165, wheelSpacing_mm: 400, beFallback_m: 0.52 }
};

// Heavy-Duty Mobile Base Caster Presets
export const CASTER_PRESETS = {
  'HD-150': { name: 'Ø150 × 50 mm Heavy Caster', dia: 150, width: 50, unitMass: 18 },
  'HD-200': { name: 'Ø200 × 50 mm Heavy Caster', dia: 200, width: 50, unitMass: 24 },
  'HD-250': { name: 'Ø250 × 60 mm Super-Heavy Caster', dia: 250, width: 60, unitMass: 34 }
};
