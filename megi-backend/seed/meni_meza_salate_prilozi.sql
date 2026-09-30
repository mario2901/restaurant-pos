-- Unos s menija: MEZA (100g), SALATE, PRILOZI
-- Sigurno za ponovno pokretanje: preskače stavke koje već postoje (po imenu + kategoriji).

-- ========== MEZA -> food, kategorija "Ostalo", porcija "100g" ==========
INSERT INTO food (name, description, category, available)
SELECT v.name, NULL, 'Ostalo', TRUE
FROM (VALUES ('Pršut'), ('Kulen'), ('Gov. pečenica'), ('Suđuk'), ('Sir'), ('Riža')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM food f WHERE f.name = v.name AND f.category = 'Ostalo');

INSERT INTO portion (size, price, food_id)
SELECT v.size, v.price, f.id
FROM (VALUES
    ('Pršut',         '100g',    5.00),
    ('Kulen',         '100g',    4.00),
    ('Gov. pečenica', '100g',    7.00),
    ('Suđuk',         '100g',    5.00),
    ('Sir',           '100g',    3.00),
    ('Riža',          'Porcija', 1.50)
) AS v(name, size, price)
JOIN food f ON f.name = v.name AND f.category = 'Ostalo'
WHERE NOT EXISTS (SELECT 1 FROM portion p WHERE p.food_id = f.id AND p.size = v.size);

-- ========== SALATE -> food, kategorija "Salata", porcija "Standardna" ==========
INSERT INTO food (name, description, category, available)
SELECT v.name, NULL, 'Salata', TRUE
FROM (VALUES ('Sezonska salata'), ('Gurman salata'), ('Portugal salata'),
             ('Mexico salata'), ('Šopska salata'), ('Grčka salata')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM food f WHERE f.name = v.name AND f.category = 'Salata');

INSERT INTO portion (size, price, food_id)
SELECT 'Standardna', v.price, f.id
FROM (VALUES
    ('Sezonska salata', 4.00),
    ('Gurman salata',   5.00),
    ('Portugal salata', 5.00),
    ('Mexico salata',   5.00),
    ('Šopska salata',   5.00),
    ('Grčka salata',    5.00)
) AS v(name, price)
JOIN food f ON f.name = v.name AND f.category = 'Salata'
WHERE NOT EXISTS (SELECT 1 FROM portion p WHERE p.food_id = f.id AND p.size = 'Standardna');

-- ========== PRILOZI -> addon ==========
INSERT INTO addon (name, price, available)
SELECT v.name, v.price, TRUE
FROM (VALUES
    ('Feta',              1.00),
    ('Kajmak',            2.50),
    ('Kečap',             1.50),
    ('Majoneza',          1.50),
    ('Bešamel od gljiva', 2.00),
    ('Pomfrit',           4.00),
    ('Ajvar',             1.50)
) AS v(name, price)
WHERE NOT EXISTS (SELECT 1 FROM addon a WHERE a.name = v.name);
