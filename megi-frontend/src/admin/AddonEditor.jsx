import { useState } from "react";
import styles from "../style/AdminEditor.module.css";
import useAddons from "../hooks/useAddons";
import {
  useCreateAddon,
  useDeleteAddon,
  useSetAddonAvailable,
  useUpdateAddon,
} from "../hooks/useMenuAdmin";
import { parsePrice, priceInput } from "../data/menu";
import ConfirmDelete from "./ConfirmDelete";
import AvailabilityToggle from "./AvailabilityToggle";

/** Bočni panel za prilog (kečap, pomfrit…). addonId = null -> novi prilog. */
export default function AddonEditor({ addonId, onClose, onCreated }) {
  const { data: addons = [] } = useAddons({ all: true });
  const addon = addonId != null ? addons.find((a) => a.id === addonId) : null;
  const isNew = addonId == null;

  const [name, setName] = useState(addon?.name ?? "");
  const [price, setPrice] = useState(priceInput(addon?.price));

  const create = useCreateAddon();
  const update = useUpdateAddon();
  const setAvailable = useSetAddonAvailable();
  const remove = useDeleteAddon();

  if (!isNew && !addon) {
    return <p className={styles.muted}>Prilog nije pronađen.</p>;
  }

  const cleanName = name.trim();
  const parsed = parsePrice(price);
  const dirty =
    isNew || cleanName !== addon.name || parsed !== Number(addon.price);
  const canSave = cleanName && parsed > 0 && dirty;
  const saving = create.isPending || update.isPending;
  const error =
    create.error || update.error || setAvailable.error || remove.error;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    const body = { name: cleanName, price: parsed };
    if (isNew) {
      create.mutate(body, { onSuccess: (created) => onCreated?.(created) });
    } else {
      update.mutate({ id: addon.id, ...body });
    }
  }

  return (
    <div className={styles.editor}>
      <header className={styles.header}>
        <h3 className={styles.title}>{isNew ? "Novi prilog" : addon.name}</h3>
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
          available={addon.available}
          isPending={setAvailable.isPending}
          onToggle={() =>
            setAvailable.mutate({ id: addon.id, available: !addon.available })
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
            placeholder="npr. Kečap"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Cijena (KM)</span>
          <input
            className={`${styles.input} ${styles.priceInput}`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
          />
        </label>
        {dirty && (
          <button
            type="submit"
            className={styles.primary}
            disabled={!canSave || saving}
          >
            {saving ? "Spremam…" : isNew ? "Dodaj prilog" : "Spremi izmjene"}
          </button>
        )}
      </form>

      {error && <p className={styles.error}>{error.message}</p>}

      {!isNew && (
        <footer className={styles.footer}>
          <ConfirmDelete
            label="Obriši prilog"
            isPending={remove.isPending}
            onConfirm={() =>
              remove.mutate(addon.id, { onSuccess: () => onClose() })
            }
          />
        </footer>
      )}
    </div>
  );
}
