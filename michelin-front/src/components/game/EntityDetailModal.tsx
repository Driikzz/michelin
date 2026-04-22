import { entityImage, michelinStarCount, priceLabel } from '../../contexts/GameContext';
import type { Entity } from '../../types/api';

interface Props {
  entity: Entity;
  inDeck: boolean;
  onAdd: () => void;
  onClose: () => void;
}

export function EntityDetailModal({ entity, inDeck, onAdd, onClose }: Props) {
  const stars = michelinStarCount(entity.michelin_rank);
  const image = entityImage(entity, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          <img src={image} alt={entity.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
          {stars > 0 && (
            <div className="absolute bottom-4 left-4 flex gap-1">
              {Array.from({ length: stars }).map((_, i) => (
                <span key={i} className="material-symbols-outlined text-yellow-400 drop-shadow" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-black text-on-surface leading-tight">{entity.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              {priceLabel(entity.price_category) && (
                <span className="text-sm font-bold text-primary-container">{priceLabel(entity.price_category)}</span>
              )}
              {entity.city && (
                <span className="text-sm text-on-surface/50 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                  {entity.city}
                </span>
              )}
            </div>
          </div>

          {entity.description && (
            <p className="text-sm text-on-surface/70 leading-relaxed italic">"{entity.description}"</p>
          )}

          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container-low border border-outline-variant/20 text-on-surface/70"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => { onAdd(); onClose(); }}
            disabled={inDeck}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              inDeck
                ? 'bg-surface-container-low text-on-surface/40 cursor-default'
                : 'bg-primary-container text-on-primary hover:bg-primary shadow-[0_8px_20px_rgba(186,11,47,0.25)] hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              {inDeck ? 'check' : 'add'}
            </span>
            {inDeck ? 'Déjà dans le deck' : 'Ajouter au deck'}
          </button>
        </div>
      </div>
    </div>
  );
}
