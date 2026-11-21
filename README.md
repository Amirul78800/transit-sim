# Floor Loading Assessment Simulator (`transit-sim`)

An interactive web-based structural engineering tool for evaluating heavy machinery rigging transport (**AMR / Powered Skates** and **Wheeled Mobile Bases**) across suspended concrete floor slabs.

🌐 **Live Simulator:** [loadskatesim.amirulazhj.tech](https://loadskatesim.amirulazhj.tech/)  
👤 **Author:** [amirulazhj.tech](https://amirulazhj.tech/) · **GitHub:** [@Amirul78800](https://github.com/Amirul78800)

---

## Features & Routes

* **`/`** — Setup selector between AMR / Powered Skates and Caster Mobile Bases.
* **`/amr/`** — Machine Skate Rigging Assessment featuring:
  * **Preset A (`2-Skate`):** `2× TS-10T` powered skates (`3.80 × 2.20 m`, `60/40` CG bias × `0.35` rocking × `Φ = 1.20`).
  * **Preset B (`6-Skate Perimeter`):** `2× TS-10T + 4× SRS-6` with RHS risers (`20%` side-split baseline + `25%` / `30%` sensitivity toggles).
  * **Additional Rigs:** `4-Point`, `8-Point`, `10-Point (CRQ-8)`, `TC 30Ton`, and one-click toggle for removing the `1,500 kg` interim Yellow Base.
  * **Live Textbook Calculations Drawer:** Expands every step from symbolic formula → live substituted values → result matched 1-to-1 with Cards 1–8.
* **`/mobile_base/`** — Heavy-duty swivel caster platform check (`4 / 6 / 8` single or twin-wheel casters, `Ø150–250 mm`, `Φ = 1.25–1.40`).

## Engineering Standards & Solvers

* **Footprint UDL & Load Cascade:** Gravity accumulation against confirmed live-load limit (`7.50 kN/m²` / `EN 1991-1-1 §6.3`), dynamic amplification (`Φ`), and `TR34` 3-point rocking (`35%` fork concentration).
* **Mode 1 — Surface Bearing (`Gent + Hertz`):** Elastomer modulus `E_PU` from Shore A hardness and Hertzian line contact `b = √(4FR / (π Lw E*))` checked against `BS 8110-1 Cl. 5.2.3.4` (`fb = 0.4·fcu`).
* **Mode 2 — Concentrated Point Load & Punching Shear:** Checks individual wheels and coaxial twin-wheel fork clusters against `EN 1991-1-1 / BS 6399` (`Qk = 4.5 kN` static / `7.0 kN` peak) plus `BS 8110-1 Cl. 3.7.7` (`1.5d`) & `Eurocode 2 Cl. 6.4` (`2.0d`) punching shear perimeters (`u0 / u1`).
* **Mode 3 — Multi-Point Strip Bending & SFD/BMD:** Solves exact simply supported `V(x)` and `M(x)` per `1.0 m` slab strip with toggleable `45°` thickness dispersion (`be = b + 2h`) or `BS 8110-1 Cl. 3.5.2.2` flexural distribution against `wL²/8` and `wL/2` benchmarks.
* **Spreader Plate Rigidity:** Cantilever curling check (`AISC Design Guide 1`) and `2h` dispersion cone visualization.

## Running Locally & Contributing

This is a zero-build static ES-module web app (`wrangler.json` ready for Cloudflare Workers / Pages).

```bash
# 1. Serve locally
cd transit-sim
python3 -m http.server 8080

# 2. Run physics & benchmark parity verification tests (Node >= 20)
node tests/verify_reports.mjs
```

Contributions, engineering edge-case refinements, and Pull Requests are very welcome! Feel free to open an [issue](https://github.com/Amirul78800/transit-sim/issues) or submit a PR.

## License

Released under the [MIT License](LICENSE).
