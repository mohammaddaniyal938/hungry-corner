import Sidebar from "./Sidebar";
import ProductCard from "./ProductsCard";
import EmptyState from "./EmptyState";
import { IconGrid, IconList } from "./Icons";

export default function MenuPage({
  filteredProducts,
  categories,
  category,
  setCategory,
  rating,
  setRating,
  price,
  setPrice,
  onlySpicy,
  setOnlySpicy,
  onlyVeg,
  setOnlyVeg,
  onlyBestseller,
  setOnlyBestseller,
  productCountsByCategory,
  resetFilters,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  activeFilterCount,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  cart,
  favorites,
  updateQty,
  toggleFavorite,
  setSelectedProduct,
}) {
  return (
    <main id="menu-section" className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 flex-1">
      <div className="mb-7 max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4A017]">
          The full spread
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5EBDD] mt-2">
          Choose your craving
        </h1>
        <p className="text-sm text-[#C19A6B] mt-2">
          Freshly made burgers, shawarmas, pizzas, sides, drinks, and value deals.
        </p>
      </div>

      <div className="flex gap-8">
        <Sidebar
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
          onResetFilters={resetFilters}
          isOpen={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          activeFilterCount={activeFilterCount}
        />

        <section className="flex-1 min-w-0" aria-label="Food menu">
          <div className="bg-[#2A211B] p-4 rounded-2xl border border-[#F5EBDD]/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg text-[#F5EBDD]">
                {category === "All" ? "All Dishes" : category}
              </span>
              <span className="text-xs text-[#C19A6B] font-semibold bg-[#2A211B] px-2.5 py-1 rounded-full">
                {filteredProducts.length} {filteredProducts.length === 1 ? "dish" : "dishes"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="bg-[#2A211B] hover:bg-[#3A3028] border border-[#F5EBDD]/10 text-[#F5EBDD] text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A017] cursor-pointer"
                aria-label="Sort menu"
              >
                <option value="featured">Sort: Featured</option>
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
              <div className="hidden sm:flex items-center bg-[#2A211B] p-1 rounded-xl border border-[#F5EBDD]/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-[#2A211B] text-[#D4A017] shadow-sm" : "text-[#C19A6B]"}`}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <IconGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-[#2A211B] text-[#D4A017] shadow-sm" : "text-[#C19A6B]"}`}
                  title="List View"
                  aria-label="List View"
                >
                  <IconList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState onReset={resetFilters} onSelectCategory={setCategory} />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {filteredProducts.map((product) => {
                const cartValue = cart[product.id];
                const quantity = typeof cartValue === "number" ? cartValue : cartValue?.qty || 0;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={quantity}
                    isFavorite={favorites.some((favorite) => favorite.id === product.id)}
                    viewMode={viewMode}
                    onAdd={() => updateQty(product.id, 1)}
                    onIncrement={() => updateQty(product.id, 1)}
                    onDecrement={() => updateQty(product.id, -1)}
                    onToggleFavorite={toggleFavorite}
                    onClick={setSelectedProduct}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
