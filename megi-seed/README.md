# megi-seed

Pocetni podaci za backend.

## Pica

1. Pokreni backend (`./gradlew bootRun` u `megi-backend`).
2. Iz ovog foldera:

```
node seed-drinks.js --dry     # provjeri sto bi poslalo
node seed-drinks.js           # stvarno posalje
```

Skripta se moze pokretati vise puta — pica koja vec postoje se preskacu.

Provjera: `http://localhost:8080/api/drinks` ili `http://localhost:8080/api/drinks?category=PIVA`

## Kategorije

ALKOHOLNA_PICA, VINA, PIVA, SOKOVI, TOPLI_NAPITCI

Popis za tabove na frontendu: `GET /api/drinks/categories`

## Napomena o zalihi

`stock` je namjerno 999999 — uz `app.stock.check-enabled=false` u
`application.properties` pica su uvijek dostupna dok traje testiranje.
