/**
 * App Store Connect auto-renewing subscription product IDs (1 month billing).
 * Apple bills and renews automatically per App Store terms; copy below is for UX only.
 */
export const IAP_SUBSCRIPTION_PRODUCT_IDS = {
  collab_pro: 'com.comesh.collab_pro',
  creator_passport: 'com.comesh.creater_passport',
  creator_elite: 'com.comesh.creater_ellite',
};

/** Shown under the paywall title (not legal terms — link users to App Store subscription management). */
export const SUBSCRIPTION_PAYWALL_FOOTNOTE =
  'Paid plans are monthly subscriptions with automatic renewal until you cancel in App Store settings.';

/** Full plan rows for the Subscription screen (Creator Access is free — no IAP product). */
export const SUBSCRIPTION_PLANS_DEFINITION = [
  {
    id: 'creator_access',
    productId: null,
    title: 'Creator Access',
    body: 'Get in and start matching',
    price: 'Free',
    unit: '',
    features: [
      '20 swipes per day',
      'Local matches (50-mile radius)',
      'Upload up to 2 videos',
      'Basic profile (niche + bio)',
      'Messaging after matching only',
      'Limited daily matches',
    ],
  },
  {
    id: 'collab_pro',
    productId: IAP_SUBSCRIPTION_PRODUCT_IDS.collab_pro,
    title: 'Collab Pro',
    subtitle: 'Most Popular',
    badge: 'Most Popular',
    body: 'Unlimited collabs, real growth',
    price: '9.99',
    unit: 'mo',
    features: [
      'Unlimited swipes and matches',
      'See who liked you',
      'Upload up to 10 videos',
      'Advanced filters',
      'Boosted visibility',
      'Nationwide matching',
    ],
  },
  {
    id: 'creator_passport',
    productId: IAP_SUBSCRIPTION_PRODUCT_IDS.creator_passport,
    title: 'Creator Passport',
    body: 'Your network, worldwide',
    price: '14.99',
    unit: 'mo',
    features: [
      'Everything in Collab Pro',
      'Change location',
      'Match in multiple cities',
      'Travel Mode badge',
      'Hotspot access',
      'Priority placement',
    ],
  },
  {
    id: 'creator_elite',
    productId: IAP_SUBSCRIPTION_PRODUCT_IDS.creator_elite,
    title: 'Creator Elite',
    body: 'Be seen first. Get picked faster',
    price: '29.99',
    unit: 'mo',
    features: [
      'Everything in Creator Passport',
      'Daily boost',
      'Elite badge',
      'Top placement',
      'Direct Connect messaging',
      'Priority inbox',
      'Analytics',
      'Early feature access',
    ],
  },
];
