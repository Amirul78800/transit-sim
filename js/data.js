// Physical Constants & Platform Geometry
export const PLAT_L = 3.80; // Skid length in meters
export const PLAT_W = 2.20; // Skid width in meters
export const PLAT_AREA = PLAT_L * PLAT_W; // 8.36 m²
export const G = 9.81;

// Roller Materials for Follower Skates
export const MAT_DATA = {
  pu:    { name: "Polyurethane 95A", flat_base: 10.0, color: "#f59e0b" },
  nylon: { name: "Nylon PA6",        flat_base: 4.0,  color: "#e2e8f0" },
  steel: { name: "Cast Steel",       flat_base: 1.0,  color: "#94a3b8" }
};

// Spreader Plate Material Database
export const PLATE_MAT_DATA = {
  ss400: {
    name: "SS400 / S275JR (fy = 275 MPa)",
    fy: 275,
    sigma_allow: 180,
    rho: 7850,
    E: 205000
  },
  s355: {
    name: "S355J2 / A572-50 (fy = 355 MPa)",
    fy: 355,
    sigma_allow: 235,
    rho: 7850,
    E: 210000
  },
  strenx700: {
    name: "Strenx 700 (fy = 700 MPa)",
    fy: 700,
    sigma_allow: 450,
    rho: 7850,
    E: 210000
  },
  hardox450: {
    name: "Hardox 450 (fy = 1,200 MPa)",
    fy: 1200,
    sigma_allow: 600,
    rho: 7850,
    E: 210000
  },
  al6061: {
    name: "Aluminum 6061-T6 (fy = 276 MPa)",
    fy: 276,
    sigma_allow: 165,
    rho: 2700,
    E: 69000
  },
  al7075: {
    name: "Aluminum 7075-T6 (fy = 505 MPa)",
    fy: 505,
    sigma_allow: 320,
    rho: 2810,
    E: 72000
  },
  cfrp: {
    name: "Carbon Fiber CFRP (fy = 600 MPa)",
    fy: 600,
    sigma_allow: 350,
    rho: 1550,
    E: 85000
  },
  g10: {
    name: "G10 / FR-4 Epoxy Glass (fy = 340 MPa)",
    fy: 340,
    sigma_allow: 200,
    rho: 1850,
    E: 24000
  },
  uhmwpe: {
    name: "UHMWPE Polymer (fy = 25 MPa)",
    fy: 25,
    sigma_allow: 14,
    rho: 960,
    E: 1100
  },
  plywood: {
    name: "Phenolic Birch Plywood (fy = 35 MPa)",
    fy: 35,
    sigma_allow: 20,
    rho: 750,
    E: 9500
  }
};

// Follower Skate Catalog Specs
export const CATALOG_MODELS = {
  'GST-8':  { wheels: 6, dia: 80,  width: 70 },
  'GST-12': { wheels: 8, dia: 80,  width: 70 },
  'SRS-6':  { wheels: 4, dia: 115, width: 60 },
  'SRS-10': { wheels: 4, dia: 115, width: 75 }
};
