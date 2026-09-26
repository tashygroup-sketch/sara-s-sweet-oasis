import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMenu } from "@/lib/shop.functions";
import { LogoIntro } from "@/components/LogoIntro";
import { Reveal } from "@/components/Reveal";
import { BookingDialog } from "@/components/BookingDialog";
import { useCart } from "@/lib/cart";
import logoAsset from "@/assets/logo.jpg.asset.json";
import cakeAsset from "@/assets/cake.jpg.asset.json";
import macaronAsset from "@/assets/macaron.jpg.asset.json";

const menuQuery = queryOptions({ queryKey: ["menu"], queryFn: () => getMenu() });

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  head: () => ({
    meta: [
      { title: "مركز سارة للحلويات | حلويات فاخرة" },
      {
        name: "description",
        content:
          "مركز سارة للحلويات — كيك المناسبات، كب كيك، ماكارون وحلويات عربية. احجز طلبك بسهولة عبر واتساب.",
      },
      { property: "og:title", content: "مركز سارة للحلويات" },
      {
        property: "og:description",
        content: "حلويات فاخرة لكل مناسبة — احجز طلبك الآن من مركز سارة للحلويات.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: menu } = useSuspenseQuery(menuQuery);
  const { lines, add, setQty, count, total } = useCart();
  const [booking, setBooking] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const available = menu.filter((m) => m.is_available);
  const categories = [...new Set(available.map((m) => m.category))];

  return (
    <div className="relative overflow-x-hidden">
      <LogoIntro />

      {/* header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="شعار مركز سارة للحلويات"
              width={48}
              height={48}
              className="h-11 w-11 object-contain"
            />
            <span className="text-lg text-ink">مركز سارة للحلويات</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full border border-border px-4 py-2 text-sm text-ink"
            >
              السلة
              {count > 0 && (
                <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setBooking(true)}
              className="rounded-full px-5 py-2 text-sm font-medium text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-pink)" }}
            >
              احجز
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative isolate overflow-hidden px-4 pt-16 pb-24 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--gradient-petal)" }}
        />
        <div className="pointer-events-none absolute -top-16 -right-10 -z-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <Reveal variant="zoom">
          <img
            src={logoAsset.url}
            alt="مركز سارة للحلويات"
            width={260}
            height={260}
            className="float-slow mx-auto h-40 w-40 object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.2)] sm:h-52 sm:w-52"
          />
        </Reveal>
        <Reveal delay={150}>
          <h1 className="mt-8 text-4xl leading-tight text-ink sm:text-5xl">حلويات تُصنع بالحب</h1>
        </Reveal>
        <Reveal delay={280}>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            كيك المناسبات، كب كيك، ماكارون وحلويات عربية — نُحضّرها طازجة كل يوم لتكون مناسبتك أحلى.
          </p>
        </Reveal>
        <Reveal delay={420}>
          <button
            onClick={() => setBooking(true)}
            className="mt-8 rounded-full px-10 py-4 text-lg font-medium text-primary-foreground shadow-[var(--shadow-soft)]"
            style={{ backgroundImage: "var(--gradient-pink)" }}
          >
            احجز طلبك
          </button>
        </Reveal>
      </section>

      {/* story */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <Reveal>
          <p className="text-center text-sm tracking-[0.35em] text-primary">قصتنا</p>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="mt-4 text-center text-3xl text-ink">لمسة سارة في كل قطعة</h2>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-5 max-w-xl text-center leading-8 text-muted-foreground">
            من مطبخ صغير إلى مركز متكامل للحلويات، نختار أجود المكوّنات ونُزيّن كل طبق بعناية لتصل
            إليك قطعة تليق بفرحتك.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-4">
          <Reveal variant="side">
            <img
              src={cakeAsset.url}
              alt="كيكة مناسبات وردية"
              loading="lazy"
              width={1024}
              height={1024}
              className="h-56 w-full rounded-3xl object-cover shadow-[var(--shadow-card)] sm:h-72"
            />
          </Reveal>
          <Reveal variant="side" delay={180}>
            <img
              src={macaronAsset.url}
              alt="ماكارون وردي"
              loading="lazy"
              width={1024}
              height={1024}
              className="mt-8 h-56 w-full rounded-3xl object-cover shadow-[var(--shadow-card)] sm:h-72"
            />
          </Reveal>
        </div>
      </section>

      {/* menu */}
      <section id="menu" className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <p className="text-center text-sm tracking-[0.35em] text-primary">المنيو</p>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="mt-4 text-center text-3xl text-ink">اختاري ما يحلو لكِ</h2>
        </Reveal>

        {categories.map((cat, ci) => (
          <div key={cat} className="mt-12">
            <Reveal>
              <h3 className="text-xl text-ink">{cat}</h3>
            </Reveal>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {available
                .filter((m) => m.category === cat)
                .map((item, i) => (
                  <Reveal key={item.id} delay={i * 110 + ci * 40} variant="up">
                    <article className="group overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          width={1024}
                          height={1024}
                          className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="p-5">
                        <h4 className="text-lg text-ink">{item.name}</h4>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {Number(item.price).toFixed(2)} د.ل
                          </span>
                          <button
                            onClick={() =>
                              add({
                                id: item.id,
                                name: item.name,
                                price: Number(item.price),
                                image_url: item.image_url,
                              })
                            }
                            className="rounded-full border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            أضف للسلة
                          </button>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
            </div>
          </div>
        ))}
      </section>

      {/* contact */}
      <footer
        className="mt-10 px-4 py-16 text-center"
        style={{ background: "var(--gradient-petal)" }}
      >
        <Reveal variant="zoom">
          <img
            src={logoAsset.url}
            alt="شعار المركز"
            loading="lazy"
            width={120}
            height={120}
            className="mx-auto h-24 w-24 object-contain"
          />
        </Reveal>
        <Reveal delay={120}>
          <h2 className="mt-6 text-2xl text-ink">اطلب الآن</h2>
          <p className="mt-2 text-muted-foreground" dir="ltr">
            0915756638
          </p>
          <button
            onClick={() => setBooking(true)}
            className="mt-6 rounded-full px-8 py-3 font-medium text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-pink)" }}
          >
            احجز
          </button>
          <p className="mt-8 text-xs text-muted-foreground">© مركز سارة للحلويات</p>
        </Reveal>
      </footer>

      {/* cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/40 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="animate-scale-in w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-ink">سلة الطلبات</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full px-3 py-1 hover:bg-muted"
              >
                ✕
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">السلة فارغة</p>
            ) : (
              <>
                <div className="mt-5 space-y-3">
                  {lines.map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      {l.image_url && (
                        <img
                          src={l.image_url}
                          alt={l.name}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-ink">{l.name}</p>
                        <p className="text-sm text-muted-foreground">{l.price.toFixed(2)} د.ل</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(l.id, l.qty - 1)}
                          className="h-8 w-8 rounded-full bg-muted"
                        >
                          −
                        </button>
                        <span>{l.qty}</span>
                        <button
                          onClick={() => setQty(l.id, l.qty + 1)}
                          className="h-8 w-8 rounded-full bg-muted"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-between border-t border-border pt-4 font-bold text-ink">
                  <span>الإجمالي</span>
                  <span>{total.toFixed(2)} د.ل</span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setBooking(true);
                  }}
                  className="mt-5 w-full rounded-full px-6 py-3 font-medium text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-pink)" }}
                >
                  احجز الآن
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BookingDialog open={booking} onClose={() => setBooking(false)} />
    </div>
  );
}
