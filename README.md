<div align="center">

# ✨ Lumière — Salon & Spa Platform

**A full-stack booking + e-commerce + admin platform, built from the ground up.**

Real-time appointment scheduling · Retail shop with cart & checkout · Stripe payments · Full admin console

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API](#-api-overview) · [Screenshots](#-screens)

</div>

---

## Overview

Lumière is a production-style web platform for a salon & spa business, covering everything the
business actually needs to run online: a marketing site, real-time appointment booking with
staff and time-slot availability, a retail product shop, secure card payments, customer
accounts, and a complete admin dashboard for managing the day-to-day operation.

It's built as a **single-page vanilla JavaScript frontend** talking to a **Node.js/Express REST
API** backed by **MongoDB**, with **Stripe** handling all payment processing. No framework, no
bundler, no build step on the client — just clean, dependency-free JavaScript doing real work.

> One codebase, same architecture, works for any appointment-based service business — salons,
> clinics, gyms, studios, tuition centers. Swap the data, keep the engine.

---

## 🚀 Features

### Customer-facing

- **Landing experience** — hero, service highlights, "how it works", stylist team, before/after
  gallery with lightbox, review carousel, membership tiers, shop preview, location & hours.
- **Service catalog** — category, price, and duration filtering with a detail modal per service.
- **5-step booking wizard** — select services & add-ons → choose a stylist (or "any available")
  → pick a date & real-time available time slot → enter details & apply a coupon → review,
  choose a deposit/full/at-venue payment option, and pay by card.
- **Retail shop** — filterable product grid, variants, stock-aware detail pages, a persistent
  cart drawer with a free-shipping progress bar, and a 3-step checkout.
- **Customer accounts** — upcoming & past appointments (reschedule/cancel/rebook), order
  history, loyalty points, saved addresses, profile settings.
- **Secure checkout** — Stripe Elements card capture with 3D Secure support; guest checkout
  supported end to end.

### Admin console

- **Dashboard** — live KPIs (today's bookings, monthly revenue with month-over-month change,
  new customers, average ticket), a 12-month revenue trend chart, today's schedule, and a
  recent-activity feed.
- **Appointments** — filterable list, per-status transitions (pending → confirmed → completed /
  no-show / cancelled), reschedule, and internal notes.
- **Services, staff & inventory** — full CRUD, staff working-hours & leave management,
  per-service staff assignment, stock levels with low-stock alerts.
- **Orders, customers & payments** — order status/tracking pipeline, a searchable customer
  directory with full visit/spend history, transaction list with refund support and CSV export,
  and coupon management.

---

## 🧱 Tech Stack

| Layer            | Technology                                  |
|-------------------|----------------------------------------------|
| Frontend          | Vanilla JavaScript (SPA), HTML5, CSS3        |
| Routing           | Hash-based client-side router with route guards |
| Backend           | Node.js + Express                            |
| Database          | MongoDB + Mongoose                           |
| Auth              | JWT + bcrypt                                 |
| Payments          | Stripe (PaymentIntents, Elements, Webhooks)  |
| Charts            | Chart.js                                     |

**Why vanilla JS on the frontend?** No build tooling, no framework lock-in, deployable anywhere
that serves static files, and every interaction — state, rendering, routing — is hand-rolled and
transparent rather than hidden behind abstraction.

---

## 🏗 Architecture

```
Browser (SPA)
  ├─ STATE          global app state, single source of truth
  ├─ Router          hash-based routing, public / guest / customer / admin guards
  ├─ Pages           render functions per route
  └─ API client      typed fetch wrapper → REST API
        │  HTTPS / JSON
        ▼
Node.js + Express
  ├─ routes/          URL → controller mapping
  ├─ controllers/     business logic
  ├─ models/          Mongoose schemas
  └─ middleware/      auth, admin guard, error handling
        │
        ├──► MongoDB — users, services, staff, appointments,
        │              products, orders, payments, reviews, coupons
        └──► Stripe   — PaymentIntents, Elements, signed webhooks
```

### Design decisions worth knowing about

- **Snapshot pattern** — appointments and orders store a *copy* of the service/product name and
  price at the moment of booking, not just a reference. If an admin changes a price six months
  later, historical bookings still show what the customer actually paid.
- **Server-verified payment amounts** — the frontend never tells the backend how much to charge.
  The Stripe PaymentIntent amount is always re-derived from the appointment/order record in the
  database, closing off a very real class of client-side tampering.
- **Race-condition-safe booking** — every appointment write re-checks for a conflicting booking
  immediately before insert, using a numeric time-range query, so two customers can't double
  book the same slot in the same second.
- **Signed, raw-body Stripe webhooks** — the webhook route is mounted before the JSON body
  parser and verifies Stripe's signature on every event, so appointment/order state is only ever
  updated by a payment Stripe can actually vouch for.

---

## ⚡ Getting Started

### Option A — Frontend only (no setup required)

The client ships with realistic mock data and works standalone.

```bash
cd client
# open index.html with any static server, e.g. VS Code "Live Server"
```

### Option B — Full stack

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # fill in MongoDB URI, JWT secret, Stripe keys
npm run dev

# 2. Frontend
cd client
# serve with Live Server / any static file server
```

**Environment variables** (`server/.env`):

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lumiere-salon
JWT_SECRET=replace_with_a_long_random_string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5500
```

MongoDB Atlas' free tier and Stripe test mode are both sufficient to run the full stack at zero
cost. Test with card `4242 4242 4242 4242`, any future expiry, any CVC.

---

## 🔌 API Overview

REST API under `/api`, JSON in and out, JWT bearer auth on protected routes.

```
POST   /api/auth/register           /api/auth/login          /api/auth/me
GET    /api/services                /api/staff                /api/products
GET    /api/appointments/slots      POST /api/appointments    PUT /api/appointments/:id/cancel
GET    /api/appointments (admin)    PUT  /api/appointments/:id/status (admin)
POST   /api/orders                  GET  /api/orders/my
POST   /api/payments/create-intent  POST /api/webhook/stripe
POST   /api/coupons/validate
GET    /api/admin/stats             /api/admin/revenue
```

Full route list lives in `server/routes/`.

---

## 📁 Project Structure

```
lumiere-salon/
├── client/
│   ├── index.html
│   ├── css/          design tokens, base, components, layout, admin
│   ├── js/            state, router, api client, auth, cart, booking, payment
│   └── pages/          one render module per route (+ admin/ subfolder)
└── server/
    ├── server.js
    ├── config/         database & Stripe setup
    ├── models/          9 Mongoose schemas
    ├── controllers/     business logic per resource
    ├── routes/           REST endpoints
    ├── middleware/       auth, admin guard, error handling
    └── utils/            slot-generation engine, validators
```

---

## 🖼 Screens

*Home · Booking wizard · Shop · Admin dashboard — add screenshots here once deployed.*

---

<div align="center">

Built by **Mursalin Shuvo**

</div>
