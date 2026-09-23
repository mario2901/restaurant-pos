import styles from "./style/App.module.css";
import RightSideBar from "./RightSideBar";
import Tables from "./Tables.jsx";
import Menu from "./Menu.jsx";
import { useState } from "react";
import OrderContextProvider from "./context/OrderContext.jsx";

export default function App() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [reon, setReon] = useState("unutra");

  return (
    <OrderContextProvider>
      <div className={styles.app}>
        <div className={styles.global}>
          <main className={styles.main}>
            {selectedTable ? (
              <Menu
                table={selectedTable}
                onBack={() => setSelectedTable(null)}
              />
            ) : (
              <Tables
                reon={reon}
                onReonChange={setReon}
                onSelectTable={setSelectedTable}
              />
            )}
          </main>
          <RightSideBar table={selectedTable}></RightSideBar>
        </div>
      </div>
    </OrderContextProvider>
  );
}
