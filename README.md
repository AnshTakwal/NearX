# NearX - Hyperlocal Near-Expiry Deals App

NearX connects consumers with local grocery stores and supermarkets to purchase near-expiry products at heavily discounted prices, reducing food waste and saving money.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Payments**: Razorpay (Node.js/Express backend for order generation)

## Project Structure
- `src/api` - Supabase API calls (products, orders, addresses, stores, cart)
- `src/components` - Reusable UI components (Navbar, ProductCard, Toast, ProtectedRoute)
- `src/context` - React Context (AuthContext for global state)
- `src/hooks` - Custom hooks (`useAuth`, `useCart`, `useProducts`, `useOrders`)
- `src/pages` - Page components divided by user roles (customer, store, delivery)
- `server/` - Node.js Express server for Razorpay integration

## Setup Instructions

### 1. Supabase Configuration
1. Create a new Supabase project.
2. Run the SQL scripts provided in `database/schema.sql` and `database/rls_policies.sql` in the Supabase SQL Editor to set up tables, triggers, and Row Level Security.
3. Create a storage bucket named `product-images` and make it public.
4. Get your Supabase URL and Anon Key from Project Settings > API.

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
1. **Authentication**: Role-based access (Customer, Store Owner, Delivery Partner) using Supabase Auth.
2. **Products**: Real-time inventory sync, discount auto-calculation based on expiry date, image uploads to Supabase Storage.
3. **Cart & Checkout**: `localStorage` based cart, Razorpay payment gateway integration, secure atomic stock decrement.
4. **Order Tracking**: Real-time status updates using Supabase Realtime subscriptions.
5. **Store Dashboard**: Analytics, order management, and product CRUD.
6. **Delivery Dashboard**: Real-time assignment tracking, maps navigation, and earnings calculation.
