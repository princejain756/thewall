import { collections as storeCollections, collectionCoverSrc, posterSrc } from './collections';

const navImg = {
  memory: posterSrc('the wall', 'Aesthetic', 'Love.jpeg'),
  art: posterSrc('the wall', 'Anime', 'Gojo.jpeg'),
  polaroid: posterSrc('the wall', 'Aesthetic', 'Poster.jpeg'),
  mini: posterSrc('the wall', 'Anime', 'Luffy.jpeg'),
};

export type NavLink = {
  label: string;
  href: string;
  description?: string;
  image?: string;
};

export type NavGroup = {
  title: string;
  links: NavLink[];
};

export type NavItem = {
  id: string;
  label: string;
  href: string;
  type: 'mega' | 'dropdown' | 'link';
  variant?: 'cinematic' | 'standard';
  eyebrow?: string;
  headline?: string;
  description?: string;
  image?: string;
  cta?: { label: string; href: string };
  groups?: NavGroup[];
  links?: NavLink[];
};

export function previewId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const entertainmentCollections = storeCollections.filter((c) =>
  ['anime', 'superheros', 'movies', 'tv-series', 'games', 'music'].includes(c.id),
);
const lifestyleCollections = storeCollections.filter((c) =>
  ['aesthetic', 'motivation', 'cars'].includes(c.id),
);
const sportsCollections = storeCollections.filter((c) =>
  ['cricket', 'football', 'f1', 'basketball'].includes(c.id),
);

function collectionLinks(items: typeof storeCollections): NavLink[] {
  return items.map((c) => ({
    label: c.label,
    href: c.href,
    image: collectionCoverSrc(c),
  }));
}

export const navigation: NavItem[] = [
  {
    id: 'memory-posters',
    label: 'Memory Posters',
    href: '/products/best-sister-timeless',
    type: 'dropdown',
    links: [
      { label: 'Best Sister — Timeless', href: '/products/best-sister-timeless', description: 'Personalized Rakhi & family poster' },
      { label: 'Custom Memory Poster', href: '/products/memory-poster', description: 'Upload your photo in A4/A5' },
      { label: 'Couples & Moments', href: '/products/memory-poster', description: 'Timeless keepsakes' },
    ],
  },
  {
    id: 'art-posters',
    label: 'Art Posters',
    href: '#art-posters',
    type: 'mega',
    variant: 'standard',
    eyebrow: 'Curated Collection',
    headline: 'PRINTS THAT SPEAK.',
    description: 'Cinema, culture, and craft — curated designs for walls that tell a story.',
    image: navImg.art,
    cta: { label: 'Shop Art Posters', href: '/shop' },
    groups: [
      { title: 'Entertainment', links: collectionLinks(entertainmentCollections) },
      { title: 'Lifestyle', links: collectionLinks(lifestyleCollections) },
      { title: 'Sports', links: collectionLinks(sportsCollections) },
    ],
  },
  {
    id: 'albums',
    label: 'Albums',
    href: '/products/memory-poster',
    type: 'dropdown',
    links: [
      { label: 'Travel Album', href: '/products/memory-poster', description: 'Adventures worth framing' },
      { label: 'Family Album', href: '/products/memory-poster', description: 'Generations on your wall' },
      { label: 'Couple Album', href: '/products/memory-poster', description: 'Your story together' },
      { label: 'Memory Albums', href: '/products/memory-poster', description: 'Moments that matter' },
    ],
  },
];

/** Unique preview images for a mega menu panel (for stacked crossfade layers). */
export function getMegaPreviewImages(item: NavItem) {
  const map = new Map<string, { id: string; src: string; label: string }>();

  if (item.image) {
    map.set('default', { id: 'default', src: item.image, label: item.headline ?? item.label });
  }

  item.groups?.forEach((group) => {
    group.links.forEach((link) => {
      if (!link.image) return;
      const id = previewId(link.label);
      if (!map.has(id)) {
        map.set(id, { id, src: link.image, label: link.label });
      }
    });
  });

  return Array.from(map.values());
}
