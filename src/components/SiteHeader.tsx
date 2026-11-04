import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCartStore, cartCount } from "../store/cart";
import { ROPERO_URL } from "../lib/routes";

// "#x" baja a una sección de la landing; "/ropero/" es una página propia.
const LINKS = [
  { href: "#caida-libre", label: "Trajes técnicos" },
  { href: ROPERO_URL, label: "El Ropero" },
];

const onRoperoPage = () => window.location.pathname.startsWith(ROPERO_URL);

function scrollToId(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SiteHeader() {
  const lines = useCartStore((s) => s.lines);
  const openCart = useCartStore((s) => s.open);
  const count = cartCount(lines);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(() =>
    onRoperoPage() ? ROPERO_URL : (LINKS.find((l) => l.href === window.location.hash)?.href ?? LINKS[0].href),
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(href: string) {
    setMobileOpen(false);
    if (!href.startsWith("#")) {
      if (!onRoperoPage()) window.location.assign(href);
      return;
    }
    if (onRoperoPage()) {
      window.location.assign(`/${href}`);
      return;
    }
    setActive(href);
    scrollToId(href);
  }

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`sticky top-0 z-40 border-b transition-[height,background-color] duration-300 ${
        scrolled ? "border-line bg-ink/92 backdrop-blur-md" : "border-transparent bg-ink"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-[height] duration-300 ${
          scrolled ? "h-[64px]" : "h-[88px]"
        }`}
      >
        <a
          href="/#caida-libre"
          onClick={(e) => {
            e.preventDefault();
            go("#caida-libre");
          }}
          className="flex items-center gap-2.5"
        >
          <img src="/images/brand/forty-five-isotipo-white.png" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
          <img src="/images/brand/forty-five-horizontal-white.png" alt="Forty Five" className="h-4 object-contain sm:h-[18px]" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => go(link.href)}
              className={`font-display relative pb-1 text-xs tracking-[0.12em] uppercase transition ${
                active === link.href ? "text-paper" : "text-paper-dim hover:text-paper"
              }`}
            >
              {link.label}
              {active === link.href ? (
                <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-[2px] bg-orange" />
              ) : null}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Buscar"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-paper transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:flex"
          >
            <Search size={18} />
          </button>
          <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={openCart}
            aria-label={`Carrito, ${count} artículos`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-paper transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <ShoppingBag size={18} />
            {count > 0 ? (
              <span className="tnum absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-ink">
                {count}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-paper transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-1 border-t border-line px-5 py-4 lg:hidden"
        >
          {LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => go(link.href)}
              className={`font-display py-2 text-left text-sm tracking-[0.08em] uppercase ${
                active === link.href ? "text-orange" : "text-paper-dim"
              }`}
            >
              {link.label}
            </button>
          ))}
        </motion.nav>
      ) : null}
    </motion.header>
  );
}
