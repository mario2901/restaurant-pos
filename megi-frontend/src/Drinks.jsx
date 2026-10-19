import { useContext } from "react";

import { OrderContext } from "./context/OrderContext.jsx";
import DrinkItem from "./DrinkItem.jsx";

export default function Drinks() {
  const { addItemToOrder } = useContext(OrderContext);

  function handleAddDrink(drink) {
    addItemToOrder({ item: drink, type: "DRINK" });
  }

  return <DrinkItem handleAddDrink={handleAddDrink} />;
}
