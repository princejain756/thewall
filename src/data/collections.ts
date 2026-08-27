export type Collection = {
  id: string;
  label: string;
  href: string;
  folder: string;
  cover: string;
  icon: string;
  count?: number;
};

/** Encode local poster paths under /public/images */
export function posterSrc(...parts: string[]): string {
  return `/images/${parts.map((p) => encodeURIComponent(p)).join('/')}`;
}

export function iconSrc(filename: string): string {
  return `/images/icons/without-text/${encodeURIComponent(filename)}`;
}

export const promoLines = [
  'Free delivery on prepaid orders',
  'Buy 5 get 5 free on art posters',
  'Memory albums from Rs. 299',
  'Custom wall sets — upload your moments',
];

export const collections: Collection[] = [
  {
    id: 'aesthetic',
    label: 'Aesthetic',
    href: '/collections/aesthetic',
    folder: 'the wall/Aesthetic',
    cover: 'Love.jpeg',
    icon: '1.png',
    count: 63,
  },
  {
    id: 'anime',
    label: 'Anime',
    href: '/collections/anime',
    folder: 'the wall/Anime',
    cover: 'Gojo.jpeg',
    icon: '2.png',
    count: 30,
  },
  {
    id: 'superheros',
    label: 'Superheroes',
    href: '/collections/superheros',
    folder: 'the wall/Superheros',
    cover: '36+ Stunning Star-Lord Wallpapers – Free Download Now!.jpeg',
    icon: '3.png',
    count: 58,
  },
  {
    id: 'cars',
    label: 'Cars',
    href: '/collections/cars',
    folder: 'the wall/Cars',
    cover: 'A-Ferrari-F40.jpeg',
    icon: '4.png',
    count: 19,
  },
  {
    id: 'movies',
    label: 'Movies',
    href: '/collections/movies',
    folder: 'the wall/Movies',
    cover: 'download.jpeg',
    icon: '5.png',
    count: 98,
  },
  {
    id: 'tv-series',
    label: 'TV Series',
    href: '/collections/tv-series',
    folder: 'the wall/Tv Series',
    cover: 'Better Call Saul - Jean Michel.jpeg',
    icon: '6.png',
    count: 25,
  },
  {
    id: 'music',
    label: 'Music',
    href: '/collections/music-artists',
    folder: 'the wall/Music Artists',
    cover: '9AC0FB2D-9BFE-487E-A3F3-DAC0D52B65B4.jpg',
    icon: '7.png',
    count: 26,
  },
  {
    id: 'games',
    label: 'Games',
    href: '/collections/game-bundle',
    folder: 'the wall/GAME BUNDLE',
    cover: 'download.jpeg',
    icon: '8.png',
    count: 26,
  },
  {
    id: 'motivation',
    label: 'Motivation',
    href: '/collections/motivation-quotes',
    folder: 'the wall/Motivation Quotes',
    cover: "' Winners Don't Make Excuses Motivational Success & Mindset Poster' Poster, picture, metal print, paint by Elite Style _ Displate.jpeg",
    icon: '9.png',
    count: 23,
  },
  {
    id: 'cricket',
    label: 'Cricket',
    href: '/collections/cricket',
    folder: 'the wall/Cricket',
    cover: 'Virat Kohli.jpeg',
    icon: '10.png',
    count: 27,
  },
  {
    id: 'football',
    label: 'Football',
    href: '/collections/football',
    folder: 'the wall/Football',
    cover: '0325D578-2C9B-4018-A422-C74A50079A6B.jpg',
    icon: '11.png',
    count: 34,
  },
  {
    id: 'f1',
    label: 'Formula 1',
    href: '/collections/f1',
    folder: 'the wall/F1',
    cover: 'Ayrton Senna F1.jpeg',
    icon: '12.png',
    count: 22,
  },
  {
    id: 'basketball',
    label: 'Basketball',
    href: '/collections/basketball',
    folder: 'the wall/Basketball',
    cover: 'Lebron James HD Wallpaper.jpeg',
    icon: '13.png',
    count: 1,
  },
];

export type HeroPoster = {
  src: string;
  alt: string;
  layer: 'back' | 'mid' | 'front';
  rotate: number;
  offsetY: number;
  size: 'sm' | 'md' | 'lg';
};

export const heroWallPhotos: HeroPoster[] = [
  { src: posterSrc('the wall', 'Aesthetic', 'universe.jpeg'), alt: 'Universe aesthetic poster', layer: 'back', rotate: -1.8, offsetY: 6, size: 'sm' },
  { src: posterSrc('the wall', 'F1', 'Fernando Alonso Poster Aesthetic.jpeg'), alt: 'Fernando Alonso F1 poster', layer: 'back', rotate: 2.2, offsetY: -4, size: 'sm' },
  { src: posterSrc('the wall', 'Anime', 'Berserk.jpeg'), alt: 'Berserk manga poster', layer: 'back', rotate: -2.5, offsetY: 8, size: 'md' },
  { src: posterSrc('the wall', 'Cricket', 'bumrah.jpeg'), alt: 'Jasprit Bumrah cricket poster', layer: 'back', rotate: 1.5, offsetY: 2, size: 'sm' },
  { src: posterSrc('the wall', 'Aesthetic', 'Skull Poster.jpeg'), alt: 'Skull art poster', layer: 'back', rotate: -1.2, offsetY: -6, size: 'md' },

  { src: posterSrc('the wall', 'Anime', 'Gojo.jpeg'), alt: 'Gojo anime poster on a bedroom wall', layer: 'mid', rotate: -2, offsetY: 4, size: 'lg' },
  { src: posterSrc('the wall', 'F1', 'Ayrton Senna F1.jpeg'), alt: 'Ayrton Senna F1 poster in a study', layer: 'mid', rotate: 1.8, offsetY: -8, size: 'md' },
  { src: posterSrc('the wall', 'Aesthetic', 'TOKYO — Visual Over Explanation.jpeg'), alt: 'Tokyo aesthetic print above a desk', layer: 'mid', rotate: -1.4, offsetY: 10, size: 'md' },
  { src: posterSrc('the wall', 'Cricket', 'Virat Kohli.jpeg'), alt: 'Virat Kohli cricket poster', layer: 'mid', rotate: 2.4, offsetY: -2, size: 'lg' },
  { src: posterSrc('the wall', 'Anime', 'Luffy.jpeg'), alt: 'Luffy anime wall art', layer: 'mid', rotate: -2.8, offsetY: 6, size: 'md' },
  { src: posterSrc('the wall', 'F1', "DON'T STOP.jpeg"), alt: 'Motivational F1 poster', layer: 'mid', rotate: 1.2, offsetY: -4, size: 'sm' },

  { src: posterSrc('the wall', 'Cars', 'A-Ferrari-F40.jpeg'), alt: 'Ferrari F40 car poster', layer: 'front', rotate: -1.6, offsetY: -10, size: 'lg' },
  { src: posterSrc('the wall', 'Cricket', 'MS dhoni.jpeg'), alt: 'MS Dhoni cricket poster', layer: 'front', rotate: 2, offsetY: 8, size: 'md' },
  { src: posterSrc('the wall', 'Aesthetic', 'Poster.jpeg'), alt: 'Minimal aesthetic wall print', layer: 'front', rotate: -2.2, offsetY: 4, size: 'md' },
  { src: posterSrc('the wall', 'Cars', 'A Porsche.jpeg'), alt: 'Porsche car poster on wall', layer: 'front', rotate: 1.4, offsetY: -6, size: 'lg' },
  { src: posterSrc('the wall', 'Anime', 'itachi.jpeg'), alt: 'Itachi anime poster', layer: 'front', rotate: -1, offsetY: 12, size: 'md' },
];

export const heroWallLayers = {
  back: heroWallPhotos.filter((p) => p.layer === 'back'),
  mid: heroWallPhotos.filter((p) => p.layer === 'mid'),
  front: heroWallPhotos.filter((p) => p.layer === 'front'),
};

export function collectionCoverSrc(collection: Collection): string {
  const [folder, ...rest] = collection.folder.split('/');
  return posterSrc(folder, ...rest, collection.cover);
}

export function collectionIconSrc(collection: Collection): string {
  return iconSrc(collection.icon);
}
