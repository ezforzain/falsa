import ProductCard from '../ProductCard';

// Shared grid used by both the "Related Products" and "Recently Viewed Products" sections —
// visually identical, only the title and product list differ. Renders nothing if there's no
// data (no empty section left dangling for a fresh visitor with no view history, for example).
export default function ProductRail({ title, products }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-8">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight mb-5">{title}</h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
