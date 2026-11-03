import { DashboardPanel } from "./DashboardPanel";

interface CategoryProductCardProps {
  title: string;
  index: string;
  image: string;
  alt: string;
  caption: string;
  onClick: () => void;
}

export function CategoryProductCard({ title, index, image, alt, caption, onClick }: CategoryProductCardProps) {
  return (
    <DashboardPanel as="button" title={title} index={index} onClick={onClick} ariaLabel={`${title} — ${caption}`}>
      <div className="relative flex-1 overflow-hidden bg-ink">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </div>
      <div className="px-4 py-3">
        <span className="font-display tnum text-[10px] tracking-[0.1em] text-paper-dim uppercase">{caption}</span>
      </div>
    </DashboardPanel>
  );
}
