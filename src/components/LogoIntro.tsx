import { useEffect, useState } from "react";
import logoAsset from "@/assets/logo.jpg.asset.json";

export function LogoIntro() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("sara-intro-seen")) {
      setGone(true);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem("sara-intro-seen", "1");
      setGone(true);
    }, 3400);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="intro-curtain fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "var(--gradient-petal)" }}
      />
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <span className="intro-halo absolute inset-0 rounded-full bg-primary/40 blur-2xl" />
          <img
            src={logoAsset.url}
            alt="مركز سارة للحلويات"
            width={220}
            height={220}
            className="intro-seal relative h-44 w-44 object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:h-56 sm:w-56"
          />
        </div>
        <h1 className="intro-text mt-8 text-3xl text-ink sm:text-4xl">مركز سارة للحلويات</h1>
        <span className="intro-text mt-3 block h-px w-32 bg-primary/70" />
        <p className="intro-text mt-3 text-sm tracking-[0.3em] text-muted-foreground">
          SARA CENTER FOR SWEETS
        </p>
      </div>
    </div>
  );
}
