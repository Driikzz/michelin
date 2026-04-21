interface MichelinStarsProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

export function MichelinStars({ count, size = 'md' }: MichelinStarsProps) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-0.5 text-primary-container">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${sizeMap[size]} drop-shadow-sm`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}
