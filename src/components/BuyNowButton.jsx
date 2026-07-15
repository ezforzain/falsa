// Full-width primary CTA for the variant sheet's sticky footer — reusable anywhere a
// "Buy Now"-style action is needed (loading spinner + disabled state built in).
export default function BuyNowButton({ onClick, disabled = false, loading = false, label = 'Buy Now', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover active:bg-orange-hover text-white font-bold text-[15.5px] py-[15px] rounded-full shadow-[0_8px_20px_rgba(201,123,45,0.35)] transition-all active:scale-[0.98] ${className}`}
    >
      {loading && (
        <span
          className="w-4 h-4 border-[2.5px] border-white/35 rounded-full inline-block"
          style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }}
        />
      )}
      {loading ? 'Processing…' : label}
    </button>
  );
}
