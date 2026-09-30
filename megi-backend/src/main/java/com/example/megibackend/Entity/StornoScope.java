package com.example.megibackend.Entity;

/** Što se stornira na narudžbi. */
public enum StornoScope {
    FOOD,   // hrana + prilozi (ide u kuhinju)
    DRINK,  // piće (šank)
    ALL;    // sve

    public boolean matches(OrderItem item) {
        return switch (this) {
            case FOOD -> item instanceof FoodOrderItem || item instanceof AddonOrderItem;
            case DRINK -> item instanceof DrinkOrderItem;
            case ALL -> true;
        };
    }
}
