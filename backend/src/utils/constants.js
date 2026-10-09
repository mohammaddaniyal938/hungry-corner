const ROLES = { CUSTOMER: 'customer', RESTAURANT_ADMIN: 'restaurant_admin', ADMIN: 'admin' };

const ORDER_STATUS = [
  'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected',
];
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS = ['cash', 'card'];

// Allowed status transitions (staff). Anything not listed is rejected.
const ORDER_TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

// Statuses from which a customer may cancel their own order.
const CUSTOMER_CANCELLABLE = ['pending', 'confirmed'];

module.exports = {
  ROLES, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, ORDER_TRANSITIONS, CUSTOMER_CANCELLABLE,
};
