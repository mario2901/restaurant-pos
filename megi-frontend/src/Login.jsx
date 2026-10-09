import styles from "./style/Login.module.css";
import { useState } from "react";
import { useLogin } from "./hooks/useLogin";
export default function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  function handleChange(e) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
    if (login.isError) login.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (pin.length !== 4) return setError("Pin mora imati 4 znamenke");

    login.mutate(pin, {
      onError: () => setPin(""),
    });
  }

  const message = error || (login.isError && login.error?.message);
  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.header}>
          <h2>Prijava</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={handleChange}
              autoFocus
              placeholder="*****"
            ></input>
            <button type="submit" disabled={pin.length !== 4}>
              Prijava
            </button>
            {message && <p className={styles.error}>{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
