-- ============================================================
--  Priprema baze za puštanje u rad
--  Pokretanje (PowerShell, backend smije raditi):
--    $h2 = Get-ChildItem "$env:USERPROFILE\.gradle\caches" -Recurse -Filter "h2-*.jar" |
--          Where-Object { $_.Name -notmatch "sources|javadoc" } | Select-Object -First 1
--    java "-Dfile.encoding=UTF-8" -cp $h2.FullName org.h2.tools.RunScript `
--      -url "jdbc:h2:file:C:/megi/data/megi;AUTO_SERVER=TRUE" -user sa `
--      -script "<putanja>\priprema-baze.sql" -showResults
--  Backend smije raditi (AUTO_SERVER). PRIJE pokretanja: Admin -> Postavke
--  -> Backup podataka -> "Napravi backup sada".
--
--  1) briše SVE narudžbe (testne) i vraća brojač narudžbi na #1
--  2) dodaje opcije Feferoni i Masline (0 KM) na sve pizze
--  3) "Cijela lepina" (1 KM) uz malu porciju Ćevapa, Krpica i Gljiva
--  Meni, piće, zalihe, konobari i postavke ostaju kakvi jesu.
--  Skripta se smije pokrenuti više puta (ne pravi duplikate).
-- ============================================================

-- 1) Narudžbe
DELETE FROM order_item_option;
DELETE FROM order_item;
DELETE FROM orders;
ALTER TABLE order_item ALTER COLUMN id RESTART WITH 1;
ALTER TABLE orders ALTER COLUMN id RESTART WITH 1;

-- 2) Feferoni i Masline na sve pizze (vrijedi za sve porcije)
INSERT INTO food_option (name, extra_price, food_id, portion_id)
SELECT 'Feferoni', 0.00, f.id, NULL FROM food f
WHERE f.category = 'Pizza'
  AND NOT EXISTS (SELECT 1 FROM food_option o
                  WHERE o.food_id = f.id AND LOWER(o.name) = 'feferoni');

INSERT INTO food_option (name, extra_price, food_id, portion_id)
SELECT 'Masline', 0.00, f.id, NULL FROM food f
WHERE f.category = 'Pizza'
  AND NOT EXISTS (SELECT 1 FROM food_option o
                  WHERE o.food_id = f.id AND LOWER(o.name) = 'masline');

-- 3) Cijela lepina (1 KM) uz MALU porciju: Ćevapi, Krpice (pileći file,
--    teleće, svinjske) i Gljive na žaru u lepini. Postojećoj se cijena postavi na 1 KM.
INSERT INTO food_option (name, extra_price, food_id, portion_id)
SELECT 'Cijela lepina', 1.00, f.id, p.id
FROM food f
JOIN portion p ON p.food_id = f.id AND LOWER(p.size) = 'mala'
WHERE f.name IN ('Ćevapi', 'Krpice pileći file', 'Krpice teleće',
                 'Krpice svinjske', 'Gljive na žaru u lepini')
  AND NOT EXISTS (SELECT 1 FROM food_option o
                  WHERE o.food_id = f.id AND LOWER(o.name) = 'cijela lepina');

UPDATE food_option SET extra_price = 1.00
WHERE LOWER(name) = 'cijela lepina';

-- Provjera (rezultat se prikaže ispod):
SELECT f.name AS jelo, o.name AS opcija, o.extra_price AS doplata, p.size AS samo_uz_porciju
FROM food_option o
JOIN food f ON f.id = o.food_id
LEFT JOIN portion p ON p.id = o.portion_id
WHERE LOWER(o.name) IN ('feferoni', 'masline', 'cijela lepina')
ORDER BY f.name, o.name;

SELECT COUNT(*) AS preostalo_narudzbi FROM orders;
