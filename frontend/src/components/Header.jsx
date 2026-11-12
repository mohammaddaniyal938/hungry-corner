import { useState } from "react";
import {
  IconSearch,
  IconCart,
  IconHeart,
  IconFilter,
  IconHistory,
  IconX,
  IconFlame,
} from "./Icons";
import ThemeToggle from "./ThemeToggle";

const KARACHI_AREAS = [
  "Clifton, Karachi",
  "DHA Phase 5 & 6",
  "Gulshan-e-Iqbal",
  "PECHS Block 2 & 6",
  "North Nazimabad",
  "Bahadurabad",
  "Gulistan-e-Johar",
  "Malir Cantt",
];

export default function Header({
  search,
  setSearch,
  cartCount,
  cartTotal,
  favoritesCount,
  onCartClick,
  onFavoritesClick,
  onHistoryClick,
  onFiltersClick,
  selectedArea,
  setSelectedArea,
  currentPage = "home",
  onNavigate,
  authUser = null,
  onSignIn,
  onSignOut,
}) {
  const [searchFocused, setSearchFocused] = useState(false);

  const searchSuggestions = ["Beef Burger", "Zinger", "Shawarma", "Fajita Pizza", "Loaded Fries"];

  return (
    <>
      {/* TOP ANNOUNCEMENT BANNER */}
      <div className="bg-[#2A211B] text-white text-xs font-semibold py-1.5 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="bg-[#D4A017]/20 text-[#F5EBDD] px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
              Flash Deal
            </span>
            <span>
              Use code <strong className="underline decoration-wavy">KARACHI20</strong> for 20% OFF!
            </span>
            <span className="hidden sm:inline opacity-70">•</span>
            <span className="hidden sm:inline"> Free Delivery on orders over Rs. 1500</span>
            <span className="hidden md:inline opacity-70">•</span>
            <span className="hidden md:inline"> Avg. Delivery: 25-35 mins</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs text-white/90 shrink-0 ml-4">
            <span className="flex items-center gap-1">
              <IconFlame className="w-3.5 h-3.5 text-[#C19A6B]" /> 100% Halal Fresh
            </span>

            {authUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/90 max-w-[160px] truncate">
                  {authUser.email}
                </span>
                <button
                  onClick={onSignOut}
                  className="bg-black/30 hover:bg-black/50 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="bg-[#D4A017] hover:bg-[#B98B12] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm shadow-[#D4A017]/25 transition-all active:scale-95 cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="sticky top-0 z-40 glass-header border-b border-white/10 text-white shadow-xl shadow-[#171513]/20">
        <div className="header-main-inner max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 md:gap-6">
          {/* LEFT: Mobile Filters Trigger & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <button
              onClick={onFiltersClick}
              className="lg:hidden w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Open Filters"
              title="Filters & Menu"
            >
              <IconFilter className="w-4 h-4" />
            </button>

            {/* BRAND LOGO */}
            <button
              onClick={() => onNavigate?.("home")}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 overflow-hidden rounded-xl bg-[#D4A017] shadow-lg shadow-[#D4A017]/30 group-hover:scale-105 transition-transform">
                <img
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=96&h=96&fit=crop&crop=center&q=90"
                  alt=""
                  className="h-full w-full object-cover object-center"
                  loading="eager"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg sm:text-2xl tracking-tight leading-none text-white">
                  Karachi<span className="text-[#C19A6B]">Bites</span>
                </span>
                <span className="text-[10px] text-white/60 tracking-wider font-semibold uppercase">
                  Fast Food & Grill
                </span>
              </div>
            </button>
          </div>

          <nav className="hidden lg:flex items-center gap-1.5 shrink-0" aria-label="Main navigation">
            <button
              onClick={() => onNavigate?.("home")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${currentPage === "home" ? "bg-[#D4A017] text-white shadow-sm shadow-[#D4A017]/20" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate?.("menu")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${currentPage === "menu" ? "bg-[#D4A017] text-white shadow-sm shadow-[#D4A017]/20" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            >
              Menu
            </button>
          </nav>

          {currentPage !== "home" && currentPage !== "menu" && (
            <div className="hidden md:block relative shrink-0">
              <button
                onClick={() => setSelectedArea(selectedArea || "Clifton, Karachi")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/90 transition-all"
                aria-label="Selected delivery area"
              >
                <span className="text-[10px] text-white/50 leading-none">Deliver to</span>
                <span className="font-semibold text-white truncate max-w-[120px]">
                  {selectedArea}
                </span>
              </button>
            </div>
          )}

          {/* SEARCH BAR */}
          <div className="header-search flex-1 min-w-0 max-w-md relative">
            <div className="relative">
              <span className="header-search-icon absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5EBDD]/80 pointer-events-none">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search burgers, shawarmas, pizzas..."
                className="header-search-input w-full bg-white/10 hover:bg-white/15 focus:bg-[#2A211B] text-[#F5EBDD] placeholder:text-[#F5EBDD]/65 focus:placeholder:text-[#F5EBDD]/45 rounded-full pl-9 pr-9 py-2 text-xs sm:text-sm font-medium border border-white/10 focus:border-[#D4A017] focus:outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:text-[#F5EBDD] p-1"
                  aria-label="Clear search"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick search suggestions popup */}
            {searchFocused && !search && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2A211B] border border-white/10 rounded-2xl p-3 shadow-2xl z-30 animate-pop-in">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item}
                      onMouseDown={() => setSearch(item)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#D4A017] text-white/80 hover:text-white text-xs transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT ACTIONS: Dashboard, Wishlist, History, Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* Order History */}
            <button
              onClick={onHistoryClick}
              className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white items-center justify-center transition-colors"
              title="Order History"
              aria-label="Order History"
            >
              <IconHistory className="w-4 h-4 text-white/80" />
            </button>

            {/* Favorites Wishlist */}
            <button
              onClick={onFavoritesClick}
              className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white flex items-center justify-center transition-colors"
              title="Saved Favorites"
              aria-label="Saved Favorites"
            >
              <IconHeart
                className={`w-4 h-4 ${favoritesCount > 0 ? "text-[#C19A6B] fill-current" : "text-white/80"}`}
              />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C19A6B] text-[#171513] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* CART BUTTON */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 bg-[#D4A017] hover:bg-[#B98B12] text-white px-3.5 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg shadow-[#D4A017]/30 active:scale-95 transition-all"
              aria-label="View Cart"
            >
              <div className="relative">
                <IconCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#C19A6B] text-[#171513] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[10px] text-white/80 uppercase font-semibold">Cart</span>
                <span className="font-extrabold text-xs">Rs. {cartTotal.toLocaleString()}</span>
              </div>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
