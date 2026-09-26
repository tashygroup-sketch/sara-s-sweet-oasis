import { useEffect, useRef, useState } from "react";

export type CarouselImage = { url: string; ratio?: number | null };

// Fallback only: for photos uploaded before their ratio was measured and stored in the
// database, we still need *some* way to size the frame. This probes the photo directly
// with a detached Image object (handler attached before src is set, so a cached photo
// can't finish loading before we're listening). New uploads skip this path entirely —
// their ratio is already known from the moment the page loads.
function useFallbackRatio(src: string, skip: boolean, onRatio: (ratio: number) => void) {
  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled && probe.naturalWidth > 0) {
        onRatio(probe.naturalHeight / probe.naturalWidth);
      }
    };
    probe.src = src;
    if (probe.complete && probe.naturalWidth > 0) {
      onRatio(probe.naturalHeight / probe.naturalWidth);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, skip]);
}

function Slide({
  image,
  onMeasured,
}: {
  image: CarouselImage;
  onMeasured: (ratio: number) => void;
}) {
  const known = typeof image.ratio === "number" ? image.ratio : null;
  useFallbackRatio(image.url, known !== null, onMeasured);
  return (
    <div className="w-full shrink-0 snap-center">
      <img src={image.url} alt="" className="h-full w-full object-contain" />
    </div>
  );
}

export function Carousel({ images }: { images: CarouselImage[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [measured, setMeasured] = useState<Record<number, number>>({});

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

  const activeImage = images[active];
  const ratio =
    (typeof activeImage?.ratio === "number" ? activeImage.ratio : null) ?? measured[active] ?? 0.8;

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{ aspectRatio: `1 / ${ratio}` }}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto transition-[aspect-ratio] duration-300 ease-out"
      >
        {images.map((img, i) => (
          <Slide
            key={img.url}
            image={img}
            onMeasured={(r) => setMeasured((prev) => ({ ...prev, [i]: r }))}
          />
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
