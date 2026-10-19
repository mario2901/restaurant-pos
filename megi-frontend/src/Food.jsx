import { useContext } from "react";
import FoodItem from "./FoodItem.jsx";
import { OrderContext } from "./context/OrderContext.jsx";

export default function Food() {
  const { addItemToOrder } = useContext(OrderContext);

  function handleAddAddon(addon) {
    addItemToOrder({ item: addon, type: "ADDON" });
  }

  return (
    <div>
      <FoodItem orderable handleAddAddon={handleAddAddon} />
    </div>
  );
}
