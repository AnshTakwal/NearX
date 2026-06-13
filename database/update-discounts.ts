// supabase/functions/update-discounts/index.ts
// =============================================
// NearX Discount Cron Job — Supabase Edge Function
// Runs daily at midnight IST (18:30 UTC previous day)
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Product {
  id: string;
  expiry_date: string;
  mrp: number;
}

function calcDiscount(daysLeft: number): { discount: number; status: string; isActive: boolean } {
  if (daysLeft <= 0)   return { discount: 60, status: "expired",     isActive: false };
  if (daysLeft < 7)    return { discount: 60, status: "last_chance", isActive: true };
  if (daysLeft <= 15)  return { discount: 40, status: "buy_soon",    isActive: true };
  if (daysLeft <= 30)  return { discount: 25, status: "active",      isActive: true };
  return                       { discount: 10, status: "active",      isActive: true };
}

Deno.serve(async (_req) => {
  try {
    console.log("🔄 Starting discount update job...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all products that are still potentially active
    const { data: products, error } = await supabase
      .from("products")
      .select("id, expiry_date, mrp")
      .eq("status", "expired")  // exclude already expired
      .not("status", "eq", "expired"); // get everything except expired

    // Corrected query — fetch non-expired products
    const { data: activeProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, expiry_date, mrp")
      .neq("status", "expired");

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    let updated = 0;
    let expired = 0;

    for (const product of (activeProducts as Product[])) {
      const expiryDate = new Date(product.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      const diffMs = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const { discount, status, isActive } = calcDiscount(daysLeft);
      const salePrice = Math.round(product.mrp - (product.mrp * discount) / 100);

      const { error: updateError } = await supabase
        .from("products")
        .update({
          discount_percent: discount,
          sale_price: salePrice,
          status: status,
          is_active: isActive,
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(`Failed to update product ${product.id}: ${updateError.message}`);
        continue;
      }

      if (status === "expired") expired++;
      updated++;
    }

    const summary = `✅ Done. Updated ${updated} products, ${expired} marked expired.`;
    console.log(summary);

    return new Response(JSON.stringify({ success: true, message: summary }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ Cron job failed:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// =============================================
// HOW TO REGISTER THE CRON SCHEDULE
// =============================================
//
// Option 1: Using pg_cron (via Supabase SQL Editor)
// Enable pg_cron extension first:
//
//   CREATE EXTENSION IF NOT EXISTS pg_cron;
//
//   SELECT cron.schedule(
//     'update-product-discounts',    -- job name
//     '30 18 * * *',                 -- every day at 18:30 UTC = midnight IST
//     $$
//       SELECT net.http_post(
//         url := 'https://<your-project>.supabase.co/functions/v1/update-discounts',
//         headers := jsonb_build_object(
//           'Authorization', 'Bearer ' || '<SUPABASE_SERVICE_ROLE_KEY>',
//           'Content-Type', 'application/json'
//         ),
//         body := '{}'
//       );
//     $$
//   );
//
// Option 2: Using Supabase Dashboard
//   1. Go to Database → Extensions → Enable pg_cron and pg_net
//   2. Go to Database → Cron Jobs
//   3. Add new job with schedule: 30 18 * * *
//   4. Set the HTTP request to POST your edge function URL
//
// Deploy the function:
//   supabase functions deploy update-discounts --no-verify-jwt
