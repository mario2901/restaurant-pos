package com.example.megibackend.Entity;

public enum ItemStatus {
    NEW,        // dodano na narudžbu, još nije poslano na print
    SENT,       // poslano u kuhinju / šank
    CANCELLED   // stornirano, ne ulazi u total
}
