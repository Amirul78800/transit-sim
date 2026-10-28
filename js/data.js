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
  ss400:   { name: "SS400 / S275 Mild Steel", fy: 275, sigma_allow: 180, rho: 7850, E: 210000 },
  s355:    { name: "S355 High-Strength Steel", fy: 355, sigma_allow: 235, rho: 7850, E: 210000 },
  al6061:  { name: "Aluminum 6061-T6",        fy: 276, sigma_allow: 160, rho: 2700, E: 70000  },
  plywood: { name: "Phenolic Birch Plywood",  fy: 32,  sigma_allow: 16,  rho: 750,  E: 9000   },
  uhmwpe:  { name: "UHMWPE Outrigger Plastic",fy: 22,  sigma_allow: 10,  rho: 960,  E: 1000   },
  hardwood:{ name: "Hardwood Dunnage (Kempas)",fy: 50,  sigma_allow: 25,  rho: 900,  E: 14000  }
};

// Follower Skate Catalog Specs
export const CATALOG_MODELS = {
  'GST-8':  { wheels: 6, dia: 80,  width: 70 },
  'GST-12': { wheels: 8, dia: 80,  width: 70 },
  'SRS-6':  { wheels: 4, dia: 115, width: 60 },
  'SRS-10': { wheels: 4, dia: 115, width: 75 }
};