export const MOCK_PLAYERS = [
  { id: '1', name: 'You', status: 'ready' as const, isHost: true, avatar: 'https://i.pravatar.cc/150?img=47' },
  { id: '2', name: 'Marc D.', status: 'ready' as const, isHost: false, avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: '3', name: 'Sophie T.', status: 'invited' as const, isHost: false, avatar: 'https://i.pravatar.cc/150?img=25' },
];

export const MOCK_PRESETS = [
  { id: 'eco', icon: 'savings', label: 'Petit prix', description: 'Les bonnes adresses sans se ruiner. Qualité garantie.', priceRange: '€' },
  { id: 'midrange', icon: 'restaurant_menu', label: 'Sweet spot', description: 'Le meilleur ratio qualité-prix. Ça envoie quand même.', priceRange: '€€' },
  { id: 'premium', icon: 'wine_bar', label: 'Soirée spéciale', description: 'On sort le grand jeu. Pour les occasions qui comptent.', priceRange: '€€€' },
  { id: 'gastronomique', icon: 'workspace_premium', label: 'Grande table', description: "L'excellence Michelin. Expérience totale, soirée mémorable.", priceRange: '€€€€' },
];

export const MOCK_TAGS = [
  'Japanese', 'Italian', 'Spicy', 'Vegetarian', 'Seafood', 'Natural Wine', 'Late Night', 'Patio', 'Date Night',
];

export const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'Le Cinq',
    stars: 3,
    priceRange: '€€€€',
    location: 'Paris 8e',
    cuisine: 'French Gastronomy',
    quote: '"A monumental culinary experience wrapped in Parisian majesty."',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    distance: '0.3 km',
    sponsored: true,
    tags: ['#DateNight', '$$$'],
  },
  {
    id: '2',
    name: 'Septime',
    stars: 1,
    priceRange: '€€',
    location: 'Paris 11e',
    cuisine: 'Modern European',
    quote: '"Unpretentious yet wildly inventive modern French cuisine."',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    distance: '1.2 km',
    sponsored: false,
    tags: ['#InstaWorthy'],
  },
  {
    id: '3',
    name: "L'Arpège",
    stars: 3,
    priceRange: '€€€€',
    location: 'Paris 7e',
    cuisine: 'French',
    quote: '"A vegetable-forward temple of French haute cuisine."',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    distance: '0.8 km',
    sponsored: false,
    tags: ['#Vegetarian'],
  },
  {
    id: '4',
    name: "L'Atelier Ombre",
    stars: 2,
    priceRange: '€€€',
    location: 'Paris 6e',
    cuisine: 'Modern Gastronomy',
    quote: '"A sensory journey through modern gastronomy with avant-garde presentations."',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cfd6c4b9?w=800&q=80',
    distance: '1.5 km',
    sponsored: false,
    tags: ['#DateNight', '$$$'],
  },
  {
    id: '5',
    name: 'Neon Nori',
    stars: 1,
    priceRange: '€€',
    location: 'Paris 3e',
    cuisine: 'Asian Fusion',
    quote: '"Electric atmosphere meets traditional technique."',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    distance: '2.1 km',
    sponsored: false,
    tags: ['#InstaWorthy'],
  },
];

export const MOCK_NEARBY = [
  { id: 'n1', name: 'Frenchie', stars: 1, distance: '0.4 km', cuisine: 'Modern French' },
  { id: 'n2', name: "L'Arpège", stars: 3, distance: '1.2 km', cuisine: 'Fine Dining' },
  { id: 'n3', name: 'Clown Bar', stars: 0, distance: '0.8 km', cuisine: 'Bib Gourmand' },
];

export const MOCK_VOTE_RESULTS = [
  { player: 'Alice (You)', avatar: 'https://i.pravatar.cc/150?img=47', pick: "L'Ambroisie", oui: 3, non: 1 },
  { player: 'Bob', avatar: 'https://i.pravatar.cc/150?img=12', pick: 'Guy Savoy', oui: 2, non: 2 },
  { player: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=33', pick: 'Arpège', oui: 1, non: 3 },
  { player: 'Diana', avatar: 'https://i.pravatar.cc/150?img=25', pick: 'Septime', oui: 2, non: 2 },
];
