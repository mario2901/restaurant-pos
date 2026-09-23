package com.example.megibackend.Dto;

public enum TicketType {
    KITCHEN,  // kuhinja: samo hrana, s napomenama, bez cijena
    BAR,      // šank: sve stavke s cijenama
    BILL      // račun za stol: sve ne-stornirane stavke narudžbe
}
