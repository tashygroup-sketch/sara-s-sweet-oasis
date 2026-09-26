import { useRef, useState } from "react";

export function Carousel({ images }: { images: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Each photo's own height/width ratio, captured once it loads, so the frame can match
  // that exact photo instead of cropping it or leaving empty space around it.
  const [ratios, setRatios] = useState<Record<number, number>>({});

  function handleScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function handleLoad(i: number, e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth > 0) {
      setRatios((r) => ({ ...r, [i]: img.naturalHeight / img.naturalWidth }));
    }
  }

  if (images.length === 0) return null;

  const ratio = ratios[active] ?? 0.8;

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{ aspectRatio: `1 / ${ratio}` }}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto transition-[aspect-ratio] duration-300 ease-out"
      >
        {images.map((src, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            <img
              src={src}
              alt=""
              onLoad={(e) => handleLoad(i, e)}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`صورة ${i + 1} من ${images.length}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-4 bg-primary" : "w-1.5 bg-primary/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
