import {
  IconFlame,
  IconBike,
  IconCheckCircle,
  IconPlus,
  IconArrowRight,
  IconUtensils,
} from "../Icons";

export default function DashboardOverview({
  orders = [],
  products = [],
  onNavigateTab,
  onUpdateOrderStatus,
  onOpenAddDish,
}) {
  // Compute Key Metrics
  const totalRevenue = orders.reduce((sum, o) => {
    return sum + (o.billSummary?.grandTotal || o.grand_total || 0);
  }, 0);

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing" || o.status === "out_for_delivery",
  );
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // Category counts
  const categoryStats = {};
  products.forEach((p) => {
    categoryStats[p.category] = (categoryStats[p.category] || 0) + 1;
  });

  const recentOrders = orders.slice(0, 6);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
             New Order
          </span>
        );
      case "preparing":
        return (
          <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
             In Kitchen
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
             On The Way
          </span>
        );
      case "delivered":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
            ✓ Delivered
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-[#171513] via-[#3A3028] to-[#D4A017] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Karachi Bites Kitchen & Operations</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white">
            Restaurant Command Center
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-lg font-normal">
            Real-time management for customer orders across Karachi, kitchen production, menu
            pricing, and sales performance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={onOpenAddDish}
            className="bg-[#2A211B] text-[#171513] hover:bg-[#171513] font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <IconPlus className="w-4 h-4 text-[#D4A017]" />
            <span>Add New Dish</span>
          </button>

          <button
            onClick={() => onNavigateTab("orders")}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl border border-white/20 transition-all flex items-center gap-2"
          >
            <span>View All Orders</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Sales */}
        <div className="p-6 rounded-3xl bg-[#2A211B] border border-[#F5EBDD]/10 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#C19A6B] uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#3B3020] text-[#D4A017] flex items-center justify-center text-lg font-bold">
              Rs
            </div>
          </div>
          <p className="font-display font-extrabold text-2xl sm:text-3xl text-[#F5EBDD]">
            Rs. {totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#D4A017] font-semibold mt-1 flex items-center gap-1">
            <span>↑ Active</span> • {orders.length} total orders recorded
          </p>
        </div>

        {/* Active Kitchen Orders */}
        <div className="p-6 rounded-3xl bg-[#2A211B] border border-[#F5EBDD]/10 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#C19A6B] uppercase tracking-wider">
              Active Orders
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IconFlame className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-extrabold text-2xl sm:text-3xl text-[#D4A017]">
            {activeOrders.length}
          </p>
          <p className="text-[11px] text-[#C19A6B] font-medium mt-1">
            Pending / In Kitchen / Out for Delivery
          </p>
        </div>

        {/* Completed Deliveries */}
        <div className="p-6 rounded-3xl bg-[#2A211B] border border-[#F5EBDD]/10 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#C19A6B] uppercase tracking-wider">
              Completed
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IconCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-extrabold text-2xl sm:text-3xl text-[#D4A017]">
            {deliveredOrders.length}
          </p>
          <p className="text-[11px] text-[#C19A6B] font-medium mt-1">
            Successfully delivered to doorsteps
          </p>
        </div>

        {/* Average Order Value */}
        <div className="p-6 rounded-3xl bg-[#2A211B] border border-[#F5EBDD]/10 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#C19A6B] uppercase tracking-wider">
              Avg Order Value
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <IconUtensils className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-extrabold text-2xl sm:text-3xl text-[#F5EBDD]">
            Rs. {averageOrderValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#C19A6B] font-medium mt-1">
            {products.length} menu dishes available
          </p>
        </div>
      </div>

      {/* TWO COLUMNS: Recent Orders Table & Menu Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Recent Live Orders (8 cols) */}
        <div className="lg:col-span-8 bg-[#2A211B] rounded-3xl border border-[#F5EBDD]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F5EBDD]/10 mb-4">
            <div>
              <h3 className="font-display font-extrabold text-lg text-[#F5EBDD]">
                Recent Customer Orders
              </h3>
              <p className="text-xs text-[#C19A6B]">Manage live kitchen progression in real time</p>
            </div>

            <button
              onClick={() => onNavigateTab("orders")}
              className="text-xs font-bold text-[#D4A017] hover:underline"
            >
              Manage All →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#C19A6B]">
              No orders placed yet. Place an order on the Storefront to see it live here!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F5EBDD]/10 text-[#C19A6B] font-extrabold uppercase text-[10px]">
                    <th className="pb-3 font-extrabold">Order ID</th>
                    <th className="pb-3 font-extrabold">Customer & Zone</th>
                    <th className="pb-3 font-extrabold">Items</th>
                    <th className="pb-3 font-extrabold">Total</th>
                    <th className="pb-3 font-extrabold">Status</th>
                    <th className="pb-3 font-extrabold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBDD]/5">
                  {recentOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-[#171513] transition-colors">
                      <td className="py-3.5 font-mono font-bold text-[#F5EBDD]">{order.orderId}</td>
                      <td className="py-3.5">
                        <p className="font-bold text-[#F5EBDD]">{order.name}</p>
                        <p className="text-[10px] text-[#C19A6B]">{order.area}</p>
                      </td>
                      <td className="py-3.5">
                        <span className="font-medium text-[#F5EBDD]">
                          {order.items?.length || 0} items
                        </span>
                      </td>
                      <td className="py-3.5 font-extrabold text-[#D4A017]">
                        Rs.{" "}
                        {(order.billSummary?.grandTotal || order.grand_total || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 text-right">
                        {order.status === "pending" && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.orderId, "preparing")}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm"
                          >
                            Send to Kitchen
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.orderId, "out_for_delivery")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm"
                          >
                            Assign Rider
                          </button>
                        )}
                        {order.status === "out_for_delivery" && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.orderId, "delivered")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {order.status === "delivered" && (
                          <span className="text-[11px] text-emerald-600 font-bold">Done ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Menu Categories & Quick Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Categories card */}
          <div className="bg-[#2A211B] rounded-3xl border border-[#F5EBDD]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EBDD]/10 mb-4">
              <h3 className="font-display font-extrabold text-base text-[#F5EBDD]">
                Menu Category Mix
              </h3>
              <button
                onClick={() => onNavigateTab("menu")}
                className="text-xs font-bold text-[#D4A017] hover:underline"
              >
                Edit Menu →
              </button>
            </div>

            <div className="space-y-2.5">
              {Object.entries(categoryStats).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#2A211B]/60 text-xs font-medium"
                >
                  <span className="font-bold text-[#F5EBDD]">{cat}</span>
                  <span className="bg-[#D4A017] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {count} dishes
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Karachi Quick Links */}
          <div className="bg-[#3B3020] rounded-3xl border border-[#D4A017]/20 p-6">
            <h4 className="font-display font-bold text-sm text-[#F5EBDD] mb-2 flex items-center gap-1.5">
              <IconBike className="w-4 h-4 text-[#D4A017]" /> Express Delivery Hotlines
            </h4>
            <p className="text-xs text-[#C19A6B] leading-relaxed">
              Kitchen operating 7 days a week from 12:00 PM to 4:00 AM across Clifton, DHA, Gulshan,
              PECHS, and Johar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
