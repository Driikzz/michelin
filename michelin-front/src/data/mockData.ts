// MOCK_PRESETS is kept as UI-only constants — they map to priceFilter 1–4
// but have labels, icons, and price strings that are purely presentational.
export const MOCK_PRESETS = [
  { id: 'eco', icon: 'savings', label: 'Petit prix', description: 'Les bonnes adresses sans se ruiner. Qualité garantie.', priceRange: '€' },
  { id: 'midrange', icon: 'restaurant_menu', label: 'Sweet spot', description: 'Le meilleur ratio qualité-prix. Ça envoie quand même.', priceRange: '€€' },
  { id: 'premium', icon: 'wine_bar', label: 'Soirée spéciale', description: 'On sort le grand jeu. Pour les occasions qui comptent.', priceRange: '€€€' },
  { id: 'gastronomique', icon: 'workspace_premium', label: 'Grande table', description: "L'excellence Michelin. Expérience totale, soirée mémorable.", priceRange: '€€€€' },
];
