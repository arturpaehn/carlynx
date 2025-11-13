# AI Prompt: Generate Vehicle Price Data for Texas Market

## Database Table Structure

```sql
CREATE TABLE vehicle_price_benchmarks (
  id BIGSERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  avg_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Only 4 fields needed in INSERT:** brand, model, year, avg_price

## Task

Create SQL INSERT statements for popular vehicles in Texas (2000-2024).

**Format:**
```sql
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price) VALUES
('Honda', 'Civic', 2020, 22000),
('Honda', 'Civic', 2022, 25000),
('Honda', 'Civic', 2024, 28000);
```

## Years to Include
Pick years per model: 2000-2024

## Brands & Models (Minimum 5 models each)

### ❌ SKIP (Already in database):
- Ford (all models)
- Toyota Camry

### ✅ CARS & TRUCKS to Add:

**Chevrolet:** Silverado, Tahoe, Camaro, Equinox, Malibu, Suburban, Colorado

**RAM:** 1500, 2500, 3500

**Toyota:** Corolla, Tacoma, Tundra, RAV4, Highlander, 4Runner

**GMC:** Sierra, Yukon, Terrain, Acadia

**Honda:** Civic, Accord, CR-V, Pilot, Ridgeline

**Nissan:** Altima, Rogue, Titan, Sentra, Pathfinder

**Jeep:** Wrangler, Grand Cherokee, Cherokee, Gladiator, Compass

**Dodge:** Charger, Durango, Challenger, RAM ProMaster

**Hyundai:** Elantra, Tucson, Santa Fe, Sonata, Palisade

**Kia:** K5/Optima, Sorento, Sportage, Telluride, Forte

**Subaru:** Outback, Forester, Crosstrek, Ascent, Impreza

**Mazda:** CX-5, Mazda3, CX-9, CX-30, Mazda6

**Volkswagen:** Jetta, Tiguan, Atlas, Passat, ID.4

**Tesla:** Model 3 (2018+), Model Y (2020+), Model S

### ✅ MOTORCYCLES to Add:

**Harley-Davidson:** Street Glide, Road Glide, Softail, Sportster, Road King, Ultra Limited

**Honda:** Gold Wing, Shadow, Rebel, CB500X, Africa Twin

**Yamaha:** MT-09, R1, YZF-R6, FJR1300, Tracer

**Kawasaki:** Ninja, Z900, Versys, Vulcan, Concours

**Suzuki:** GSX-R1000, Hayabusa, V-Strom, Boulevard

**BMW:** R1250GS, S1000RR, F850GS, R1250RT

**Ducati:** Panigale, Monster, Multistrada, Scrambler

**Indian:** Chief, Scout, Challenger, Roadmaster

**Triumph:** Bonneville, Street Triple, Tiger, Rocket

**KTM:** 1290 Super Duke, 890 Adventure, RC 390

## Price Guidelines (Texas Market 2024)

**Cars:**
- Compact sedans: $6K (2000) → $28K (2024)
- Mid-size: $8K (2000) → $35K (2024)
- SUVs: $10K (2000) → $45K (2024)
- Trucks: $12K (2000) → $60K (2024)

**Motorcycles:**
- Standard/Cruiser: $3K (2000) → $12K (2024)
- Sport bikes: $4K (2000) → $18K (2024)
- Touring bikes: $8K (2000) → $30K (2024)
- Adventure bikes: $6K (2000) → $22K (2024)

Use realistic depreciation and Texas market conditions.

## Output Format

Organize by brand with comments:

```sql
-- ============================================
-- HONDA MOTORCYCLES
-- ============================================

-- Honda Gold Wing
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price) VALUES
('Honda', 'Gold Wing', 2000, 10000),
('Honda', 'Gold Wing', 2010, 18000),
('Honda', 'Gold Wing', 2020, 28000),
('Honda', 'Gold Wing', 2024, 32000);

-- Honda Shadow
INSERT INTO vehicle_price_benchmarks (brand, model, year, avg_price) VALUES
...
```

**Generate complete SQL script for ALL brands and models!**
