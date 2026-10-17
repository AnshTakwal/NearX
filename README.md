# NearX - Hyperlocal Near-Expiry Deals App

NearX connects consumers with local grocery stores and supermarkets to purchase near-expiry products at heavily discounted prices, reducing food waste and saving money.

🔗 **Live Application**: [https://near-x-eight.vercel.app](https://near-x-eight.vercel.app)

---

## Architecture Overview

NearX is organized into three primary layers:

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│      (Vite + Tailwind CSS + Lucide Icons + Leaflet)     │
│  - Client-side localStorage Cart                       │
│  - Role-based UX (Customer, Store Owner, Delivery)     │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼ Direct Client Calls      ▼ Server-side Requests
┌──────────────────────────────┐  ┌──────────────────────────────┐
│       Supabase Backend       │  │   Serverless API / Express   │
│  - PostgreSQL with RLS       │  │   (/api & /server)           │
│  - Supabase Auth & Storage   │  │  - /api/search-keywords      │
│  - Realtime Subscriptions    │  │    (Gemini AI keyword search)│
│  - place_order (Atomic RPC)  │  │  - /api/delivery-status      │
└──────────────────────────────┘  │    (Privileged status update)│
                                  └──────────────────────────────┘
```

1. **Frontend**: React 19 single-page application built with Vite and Tailwind CSS. Directly manages client-side cart storage (`localStorage`), interactive store/delivery map picking with Leaflet, and connects directly to Supabase with Row Level Security (RLS).
2. **Serverless API (`/api`) & Express Server (`/server`)**:
   - `search-keywords`: Proxies AI queries to Google Gemini securely server-side without exposing keys to the client bundle, complete with in-memory rate limiting.
   - `delivery-status`: Secure endpoint using Supabase service role privileges to transition delivery partner order states.
3. **Database (`Supabase PostgreSQL`)**:
   - Relational schema enforcing strict Row Level Security (RLS).
   - Atomic checkout via `place_order` stored procedure locking inventory, re-validating prices server-side, and rolling back if stock is depleted.

---

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Framer Motion, Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime Subscriptions)
- **APIs & Middleware**: Node.js Express (`/server`) and Vercel Serverless Functions (`/api`)
- **AI / Search**: Google Gemini API (Server-side keyword extraction)
- **Maps**: Leaflet & React-Leaflet (Store location picking & routing)

---

## Project Structure
- `src/api/` - Supabase client calls (`products`, `orders`, `addresses`, `stores`)
- `src/components/` - Reusable UI components by domain (`customer`, `store`, `delivery`, `shared`)
- `src/context/` - React Context (`AuthContext` for global session and role management)
- `src/hooks/` - Custom hooks (`useAuth`, `useCart`, `useProducts`, `useOrders`, etc.)
- `src/pages/` - Views partitioned by role (`customer`, `store`, `delivery`)
- `src/utils/` - Utility logic (dynamic discount calculation, formatters)
- `api/` - Vercel serverless handlers (`search-keywords.js`, `delivery-status.js`)
- `server/` - Express server mirroring serverless endpoints for local dev and node environments
- `database/` - PostgreSQL migration scripts, RLS policies, seed files, and automated tests
- `scripts/` - Auxiliary scripts for seeding, database maintenance, and image syncing

---

## Setup Instructions

### 1. Supabase Configuration
1. Create a project on [Supabase](https://supabase.com).
2. Run `database/complete_setup.sql` (or `database/schema.sql` and `database/rls_policies.sql`) in the Supabase SQL Editor to set up tables, triggers, and Row Level Security.
3. Apply migration `database/migrations/20261017_place_order_transaction.sql` to install the atomic `place_order` RPC function.
4. (Optional) Run `database/seed_100_products.sql` to populate sample stores and products.
5. Create a public storage bucket named `product-images`.
6. Retrieve your Project URL and Anon Key from Project Settings > API.

### 2. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
# Client-side (Vite)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:3001

# Server-side only (never exposed to browser)
GEMINI_API_KEY=your_gemini_api_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Running the Application

**Option A: Running Frontend with Vercel CLI (matches production)**
```bash
npm install
vercel dev
```

**Option B: Running Vite Frontend + Express Backend Separately**

*Terminal 1: Start Frontend*
```bash
npm install
npm run dev
```

*Terminal 2: Start Backend API*
```bash
cd server
npm install
npm start
```

---

## Features Implemented
1. **Authentication & Validation**: Role-based access control (Customer, Store Owner, Delivery Partner) with Supabase Auth.
2. **Products & Dynamic Pricing**: Real-time inventory sync, automated discount calculation based on expiry date (`discountCalc.js`), and image uploads to Supabase Storage.
3. **Cart & Transactional Checkout**: Client-side `localStorage` shopping cart with atomic transactional checkout via PostgreSQL `place_order` function (verifies stock with row locks, recomputes prices, decrements inventory safely).
4. **Order Tracking**: Real-time status updates using Supabase Realtime subscriptions with visual progress steppers.
5. **AI Natural Language Search**: Server-side Google Gemini keyword extraction to parse shopper intent and price limits safely without exposing API keys.
6. **Store Dashboard**: Analytics (revenue charts, sales trends), inventory management, and product CRUD with low-stock alerts.
7. **Delivery Dashboard**: Real-time assignment tracking, status updates, and delivery history.
8. **Interactive Maps**: Leaflet integration for store coordinates selection during onboarding and delivery navigation.

---

## Roadmap
- **Online payments (Razorpay)** - planned; currently orders are created with `payment_status = 'pending'` (cash/pay-on-delivery flow).
- Automated SMS/WhatsApp notifications for order updates.
- Customer review and rating system for stores and products.
