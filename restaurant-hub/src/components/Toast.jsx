import { IconCheckCircle, IconInfo, IconX } from "./Icons";

export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[120] animate-slide-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium backdrop-blur-md ${
          isSuccess
            ? "bg-[#171513]/95 text-white border-white/10 shadow-black/30"
            : "bg-[#D4A017] text-white border-red-400/30"
        }`}
      >
        <span className={isSuccess ? "text-[#D4A017]" : "text-white"}>
          {isSuccess ? (
            <IconCheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <IconInfo className="w-5 h-5" />
          )}
        </span>
        <span className="max-w-xs">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss toast"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
