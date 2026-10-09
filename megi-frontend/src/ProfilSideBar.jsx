import { useNavigate } from "react-router";
import { TbArrowLeft, TbLogout } from "react-icons/tb";
import { useMe, useLogout } from "./hooks/useLogin";
import ShiftStats from "./ShiftStats";
import ReportsButtons from "./ReportsButtons";
import ChangePin from "./ChangePin";
import styles from "./style/ProfilSideBar.module.css";

export default function ProfilSideBar() {
  const { data: user } = useMe();
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <aside className={styles.sideBar}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => navigate("/")}
        >
          <TbArrowLeft size={18} />
          Stolovi
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.logout}`}
          onClick={logout}
        >
          <TbLogout size={18} />
          Odjava
        </button>
      </div>

      <h2 className={styles.name}>{user.name}</h2>

      <ShiftStats userId={user.id} />
      <ReportsButtons />
      <ChangePin userId={user.id} />
    </aside>
  );
}
