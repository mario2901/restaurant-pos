import styles from "./style/Menu.module.css";
import { useState } from "react";
import Food from "./Food.jsx";
import Drinks from "./Drinks.jsx";

export default function Menu({ table, onBack }) {
  const [section, setSection] = useState("hrana");

  return (
    <div>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Stolovi
        </button>
        <h2 className={styles.tableTitle}>{table.name}</h2>
        <span className={styles.headerSpacer} />
      </div>

      <div className={styles.sectionSwitch}>
        <button
          className={`${styles.sectionBtn} ${
            section === "hrana" ? styles.sectionActive : ""
          }`}
          onClick={() => setSection("hrana")}
        >
          Hrana
        </button>
        <button
          className={`${styles.sectionBtn} ${
            section === "pice" ? styles.sectionActive : ""
          }`}
          onClick={() => setSection("pice")}
        >
          Piće
        </button>
      </div>

      {section === "hrana" ? <Food table={table} /> : <Drinks />}
    </div>
  );
}
