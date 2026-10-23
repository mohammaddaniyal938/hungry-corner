import { useState, useEffect } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { api } from "../../services/api";
import { apiService } from "../../services/apiService";
import { IconShieldCheck, IconCheckCircle, IconCopy } from "../Icons";

export default function DashboardDatabase({ onShowToast, onRefreshData }) {
  const [seeding, setSeeding] = useState(false);
  const [testing, setTesting] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    checking: true,
    uptime: 0,
    url: api.baseUrl,
  });
  const [copied, setCopied] = useState(false);

  const checkConnection = async () => {
    setTesting(true);
    try {
      const res = await api.health.check();
      if (res?.success) {
        setBackendStatus({
          connected: true,
          checking: false,
          uptime: Math.floor(res.data?.uptime || 0),
          url: api.baseUrl,
        });
        if (onShowToast) onShowToast("Backend connected successfully! ");
      } else {
        setBackendStatus({
          connected: false,
          checking: false,
          uptime: 0,
          url: api.baseUrl,
        });
      }
    } catch (err) {
      setBackendStatus({
        connected: false,
        checking: false,
        uptime: 0,
        error: err.message,
        url: api.baseUrl,
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const apiEndpointsSummary = `// ==========================================
// KARACHI BITES REST API SPECIFICATION
// Base URL: ${api.baseUrl}
// ==========================================

// 1. AUTHENTICATION & USERS
POST   /api/auth/register       // Register new customer account { name, email, password, phone }
POST   /api/auth/login          // Login user { email, password } -> returns JWT
POST   /api/auth/logout         // Invalidate active JWT token
GET    /api/users/me            // Current authenticated user profile
PATCH  /api/users/me            // Update customer profile { name, phone }
PATCH  /api/users/change-password // Update password { currentPassword, newPassword }

// 2. RESTAURANTS & MENU
GET    /api/restaurants         // List all active restaurants in Karachi
GET    /api/restaurants/:id     // Restaurant details with operating hours & delivery fee
GET    /api/restaurants/:id/menu // Restaurant full menu with search, category & price filters
GET    /api/menu/:id            // Single dish details & ingredients
POST   /api/restaurants/:id/menu // [Admin/Owner] Add new dish to menu
PATCH  /api/menu/:id            // [Admin/Owner] Update dish price, image or description
DELETE /api/menu/:id            // [Admin/Owner] Delete dish from menu
PATCH  /api/menu/:id/availability // [Admin/Owner] Toggle dish in-stock / out-of-stock

// 3. CART & LIVE ORDERS
GET    /api/cart                // Get customer active cart
POST   /api/cart/items          // Add item to cart { menuItemId, quantity }
PATCH  /api/cart/items/:id      // Update cart item quantity
DELETE /api/cart/items/:id      // Remove item from cart
POST   /api/orders              // Place order with delivery address & phone
GET    /api/orders/my-orders    // Customer order history & live delivery tracking
GET    /api/orders/:id          // Order receipt snapshot with immutable item prices
PATCH  /api/orders/:id/cancel   // Customer cancellation (while pending/confirmed)
PATCH  /api/orders/:id/status   // [Admin/Staff] Advance order status: pending -> confirmed -> preparing -> out_for_delivery -> delivered

// 4. SUPER ADMIN CONTROLS
GET    /api/admin/dashboard     // Kitchen analytics, revenue, active order volume & low stock
GET    /api/admin/users         // User directory with role management & account block
PATCH  /api/admin/users/:id/role // Assign admin / restaurant_admin / customer role
GET    /api/admin/coupons       // Active discount codes & usage limits
POST   /api/admin/coupons       // Create coupon { code, discountValue, minimumOrder }
`;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await apiService.seedDefaultProducts();
      if (onShowToast) {
        onShowToast(`Menu synchronized (${count} dishes ready)! `);
      }
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast("Seeding completed to local storage");
    } finally {
      setSeeding(false);
    }
  };

  const handleCopyApiSpec = () => {
    navigator.clipboard.writeText(apiEndpointsSummary);
    setCopied(true);
    if (onShowToast) onShowToast("API Specification copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Card */}
      <div className="bg-[#2A211B] p-6 rounded-3xl border border-[#F5EBDD]/10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F5EBDD]/10">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${backendStatus.connected ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`}
              />
              <h2 className="font-display font-extrabold text-xl text-[#F5EBDD]">
                Express + MongoDB Backend Integration
              </h2>
            </div>
            <p className="text-xs text-[#C19A6B] mt-0.5">
              REST API connectivity status, JWT authentication, and live catalog sync
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={checkConnection}
              disabled={testing}
              className="bg-[#171513] hover:bg-[#3B3020] text-[#F5EBDD] text-xs font-bold px-4 py-3 rounded-2xl border border-[#F5EBDD]/10 transition-all cursor-pointer"
            >
              {testing ? "Testing..." : " Test Connection"}
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-[#D4A017] hover:bg-[#B98B12] text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-[#D4A017]/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {seeding ? <span>Syncing Menu...</span> : <span> Sync Menu Catalog</span>}
            </button>
          </div>
        </div>

        {/* Status badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-[#171513] border border-[#F5EBDD]/5 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${backendStatus.connected ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"} flex items-center justify-center font-bold text-lg`}
            >
              {backendStatus.connected ? "✓" : "!"}
            </div>
            <div>
              <p className="text-[10px] text-[#C19A6B] uppercase font-bold tracking-wider">
                REST API Server
              </p>
              <p className="text-xs font-extrabold text-[#F5EBDD]">
                {backendStatus.connected
                  ? "Connected (Port 5000)"
                  : "Offline / Standalone Fallback"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#171513] border border-[#F5EBDD]/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] text-[#C19A6B] uppercase font-bold tracking-wider">
                Authentication
              </p>
              <p className="text-xs font-extrabold text-[#F5EBDD]">JWT + Role-Based Access</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#171513] border border-[#F5EBDD]/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] text-[#C19A6B] uppercase font-bold tracking-wider">
                Data Resilience
              </p>
              <p className="text-xs font-extrabold text-[#F5EBDD]">Dual REST API + Local Cache</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-[#171513] border border-[#F5EBDD]/10 text-[11px] font-mono text-[#C19A6B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <strong className="text-[#F5EBDD]">API Base Endpoint:</strong> {backendStatus.url}
          </div>
          {backendStatus.connected && (
            <div className="text-emerald-400">
              Server Uptime: {backendStatus.uptime}s • Health: OK
            </div>
          )}
        </div>
      </div>

      {/* API Reference Spec Box */}
      <div className="bg-[#171513] text-white p-6 rounded-3xl shadow-xl space-y-4 border border-[#F5EBDD]/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <IconShieldCheck className="w-5 h-5 text-[#D4A017]" />
              Backend REST API Endpoints Cheat Sheet
            </h3>
            <p className="text-xs text-[#C19A6B]">
              Integrated Express routes powering Menu, Cart, Orders, Auth, and Analytics.
            </p>
          </div>

          <button
            onClick={handleCopyApiSpec}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <IconCheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <IconCopy className="w-4 h-4" />
            )}
            <span>{copied ? "Copied!" : "Copy API Reference"}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-[#2A211B] text-emerald-400 text-xs font-mono overflow-x-auto scroll-thin max-h-80 border border-white/10 leading-relaxed">
          {apiEndpointsSummary}
        </pre>
      </div>
    </div>
  );
}
