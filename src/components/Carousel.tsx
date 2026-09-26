import { useRef, useState } from "react";

export function Carousel({
  images,
  heightClassName = "h-64",
}: {
  images: string[];
  heightClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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

  if (images.length === 0) return null;

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className={`scrollbar-none flex snap-x snap-mandatory overflow-x-auto bg-muted ${heightClassName}`}
      >
        {images.map((src, i) => (
          <div key={i} className="flex w-full shrink-0 snap-center items-center justify-center">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
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
