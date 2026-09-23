# Restaurant POS

A point-of-sale system built for a real restaurant. Waiters take orders on tablets for tables, takeaway and delivery. Food orders go to the kitchen and drinks to the bar as separate tickets, and the app provides daily, monthly and delivery-specific sales reports.

> **Status:** active development. Ticket printing to physical printers and route protection are not implemented yet.

## Features

- **Table ordering**: tables grouped by area (inside, terrace, upper floor), with a live view of which tables have open orders
- **Delivery and takeaway**: dedicated order blocks; items can be added to a delivery even after it has been sent to print
- **Food with portions and options**: each dish has sizes (e.g. small / large) and paid options that can apply to all portions or to a single one
- **Drinks and add-ons**: drink stock is tracked and adjusted automatically when orders change
- **Kitchen and bar tickets**: kitchen tickets contain food only, with notes and no prices; bar tickets contain all items with prices
- **Order lifecycle**: unsent items can be deleted, sent items can only be voided, and an order closes when the bill is requested
- **Price freezing**: the price is stored on each order item at order time, so menu changes never affect past orders
- **Reports**: revenue for today, a specific day, a month or a custom range, plus a separate delivery report with top items and a per-waiter breakdown
- **Waiter login**: a PIN on the tablet identifies which waiter placed each order

## Tech stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Backend  | Java, Spring Boot, Spring Data JPA, Hibernate       |
| Database | Relational SQL database                             |
| Frontend | React, Vite, TanStack Query, CSS Modules            |
| Build    | Gradle (backend), npm (frontend)                    |

## Project structure
restaurant-pos/
├── megi-backend/ # Spring Boot REST API
└── megi-frontend/ # React + Vite


## Getting started

### Prerequisites

- Java 17 or newer
- Node.js 18 or newer
- A running SQL database

### Backend

1. Configure the database connection in `backend/src/main/resources/application.properties`:

```properties
   spring.datasource.url=jdbc:<your-database-url>
   spring.datasource.username=<username>
   spring.datasource.password=${DB_PASSWORD}
```

2. Run the application:

```bash
   cd backend
   ./gradlew bootRun
```

   The API runs on `http://localhost:8080`.

### Frontend

1. Create a `.env` file based on `.env.example`:
2. 
   Use the IP address of the machine running the backend so that tablets on the same network can reach it.

2. Install dependencies and start the dev server:

```bash
   cd frontend
   npm install
   npm run dev -- --host
```

   `--host` makes the app reachable from other devices on the local network.

## API overview

All endpoints are under `/api`. Request and response bodies are JSON.

| Area      | Base route     | Purpose                                                    |
| --------- | -------------- | ---------------------------------------------------------- |
| Orders    | `/api/orders`  | Open, submit, send to print, void items, bill and close    |
| Food      | `/api/food`    | Dishes, portions and options                               |
| Drinks    | `/api/drinks`  | Drinks, availability and stock                             |
| Add-ons   | `/api/addons`  | Extras such as bread or sauces                             |
| Users     | `/api/users`   | Waiters, PIN login and roles                               |
| Reports   | `/api/reports` | Sales and delivery reports                                 |

The main ordering call is `POST /api/orders/submit`. It opens or reuses an order, saves the cart and returns the kitchen and bar tickets in a single request. Prices are never sent from the client; the backend reads them from the menu.

## Typical flow

1. The waiter logs in with a PIN.
2. The waiter selects a table, or the delivery or takeaway block.
3. The waiter adds dishes (choosing a portion and options), drinks and add-ons to the cart.
4. **Order** sends the cart, and the kitchen and bar tickets are generated.
5. More items can be ordered to the same table at any time.
6. **Bill** closes the order and returns the receipt.

## Roadmap

- [ ] Printing to kitchen and bar thermal printers
- [ ] Authentication and route protection
- [ ] Admin screen for menu, stock and users
- [ ] Reports dashboard in the frontend

## License

Private project. All rights reserved.
