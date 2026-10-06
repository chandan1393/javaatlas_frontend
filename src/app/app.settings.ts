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

  /**
   * Business details from the GST registration. Shown on the About, Contact, Privacy, Terms, Refund and Delivery
   * pages and in the footer. Razorpay and AdSense both check these pages.
   */
  business: {
    /** The name customers see everywhere: the trade name on the GST certificate. */
    tradeName: 'Xelvo Technologies',
    /** Legal name on the GST certificate. For a sole proprietorship this is the proprietor's own name. */
    legalName: 'Chandan Sharma',
    /**
     * India's Consumer Protection (E-Commerce) Rules, 2020 ask online sellers to show their legal name and the name
     * of a grievance officer. When true, the proprietor's name appears ONLY where those rules need it: the grievance
     * officer section of the Contact page and the legal line in the Terms. Everywhere else the trade name is used.
     * Check with your CA before switching this off.
     */
    showLegalName: true,
    /** GST identification number (state code 09: Uttar Pradesh). */
    gstin: '09ECPPK7862F1ZY',
    email: 'admin@javaatlas.com',
    /** Principal place of business as on the GST certificate: street, city, PIN code, state. */
    address: 'Uttar Pradesh, India',
    /** Courts named in the Terms: your city. */
    jurisdiction: 'Uttar Pradesh, India',
    /** Days after purchase within which a refund can be requested. */
    refundDays: 7,
    /** GST rate included in course prices (online courses: 18%). */
    gstRate: 18,
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
