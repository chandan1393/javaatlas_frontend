/**
 * Site settings. Edit these before you deploy.
 *
 * apiBase: where the Spring Boot backend lives.
 *   ''  = same site. Use this with the Docker/Caddy setup, and locally with `npm start` (proxied to :8080).
 *   'https://api.javaatlas.com' = backend on another subdomain, e.g. website on Vercel + backend on Railway.
 *   Then also set APP_CORS_ORIGINS=https://javaatlas.com on the backend.
 *   Keep both on the same main domain so the sign-in cookie works.
 */
export const SETTINGS = {
  apiBase: 'https://api.javaatlas.com',
  /** Name shown in the header, search results and the Razorpay checkout window. */
  brand: 'JavaAtlas',
  /** Color of the Razorpay checkout window. */
  accent: '#6C4DFF',

  /**
   * Your website's address, with https:// and without a trailing slash.
   * Used for canonical links, social previews, structured data, sitemap.xml and robots.txt.
   * Leave empty only for local testing: search engines need it.
   */
  siteUrl: 'https://javaatlas.com',
  /** One-line description for the home page and search results. */
  tagline: 'Free Java tutorials from your first program to Spring Boot and microservices, with interview prep and a Java version guide.',
  /** Google Search Console "HTML tag" verification code (just the content="…" value). Optional. */
  googleSiteVerification: '',

  /** Shown on the About, Contact, Privacy, Terms and Refund pages. Razorpay and AdSense both check these pages. */
  business: {
    legalName: 'Your Company Name',
    email: 'admin@javaatlas.com',
    address: 'Your City, State, India',
    /** Courts named in the Terms. */
    jurisdiction: 'Your City, India',
    /** Days after purchase within which a refund can be requested. */
    refundDays: 7,
  },

  /**
   * Google AdSense. Ads appear only on free content pages (lessons, versions, interview, topics, paths),
   * never on paid courses, checkout, account or admin pages.
   * Leave adsenseClient empty to show no ads at all.
   */
  ads: {
    /** Your publisher id, e.g. 'ca-pub-1234567890123456'. Also used to write ads.txt at build time. */
    adsenseClient: '',
    /** Let Google place extra ads automatically (turn on "Auto ads" in AdSense too). */
    autoAds: false,
    /** Ad unit ids from AdSense → Ads → By ad unit. An empty id hides that placement. */
    slots: {
      inArticle: '',
      lessonEnd: '',
      sidebar: '',
      listing: '',
    },
    /** Don't show ads to signed-in learners who have enrolled in a course. */
    hideForCustomers: true,
    /** Request test ads (no revenue, no policy risk) while you develop. */
    testMode: false,
  },
};

export type AdSlotName = keyof typeof SETTINGS.ads.slots;
