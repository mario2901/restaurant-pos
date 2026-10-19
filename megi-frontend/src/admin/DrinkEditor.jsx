import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import useDrink from "../hooks/useDrink";
import useDrinkCat from "../hooks/useDrinkCat";
import {
  useCreateDrink,
  useDeleteDrink,
  useSetDrinkAvailable,
  useUpdateDrink,
} from "../hooks/useMenuAdmin";
import { parsePrice, priceInput } from "../data/menu";
import ConfirmDelete from "./ConfirmDelete";
import AvailabilityToggle from "./AvailabilityToggle";

/**
 * Bočni panel za piće. drinkId = null -> novo piće.
 * Početna zaliha se upisuje samo kod novog pića; kasnije ide preko stranice zaliha.
 */
export default function DrinkEditor({ drinkId, defaultCategory, onClose, onCreated }) {
  const { data: drinks = [] } = useDrink({ all: true });
  const { data: categories = [] } = useDrinkCat();
  const drink = drinkId != null ? drinks.find((d) => d.id === drinkId) : null;
  const isNew = drinkId == null;

  const [name, setName] = useState(drink?.name ?? "");
  const [price, setPrice] = useState(priceInput(drink?.price));
  const [category, setCategory] = useState(
    drink?.category ?? defaultCategory ?? "SOKOVI",
  );
  const [stock, setStock] = useState("0");

  const create = useCreateDrink();
  const update = useUpdateDrink();
  const setAvailable = useSetDrinkAvailable();
  const remove = useDeleteDrink();

  if (!isNew && !drink) {
    return <p className={styles.muted}>Piće nije pronađeno.</p>;
  }

  const cleanName = name.trim();
  const parsed = parsePrice(price);
  const stockNum = stock === "" ? 0 : Number(stock);
  const dirty =
    isNew ||
    cleanName !== drink.name ||
    parsed !== Number(drink.price) ||
    category !== drink.category;
  const canSave =
    cleanName &&
    parsed > 0 &&
    category &&
    Number.isInteger(stockNum) &&
    stockNum >= 0 &&
    dirty;
  const saving = create.isPending || update.isPending;
  const error =
    create.error || update.error || setAvailable.error || remove.error;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    const body = {
      name: cleanName,
      price: parsed,
      category,
      // backend kod izmjene ignorira stock
      stock: isNew ? stockNum : drink.stock,
    };
    if (isNew) {
      create.mutate(body, { onSuccess: (created) => onCreated?.(created) });
    } else {
      update.mutate({ id: drink.id, ...body });
    }
  }

  return (
    <div className={styles.editor}>
      <header className={styles.header}>
        <h3 className={styles.title}>{isNew ? "Novo piće" : drink.name}</h3>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Zatvori"
        >
          &times;
        </button>
      </header>

      {!isNew && (
        <AvailabilityToggle
          available={drink.available}
          isPending={setAvailable.isPending}
          onToggle={() =>
            setAvailable.mutate({ id: drink.id, available: !drink.available })
          }
        />
      )}

      <form className={styles.section} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Naziv</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="npr. Coca-Cola 0,25"
          />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Cijena (KM)</span>
            <input
              className={styles.input}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </label>
          {isNew ? (
            <label className={styles.field}>
              <span className={styles.label}>Početna zaliha</span>
              <input
                className={styles.input}
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="0"
              />
            </label>
          ) : (
            <div className={styles.field}>
              <span className={styles.label}>Zaliha</span>
              <span className={styles.readonly}>{drink.stock} kom</span>
            </div>
          )}
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Kategorija</span>
          <select
            className={styles.input}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {dirty && (
          <button
            type="submit"
            className={styles.primary}
            disabled={!canSave || saving}
          >
            {saving ? "Spremam…" : isNew ? "Dodaj piće" : "Spremi izmjene"}
          </button>
        )}
      </form>

      {error && <p className={styles.error}>{error.message}</p>}

      {!isNew && (
        <footer className={styles.footer}>
          <ConfirmDelete
            label="Obriši piće"
            isPending={remove.isPending}
            onConfirm={() =>
              remove.mutate(drink.id, { onSuccess: () => onClose() })
            }
          />
          <span className={styles.rowHint}>
            Zaliha se mijenja na stranici zaliha. Piće koje je bilo naručivano
            ne može se obrisati — skini ga s karte.
          </span>
        </footer>
      )}
    </div>
  );
}
