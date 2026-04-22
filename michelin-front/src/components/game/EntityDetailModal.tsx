import { useEffect, useRef } from 'react';
import { entityImage, michelinStarCount, priceLabel } from '../../contexts/GameContext';
import type { Entity, HoursSlot } from '../../types/api';

interface Props {
  entity: Entity;
  inDeck: boolean;
  onAdd: () => void;
  onClose: () => void;
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer',
  thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function formatTime(t: string): string {
  // t is like "T12:00:00"
  return t.replace('T', '').slice(0, 5);
}

function getTodayKey(): string {
  return DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function TodayHours({ hours }: { hours: Record<string, HoursSlot[]> }) {
  const key = getTodayKey();
  const slots = hours[key];
  if (!slots || slots.length === 0) return <span className="text-on-surface/40 text-xs">Fermé aujourd'hui</span>;
  const open = slots.filter((s) => !s.closed);
  if (open.length === 0) return <span className="text-on-surface/40 text-xs">Fermé aujourd'hui</span>;
  return (
    <span className="text-xs text-on-surface/70">
      {open.map((s, i) => (
        <span key={i}>{i > 0 && ' · '}{formatTime(s.opens)} – {formatTime(s.closes)}</span>
      ))}
    </span>
  );
}

export function EntityDetailModal({ entity, inDeck, onAdd, onClose }: Props) {
  const stars = michelinStarCount(entity.michelin_rank);
  const image = entityImage(entity, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80');
  const sortedDays = entity.days_open
    ? DAY_ORDER.filter((d) => entity.days_open!.includes(d))
    : null;
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-entity-title"
        className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
          <img src={image} alt={entity.name} className="w-full h-full object-cover" />
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>close</span>
          </button>
          <div className="absolute bottom-4 left-4 flex gap-1 items-center">
            {Array.from({ length: stars }).map((_, i) => (
              <span key={i} className="material-symbols-outlined text-yellow-400 drop-shadow" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>star</span>
            ))}
            {entity.green_star && (
              <span
                className="material-symbols-outlined text-green-400 drop-shadow"
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                title="Étoile Verte Michelin"
              >
                eco
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h2 id="modal-entity-title" className="text-xl font-black text-on-surface leading-tight">{entity.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {priceLabel(entity.price_category) && (
                <span className="text-sm font-bold text-primary-container">{priceLabel(entity.price_category)}</span>
              )}
              {entity.city && (
                <span className="text-sm text-on-surface/50 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                  {entity.city}
                </span>
              )}
              {entity.chef && (
                <span className="text-sm text-on-surface/50 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>chef_hat</span>
                  {entity.chef}
                </span>
              )}
            </div>
          </div>

          {entity.description && (
            <p className="text-sm text-on-surface/70 leading-relaxed italic">"{entity.description}"</p>
          )}

          {/* Days open */}
          {sortedDays && sortedDays.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex gap-1 flex-wrap">
                {DAY_ORDER.map((day) => (
                  <span
                    key={day}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      sortedDays.includes(day)
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container-low text-on-surface/30'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </span>
                ))}
              </div>
              {entity.hours_of_operation && (
                <div className="flex items-center gap-1 text-on-surface/50">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                  <TodayHours hours={entity.hours_of_operation} />
                </div>
              )}
            </div>
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

          {/* Website link */}
          {entity.website_url && (
            <a
              href={entity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-container hover:underline"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
              {entity.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
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
