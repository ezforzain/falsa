import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { IconBox, IconChevronLeft, IconChevronRight, IconClose, IconSearch, IconZoomIn } from './icons';
import ZoomableImage from './ZoomableImage';

// A single <img> that swaps itself for a neutral placeholder if the URL fails to load —
// seller-supplied image URLs aren't validated server-side beyond "looks like a string",
// so a broken link shouldn't break the gallery around it.
function SafeImage({ src, alt, className, onClick, onPointerDown, onPointerUp, draggable }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-muted text-text-muted`} onClick={onClick}>
        <IconBox width="28" height="28" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onError={() => setFailed(true)}
      draggable={draggable}
    />
  );
}

/**
 * Reusable product image gallery: swipeable carousel (Embla) with loop, prev/next arrows,
 * keyboard arrow-key navigation, pagination dots, clickable thumbnails, and a click-to-zoom
 * lightbox. Automatically collapses to a plain static image (no arrows/dots) when there's
 * only one image.
 */
export default function ImageGallery({
  images,
  alt,
  heightClassName = 'h-[280px] sm:h-[360px] lg:h-[440px]',
  radiusClassName = 'rounded-2xl',
  thumbHeightClassName = 'h-[64px]',
  badge = null,
  // 'cover' (default, fills the frame and crops) or 'contain' (shows the whole image, letterboxed
  // if its aspect ratio doesn't match the frame) — product detail pages want 'contain' so a seller's
  // photo is never cropped, while dense grids/cards elsewhere keep the 'cover' look.
  fit = 'cover',
}) {
  const safeImages = images && images.length > 0 ? images : [];
  const multi = safeImages.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: multi, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const scrollTo = useCallback((i) => emblaApi?.scrollTo(i), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  // Keyboard navigation — ignored while the user is typing in a form field elsewhere on the page.
  useEffect(() => {
    if (!multi) return;
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') scrollPrev();
      else if (e.key === 'ArrowRight') scrollNext();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [multi, scrollPrev, scrollNext]);

  // Zoom lightbox: Escape to close, arrow keys to browse while open.
  useEffect(() => {
    if (!zoomOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setZoomOpen(false);
      else if (e.key === 'ArrowLeft') scrollPrev();
      else if (e.key === 'ArrowRight') scrollNext();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [zoomOpen, scrollPrev, scrollNext]);

  // Distinguish a tap/click (open zoom) from a drag/swipe (change slide) by movement + time,
  // rather than depending on Embla's internals.
  const pointerStart = useRef(null);
  const onImagePointerDown = (e) => {
    pointerStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onImagePointerUp = (e) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
    const elapsed = Date.now() - start.t;
    if (moved < 8 && elapsed < 500) setZoomOpen(true);
  };

  if (safeImages.length === 0) return null;

  return (
    <div>
      {/* Main image / carousel */}
      <div className={`relative w-full ${heightClassName} ${radiusClassName} overflow-hidden group bg-surface-muted`}>
        <div className="h-full overflow-hidden" ref={multi ? emblaRef : undefined}>
          <div className="flex h-full">
            {safeImages.map((src, i) => (
              <div key={i} className="relative flex-[0_0_100%] h-full overflow-hidden">
                <SafeImage
                  src={src}
                  alt={`${alt} — photo ${i + 1} of ${safeImages.length}`}
                  className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} cursor-zoom-in select-none transition-transform duration-300 ease-out ${fit === 'contain' ? '' : 'group-hover:scale-[1.06]'}`}
                  onPointerDown={onImagePointerDown}
                  onPointerUp={onImagePointerUp}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {badge}

        {multi && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-ink cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <IconChevronLeft width="16" height="16" strokeWidth="2.6" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-ink cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <IconChevronRight width="16" height="16" strokeWidth="2.6" />
            </button>
          </>
        )}

        {multi && (
          <span className="absolute bottom-3 left-3 bg-black/50 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full pointer-events-none">
            {selectedIndex + 1}/{safeImages.length}
          </span>
        )}

        <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/45 flex items-center justify-center text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none">
          <IconSearch width="14" height="14" />
        </span>
      </div>

      {/* Pagination dots */}
      {multi && (
        <div className="flex items-center justify-center gap-2 mt-3.5">
          {safeImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === selectedIndex}
              className={`cursor-pointer rounded-full transition-all duration-300 ${
                i === selectedIndex ? 'w-6 h-[7px] bg-green' : 'w-[7px] h-[7px] bg-border-strong hover:bg-text-muted'
              }`}
            />
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {multi && (
        <div className="grid gap-2 sm:gap-3 mt-3" style={{ gridTemplateColumns: `repeat(${Math.min(safeImages.length, 5)}, 1fr)` }}>
          {safeImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Show image ${i + 1}`}
              className={`${thumbHeightClassName} rounded-lg overflow-hidden cursor-pointer transition-colors`}
              style={{ border: `2px solid ${i === selectedIndex ? '#0E5A46' : '#E4E0D6'}` }}
            >
              <SafeImage src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 px-4" onClick={() => setZoomOpen(false)}>
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer p-2"
          >
            <IconClose width="26" height="26" />
          </button>

          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollPrev();
                }}
                aria-label="Previous image"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <IconChevronLeft width="20" height="20" strokeWidth="2.4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollNext();
                }}
                aria-label="Next image"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <IconChevronRight width="20" height="20" strokeWidth="2.4" />
              </button>
            </>
          )}

          <div className="w-full h-[85vh] animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <ZoomableImage
              src={safeImages[selectedIndex]}
              alt={alt}
              resetKey={selectedIndex}
              onSwipeLeft={multi ? scrollNext : undefined}
              onSwipeRight={multi ? scrollPrev : undefined}
            />
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
            <span className="flex items-center gap-1.5 text-white/60 text-[11px] font-medium">
              <IconZoomIn width="12" height="12" />
              Pinch or double-tap to zoom
            </span>
            {multi && (
              <div className="text-white/70 text-xs font-medium">
                {selectedIndex + 1} / {safeImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
