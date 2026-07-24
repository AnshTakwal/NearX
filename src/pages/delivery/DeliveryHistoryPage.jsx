import React from "react";
import { Truck, Loader2, Package, MapPin, Store, User, ChevronLeft, TrendingUp, IndianRupee } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrders } from "../../hooks/useOrders";

/**
 * Formats a delivery address from an addresses object.
 */
function formatAddress(addresses) {
  if (!addresses) return "Address unavailable";
  const parts = [addresses.address_line, addresses.city, addresses.pincode].filter(Boolean);
  return parts.join(", ") || "Address unavailable";
}

export default function DeliveryHistoryPage() {
  const { deliveryHistory, loading, error } = useOrders();

  // Running total: sum of delivery_assignments.earnings (the flat Rs.40 fee per delivery)
  const totalEarnings = deliveryHistory.reduce((sum, row) => sum + (row.earnings || 0), 0);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex items-center justify-center bg-[#F7F8FA]">
        <Loader2 className="w-10 h-10 text-[#0097A7] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center bg-[#F7F8FA] px-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-[#0097A7] font-medium hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F8FA] min-h-screen pb-16">
      {/* Page header with earnings summary */}
      <div className="bg-gray-900 text-white w-full shadow-md">
        <div className="container-premium px-6 py-8">
          <Link
            to="/delivery/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium mb-5"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Earnings History</p>
              <h1 className="text-2xl md:text-3xl font-bold">My Deliveries</h1>
              <p className="text-gray-400 text-sm mt-1">
                {deliveryHistory.length} completed {deliveryHistory.length === 1 ? "delivery" : "deliveries"}
              </p>
            </div>

            {/* Total earnings card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#0097A7]/30 flex items-center justify-center text-[#00BCD4]">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Earned</p>
                <p className="text-2xl font-bold text-[#00BCD4]">Rs.{(totalEarnings / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-premium px-6 py-8">
        {deliveryHistory.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E0F7FA] flex items-center justify-center text-[#0097A7] mb-4">
              <Truck size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No deliveries yet</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Your completed deliveries will appear here once you finish your first drop-off.
            </p>
            <Link
              to="/delivery/dashboard"
              className="mt-6 btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              <Package size={16} />
              View Available Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveryHistory.map((row) => {
              const order = row.orders;
              const deliveredDate = row.delivered_at
                ? new Date(row.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : new Date(order?.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              const deliveredTime = row.delivered_at
                ? new Date(row.delivered_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "";
              const earning = row.earnings || 0;      // paise — delivery partner cut
              const orderTotal = order?.total || 0;   // paise — what customer paid

              return (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-[#0097A7]/30 transition-all"
                >
                  {/* Cyan top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-[#0097A7] to-[#00BCD4]" />

                  <div className="p-6 md:p-8">
                    {/* Date + earning row */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Delivered</p>
                        <p className="font-bold text-gray-900">
                          {deliveredDate}{deliveredTime ? ` · ${deliveredTime}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Your Earning</p>
                        <p className="text-xl font-bold text-green-600">+Rs.{(earning / 100).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5 border-t border-gray-100">
                      {/* Store */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E0F7FA] flex items-center justify-center text-[#0097A7] shrink-0 mt-0.5">
                          <Store size={15} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Pickup Store</p>
                          <p className="font-semibold text-gray-900 text-[15px]">{order?.stores?.name ?? "—"}</p>
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                          <User size={15} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Customer</p>
                          <p className="font-semibold text-gray-900 text-[15px]">{order?.profiles?.full_name ?? "—"}</p>
                        </div>
                      </div>

                      {/* Delivery address */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                          <MapPin size={15} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Delivered To</p>
                          <p className="font-semibold text-gray-900 text-[15px] leading-snug">{formatAddress(order?.addresses)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order total footer */}
                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <p className="text-xs text-gray-400 font-medium">
                        Order value (customer paid)
                      </p>
                      <p className="text-gray-600 font-semibold text-sm">
                        Rs.{(orderTotal / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
