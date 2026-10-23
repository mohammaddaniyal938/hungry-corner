import { IconUtensils, IconFilter, IconHeart, IconCart } from "./Icons";

export default function MobileBottomNav({
  activeTab = "menu",
  onMenuClick,
  onFiltersClick,
  onFavoritesClick,
  onCartClick,
  cartCount = 0,
  favoritesCount = 0,
  activeFilterCount = 0,
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#171513]/95 border-t border-white/10 backdrop-blur-xl px-4 py-2 text-white shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Menu */}
        <button
          onClick={onMenuClick}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "menu" ? "text-[#D4A017] font-bold" : "text-white/70 hover:text-white"
          }`}
        >
          <IconUtensils className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>

        {/* Filters */}
        <button
          onClick={onFiltersClick}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-white/70 hover:text-white transition-all"
        >
          <div className="relative">
            <IconFilter className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#D4A017] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Filters</span>
        </button>

        {/* Favorites */}
        <button
          onClick={onFavoritesClick}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-white/70 hover:text-white transition-all"
        >
          <div className="relative">
            <IconHeart
              className={`w-5 h-5 ${favoritesCount > 0 ? "text-[#D4A017] fill-[#D4A017]" : ""}`}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#D4A017] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Saved</span>
        </button>

        {/* Cart */}
        <button
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl bg-[#D4A017] text-white font-bold transition-all active:scale-95 shadow-lg shadow-[#D4A017]/30"
        >
          <div className="relative">
            <IconCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-[#C19A6B] text-[#171513] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Cart</span>
        </button>
      </div>
    </div>
  );
}
