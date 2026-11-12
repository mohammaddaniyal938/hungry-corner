import { IconRotateCcw } from "./Icons";
import { Utensils } from "lucide-react";

export default function EmptyState({ onReset, onSelectCategory }) {
  const quickPills = ["Burgers", "Shawarma", "Pizza", "Sides"];

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-[#2A211B] rounded-3xl border border-[#F5EBDD]/10 p-8 shadow-sm">
      <div className="w-20 h-20 rounded-full bg-[#3B3020] text-[#D4A017] flex items-center justify-center text-4xl mb-4 stamp-badge">
        <Utensils className="h-9 w-9" aria-hidden="true" />
      </div>

      <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#F5EBDD] mb-2">
        No Sizzling Dishes Match Your Filter
      </h3>

      <p className="text-xs sm:text-sm text-[#C19A6B] max-w-sm mb-6 leading-relaxed font-normal">
        Try clearing your search keyword, adjusting your price range, or explore our popular
        categories below.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {quickPills.map((pill) => (
          <button
            key={pill}
            onClick={() => onSelectCategory(pill)}
            className="px-3.5 py-1.5 rounded-full bg-[#2A211B] hover:bg-[#D4A017] text-[#F5EBDD] hover:text-white text-xs font-bold transition-all shadow-sm"
          >
            {pill}
          </button>
        ))}
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 bg-[#D4A017] hover:bg-[#B98B12] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold shadow-lg shadow-[#D4A017]/30 active:scale-95 transition-all"
      >
        <IconRotateCcw className="w-4 h-4" />
        <span>Reset All Filters</span>
      </button>
    </div>
  );
}
