import { IconArrowRight, IconClock, IconSparkles } from "./Icons";

export default function MidnightFeastSection({ onClaimDeal }) {
  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#2A211B] text-white shadow-2xl shadow-[#171513]/15 border border-[#F5EBDD]/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="relative min-h-[240px] sm:min-h-[300px] lg:min-h-[380px] w-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=85"
              alt="Stacked burgers fresh from the grill"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="eager"
              onError={(event) => {
                event.currentTarget.src =
                  "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=85";
              }}
            />
            <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-[#D4A017] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#D4A017]/30">
              <IconSparkles className="w-3.5 h-3.5 text-white" /> After-dark special
            </span>
          </div>

          <div className="relative flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-12">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#C19A6B]">
              <IconClock className="w-4 h-4 text-[#D4A017]" /> Served until 4:00 AM
            </p>
            <h2 className="font-display mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight text-white">
              Karachi Midnight Due Feast
            </h2>
            <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-white/80 font-normal">
              When the city gets hungry after dark, bring home a table full of smoky burgers, crispy
              sides, and ice-cold drinks made for sharing.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                onClick={onClaimDeal}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4A017] px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-[#D4A017]/25 transition-all hover:bg-[#B98B12] active:scale-95 cursor-pointer"
              >
                <span>Taste the midnight menu</span>
                <IconArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[#C19A6B]">
                Free delivery over Rs. 1,500
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
