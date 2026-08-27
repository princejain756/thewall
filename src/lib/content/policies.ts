export type ContentPage = {
  title: string;
  slug: string;
  type: 'page' | 'policy' | 'faq';
  description: string;
  sections: { heading?: string; body: string }[];
};

const BUSINESS = {
  name: 'The Wall Records',
  brand: 'the.Wall',
  website: 'https://2thewall.in',
  email: 'hello@2thewall.in',
  phone: '+91 98765 43210',
  address: 'India',
};

export const CONTENT_PAGES: Record<string, ContentPage> = {
  about: {
    title: 'About Us',
    slug: 'about',
    type: 'page',
    description: 'Learn about The Wall Records — premium art posters and custom memory prints.',
    sections: [
      {
        body: `${BUSINESS.name} (${BUSINESS.brand}) is an India-based online store for art posters, memory prints, albums, and custom wall art. We help customers turn their favourite moments, fandoms, and aesthetics into premium prints for their walls.`,
      },
      {
        heading: 'What we sell',
        body: 'Curated art posters across anime, movies, sports, cars, music, and aesthetic collections — plus custom-made memory posters, albums, polaroids, and phone case prints.',
      },
      {
        heading: 'Our promise',
        body: 'Quality prints, transparent pricing, secure payments, and reliable delivery across India. Every order is produced with care and shipped in protective packaging.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    slug: 'privacy',
    type: 'policy',
    description: 'How The Wall Records collects, uses, and protects your personal information.',
    sections: [
      {
        body: `This Privacy Policy explains how ${BUSINESS.name} ("we", "us") collects and uses information when you visit ${BUSINESS.website} or place an order.`,
      },
      {
        heading: 'Information we collect',
        body: 'We collect your name, email, phone number, shipping address, order details, and payment status. Payment card/UPI details are processed securely by Razorpay — we do not store full payment credentials on our servers.',
      },
      {
        heading: 'How we use your information',
        body: 'To process orders, arrange delivery, send order updates, provide customer support, prevent fraud, and improve our store. With your consent, we may send promotional emails which you can opt out of anytime.',
      },
      {
        heading: 'Sharing of data',
        body: 'We share data only with service providers needed to run our business: payment processors (Razorpay), shipping partners, and hosting providers. We do not sell your personal data.',
      },
      {
        heading: 'Data retention & security',
        body: 'We retain order and account data as required for legal, tax, and support purposes. We use industry-standard security measures including HTTPS and secure session handling.',
      },
      {
        heading: 'Your rights',
        body: `You may request access, correction, or deletion of your personal data by emailing ${BUSINESS.email}.`,
      },
      {
        heading: 'Contact',
        body: `Questions about this policy: ${BUSINESS.email} · ${BUSINESS.phone}`,
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    slug: 'terms',
    type: 'policy',
    description: 'Terms governing use of thewall.in and purchases from The Wall Records.',
    sections: [
      {
        body: `By accessing ${BUSINESS.website} or placing an order, you agree to these Terms & Conditions with ${BUSINESS.name}.`,
      },
      {
        heading: 'Account & eligibility',
        body: 'You must create an account and sign in before completing checkout. You must be 18+ or have guardian consent. You are responsible for keeping your login credentials secure.',
      },
      {
        heading: 'Products & pricing',
        body: 'All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Product images are representative; minor colour variation may occur due to screen and print differences.',
      },
      {
        heading: 'Orders & payment',
        body: 'An order is confirmed after successful payment (prepaid) or order placement (COD). We reserve the right to cancel orders in case of pricing errors, stock issues, or suspected fraud.',
      },
      {
        heading: 'Intellectual property',
        body: 'Website content, branding, and original designs are owned by The Wall Records. Poster artwork belongs to respective rights holders; we sell licensed/authorised print products only.',
      },
      {
        heading: 'Limitation of liability',
        body: 'We are not liable for indirect damages. Our liability is limited to the order value for any claim relating to your purchase.',
      },
      {
        heading: 'Governing law',
        body: 'These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in India.',
      },
      {
        heading: 'Contact',
        body: `${BUSINESS.email} · ${BUSINESS.phone}`,
      },
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    slug: 'refund',
    type: 'policy',
    description: 'Refund, return, and cancellation policy for The Wall Records orders.',
    sections: [
      {
        body: 'We want you to love what arrives on your wall. Please read our refund and cancellation policy below.',
      },
      {
        heading: 'Cancellations',
        body: 'Orders can be cancelled within 12 hours of placement if production has not started. Contact us at hello@2thewall.in with your order number. Once shipped, cancellation is not possible — return rules apply.',
      },
      {
        heading: 'Returns & replacements',
        body: 'We accept returns/replacements for: (1) damaged items received, (2) wrong product/size shipped, or (3) significant print defects. Report within 48 hours of delivery with photos. Custom/personalised items are non-returnable unless defective.',
      },
      {
        heading: 'Refunds',
        body: 'Approved refunds are processed to the original payment method within 5–7 business days. COD orders receive refund via UPI/bank transfer. Shipping charges are non-refundable unless the error was ours.',
      },
      {
        heading: 'Non-refundable cases',
        body: 'Change-of-mind returns, incorrect address provided by customer, or normal minor colour variation are not eligible for refund.',
      },
      {
        heading: 'How to request',
        body: `Email ${BUSINESS.email} with order number, photos, and issue description. Our team responds within 1–2 business days.`,
      },
    ],
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    slug: 'shipping',
    type: 'policy',
    description: 'Shipping times, charges, and delivery information for The Wall Records.',
    sections: [
      {
        heading: 'Processing time',
        body: 'Orders are processed within 1–2 business days. Custom memory products may take 2–4 additional days.',
      },
      {
        heading: 'Shipping charges',
        body: 'Prepaid orders (UPI, cards, netbanking): FREE express shipping. Cash on Delivery (COD): ₹49 shipping fee per order.',
      },
      {
        heading: 'Delivery timeline',
        body: 'Metro cities: 3–5 business days after dispatch. Other locations: 5–8 business days. Remote areas may take longer.',
      },
      {
        heading: 'Tracking',
        body: 'You receive tracking details by email/SMS once your order ships. Track orders in your account at /account.',
      },
      {
        heading: 'Delivery issues',
        body: `If your package is delayed, lost, or damaged, contact ${BUSINESS.email} within 48 hours of the expected delivery date.`,
      },
    ],
  },
  faq: {
    title: 'FAQ',
    slug: 'faq',
    type: 'faq',
    description: 'Frequently asked questions about ordering from The Wall Records.',
    sections: [
      {
        heading: 'Do I need an account to order?',
        body: 'Yes. Create a free account and sign in before checkout. This helps us track your orders and invoices.',
      },
      {
        heading: 'What payment methods do you accept?',
        body: 'UPI, credit/debit cards, netbanking (via Razorpay), and Cash on Delivery (COD).',
      },
      {
        heading: 'What sizes are available?',
        body: 'Most art posters are available in A4, A3, and A2 sizes. Size options are shown on each product page.',
      },
      {
        heading: 'Can I upload my own photos?',
        body: 'Yes — browse our Custom Made section for memory posters, albums, polaroids, and phone case prints.',
      },
      {
        heading: 'How do combo discounts work?',
        body: 'Automatic combo offers apply at checkout — e.g. Buy 5 Get 5 Free on art posters. No coupon needed.',
      },
      {
        heading: 'How do I contact support?',
        body: `Email ${BUSINESS.email} or visit our Contact page.`,
      },
    ],
  },
};

export const POLICY_SLUGS = Object.keys(CONTENT_PAGES);

export function getContentPage(slug: string): ContentPage | null {
  return CONTENT_PAGES[slug] ?? null;
}

export const CONTACT_INFO = BUSINESS;
