import { IconBike, IconReceipt, IconX } from "./Icons";

const paymentLabels = {
  cod: "Cash on Delivery",
  jazzcash: "JazzCash / EasyPaisa",
  card_on_delivery: "Card Machine on Delivery",
  online_card: "Paid Online",
};

const statusLabels = {
  pending: "Order received",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

export default function OrderReceiptModal({ order, isOpen, onClose, onTrackOrder, onNewOrder }) {
  if (!isOpen || !order) return null;

  const bill = order.billSummary || {};
  const subtotal = bill.subtotal ?? order.subtotal ?? 0;
  const deliveryFee = bill.deliveryFee ?? order.delivery_fee ?? 0;
  const discount = bill.discountAmount ?? order.discount ?? 0;
  const total = bill.grandTotal ?? order.grand_total ?? subtotal - discount + deliveryFee;
  const createdAt = order.createdAt || order.created_at;
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#2A211B] rounded-3xl shadow-2xl overflow-hidden animate-pop-in max-h-[92vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 bg-[#171513] text-white flex items-start justify-between border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[#C19A6B] mb-1">
              <IconReceipt className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                Karachi Bites
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">Order Confirmed</h2>
            <p className="text-xs text-white/60 mt-1">
              Thank you for ordering fresh from our kitchen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close receipt"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div className="receipt-paper p-5 sm:p-7 overflow-y-auto scroll-thin flex-1 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-dashed border-[#F5EBDD]/20">
            <div>
              <p className="text-[10px] text-[#C19A6B] uppercase font-black tracking-wider">
                Order ID
              </p>
              <p className="font-mono font-extrabold text-lg text-[#F5EBDD]">
                {order.orderId || order.order_id}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] text-[#C19A6B] uppercase font-black tracking-wider">
                Date & time
              </p>
              <p className="text-xs font-bold text-[#F5EBDD]">{formattedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] text-[#C19A6B] uppercase font-black tracking-wider mb-1">
                Customer
              </p>
              <p className="font-bold text-[#F5EBDD]">
                {order.name || order.customer_name || "Customer"}
              </p>
              <p className="text-[#C19A6B]">{order.phone || "Phone not provided"}</p>
              <p className="text-[#C19A6B] break-all">{order.email || "Email not provided"}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#C19A6B] uppercase font-black tracking-wider mb-1">
                Delivery
              </p>
              <p className="font-bold text-[#F5EBDD]">{order.area || "Karachi"}</p>
              <p className="text-[#C19A6B] leading-relaxed">
                {order.address || "Address not provided"}
              </p>
              {order.deliveryNotes && (
                <p className="text-[#D4A017] mt-1">Note: {order.deliveryNotes}</p>
              )}
            </div>
          </div>

          <div className="border-y border-[#F5EBDD]/10 py-4 space-y-2">
            <div className="flex justify-between text-[10px] text-[#C19A6B] uppercase font-black tracking-wider pb-1">
              <span>Items</span>
              <span>Amount</span>
            </div>
            {(order.items || []).map((item, index) => {
              const unitPrice = item.customUnitPrice || item.unitPrice || item.price || 0;
              return (
                <div
                  key={`${item.id || item.title}-${index}`}
                  className="flex justify-between gap-4 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#F5EBDD]">
                      {item.qty}x {item.title}
                    </p>
                    <p className="text-[10px] text-[#C19A6B]">{formatCurrency(unitPrice)} each</p>
                  </div>
                  <span className="font-bold text-[#F5EBDD] shrink-0">
                    {formatCurrency(unitPrice * item.qty)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#C19A6B]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#D4A017]">
                <span>Discount</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#C19A6B]">
              <span>Delivery charges</span>
              <span>{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t border-[#F5EBDD]/10 text-base font-extrabold text-[#F5EBDD]">
              <span>Total</span>
              <span className="text-[#D4A017]">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#2A211B]">
              <p className="text-[10px] text-[#C19A6B] uppercase font-black">Payment method</p>
              <p className="font-bold mt-1">
                {paymentLabels[order.paymentMethod] || order.paymentMethod || "Not specified"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#3B3020]">
              <p className="text-[10px] text-[#D4A017] uppercase font-black">Order status</p>
              <p className="font-bold text-[#D4A017] mt-1">
                {statusLabels[order.status] || order.status || "Order received"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#2A211B] border-t border-[#F5EBDD]/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-[#2A211B] hover:bg-gray-100 border border-[#F5EBDD]/15 text-[#F5EBDD] font-bold text-xs rounded-xl transition-colors"
          >
            Print / Save PDF
          </button>
          {onTrackOrder && (
            <button
              onClick={() => onTrackOrder(order)}
              className="flex-1 py-3 bg-[#171513] hover:bg-[#D4A017] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <IconBike className="w-4 h-4" /> Track order
            </button>
          )}
          {onNewOrder && (
            <button
              onClick={onNewOrder}
              className="flex-1 py-3 bg-[#D4A017] hover:bg-[#B98B12] text-white font-extrabold text-xs rounded-xl transition-colors"
            >
              Order more bites
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
