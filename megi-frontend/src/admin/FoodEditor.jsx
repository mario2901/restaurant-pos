import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import useFood from "../hooks/useFood";
import {
  useCreateFood,
  useDeleteFood,
  useSetFoodAvailable,
  useUpdateFood,
} from "../hooks/useMenuAdmin";
import { FOOD_CATEGORIES, parsePrice } from "../data/menu";
import ConfirmDelete from "./ConfirmDelete";
import AvailabilityToggle from "./AvailabilityToggle";
import PortionsEditor from "./PortionsEditor";
import OptionsEditor from "./OptionsEditor";

const EMPTY_PORTION = { size: "", price: "" };

/** Odabir kategorije: samo fiksne; nepoznata postojeća se zadržava dok je admin ne promijeni. */
function CategorySelect({ value, onChange }) {
  const unknown = value && !FOOD_CATEGORIES.includes(value);
  return (
    <select
      className={styles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {unknown && <option value={value}>{value} (trenutna)</option>}
      {FOOD_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

/**
 * Bočni panel za jelo.
 *  - foodId = null -> novo jelo (naziv, opis, kategorija + barem jedna porcija)
 *  - foodId        -> izmjena podataka, dostupnost, brisanje, porcije, opcije
 * Jelo se uvijek čita svježe iz React Query liste (nakon svake izmjene se osvježi).
 */
export default function FoodEditor({ foodId, onClose, onCreated }) {
  const { data: foods = [] } = useFood({ all: true });
  const food = foodId != null ? foods.find((f) => f.id === foodId) : null;
  const isNew = foodId == null;

  const [name, setName] = useState(food?.name ?? "");
  const [description, setDescription] = useState(food?.description ?? "");
  const [category, setCategory] = useState(food?.category ?? "Pizza");
  const [portions, setPortions] = useState([EMPTY_PORTION]);

  const create = useCreateFood();
  const update = useUpdateFood();
  const setAvailable = useSetFoodAvailable();
  const remove = useDeleteFood();

  if (!isNew && !food) {
    return <p className={styles.muted}>Jelo nije pronađeno.</p>;
  }

  const cleanName = name.trim();
  const cleanDescription = description.trim();
  const parsedPortions = portions.map((p) => ({
    size: p.size.trim(),
    price: parsePrice(p.price),
  }));
  const portionsValid =
    parsedPortions.length > 0 &&
    parsedPortions.every((p) => p.size && p.price > 0);

  const dirty =
    !isNew &&
    (cleanName !== food.name ||
      cleanDescription !== (food.description ?? "") ||
      category !== (food.category ?? ""));
  const canSave = cleanName && (isNew ? portionsValid : dirty);
  const saving = create.isPending || update.isPending;
  const error =
    create.error || update.error || setAvailable.error || remove.error;

  function changePortion(index, field, value) {
    setPortions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    const body = {
      name: cleanName,
      description: cleanDescription || null,
      category,
    };
    if (isNew) {
      create.mutate(
        { ...body, portions: parsedPortions },
        { onSuccess: (created) => onCreated?.(created) },
      );
    } else {
      update.mutate({ id: food.id, ...body });
    }
  }

  return (
    <div className={styles.editor}>
      <header className={styles.header}>
        <h3 className={styles.title}>{isNew ? "Novo jelo" : food.name}</h3>
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
          available={food.available}
          isPending={setAvailable.isPending}
          onToggle={() =>
            setAvailable.mutate({ id: food.id, available: !food.available })
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
            placeholder="npr. Pizza Margherita"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Opis</span>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sastojci (neobavezno)"
            rows={2}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Kategorija</span>
          <CategorySelect value={category} onChange={setCategory} />
        </label>

        {isNew && (
          <div className={styles.field}>
            <span className={styles.label}>Porcije i cijene</span>
            {portions.map((p, i) => (
              <div key={i} className={styles.row}>
                <input
                  className={styles.input}
                  value={p.size}
                  onChange={(e) => changePortion(i, "size", e.target.value)}
                  placeholder="Porcija (npr. Mala)"
                />
                <input
                  className={`${styles.input} ${styles.priceInput}`}
                  value={p.price}
                  onChange={(e) => changePortion(i, "price", e.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                />
                <button
                  type="button"
                  className={`${styles.ghost} ${styles.small}`}
                  onClick={() =>
                    setPortions((prev) => prev.filter((_, j) => j !== i))
                  }
                  disabled={portions.length <= 1}
                  aria-label="Ukloni porciju"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={`${styles.ghost} ${styles.small} ${styles.alignStart}`}
              onClick={() => setPortions((prev) => [...prev, EMPTY_PORTION])}
            >
              + Još jedna porcija
            </button>
          </div>
        )}

        {(isNew || dirty) && (
          <button
            type="submit"
            className={styles.primary}
            disabled={!canSave || saving}
          >
            {saving ? "Spremam…" : isNew ? "Dodaj jelo" : "Spremi izmjene"}
          </button>
        )}
      </form>

      {error && <p className={styles.error}>{error.message}</p>}

      {!isNew && (
        <>
          <PortionsEditor food={food} />
          <OptionsEditor food={food} />

          <footer className={styles.footer}>
            <ConfirmDelete
              label="Obriši jelo"
              isPending={remove.isPending}
              onConfirm={() =>
                remove.mutate(food.id, { onSuccess: () => onClose() })
              }
            />
            <span className={styles.rowHint}>
              Jelo koje je bilo naručivano ne može se obrisati — skini ga s
              menija.
            </span>
          </footer>
        </>
      )}
    </div>
  );
}
