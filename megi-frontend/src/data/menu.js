// Kategorije jela — tabovi na meniju i jedini izbor u Adminu.
// Jelo bez neke od glavnih kategorija prikazuje se pod "Ostalo".
export const MAIN_FOOD_CATEGORIES = ["Pizza", "Roštilj", "Doručak", "Salata"];
export const FOOD_CATEGORIES = [...MAIN_FOOD_CATEGORIES, "Ostalo"];

export const formatPrice = (price) =>
  `${Number(price ?? 0).toFixed(2).replace(".", ",")} KM`;

/** "12,5" ili "12.5" -> 12.5; prazno/neispravno -> NaN */
export const parsePrice = (value) =>
  value === "" || value == null
    ? NaN
    : Number(String(value).trim().replace(",", "."));

/** Za početnu vrijednost inputa: 12.5 -> "12,50" */
export const priceInput = (price) =>
  price == null ? "" : Number(price).toFixed(2).replace(".", ",");
