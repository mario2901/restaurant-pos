package com.example.megibackend.Dto;

public enum TicketType {
    KITCHEN,  // kuhinja: hrana i prilozi, s napomenama, bez cijena
    BAR,      // šank: sve stavke s cijenama
    BILL,          // račun za stol: sve ne-stornirane stavke narudžbe
    STORNO_KITCHEN, // storno za kuhinju: hrana i prilozi, bez cijena
    STORNO_BAR      // storno za šank: sve stornirane stavke s iznosima
}
