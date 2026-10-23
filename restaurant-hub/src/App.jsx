
import { useState, useEffect, useMemo } from "react";
import { Utensils } from "lucide-react";
import { apiService } from "./services/apiService";
import { fireConfetti } from "./utils/confetti";

import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import MidnightFeastSection from "./components/MidnightFeastSection";
import MenuPage from "./components/MenuPage";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import FoodDetailsModal from "./components/FoodDetailsModal";
import FavoritesDrawer from "./components/FavoritesDrawer";
import OrderHistoryModal from "./components/OrderHistoryModal";
import OrderTrackingModal from "./components/OrderTrackingModal";
import OrderReceiptModal from "./components/OrderReceiptModal";
import MobileBottomNav from "./components/MobileBottomNav";
import Toast from "./components/Toast";
import { useAuth } from "./lib/auth-context.jsx";

const STORAGE_KEYS = {
  CART: "karachi_bites_cart_v2",
  FAVORITES: "karachi_bites_favs_v2",
  HISTORY: "karachi_bites_orders_v2",
  AREA: "karachi_bites_selected_area",
};

export default function App() {
  // Authentication + role information (customer / staff / admin)
  const auth = useAuth();

  const [storefrontPage, setStorefrontPage] = useState("home");

  // ==========================================
  // 1. PRODUCTS & BACKEND API DATA
  // ==========================================
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AREA) || "Clifton, Karachi";
  });

  const loadProducts = async () => {
    setLoading(true);
    const data = await apiService.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AREA, selectedArea);
  }, [selectedArea]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 0);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // 2. ORDERS & LIVE SYNC
  // ==========================================
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const data = await apiService.getOrders();
    setOrders(data);
  };

  useEffect(() => {
    const timer = setTimeout(loadOrders, 0);

    // Subscribe to live order updates
    const unsubscribe = apiService.subscribeToOrders((payload) => {
      console.log("Live order update received:", payload);
      loadOrders();
    });

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute active orders count for kitchen badge
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === "pending" || o.status === "preparing" || o.status === "out_for_delivery",
    ).length;
  }, [orders]);

  // ==========================================
  // 3. CART MANAGEMENT (with localStorage)
  // ==========================================
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not save cart", e);
    }
  }, [cart]);

  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // ==========================================
  // 4. FAVORITES & WISHLIST
  // ==========================================
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn("Could not save favorites", e);
    }
  }, [favorites]);

  const toggleFavorite = (product) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.title}" from saved bites`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        showToast(`Saved "${product.title}" to your favorites! `);
        return [...prev, product];
      }
    });
  };

  // ==========================================
  // 5. MODALS & DRAWERS
  // ==========================================
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentBillSummary, setCurrentBillSummary] = useState({});

  // ==========================================
  // 6. TOAST NOTIFICATION
  // ==========================================
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  // ==========================================
  // 7. FILTERS, SEARCH, SORT & VIEW MODE
  // ==========================================
  const [category, setCategory] = useState("All");
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [onlySpicy, setOnlySpicy] = useState(false);
  const [onlyVeg, setOnlyVeg] = useState(false);
  const [onlyBestseller, setOnlyBestseller] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  const categories = useMemo(() => {
    const rawCategories = products.map((p) => p.category).filter(Boolean);
    return ["All", ...Array.from(new Set(rawCategories))];
  }, [products]);

  const productCountsByCategory = useMemo(() => {
    const counts = { All: products.length };
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (category !== "All") count++;
    if (rating > 0) count++;
    if (price !== "All") count++;
    if (search.trim() !== "") count++;
    if (onlySpicy) count++;
    if (onlyVeg) count++;
    if (onlyBestseller) count++;
    return count;
  }, [category, rating, price, search, onlySpicy, onlyVeg, onlyBestseller]);

  const resetFilters = () => {
    setCategory("All");
    setRating(0);
    setPrice("All");
    setSearch("");
    setSortBy("featured");
    setOnlySpicy(false);
    setOnlyVeg(false);
    setOnlyBestseller(false);
    showToast("All filters reset");
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = products.filter((product) => {
      // 1. Category
      const catMatch = category === "All" || product.category === category;

      // 2. Rating
      let ratingMatch = true;
      if (rating > 0) {
        ratingMatch = Number(product.rating) >= rating;
      }

      // 3. Price
      let priceMatch = true;
      const numPrice = Number(product.price);
      if (price === "0-500") {
        priceMatch = numPrice <= 500;
      } else if (price === "501-1000") {
        priceMatch = numPrice >= 501 && numPrice <= 1000;
      } else if (price === "1001-1500") {
        priceMatch = numPrice >= 1001 && numPrice <= 1500;
      } else if (price === "1501-plus") {
        priceMatch = numPrice > 1500;
      }

      // 4. Tags
      if (onlySpicy && !product.isSpicy) return false;
      if (onlyVeg && !product.isVeg) return false;
      if (onlyBestseller && product.badge !== "Bestseller" && product.badge !== "Popular")
        return false;

      // 5. Search
      let searchMatch = true;
      if (search.trim() !== "") {
        const q = search.trim().toLowerCase();
        const inTitle = product.title.toLowerCase().includes(q);
        const inDesc = product.description?.toLowerCase().includes(q);
        const inCat = product.category?.toLowerCase().includes(q);
        const inIng = product.ingredients?.some((ing) => ing.toLowerCase().includes(q));
        searchMatch = inTitle || inDesc || inCat || inIng;
      }

      return product.inStock !== false && catMatch && ratingMatch && priceMatch && searchMatch;
    });

    // Sorting
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating-desc") {
      list = [...list].sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    return list;
  }, [products, category, rating, price, search, sortBy, onlySpicy, onlyVeg, onlyBestseller]);

  // ==========================================
  // 8. CART COMPUTATIONS & ACTIONS
  // ==========================================
  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => {
      const qty = typeof item === "number" ? item : item.qty || 0;
      return sum + qty;
    }, 0);
  }, [cart]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, val]) => {
        const product = products.find((p) => String(p.id) === String(id));
        if (!product) return null;

        const qty = typeof val === "number" ? val : val.qty || 0;
        if (qty <= 0) return null;

        return {
          ...product,
          qty,
          selectedAddons: val.selectedAddons || [],
          spiceLevel: val.spiceLevel || "Medium",
          specialInstructions: val.specialInstructions || "",
          customUnitPrice: val.unitPrice || product.price,
        };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const unit = item.customUnitPrice || item.price;
      return sum + unit * item.qty;
    }, 0);
  }, [cartItems]);

  const updateQty = (id, delta) => {
    const product = products.find((item) => String(item.id) === String(id));
    if (delta > 0 && product?.inStock === false) {
      showToast(`${product.title} is currently out of stock`, "info");
      return;
    }

    setCart((prev) => {
      const next = { ...prev };
      const current = next[id];
      const currentQty = typeof current === "number" ? current : current?.qty || 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        delete next[id];
      } else if (typeof current === "object" && current !== null) {
        next[id] = { ...current, qty: newQty };
      } else {
        next[id] = newQty;
      }
      return next;
    });
  };

  const handleAddToCartWithCustomizations = (product, quantity, customOptions = {}) => {
    if (product.inStock === false) {
      showToast(`${product.title} is currently out of stock`, "info");
      return;
    }

    setCart((prev) => {
      const next = { ...prev };
      const existing = next[product.id];
      const existingQty = typeof existing === "number" ? existing : existing?.qty || 0;
      next[product.id] = {
        qty: existingQty + quantity,
        ...customOptions,
      };
      return next;
    });
  };

  const removeItemFromCart = (id) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    setCart({});
    setAppliedDiscount(null);
    showToast("Cart cleared");
  };

  const handleAddAllFavoritesToCart = () => {
    favorites.forEach((fav) => {
      updateQty(fav.id, 1);
    });
    setFavoritesOpen(false);
    setCartOpen(true);
    showToast(`Added ${favorites.length} saved favorites to your cart! `);
  };

  const handleClaimFeaturedDeal = () => {
    const deal = products.find((p) => p.id === 14) || products[0];
    if (deal && deal.inStock !== false) {
      updateQty(deal.id, 1);
      setCartOpen(true);
      showToast(`Added "${deal.title}" to cart! `);
    } else if (deal) {
      showToast(`${deal.title} is currently out of stock`, "info");
    }
  };

  // ==========================================
  // 9. CHECKOUT & ORDER COMPLETION FLOW
  // ==========================================
  const handleOpenCheckout = (summary) => {
    if (cartItems.length === 0) {
      showToast("Add an item before checking out", "info");
      return;
    }
    setCurrentBillSummary(summary);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleConfirmOrder = async (orderData) => {
    // Save via backend API service before showing confirmation.
    const placed = await apiService.placeOrder(orderData);

    fireConfetti();

    // 3. Update active orders state
    setOrders((prev) => [placed, ...prev]);

    // 4. Clear cart
    setCart({});
    setAppliedDiscount(null);

    // 5. Close checkout, open the receipt for the newly placed order
    setCheckoutOpen(false);
    setActiveReceiptOrder(placed);
    setReceiptOpen(true);
    setActiveTrackingOrder(placed);

    showToast(`Order ${placed.orderId} placed successfully! `);
  };

  // ==========================================
  // 10. ADMIN DASHBOARD OPERATIONS (CRUD)
  // ==========================================
  const handleAddProduct = async (productData) => {
    const created = await apiService.addProduct(productData);
    setProducts((prev) => [created, ...prev]);
  };

  const handleUpdateProduct = async (id, updates) => {
    const updated = await apiService.updateProduct(id, updates);
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updated } : p)),
    );
  };

  const handleDeleteProduct = async (id) => {
    await apiService.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await apiService.updateOrderStatus(orderId, newStatus);
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o)));
    if (activeTrackingOrder && activeTrackingOrder.orderId === orderId) {
      setActiveTrackingOrder((prev) => ({ ...prev, status: newStatus }));
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#171513] flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-[#D4A017] text-white flex items-center justify-center text-4xl mx-auto mb-4 shadow-xl shadow-[#D4A017]/30 animate-bounce">
            <Utensils className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[#F5EBDD]">
            Karachi<span className="text-[#D4A017]">Bites</span>
          </h2>
          <p className="text-xs text-[#C19A6B] mt-2 font-medium">
            Fetching fresh menu from Backend API...
          </p>
        </div>
      </div>
    );
  }

  const navigateStorefront = (page) => {
    setStorefrontPage(page);
    if (page === "menu") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================
  // STOREFRONT APPLICATION LAYOUT
  // ==========================================
  return (
    <div className="min-h-screen bg-[#171513] text-[#F5EBDD] flex flex-col antialiased selection:bg-[#D4A017] selection:text-white pb-16 lg:pb-0">
      {/* 1. TOAST NOTIFICATIONS */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* 2. HEADER */}
      <Header
        search={search}
        setSearch={(value) => {
          setSearch(value);
          if (value.trim()) navigateStorefront("menu");
        }}
        currentPage={storefrontPage}
        onNavigate={navigateStorefront}
        cartCount={cartCount}
        cartTotal={cartTotal}
        favoritesCount={favorites.length}
        activeOrdersCount={activeOrdersCount}
        onCartClick={() => setCartOpen(true)}
        onFavoritesClick={() => setFavoritesOpen(true)}
        onHistoryClick={() => setHistoryOpen(true)}
        onFiltersClick={() => {
          navigateStorefront("menu");
          setMobileFiltersOpen(true);
        }}
        authUser={auth.user}
        onSignIn={() => {
          window.location.href = "/auth?redirect=%2F";
        }}
        onSignOut={async () => {
          await auth.signOut();
          showToast("Signed out");
        }}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
      />

      {/* 3. HOME CONTENT */}
      {storefrontPage === "home" && (
        <>
          <HeroBanner
            onSelectCategory={(cat) => {
              setCategory(cat);
              navigateStorefront("menu");
            }}
            activeCategory={category}
            onClaimFeaturedDeal={handleClaimFeaturedDeal}
          />
          <MidnightFeastSection onClaimDeal={handleClaimFeaturedDeal} />
        </>
      )}

      {storefrontPage === "menu" && (
        <MenuPage
          filteredProducts={filteredProducts}
          categories={categories}
          category={category}
          setCategory={setCategory}
          rating={rating}
          setRating={setRating}
          price={price}
          setPrice={setPrice}
          onlySpicy={onlySpicy}
          setOnlySpicy={setOnlySpicy}
          onlyVeg={onlyVeg}
          setOnlyVeg={setOnlyVeg}
          onlyBestseller={onlyBestseller}
          setOnlyBestseller={setOnlyBestseller}
          productCountsByCategory={productCountsByCategory}
          resetFilters={resetFilters}
          mobileFiltersOpen={mobileFiltersOpen}
          setMobileFiltersOpen={setMobileFiltersOpen}
          activeFilterCount={activeFilterCount}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          cart={cart}
          favorites={favorites}
          updateQty={updateQty}
          toggleFavorite={toggleFavorite}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      {/* 5. FOOTER */}
      <footer className="bg-[#171513] text-white border-t border-white/10 mt-16 pt-12 pb-16 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-[#D4A017] flex items-center justify-center text-lg">
                  <Utensils className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-display font-extrabold text-xl tracking-tight text-white">
                  Karachi<span className="text-[#D4A017]">Bites</span>
                </span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed font-normal">
                Karachi's favorite destination for authentic street flavors, gourmet burgers, and
                loaded shawarmas crafted with 100% Halal fresh ingredients.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-bold text-sm text-white mb-3 uppercase tracking-wider text-[#C19A6B]">
                Menu Highlights
              </h4>
              <ul className="space-y-2 text-xs text-white/70">
                <li>
                  <button
                    onClick={() => {
                      setCategory("Burgers");
                      navigateStorefront("menu");
                    }}
                    className="hover:text-white"
                  >
                    Gourmet Beef Burgers
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCategory("Shawarma");
                      navigateStorefront("menu");
                    }}
                    className="hover:text-white"
                  >
                    Lebanese Chicken Shawarma
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCategory("Pizza");
                      navigateStorefront("menu");
                    }}
                    className="hover:text-white"
                  >
                    Handcrafted Fajita Pizzas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setCategory("Sides");
                      navigateStorefront("menu");
                    }}
                    className="hover:text-white"
                  >
                    Dynamite Loaded Fries
                  </button>
                </li>
              </ul>
            </div>

            {/* Delivery Areas */}
            <div>
              <h4 className="font-display font-bold text-sm text-white mb-3 uppercase tracking-wider text-[#C19A6B]">
                Express Delivery Zones
              </h4>
              <ul className="space-y-1.5 text-xs text-white/70">
                <li>• Clifton & DHA Phase 1-8</li>
                <li>• Gulshan-e-Iqbal & PECHS</li>
                <li>• North Nazimabad & Bahadurabad</li>
                <li>• Gulistan-e-Johar & Malir Cantt</li>
              </ul>
            </div>

            {/* Contact & Hours */}
            <div>
              <h4 className="font-display font-bold text-sm text-white mb-3 uppercase tracking-wider text-[#C19A6B]">
                Karachi Hotline & Admin
              </h4>
              <p className="text-xs text-white/70 mb-1">
                 Order Helpline: <strong>(021) 111-BITES-0</strong>
              </p>
              <p className="text-xs text-white/70 mb-1"> Daily Timings: 12:00 PM – 4:00 AM</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-3">
            <p>
               {new Date().getFullYear()} Karachi Bites. All rights reserved. Express & MongoDB
              Backend.
            </p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
              <span className="hover:text-white cursor-pointer">Halal Certificate</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. MOBILE BOTTOM BAR */}
      <MobileBottomNav
        activeTab={mobileFiltersOpen ? "filters" : "menu"}
        onMenuClick={() => {
          setMobileFiltersOpen(false);
          navigateStorefront("menu");
        }}
        onFiltersClick={() => {
          navigateStorefront("menu");
          setMobileFiltersOpen(true);
        }}
        onFavoritesClick={() => setFavoritesOpen(true)}
        onCartClick={() => setCartOpen(true)}
        cartCount={cartCount}
        favoritesCount={favorites.length}
        activeFilterCount={activeFilterCount}
      />

      {/* 7. CART DRAWER */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onIncrement={(id) => updateQty(id, 1)}
        onDecrement={(id) => updateQty(id, -1)}
        onRemoveItem={removeItemFromCart}
        onClearCart={clearCart}
        onPlaceOrder={handleOpenCheckout}
        appliedDiscount={appliedDiscount}
        setAppliedDiscount={setAppliedDiscount}
        onShowToast={showToast}
      />

      {/* 8. CHECKOUT MODAL */}
      {checkoutOpen && (
        <CheckoutModal
          onClose={() => setCheckoutOpen(false)}
          onConfirm={handleConfirmOrder}
          cartItems={cartItems}
          billSummary={currentBillSummary}
          selectedArea={selectedArea}
        />
      )}

      {/* 9. FOOD DETAILS & CUSTOMIZATION MODAL */}
      {selectedProduct && (
        <FoodDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCartWithCustomizations}
          isFavorite={favorites.some((f) => f.id === selectedProduct.id)}
          onToggleFavorite={toggleFavorite}
          onShowToast={showToast}
        />
      )}

      {/* 10. SAVED FAVORITES DRAWER */}
      <FavoritesDrawer
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        favorites={favorites}
        onRemoveFavorite={(id) => toggleFavorite({ id })}
        onAddToCart={(p, q) => {
          updateQty(p.id, q);
          showToast(`Added "${p.title}" to cart! `);
        }}
        onAddAllFavorites={handleAddAllFavoritesToCart}
      />

      {/* 11. ORDER HISTORY MODAL */}
      <OrderHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        orderHistory={orders}
        onTrackOrder={(order) => {
          setHistoryOpen(false);
          setActiveTrackingOrder(order);
          setTrackingOpen(true);
        }}
        onViewReceipt={(order) => {
          setHistoryOpen(false);
          setActiveReceiptOrder(order);
          setReceiptOpen(true);
        }}
        onClearHistory={() => {
          setOrders([]);
          apiService.clearLocalOrderHistory();
          showToast("Order history cleared");
        }}
      />

      {/* 12. ORDER RECEIPT */}
      {receiptOpen && activeReceiptOrder && (
        <OrderReceiptModal
          order={activeReceiptOrder}
          isOpen={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          onTrackOrder={(order) => {
            setReceiptOpen(false);
            setActiveTrackingOrder(order);
            setTrackingOpen(true);
          }}
          onNewOrder={() => {
            setReceiptOpen(false);
            navigateStorefront("menu");
          }}
        />
      )}

      {/* 13. LIVE ORDER TRACKING MODAL */}
      {trackingOpen && activeTrackingOrder && (
        <OrderTrackingModal
          order={activeTrackingOrder}
          onClose={() => setTrackingOpen(false)}
          onNewOrder={() => {
            setTrackingOpen(false);
            navigateStorefront("menu");
          }}
        />
      )}
    </div>
  );
}
