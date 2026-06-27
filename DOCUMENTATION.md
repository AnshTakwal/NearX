# NearX Project Documentation

## Overview
NearX is a modern grocery and delivery marketplace application that combines product browsing, cart management, order tracking, store management, and delivery workflows in a single experience.

## Tech Stack
### Frontend
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- Leaflet + React Leaflet
- Recharts
- Lucide React

### Backend / APIs
- Node.js
- Express-style server setup under the server folder
- Supabase for data storage and authentication-related workflows
- Vercel serverless API routes in the api folder

### Development Tools
- npm
- Vite build system
- Vercel deployment configuration

## Project Structure
- src/ - main frontend application source
  - components/ - reusable UI components by role
  - pages/ - route-based application pages
  - hooks/ - custom React hooks
  - context/ - authentication and shared state
  - lib/ - third-party integrations and helpers
  - api/ - frontend API integration modules
  - utils/ - utility helpers
- api/ - serverless API handlers
- server/ - backend server entry points
- database/ - SQL schema and setup scripts

## Main Features
### Customer Experience
- Browse products and view product details
- Search for products and filter by category/price/expiry
- Add items to cart
- View and manage cart
- Place orders and track order status
- View order history
- Access customer profile information

### Store Owner Features
- Add and manage products
- View store dashboard and analytics
- Manage incoming store orders
- Monitor product listings and inventory-related data

### Delivery Features
- View assigned delivery orders
- Track delivery-related tasks
- Manage delivery workflow

### UI/UX Features
- Responsive design
- Role-based navigation and views
- Reusable cards, badges, countdowns, and progress UI
- Map-based picker and viewer components
- Toast notifications and consistent shared components

## Data & Integrations
- Supabase integration for database-backed features
- Search and recommendation-style filtering logic
- Location and map support via Leaflet
- Notification and cart/order modules through frontend APIs

## Deployment
- Configured for Vercel deployment
- Frontend built with Vite
- Serverless API endpoints supported in the api folder

## Notes
This project is structured as a multi-role marketplace application with separate experiences for customers, store owners, and delivery personnel.
