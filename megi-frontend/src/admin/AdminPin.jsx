import ChangePin from "../ChangePin";
import { useMe } from "../hooks/useLogin";

/** Admin -> Promjena PIN-a: ista forma kao u Profilu konobara, za prijavljenog admina. */
export default function AdminPin() {
  const { data: user } = useMe();

  if (!user) return <p>Korisnik nije prijavljen.</p>;

  return (
    <div style={{ maxWidth: 380 }}>
      <h2 style={{ margin: "0 0 4px", color: "#e8edf3" }}>Promjena PIN-a</h2>
      <p style={{ margin: "0 0 16px", color: "#8b96a5", fontSize: 14 }}>
        Prijavljen: <strong style={{ color: "#e8edf3" }}>{user.name}</strong>
      </p>
      <ChangePin userId={user.id} />
    </div>
  );
}
