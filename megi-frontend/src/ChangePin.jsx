import { useState } from "react";
import useChangePin from "./hooks/useChangePin";
import card from "./style/ProfilCard.module.css";
import styles from "./style/ChangePin.module.css";

// isto pravilo kao backend (PinRequest): 4 do 6 znamenki
const PIN_PATTERN = /^\d{4,6}$/;
const onlyDigits = (value) => value.replace(/\D/g, "").slice(0, 6);

export default function ChangePin({ userId }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const changePin = useChangePin();

  function handleChange(setter) {
    return (e) => {
      setter(onlyDigits(e.target.value));
      setFormError("");
      changePin.reset();
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!PIN_PATTERN.test(pin)) {
      setFormError("PIN mora imati 4 do 6 znamenki.");
      return;
    }
    if (pin !== confirm) {
      setFormError("PIN-ovi se ne podudaraju.");
      return;
    }
    changePin.mutate(
      { id: userId, pin },
      {
        onSuccess: () => {
          setPin("");
          setConfirm("");
        },
      },
    );
  }

  const error = formError || changePin.error?.message;

  return (
    <section className={card.card}>
      <h3 className={card.cardTitle}>Promjena PIN-a</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          className={styles.input}
          placeholder="Novi PIN"
          value={pin}
          onChange={handleChange(setPin)}
        />
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          className={styles.input}
          placeholder="Ponovi novi PIN"
          value={confirm}
          onChange={handleChange(setConfirm)}
        />
        {error && <p className={styles.error}>{error}</p>}
        {changePin.isSuccess && (
          <p className={styles.success}>PIN je promijenjen.</p>
        )}
        <button
          type="submit"
          className={styles.submit}
          disabled={!pin || !confirm || changePin.isPending}
        >
          {changePin.isPending ? "Spremam..." : "Promijeni PIN"}
        </button>
      </form>
    </section>
  );
}
