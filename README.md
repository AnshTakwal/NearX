# NearX - Hyperlocal Near-Expiry Deals App

NearX connects consumers with local grocery stores and supermarkets to purchase near-expiry products at heavily discounted prices, reducing food waste and saving money.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Payments**: Razorpay (Node.js/Express backend for order generation)
- **Maps**: Leaflet (for location picking and routing)

## Project Structure
- `src/api` - Supabase API calls (products, orders, addresses, stores, cart)
- `src/components` - Reusable UI components organized by domain (`customer`, `store`, `delivery`, `shared`)
- `src/context` - React Context (`AuthContext` for global state and role management)
- `src/hooks` - Custom hooks (`useAuth`, `useCart`, `useProducts`, `useOrders`, etc.)
- `src/pages` - Page components divided by user roles (`customer`, `store`, `delivery`)
- `src/utils` - Utility functions like dynamic discount calculations
- `server/` - Node.js Express server for Razorpay integration
- `database/` - SQL scripts for Supabase schema, RLS policies, and dummy data
- `scripts/` - Node.js scripts for bulk data processing, image scraping, and database seeding

## Setup Instructions

### 1. Supabase Configuration
1. Create a new Supabase project.
2. Run the SQL scripts provided in `database/complete_setup.sql` (or `schema.sql` and `rls_policies.sql`) in the Supabase SQL Editor to set up tables, triggers, and Row Level Security.
3. You can also run the seed scripts (like `database/seed_100_products.sql`) to populate initial dummy data.
4. Create a storage bucket named `product-images` and make it public.
5. Get your Supabase URL and Anon Key from Project Settings > API.

### 2. Razorpay Configuration
1. Create a Razorpay account.
2. Go to Settings > API Keys and generate test keys.

### 3. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_BACKEND_URL=http://localhost:3001
RAZORPAY_KEY_SECRET=your_razorpay_secret_key # Only needed by the node server
```

### 4. Running the Application

You need to run both the React frontend and the Express backend simultaneously.

**Terminal 1: Start the Frontend**
```bash
npm install
npm run dev
```

**Terminal 2: Start the Backend (Razorpay Server)**
```bash
cd server
npm install
npm start
```

## Features Implemented
1. **Authentication & Validation**: Role-based access (Customer, Store Owner, Delivery Partner) using Supabase Auth with robust client-side form validations (email formatting, password strength, phone numbers).
2. **Products & Dynamic Pricing**: Real-time inventory sync, advanced discount auto-calculation based on expiry date (`discountCalc.js`), and image uploads to Supabase Storage.
3. **Cart & Checkout**: `localStorage` based cart, Razorpay payment gateway integration, secure atomic stock decrement.
4. **Order Tracking**: Real-time status updates using Supabase Realtime subscriptions with visual steppers.
5. **AI Natural Language Search**: Customers can search for products intuitively using natural language queries.
6. **Store Dashboard**: Analytics (Revenue charts, Top products), comprehensive order management, and product CRUD with low-stock alerts.
7. **Delivery Dashboard**: Real-time assignment tracking, earnings calculation, and delivery history.
8. **Map Integration**: Interactive maps via Leaflet for precise store location picking during registration and delivery navigation.
