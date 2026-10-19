import styles from "./style/User.module.css";
import useUsers, { useDeleteUser, useCreateUser } from "./hooks/useUsers";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";

const EMPTY_FORM = { name: "", pin: "", role: "WAITER" };

export default function Users() {
  const { data: users = [], isPending, error } = useUsers();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();

  if (isPending) return <p>Učitavanje korisnika</p>;
  if (error) return <p>{error.message}</p>;

  function handleDelete() {
    deleteUser.mutate(
      { id: selected.id, active: false },
      { onSuccess: () => setSelected(null) },
    );
  }

  function handleCancelDelete() {
    setSelected(null);
    deleteUser.reset();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "pin" ? value.replace(/\D/g, "").slice(0, 4) : value,
    }));
    setFormError("");
    if (createUser.isError) createUser.reset();
  }

  function handleCreate(e) {
    e.preventDefault();
    const name = form.name.trim();

    if (!name) return setFormError("Upiši ime");
    if (form.pin.length !== 4) return setFormError("PIN mora imati 4 znamenke");

    createUser.mutate(
      { name, pin: form.pin, role: form.role },
      { onSuccess: () => setForm(EMPTY_FORM) },
    );
  }

  const createMessage =
    formError || (createUser.isError && createUser.error.message);

  return (
    <div className={styles.content}>
      <h2>Konobari</h2>

      <ul className={styles.lista}>
        {users.map((user) => (
          <li key={user.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.role}>
                {user.role === "WAITER" ? "Konobar" : "Admin"}
              </span>
              <span
                className={`${styles.status} ${
                  user.active ? styles.statusActive : styles.statusInactive
                }`}
              >
                {user.active ? "Aktivan" : "Neaktivan"}
              </span>
            </div>
            {user.active && (
              <button
                type="button"
                className={styles.deleteBtn}
                aria-label={`Deaktiviraj korisnika ${user.name}`}
                onClick={() => setSelected(user)}
              >
                <FaTrash />
              </button>
            )}
          </li>
        ))}
      </ul>

      {selected && (
        <div className={styles.confirm}>
          <p>Sigurno želiš deaktivirati {selected.name}?</p>
          <button
            type="button"
            className={styles.confirmDa}
            onClick={handleDelete}
            disabled={deleteUser.isPending}
          >
            Da
          </button>
          <button
            type="button"
            className={styles.confirmNe}
            onClick={handleCancelDelete}
          >
            Ne
          </button>
          {deleteUser.isError && <p>{deleteUser.error.message}</p>}
        </div>
      )}

      <form className={styles.form} onSubmit={handleCreate}>
        <h3 className={styles.formTitle}>Novi korisnik</h3>

        <div className={styles.formRow}>
          <input
            className={styles.input}
            type="text"
            name="name"
            placeholder="Ime"
            value={form.name}
            onChange={handleChange}
            autoComplete="off"
          />
          <input
            className={styles.input}
            type="password"
            name="pin"
            inputMode="numeric"
            placeholder="PIN (4 znamenke)"
            value={form.pin}
            onChange={handleChange}
            autoComplete="new-password"
          />
          <select
            className={styles.input}
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="WAITER">Konobar</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={createUser.isPending}
        >
          {createUser.isPending ? "Spremam..." : "Dodaj"}
        </button>

        {createMessage && <p className={styles.formError}>{createMessage}</p>}
      </form>
    </div>
  );
}
