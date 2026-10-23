import { api, getToken, getStoredUser } from "./api";
import { products as fallbackProducts } from "../data/products";

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: "karachi_bites_custom_products",
  ORDERS: "karachi_bites_orders_v2",
  REVIEWS: "karachi_bites_user_reviews",
  CACHED_RESTAURANT_ID: "karachi_bites_restaurant_id",
  CACHED_CATEGORIES: "karachi_bites_categories_map",
};

// Helper: Normalize product items from Backend API or local storage into UI product structure
export const normalizeProduct = (item) => {
  if (!item) return null;
  const rawCategory =
    typeof item.category === "object" && item.category !== null
      ? item.category.name
      : item.category;
  const prepTimeStr =
    typeof item.preparationTime === "number"
      ? `${item.preparationTime} min`
      : item.prep_time || item.prepTime || "15-20 min";

  return {
    id: item._id || item.id,
    title: item.name || item.title || "Untitled Dish",
    description: item.description || "",
    price: Number(item.finalPrice ?? item.price ?? 0),
    originalPrice: item.discountPrice != null ? Number(item.price) : undefined,
    category: rawCategory || "Burgers",
    rating: Number(item.rating || 4.8),
    reviewsCount: Number(item.reviewsCount || item.reviews_count || 24),
    image: item.image || item.image_url || fallbackProducts[0]?.image || "",
    badge: item.badge || (item.discountPrice != null ? "Special Offer" : ""),
    isSpicy: Boolean(item.isSpicy ?? item.is_spicy),
    isVeg: Boolean(item.isVeg ?? item.is_veg),
    prepTime: prepTimeStr,
    calories: item.calories || "650 kcal",
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients
      : typeof item.ingredients === "string"
        ? item.ingredients.split(",").map((s) => s.trim())
        : [],
    addons: Array.isArray(item.addons) ? item.addons : [],
    inStock: item.isAvailable !== false && item.in_stock !== false && item.inStock !== false,
  };
};

// Helper: Normalize order structure for frontend
export const normalizeOrder = (o) => {
  if (!o) return null;
  const orderId =
    o.orderNumber ||
    o.order_id ||
    o.orderId ||
    o._id ||
    `KB-${Date.now().toString(36).toUpperCase()}`;
  const addressStr =
    typeof o.deliveryAddress === "object" && o.deliveryAddress !== null
      ? `${o.deliveryAddress.address || ""}${o.deliveryAddress.city ? `, ${o.deliveryAddress.city}` : ""}`
      : o.address || "";

  const subtotal = Number(o.subtotal || o.billSummary?.subtotal || 0);
  const deliveryFee = Number(o.deliveryFee || o.delivery_fee || o.billSummary?.deliveryFee || 0);
  const discountAmount = Number(o.discount || o.billSummary?.discountAmount || 0);
  const grandTotal = Number(
    o.total ||
      o.grand_total ||
      o.billSummary?.grandTotal ||
      subtotal + deliveryFee - discountAmount,
  );

  return {
    ...o,
    id: o._id || o.id,
    orderId,
    name: o.user?.name || o.customer_name || o.name || "Customer",
    phone: o.phone || "",
    email: o.user?.email || o.email || "",
    area: o.deliveryAddress?.city || o.area || "Karachi",
    address: addressStr,
    deliveryNotes: o.notes || o.delivery_notes || o.deliveryNotes || "",
    paymentMethod: o.paymentMethod || o.payment_method || "cod",
    status: o.orderStatus || o.status || "pending",
    items: Array.isArray(o.items)
      ? o.items.map((it) => ({
          id: it.menuItem?._id || it.menuItem || it.id,
          title: it.name || it.title,
          price: Number(it.price || 0),
          qty: Number(it.quantity || it.qty || 1),
          subtotal: Number(it.subtotal || it.price * (it.quantity || it.qty || 1)),
          addons: it.addons || it.selectedAddons || [],
        }))
      : [],
    billSummary: {
      subtotal,
      deliveryFee,
      discountAmount,
      grandTotal,
    },
    createdAt: o.createdAt || o.created_at || new Date().toISOString(),
  };
};

export const apiService = {
  // ==========================================
  // 1. PRODUCTS & MENU
  // ==========================================
  async getActiveRestaurantId() {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.CACHED_RESTAURANT_ID);
      if (cached) return cached;

      const res = await api.restaurants.list({ limit: 10 });
      const restaurants = res?.data || [];
      const kb =
        restaurants.find((r) => r.name.toLowerCase().includes("karachi bites")) || restaurants[0];
      if (kb?._id) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.CACHED_RESTAURANT_ID, kb._id);
        return kb._id;
      }
    } catch (err) {
      console.warn("Could not fetch restaurants from backend:", err.message);
    }
    return null;
  },

  async getProducts() {
    // 1. Try Backend API first
    try {
      const restaurantId = await this.getActiveRestaurantId();
      if (restaurantId) {
        const res = await api.menu.listByRestaurant(restaurantId, { limit: 100 });
        const items = res?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          const normalized = items.map(normalizeProduct);
          localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (err) {
      console.warn("Backend API menu fetch failed, falling back to cache:", err.message);
    }

    // 2. Try LocalStorage custom cache
    try {
      const customSaved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      if (customSaved) {
        const parsed = JSON.parse(customSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProduct);
        }
      }
    } catch (e) {
      console.warn("Could not read local custom products:", e);
    }

    // 3. Static fallback
    return fallbackProducts.map(normalizeProduct);
  },

  async addProduct(product) {
    const formatted = {
      title: (product.title || product.name || "").trim(),
      price: Number(product.price || 0),
      description: product.description || "",
      category: product.category || "Burgers",
      rating: Number(product.rating || 5.0),
      image: product.image || fallbackProducts[0]?.image || "",
      isSpicy: Boolean(product.isSpicy),
      isVeg: Boolean(product.isVeg),
      prepTime: product.prepTime || "15 min",
      inStock: true,
      ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
    };

    // Try Backend API
    try {
      const restaurantId = await this.getActiveRestaurantId();
      if (restaurantId) {
        // Find or map category
        const catRes = await api.categories.list(restaurantId);
        const cats = catRes?.data || [];
        let cat = cats.find((c) => c.name.toLowerCase() === formatted.category.toLowerCase());
        if (!cat && cats.length > 0) {
          cat = cats[0];
        }

        if (cat?._id) {
          const created = await api.menu.create(restaurantId, {
            name: formatted.title,
            description: formatted.description,
            price: formatted.price,
            category: cat._id,
            image: formatted.image,
            ingredients: formatted.ingredients,
            preparationTime: parseInt(formatted.prepTime, 10) || 15,
          });

          if (created?.data) {
            const norm = normalizeProduct(created.data);
            const current = await this.getProducts();
            localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify([norm, ...current]));
            return norm;
          }
        }
      }
    } catch (err) {
      console.warn("Backend add product failed, saving locally:", err.message);
    }

    // Local fallback
    const fallbackItem = {
      ...formatted,
      id: `custom_${Date.now()}`,
    };
    const norm = normalizeProduct(fallbackItem);
    try {
      const current = await this.getProducts();
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify([norm, ...current]));
    } catch (e) {
      console.error("Local add product save error:", e);
    }
    return norm;
  },

  async updateProduct(id, updates) {
    // Try Backend API
    try {
      if (typeof id === "string" && id.length === 24 && !id.startsWith("custom_")) {
        const payload = {};
        if (updates.title || updates.name) payload.name = updates.title || updates.name;
        if (updates.price != null) payload.price = Number(updates.price);
        if (updates.description != null) payload.description = updates.description;
        if (updates.image != null) payload.image = updates.image;
        if (updates.ingredients != null) payload.ingredients = updates.ingredients;
        if (updates.inStock != null) payload.isAvailable = Boolean(updates.inStock);
        if (updates.prepTime != null)
          payload.preparationTime = parseInt(updates.prepTime, 10) || 15;

        const res = await api.menu.update(id, payload);
        if (res?.data) {
          const norm = normalizeProduct(res.data);
          const current = await this.getProducts();
          const updated = current.map((p) => (String(p.id) === String(id) ? norm : p));
          localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
          return norm;
        }
      }
    } catch (err) {
      console.warn("Backend update product error, falling back to local:", err.message);
    }

    // Local update
    try {
      const current = await this.getProducts();
      const updated = current.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return updated.find((p) => String(p.id) === String(id)) || null;
    } catch (e) {
      console.error("Local update product error:", e);
      return null;
    }
  },

  async deleteProduct(id) {
    try {
      if (typeof id === "string" && id.length === 24 && !id.startsWith("custom_")) {
        await api.menu.delete(id);
      }
    } catch (err) {
      console.warn("Backend delete product error:", err.message);
    }

    try {
      const current = await this.getProducts();
      const updated = current.filter((p) => String(p.id) !== String(id));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
      return true;
    } catch {
      return true;
    }
  },

  async seedDefaultProducts() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(fallbackProducts));
      return fallbackProducts.length;
    } catch {
      return fallbackProducts.length;
    }
  },

  // ==========================================
  // 2. ORDERS
  // ==========================================
  async getOrders() {
    let remoteOrders = [];
    const token = getToken();
    const user = getStoredUser();

    if (token) {
      try {
        if (user?.role === "admin") {
          const res = await api.orders.adminOrders({ limit: 50 });
          remoteOrders = res?.data || [];
        } else if (user?.role === "restaurant_admin") {
          const restaurantId = await this.getActiveRestaurantId();
          if (restaurantId) {
            const res = await api.orders.restaurantOrders(restaurantId, { limit: 50 });
            remoteOrders = res?.data || [];
          }
        } else {
          const res = await api.orders.myOrders({ limit: 50 });
          remoteOrders = res?.data || [];
        }
      } catch (err) {
        console.warn("Backend fetch orders failed:", err.message);
      }
    }

    let localOrders = [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
      localOrders = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Local orders read error:", e);
    }

    const map = new Map();
    // Remote orders
    remoteOrders.forEach((o) => {
      const norm = normalizeOrder(o);
      if (norm?.orderId) map.set(norm.orderId, norm);
    });
    // Local orders
    localOrders.forEach((o) => {
      const norm = normalizeOrder(o);
      if (norm?.orderId && !map.has(norm.orderId)) {
        map.set(norm.orderId, norm);
      }
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return combined;
  },

  async placeOrder(orderData) {
    const orderId = orderData.orderId || `KB-${Date.now().toString(36).toUpperCase()}`;
    const normalized = normalizeOrder({
      ...orderData,
      orderId,
      createdAt: new Date().toISOString(),
    });

    // Try backend order placement if authenticated customer
    const token = getToken();
    const user = getStoredUser();
    if (token && user?.role === "customer") {
      try {
        // Backend order creation via customer cart
        const restaurantId = await this.getActiveRestaurantId();
        if (restaurantId) {
          await api.cart.clear().catch(() => {});
          for (const item of normalized.items) {
            if (item.id && typeof item.id === "string" && item.id.length === 24) {
              await api.cart
                .addItem({ menuItemId: item.id, quantity: item.qty || 1 })
                .catch(() => {});
            }
          }

          const res = await api.orders.create({
            deliveryAddress: {
              address: normalized.address || "Street Address",
              city: normalized.area || "Karachi",
            },
            phone: normalized.phone || "+923000000000",
            notes: normalized.deliveryNotes || "",
            paymentMethod: "cash",
          });

          if (res?.data) {
            const serverOrder = normalizeOrder(res.data);
            this.saveLocalOrder(serverOrder);
            return serverOrder;
          }
        }
      } catch (err) {
        console.warn("Backend order placement fallback to local storage:", err.message);
      }
    }

    // Save locally
    this.saveLocalOrder(normalized);
    return normalized;
  },

  saveLocalOrder(order) {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
      const existing = saved ? JSON.parse(saved) : [];
      const filtered = existing.filter(
        (o) => (o.orderId || o.orderNumber) !== (order.orderId || order.orderNumber),
      );
      const updated = [order, ...filtered];
      localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save local order:", e);
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    // Try Backend API
    try {
      const token = getToken();
      if (token) {
        const all = await this.getOrders();
        const found = all.find((o) => o.orderId === orderId || o.id === orderId);
        const backendId = found?.id || orderId;
        if (typeof backendId === "string" && backendId.length === 24) {
          await api.orders.updateStatus(backendId, newStatus);
        }
      }
    } catch (err) {
      console.warn("Backend order status update error:", err.message);
    }

    // Update local storage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
      if (saved) {
        const orders = JSON.parse(saved);
        const updated = orders.map((o) =>
          o.orderId === orderId || o.order_id === orderId || o.id === orderId
            ? { ...o, status: newStatus, orderStatus: newStatus }
            : o,
        );
        localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      }
      return true;
    } catch {
      return false;
    }
  },

  clearLocalOrderHistory() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ORDERS);
      return true;
    } catch {
      return false;
    }
  },

  subscribeToOrders(callback) {
    if (!callback) return () => {};

    // Live order polling every 10 seconds to keep order status in sync
    const interval = setInterval(async () => {
      try {
        if (typeof document !== "undefined" && document.hidden) return;
        const orders = await this.getOrders();
        callback({ event: "UPDATE", orders });
      } catch (e) {
        // silent catch
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  },

  // ==========================================
  // 3. REVIEWS
  // ==========================================
  async getReviews() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not read local reviews:", e);
    }

    const defaultReviews = [
      {
        id: "rev_1",
        username: "Hamza Al-Siddiq",
        rating: 5.0,
        review:
          "The Karachi Fire Krunch Burger is unbeatable in Karachi. Crispy, spicy and delivered steaming hot in 20 minutes!",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
        date: "2 hours ago",
      },
      {
        id: "rev_2",
        username: "Ayesha Tariq",
        rating: 5.0,
        review:
          "Best Lebanese Shawarma platter in Clifton. The garlic toum sauce is authentic and rich.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        date: "5 hours ago",
      },
      {
        id: "rev_3",
        username: "Bilal Chaudhry",
        rating: 4.8,
        review:
          "Loaded Truffle Parmesan Fries were incredible. Generous portions and very fast delivery.",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80",
        date: "Yesterday",
      },
    ];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(defaultReviews));
    } catch {
      // ignore
    }
    return defaultReviews;
  },

  async deleteReview(reviewId) {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.REVIEWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((r) => String(r.id) !== String(reviewId));
        localStorage.setItem(LOCAL_STORAGE_KEYS.REVIEWS, JSON.stringify(filtered));
      }
      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 4. BACKEND HEALTH
  // ==========================================
  async checkBackendHealth() {
    try {
      const res = await api.health.check();
      return {
        connected: res?.success === true,
        data: res?.data,
        url: api.baseUrl,
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message,
        url: api.baseUrl,
      };
    }
  },
};

// Aliases for clean backward compatibility
export const supabaseService = apiService;
