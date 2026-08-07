<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,6,12,20&height=220&section=header&text=Lumi%C3%A8re%20Salon%20%26%20Spa&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Booking%20%2B%20E-commerce%20%2B%20Admin%2C%20built%20from%20scratch&descAlignY=58&descSize=18&animation=fadeIn" width="100%" alt="Lumière Salon & Spa banner" />

<br/>

[![Live Site](https://img.shields.io/badge/🌐_LIVE_SITE-Visit_Now-FF6B9D?style=for-the-badge&labelColor=1a1a2e)](https://lumiere-salon-frontend.onrender.com)
[![Live API](https://img.shields.io/badge/⚡_LIVE_API-Explore-4EA8DE?style=for-the-badge&labelColor=1a1a2e)](https://lumiere-salon-backend.onrender.com)
[![License](https://img.shields.io/badge/LICENSE-MIT-FFD23F?style=for-the-badge&labelColor=1a1a2e)](#)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)

<br/>

### 🪞 Real-time booking &nbsp;·&nbsp; 🛍️ Full e-commerce &nbsp;·&nbsp; 💳 Live Stripe payments &nbsp;·&nbsp; 📊 Full admin console

<br/>

**[✨ Features](#-features)** &nbsp;•&nbsp;
**[🧱 Tech Stack](#-tech-stack)** &nbsp;•&nbsp;
**[🏗 Architecture](#-architecture)** &nbsp;•&nbsp;
**[⚡ Getting Started](#-getting-started)** &nbsp;•&nbsp;
**[🔌 API](#-api-overview)** &nbsp;•&nbsp;
**[🖼 Screens](#-screens)**

</div>

<br/>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## 💫 Overview

<table>
<tr>
<td width="60%" valign="top">

Lumière is a **production-style web platform** for a salon & spa business — covering everything
the business actually needs to run online: a marketing site, real-time appointment booking with
staff & time-slot availability, a retail product shop, secure card payments, customer accounts,
and a complete admin dashboard for day-to-day operations.

It's built as a **single-page vanilla JavaScript frontend** talking to a **Node.js/Express REST
API** backed by **MongoDB**, with **Stripe** handling every payment. No framework, no bundler, no
build step on the client — just clean, dependency-free JavaScript doing real work.

> 💡 **One codebase, any service business.** Same architecture works for clinics, gyms, studios,
> tuition centers — swap the data, keep the engine.

</td>
<td width="40%" valign="top">

```
     ╭──────────────╮
     │   💇 Salon   │
     │   🛍️ Shop    │
     │   💳 Pay     │
     │   📊 Admin   │
     ╰──────────────╯
   Four apps. One codebase.
```

</td>
</tr>
</table>

<br/>

## 🚀 Features

<table>
<tr>
<td valign="top" width="50%">

### 🎀 Customer-facing

- 🏠 **Landing experience** — hero, service highlights, "how it works", stylist team, before/after
  gallery with lightbox, review carousel, membership tiers, shop preview, location & hours
- 🔍 **Service catalog** — category / price / duration filters + detail modal per service
- 🗓️ **5-step booking wizard** — services & add-ons → stylist (or *any available*) → real-time
  date & time slots → your details + coupon → review & pay (deposit / full / at-venue)
- 🛒 **Retail shop** — filterable product grid, variants, stock-aware pages, persistent cart
  drawer with free-shipping progress bar, 3-step checkout
- 👤 **Customer accounts** — appointments (reschedule / cancel / rebook), order history, loyalty
  points, saved addresses, profile settings
- 🔐 **Secure checkout** — Stripe Elements with 3D Secure, full guest-checkout support

</td>
<td valign="top" width="50%">

### 🛠️ Admin console

- 📈 **Dashboard** — live KPIs, month-over-month revenue delta, 12-month trend chart, today's
  schedule, recent-activity feed
- 📅 **Appointments** — filterable list + calendar view, status pipeline (pending → confirmed →
  completed / no-show / cancelled), reschedule, internal notes
- ✂️ **Services, staff & inventory** — full CRUD, working-hours & leave management, per-service
  staff assignment, low-stock alerts
- 💰 **Orders, customers & payments** — status/tracking pipeline, searchable customer directory
  with spend history, refunds, CSV export, coupon management

</td>
</tr>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## 🧱 Tech Stack

<div align="center">

| Layer | Technology | Why |
|:---:|:---:|:---|
| 🎨 **Frontend** | ![JS](https://img.shields.io/badge/-Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | No build tooling, no lock-in, deployable anywhere |
| 🧭 **Routing** | Hash-based SPA router | Route guards for public / guest / customer / admin |
| ⚙️ **Backend** | ![Node](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white) | Battle-tested, minimal, fast |
| 🗄️ **Database** | ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) + Mongoose | Flexible schema for a fast-moving domain |
| 🔑 **Auth** | JWT + bcrypt | Stateless, industry-standard |
| 💳 **Payments** | ![Stripe](https://img.shields.io/badge/-Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white) | PaymentIntents, Elements, signed webhooks |
| 📊 **Charts** | ![Chart.js](https://img.shields.io/badge/-Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white) | Revenue trend visualization |

</div>

> **Why vanilla JS on the frontend?** Every interaction — state, rendering, routing — is
> hand-rolled and transparent, not hidden behind a framework's abstraction.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│              🌐 Browser (SPA)                │
│                                               │
│  STATE ──────  global app state, single      │
│                source of truth               │
│  Router ─────  hash routing + role guards    │
│  Pages ──────  render fn per route           │
│  API client ─  typed fetch wrapper           │
└───────────────────┬───────────────────────────┘
                     │  HTTPS / JSON
                     ▼
┌─────────────────────────────────────────────┐
│         ⚙️  Node.js + Express API             │
│                                               │
│  routes/ ────  URL → controller mapping      │
│  controllers/  business logic                │
│  models/ ────  Mongoose schemas              │
│  middleware/   auth · admin guard · errors   │
└──────┬────────────────────────────┬───────────┘
       │                            │
       ▼                            ▼
┌───────────────┐          ┌────────────────────┐
│  🗄️ MongoDB    │          │  💳 Stripe          │
│  users, svcs,  │          │  PaymentIntents,    │
│  staff, appts, │          │  Elements, signed   │
│  products,     │          │  webhooks           │
│  orders, pay-  │          └────────────────────┘
│  ments, etc.   │
└───────────────┘
```

### 🧠 Design decisions worth knowing about

<table>
<tr><td>📸</td><td><b>Snapshot pattern</b> — appointments and orders store a <i>copy</i> of the service/product name and price at booking time, not just a reference. Change a price six months later and historical bookings still show what the customer actually paid.</td></tr>
<tr><td>🛡️</td><td><b>Server-verified payment amounts</b> — the frontend never tells the backend how much to charge. Every Stripe PaymentIntent amount is re-derived from the database record, closing off client-side tampering.</td></tr>
<tr><td>⚡</td><td><b>Race-condition-safe booking</b> — every appointment write re-checks for conflicts immediately before insert using a numeric time-range query, so two customers can't double-book the same slot.</td></tr>
<tr><td>🔏</td><td><b>Signed, raw-body Stripe webhooks</b> — mounted before the JSON parser, signature-verified on every event, so state only ever changes on a payment Stripe can vouch for.</td></tr>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## ⚡ Getting Started

### 🟢 Option A — Frontend only, zero setup

The client ships with realistic mock data and works completely standalone.

```bash
cd client
# open index.html with any static server, e.g. VS Code "Live Server"
```

### 🔵 Option B — Full stack

```bash
# 1️⃣ Backend
cd server
npm install
cp .env.example .env      # fill in MongoDB URI, JWT secret, Stripe keys
npm run seed               # optional: seed demo data (admin, staff, services, products...)
npm run dev

# 2️⃣ Frontend
cd client
# serve with Live Server / any static file server
```

**Environment variables** (`server/.env`):

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lumiere-salon
JWT_SECRET=replace_with_a_long_random_string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5500
```

> 💰 MongoDB Atlas' free tier and Stripe test mode are both sufficient to run the full stack at
> **zero cost**. Test with card `4242 4242 4242 4242`, any future expiry, any CVC.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## 🔌 API Overview

REST API under `/api`, JSON in and out, JWT bearer auth on protected routes.

```http
POST   /api/auth/register            POST /api/auth/login          GET  /api/auth/me
GET    /api/services                 GET  /api/staff                GET  /api/products
GET    /api/appointments/slots       POST /api/appointments         PUT  /api/appointments/:id/cancel
GET    /api/appointments  🔒admin    PUT  /api/appointments/:id/status  🔒admin
GET    /api/reviews                  POST /api/reviews              PUT  /api/reviews/:id/approve  🔒admin
POST   /api/orders                   GET  /api/orders/my
POST   /api/payments/create-intent   POST /api/webhook/stripe
POST   /api/coupons/validate
GET    /api/admin/stats  🔒admin     GET  /api/admin/revenue  🔒admin
```

Full route list lives in `server/routes/`.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## 📁 Project Structure

```
lumiere-salon/
├── client/
│   ├── index.html
│   ├── css/         🎨 design tokens, base, components, layout, admin
│   ├── js/           ⚙️ state, router, api client, auth, cart, booking, payment
│   └── pages/          📄 one render module per route (+ admin/ subfolder)
└── server/
    ├── server.js
    ├── config/         🔧 database & Stripe setup
    ├── models/          🗄️ 9 Mongoose schemas
    ├── controllers/     🧠 business logic per resource
    ├── routes/           🛣️ REST endpoints
    ├── middleware/       🛡️ auth, admin guard, error handling
    └── utils/            ⚡ slot-generation engine, demo seeder, validators
```

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

## 🖼 Screens

<div align="center">

| 🏠 Home | 🗓️ Booking Wizard |
|:---:|:---:|
| *Warm gradient hero, popular services, team, reviews* | *5-step flow with live slot availability* |
| 🛍️ Shop | 📊 Admin Dashboard |
| *Filterable grid, cart drawer, checkout* | *KPIs, revenue chart, today's schedule* |

**[→ See it live](https://lumiere-salon-frontend.onrender.com)**

</div>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.gif" width="100%" height="6px"/>

<div align="center">

### 💌 Built with care by **Mursalin Shuvo**

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,6,12,20&height=100&section=footer" width="100%"/>

</div>
