import { useState } from "react";
import { countReviews } from "../data/product-rating";
import { IconStar, IconHeart, IconPlus, IconMinus, IconClock, IconFlame } from "./Icons";

export default function ProductCard({
  product,
  quantity = 0,
  isFavorite = false,
  onAdd,
  onIncrement,
  onDecrement,
  onToggleFavorite,
  onClick,
  viewMode = "grid",
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const reviewCount = countReviews(product.id);

  const fallbackImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80";

  // List View Layout
  if (viewMode === "list") {
    return (
      <div
        onClick={() => onClick(product)}
        className="group bg-[#2A211B] rounded-2xl border border-[#F5EBDD]/10 p-3 sm:p-4 shadow-sm hover:shadow-xl hover:border-[#D4A017]/40 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden"
      >
        {/* Image */}
        <div className="relative w-full sm:w-44 h-36 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-[#2A211B]">
          {!imageLoaded && !imageError && <div className="absolute inset-0 skeleton-shimmer" />}
          <img
            src={imageError ? fallbackImage : product.image}
            alt={product.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {product.badge && (
            <span className="absolute top-2 left-2 bg-[#D4A017] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A017] bg-[#3B3020] px-2.5 py-0.5 rounded-full">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-[#F5EBDD]">
              <IconStar className="w-3.5 h-3.5 text-[#C19A6B]" />
              <span>{product.rating}</span>
              <span className="text-[#C19A6B] font-normal">({reviewCount})</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-base sm:text-lg text-[#F5EBDD] group-hover:text-[#D4A017] transition-colors truncate">
            {product.title}
          </h3>

          <p className="text-xs text-[#C19A6B] line-clamp-2 mt-1 mb-2 font-normal">
            {product.description}
          </p>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F5EBDD]/5">
            <div className="flex items-baseline gap-1">
              <span className="font-display font-extrabold text-lg sm:text-xl text-[#D4A017]">
                Rs. {product.price.toLocaleString()}
              </span>
            </div>

            {/* Stepper or Add */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(product);
                }}
                className="w-8 h-8 rounded-full bg-[#2A211B] hover:bg-[#3B3020] flex items-center justify-center text-[#F5EBDD] transition-colors"
                aria-label="Favorite"
              >
                <IconHeart
                  className={`w-4 h-4 ${isFavorite ? "text-[#D4A017] fill-[#D4A017]" : "text-[#C19A6B]"}`}
                />
              </button>

              {quantity > 0 ? (
                <div className="flex items-center gap-1.5 bg-[#171513] text-white rounded-full p-1 shadow">
                  <button
                    onClick={onDecrement}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-[#D4A017] flex items-center justify-center text-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <IconMinus className="w-3 h-3" />
                  </button>
                  <span className="font-extrabold text-xs min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={onIncrement}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-[#D4A017] flex items-center justify-center text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <IconPlus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAdd}
                  className="bg-[#D4A017] hover:bg-[#B98B12] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-[#D4A017]/25 transition-all active:scale-95 flex items-center gap-1"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Layout
  return (
    <div
      onClick={() => onClick(product)}
      className="group bg-[#2A211B] rounded-3xl border border-[#F5EBDD]/10 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#D4A017]/40 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col relative"
    >
      {/* Top Image Container */}
      <div className="relative w-full h-52 bg-[#2A211B] overflow-hidden">
        {!imageLoaded && !imageError && <div className="absolute inset-0 skeleton-shimmer" />}
        <img
          src={imageError ? fallbackImage : product.image}
          alt={product.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Gradient Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <span className="bg-[#D4A017] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
              {product.badge}
            </span>
          )}
          {product.isSpicy && (
            <span className="bg-[#171513]/85 backdrop-blur-md text-[#C19A6B] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
              <IconFlame className="w-3 h-3 text-[#D4A017]" /> Spicy
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-[#2A211B] text-[#F5EBDD] backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all z-10"
          aria-label="Save to favorites"
        >
          <IconHeart
            className={`w-4 h-4 ${isFavorite ? "text-[#D4A017] fill-[#D4A017]" : "text-[#C19A6B]"}`}
          />
        </button>

        {/* Prep Time pill */}
        {product.prepTime && (
          <div className="absolute bottom-3 left-3 bg-[#171513]/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
            <IconClock className="w-3 h-3 text-white/70" />
            <span>{product.prepTime}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A017] bg-[#3B3020] px-2.5 py-0.5 rounded-full">
              {product.category}
            </span>

            <div className="flex items-center gap-1 text-xs font-bold text-[#F5EBDD]">
              <IconStar className="w-3.5 h-3.5 text-[#C19A6B]" />
              <span>{product.rating}</span>
              <span className="text-[#C19A6B] font-normal text-[11px]">({reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5EBDD] group-hover:text-[#D4A017] transition-colors leading-snug">
            {product.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-[#C19A6B] line-clamp-2 mt-2 leading-relaxed font-normal">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button Footer */}
        <div className="pt-4 mt-4 border-t border-[#F5EBDD]/10 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#C19A6B] font-medium uppercase tracking-wider">
              Price
            </span>
            <span className="font-display font-extrabold text-xl sm:text-2xl text-[#D4A017]">
              Rs. {product.price.toLocaleString()}
            </span>
          </div>

          {/* Quantity Controls / Add to Cart */}
          <div onClick={(e) => e.stopPropagation()}>
            {quantity > 0 ? (
              <div className="flex items-center gap-2 bg-[#171513] text-white rounded-full p-1 shadow-lg">
                <button
                  onClick={onDecrement}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#D4A017] flex items-center justify-center text-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  <IconMinus className="w-3.5 h-3.5" />
                </button>
                <span className="font-extrabold text-sm min-w-[22px] text-center">{quantity}</span>
                <button
                  onClick={onIncrement}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#D4A017] flex items-center justify-center text-white transition-colors"
                  aria-label="Increase quantity"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAdd}
                className="bg-[#D4A017] hover:bg-[#B98B12] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-lg shadow-[#D4A017]/25 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <IconPlus className="w-4 h-4" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
