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
  type: 'mega' | 'dropdown';
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

export const navigation: NavItem[] = [
  {
    id: 'memory-posters',
    label: 'Memory Posters',
    href: '#memories',
    type: 'mega',
    variant: 'cinematic',
    eyebrow: 'Exclusively at the Wall',
    headline: 'memories, beautifully preserved.',
    description:
      'From meaningful moments to timeless art — every piece is designed to stay with you, for a lifetime.',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1400&h=800&fit=crop&q=80',
    cta: { label: 'Create Your Memory Album', href: '#memories' },
    groups: [
      {
        title: 'Albums',
        links: [
          {
            label: 'Memory Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Wedding Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Couple Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Travel Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&h=800&fit=crop&q=80',
          },
        ],
      },
      {
        title: 'Life Chapters',
        links: [
          {
            label: 'Baby Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1555252333-9f8e92e28df9?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Family Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Pet Albums',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1450778869180-41d060ede46c?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Photo Books',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1400&h=800&fit=crop&q=80',
          },
        ],
      },
      {
        title: 'Wall',
        links: [
          {
            label: 'Custom Memory Posters',
            href: '#memories',
            image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=1400&h=800&fit=crop&q=80',
          },
          {
            label: 'Personalized Frames',
            href: '#memory-frames',
            image: 'https://images.unsplash.com/photo-1609220136736-443aaeec3ad2?w=1400&h=800&fit=crop&q=80',
          },
        ],
      },
    ],
  },
  {
    id: 'art-posters',
    label: 'Art Posters',
    href: '#art-posters',
    type: 'mega',
    variant: 'standard',
    eyebrow: 'Curated Collection',
    headline: 'prints that speak.',
    description: 'Cinema, culture, and craft — curated designs for walls that tell a story.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop&q=80',
    cta: { label: 'Shop Art Posters', href: '#art-posters' },
    groups: [
      {
        title: 'Culture',
        links: [
          {
            label: 'Cinema',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Anime',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Marvel',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1635805737705-575513ab0b32?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'DC',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1612036782180-6f0b006cdca3?w=600&h=750&fit=crop&q=80',
          },
        ],
      },
      {
        title: 'Lifestyle',
        links: [
          {
            label: 'Sports',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1461896836934-ffe607ad7d3d?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Gaming',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Cars',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Travel',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=750&fit=crop&q=80',
          },
        ],
      },
      {
        title: 'Expression',
        links: [
          {
            label: 'Quotes',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Aesthetic',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Photography',
            href: '#art-posters',
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop&q=80',
          },
        ],
      },
    ],
  },
  {
    id: 'pocket-memories',
    label: 'Pocket Memories',
    href: '#pocket-memories',
    type: 'dropdown',
    links: [
      { label: 'Mini Prints', href: '#pocket-memories', description: 'Small format, big feeling' },
      { label: 'Pocket Albums', href: '#pocket-memories', description: 'Portable keepsakes' },
      { label: 'Gift Sets', href: '#gifting', description: 'Ready to give' },
    ],
  },
  {
    id: 'artist-originals',
    label: 'Artist Originals',
    href: '#artist-originals',
    type: 'mega',
    variant: 'standard',
    eyebrow: 'Luxury Segment',
    headline: 'one-of-one artworks.',
    description: 'Original pieces and limited editions from artists — for collectors and connoisseurs.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=750&fit=crop&q=80',
    cta: { label: 'View Originals', href: '#artist-originals' },
    groups: [
      {
        title: 'Collect',
        links: [
          {
            label: 'Originals',
            href: '#artist-originals',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Limited Editions',
            href: '#artist-originals',
            image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Artist Prints',
            href: '#artist-originals',
            image: 'https://images.unsplash.com/photo-1561214115-f2f695cca21e?w=600&h=750&fit=crop&q=80',
          },
        ],
      },
      {
        title: 'Marketplace',
        links: [
          {
            label: 'Browse Artists',
            href: '#artist-originals',
            image: 'https://images.unsplash.com/photo-1460661419341-f7d736b03968?w=600&h=750&fit=crop&q=80',
          },
          {
            label: 'Commission Work',
            href: '#artist-originals',
            image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=750&fit=crop&q=80',
          },
        ],
      },
    ],
  },
  {
    id: 'memory-frames',
    label: 'Memory Frames',
    href: '#memory-frames',
    type: 'dropdown',
    links: [
      { label: 'Classic Frames', href: '#memory-frames', description: 'Timeless black & natural wood' },
      { label: 'Gallery Frames', href: '#memory-frames', description: 'Museum-quality presentation' },
      { label: 'Custom Sizes', href: '#memory-frames', description: 'Built for your wall' },
    ],
  },
  {
    id: 'gifting',
    label: 'Gifting',
    href: '#gifting',
    type: 'dropdown',
    links: [
      { label: 'Gift Cards', href: '#gifting', description: 'Let them choose' },
      { label: 'Curated Sets', href: '#gifting', description: 'Thoughtfully composed' },
      { label: 'Bargain Wall', href: '#gifting', description: 'Artist deals & discounts' },
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
