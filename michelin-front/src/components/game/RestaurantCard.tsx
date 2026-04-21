import { useTranslation } from 'react-i18next';
import { MichelinStars } from '../ui/MichelinStars';

interface Restaurant {
  id: string;
  name: string;
  stars: number;
  priceRange: string;
  location: string;
  cuisine: string;
  quote: string;
  image: string;
  sponsored?: boolean;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onAdd?: () => void;
  onView?: () => void;
  added?: boolean;
}

export function RestaurantCard({ restaurant, onAdd, onView, added }: RestaurantCardProps) {
  const { t } = useTranslation();

  return (
    <article className="w-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(28,27,27,0.06)] relative group border border-transparent hover:border-primary-container/20 transition-colors">
      {restaurant.sponsored && (
        <div className="absolute top-4 left-4 z-10 bg-primary-container text-on-primary px-3 py-1 rounded-full text-[0.65rem] uppercase tracking-widest font-bold flex items-center gap-1 shadow-md">
          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          {t('deck.sponsored')}
        </div>
      )}
      <div className="h-56 md:h-64 w-full relative overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-90" />
      </div>
      <div className="p-6 flex flex-col gap-4 -mt-8 z-10 relative bg-surface-container-lowest rounded-t-xl mx-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface tracking-tight">{restaurant.name}</h2>
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-secondary mt-1">
              <span className="font-semibold text-on-surface">{restaurant.priceRange}</span>
              <span className="w-1 h-1 rounded-full bg-secondary-fixed-dim inline-block" />
              <span>{restaurant.location}</span>
            </div>
          </div>
          <MichelinStars count={restaurant.stars} size="md" />
        </div>
        <p className="text-sm leading-relaxed text-secondary border-l-2 border-primary-container/30 pl-4 italic">
          {restaurant.quote}
        </p>
        <div className="flex gap-3">
          {onAdd && (
            <button
              onClick={onAdd}
              className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 ${
                added
                  ? 'bg-surface-container-high text-on-surface/60'
                  : 'bg-primary-container text-on-primary hover:bg-primary shadow-[0_10px_20px_rgba(186,11,47,0.15)]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{added ? 'check' : 'add_circle'}</span>
              {added ? t('deck.added') : t('deck.addToDeck')}
            </button>
          )}
          {onView && (
            <button
              onClick={onView}
              className="flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
              {t('deck.details')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
