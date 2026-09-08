import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

// Read-only display of a seller's promo/sale banners (see PromoBannerManager.jsx, where they're
// managed) on their public store page — auto-advances like a typical storefront sale carousel,
// pausing while the shopper's pointer is over it. Collapses to a single static image with no
// dots/autoplay when there's only one banner.
export default function PromoBannerCarousel({ banners, className = '' }) {
  const multi = banners.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: multi, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !multi || paused) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => clearInterval(interval);
  }, [emblaApi, multi, paused]);

  if (banners.length === 0) return null;

  return (
    <div
      className={`relative w-full h-[120px] sm:h-[180px] rounded-2xl overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="h-full overflow-hidden" ref={multi ? emblaRef : undefined}>
        <div className="flex h-full">
          {banners.map((b) => (
            <div key={b.id} className="relative flex-[0_0_100%] h-full overflow-hidden">
              <img src={b.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {multi && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to banner ${i + 1}`}
              aria-current={i === selectedIndex}
              className={`cursor-pointer rounded-full transition-all duration-300 ${
                i === selectedIndex ? 'w-6 h-[7px] bg-white' : 'w-[7px] h-[7px] bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
