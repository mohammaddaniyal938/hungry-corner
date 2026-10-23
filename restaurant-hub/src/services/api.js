/**
 * Karachi Bites REST API Client
 * Connects frontend to Express + MongoDB Backend
 */

const API_BASE = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const TOKEN_KEY = "karachi_bites_jwt";
const USER_KEY = "karachi_bites_user";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn("Could not save token to localStorage:", e);
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn("Could not remove token:", e);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.warn("Could not save user to localStorage:", e);
  }
}

export function removeStoredUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn("Could not remove user:", e);
  }
}

/**
 * Core fetch wrapper with auth header injection & unified error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers = new Headers(options.headers || {});

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (
    !isFormData &&
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  } else if (
    !isFormData &&
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "object"
  ) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return { success: true, data: null };
    }

    let payload;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMsg = payload?.message || payload?.error || `HTTP error ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = payload;
      err.errors = payload?.errors || [];
      throw err;
    }

    return payload;
  } catch (error) {
    if (!error.status) {
      error.isNetworkError = true;
      error.message =
        error.message ||
        "Failed to connect to backend server. Make sure the backend is running on http://localhost:5000.";
    }
    throw error;
  }
}

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, String(item)));
      return;
    }
    query.append(key, String(value));
  });

  const qs = query.toString();
  return qs ? `?${qs}` : "";
};

export const api = {
  baseUrl: API_BASE,

  // ==========================================
  // 1. HEALTH
  // ==========================================
  health: {
    async check() {
      return apiRequest("/health");
    },
  },

  // ==========================================
  // 2. AUTH
  // ==========================================
  auth: {
    async login(email, password) {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      if (res?.data?.accessToken) {
        setToken(res.data.accessToken);
        setStoredUser(res.data.user);
      }
      return res;
    },

    async register({ name, email, password, phone }) {
      const res = await apiRequest("/auth/register", {
        method: "POST",
        body: { name, email, password, phone },
      });
      if (res?.data?.accessToken) {
        setToken(res.data.accessToken);
        setStoredUser(res.data.user);
      }
      return res;
    },

    async logout() {
      try {
        await apiRequest("/auth/logout", { method: "POST" });
      } catch (e) {
        console.warn("Backend logout notification failed (token may be expired):", e.message);
      } finally {
        removeToken();
        removeStoredUser();
      }
    },

    async getMe() {
      const res = await apiRequest("/users/me");
      if (res?.data?.user) {
        setStoredUser(res.data.user);
      }
      return res;
    },

    async updateProfile(updates) {
      const res = await apiRequest("/users/me", {
        method: "PATCH",
        body: updates,
      });
      if (res?.data?.user) {
        setStoredUser(res.data.user);
      }
      return res;
    },

    async changePassword({ currentPassword, newPassword }) {
      const res = await apiRequest("/users/change-password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      if (res?.data?.accessToken) {
        setToken(res.data.accessToken);
      }
      return res;
    },
  },

  // ==========================================
  // 3. RESTAURANTS
  // ==========================================
  restaurants: {
    async list(params = {}) {
      return apiRequest(`/restaurants${buildQueryString(params)}`);
    },
    async get(id) {
      return apiRequest(`/restaurants/${id}`);
    },
    async create(payload) {
      return apiRequest("/restaurants", {
        method: "POST",
        body: payload,
      });
    },
    async update(id, payload) {
      return apiRequest(`/restaurants/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    async delete(id) {
      return apiRequest(`/restaurants/${id}`, {
        method: "DELETE",
      });
    },
  },

  // ==========================================
  // 4. CATEGORIES
  // ==========================================
  categories: {
    async list(restaurantId) {
      return apiRequest(`/restaurants/${restaurantId}/categories`);
    },
    async create(restaurantId, payload) {
      return apiRequest(`/restaurants/${restaurantId}/categories`, {
        method: "POST",
        body: payload,
      });
    },
    async update(categoryId, payload) {
      return apiRequest(`/categories/${categoryId}`, {
        method: "PATCH",
        body: payload,
      });
    },
    async delete(categoryId) {
      return apiRequest(`/categories/${categoryId}`, {
        method: "DELETE",
      });
    },
  },

  // ==========================================
  // 5. MENU ITEMS
  // ==========================================
  menu: {
    async listByRestaurant(restaurantId, params = {}) {
      return apiRequest(`/restaurants/${restaurantId}/menu${buildQueryString(params)}`);
    },
    async get(id) {
      return apiRequest(`/menu/${id}`);
    },
    async create(restaurantId, payload) {
      return apiRequest(`/restaurants/${restaurantId}/menu`, {
        method: "POST",
        body: payload,
      });
    },
    async update(id, payload) {
      return apiRequest(`/menu/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    async delete(id) {
      return apiRequest(`/menu/${id}`, {
        method: "DELETE",
      });
    },
    async toggleAvailability(id, isAvailable) {
      return apiRequest(`/menu/${id}/availability`, {
        method: "PATCH",
        body: { isAvailable },
      });
    },
  },

  // ==========================================
  // 6. CART
  // ==========================================
  cart: {
    async get() {
      return apiRequest("/cart");
    },
    async addItem(payload) {
      return apiRequest("/cart/items", {
        method: "POST",
        body: payload,
      });
    },
    async updateItem(itemId, payload) {
      return apiRequest(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: payload,
      });
    },
    async removeItem(itemId) {
      return apiRequest(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
    },
    async clear() {
      return apiRequest("/cart", {
        method: "DELETE",
      });
    },
  },

  // ==========================================
  // 7. ORDERS
  // ==========================================
  orders: {
    async myOrders(params = {}) {
      return apiRequest(`/orders/my-orders${buildQueryString(params)}`);
    },
    async adminOrders(params = {}) {
      return apiRequest(`/admin/orders${buildQueryString(params)}`);
    },
    async restaurantOrders(restaurantId, params = {}) {
      return apiRequest(`/restaurants/${restaurantId}/orders${buildQueryString(params)}`);
    },
    async get(orderId) {
      return apiRequest(`/orders/${orderId}`);
    },
    async cancel(orderId, reason = "") {
      return apiRequest(`/orders/${orderId}/cancel`, {
        method: "PATCH",
        body: { reason },
      });
    },
    async create(payload) {
      return apiRequest("/orders", {
        method: "POST",
        body: payload,
      });
    },
    async updateStatus(id, payload) {
      const normalized = typeof payload === "string" ? { status: payload } : payload || {};
      return apiRequest(`/orders/${id}/status`, {
        method: "PATCH",
        body: normalized,
      });
    },
  },

  // ==========================================
  // 8. ADMIN
  // ==========================================
  admin: {
    async getDashboard() {
      return apiRequest("/admin/dashboard");
    },
    async getUsers(params = {}) {
      return apiRequest(`/admin/users${buildQueryString(params)}`);
    },
    async setRole(userId, role) {
      return apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: { role },
      });
    },
    async blockUser(userId) {
      return apiRequest(`/admin/users/${userId}/block`, {
        method: "PATCH",
      });
    },
    async unblockUser(userId) {
      return apiRequest(`/admin/users/${userId}/unblock`, {
        method: "PATCH",
      });
    },
    async getCoupons() {
      return apiRequest("/admin/coupons");
    },
    async createCoupon(data) {
      return apiRequest("/admin/coupons", {
        method: "POST",
        body: data,
      });
    },
    async updateCoupon(couponId, data) {
      return apiRequest(`/admin/coupons/${couponId}`, {
        method: "PATCH",
        body: data,
      });
    },
    async deleteCoupon(couponId) {
      return apiRequest(`/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
    },
  },
};
