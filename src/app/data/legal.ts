import { SETTINGS } from '../app.settings';

/**
 * About, Privacy, Terms, Refunds and Contact pages.
 * These are starting templates, not legal advice: review them (ideally with a lawyer) and edit
 * SETTINGS.business in app.settings.ts before you launch. Text uses the lesson markup: **bold**, lists.
 */
export interface LegalPage {
  title: string;
  description: string;
  intro: string;
  sections: { h: string; body: string }[];
}

const b = SETTINGS.business;
const brand = SETTINGS.brand;
/** The proprietor's name appears only where the E-Commerce Rules require it (see app.settings.ts). */
const legalLine = b.showLegalName ? `, a sole proprietorship of ${b.legalName}` : '';
const officer = b.showLegalName ? `${b.legalName}, Proprietor, ${b.tradeName}` : `The Proprietor, ${b.tradeName}`;
const updated = 'September 2026';

export const LEGAL: Record<string, LegalPage> = {
  about: {
    title: `About ${brand}`,
    description: `${brand} is a free place to learn Java, from your first program to Spring Boot and microservices, with optional paid courses.`,
    intro: `${brand} is a free place to learn Java, from your first program to Spring Boot and microservices. You don't need an account to read any lesson.`,
    sections: [
      {
        h: 'What you’ll find here',
        body: `- Free lessons covering the whole language and its ecosystem: fundamentals, object-oriented programming, collections, modern Java, data structures and algorithms, design, testing, concurrency, JPA, Spring and microservices.
- Learning paths that put lessons in order for a goal, from complete beginner to interview preparation.
- A guide to every Java version and what it added, with an upgrade planner.
- Interview questions with answers, and quizzes in every lesson.
- Paid courses for learners who want to go deeper with projects.`,
      },
      {
        h: 'How lessons are written',
        body: `Every lesson says which Java version its code needs, so what you learn matches the code you’ll meet at work. Lessons explain the idea simply first, then the details, then the traps and interview questions. We update them as new Java versions ship every March and September.`,
      },
      {
        h: 'How the site is funded',
        body: `Lessons stay free. The site is supported by paid courses and by advertising on free pages. Learners who buy a course don’t see ads.`,
      },
      {
        h: 'Who runs it',
        body: `${brand} is run by **${b.tradeName}**, ${b.address} (GSTIN ${b.gstin}). Write to us at ${b.email}.`,
      },
    ],
  },

  privacy: {
    title: 'Privacy policy',
    description: `How ${brand} collects, uses and protects your information, including cookies and advertising.`,
    intro: `This policy explains what information ${brand} (operated by ${b.tradeName}) collects, why, and the choices you have. Last updated ${updated}.`,
    sections: [
      {
        h: 'Information we collect',
        body: `- **Account details** if you create an account: your name, email address and a securely hashed password (we never store the password itself).
- **Purchases**: the course, amount, date and payment reference. Payments are processed by Razorpay; we never see or store your card, UPI or bank details.
- **Learning progress**: if you're not signed in, completed lessons, study time, your chosen Java version and theme stay in your own browser. If you're signed in, completed lessons, the time you actively spend on lessons each day and your study goal are saved to your account, so they're available on every device and can be used to estimate your finish date.
- **Questions you ask the AI tutor** are sent to our AI provider (Anthropic) to generate an answer. Please don’t include personal information in them.
- **Technical data** such as IP address, browser type and pages requested, recorded in server logs for security and troubleshooting.`,
      },
      {
        h: 'Cookies',
        body: `We use one essential cookie to keep you signed in. It can’t be read by scripts and isn’t used for tracking. Advertising partners may also set cookies, as described below.`,
      },
      {
        h: 'Site analytics',
        body: `To understand which lessons help most, we count page views, searches made on the site, lesson completions, checkouts and use of the AI tools. This runs on our own servers, with no cookies and no third-party analytics. We don’t store IP addresses: each visitor gets an anonymous code made from a one-way hash of the IP address, browser and a random value that changes every day and is then deleted, so visits can’t be linked across days or traced back to you. We also record the site that referred you, your type of device and, when available, your country. Search terms are stored without anything that identifies you, so don’t type personal details into the search box. If your browser sends Do Not Track or Global Privacy Control, nothing is recorded. Analytics data is deleted after 13 months.`,
      },
      {
        h: 'Feedback',
        body: `When you send feedback we store your message, the type of feedback, any rating, the page you were on, your type of device and, only if you enter them, your name and email address (used to reply to you). Answers to “Was this lesson helpful?” are stored without your name or email. We use feedback only to improve the site and to reply to you. To have your feedback deleted, contact us.`,
      },
      {
        h: 'Advertising',
        body: `Free pages may show ads served by Google AdSense.
- Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this website and other websites.
- Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.
- You can opt out of personalised advertising in Google’s Ads Settings (adssettings.google.com), or opt out of some third-party vendors’ cookies at www.aboutads.info.
- Visitors from the European Economic Area, the UK and Switzerland are asked for consent through a Google-certified consent message before personalised ads are shown.`,
      },
      {
        h: 'How we use information',
        body: `To provide your account and the courses you buy, process payments and refunds, send essential emails (such as password reset links and receipts), answer your messages, keep the site secure, and understand how the site is used so we can improve it. We don’t sell your personal information.`,
      },
      {
        h: 'Who we share it with',
        body: `Only with service providers that help us run the site, and only as needed: Razorpay (payments), Google (advertising), Anthropic (AI tutor answers), our email provider (account emails) and our hosting provider. We may also disclose information when the law requires it.`,
      },
      {
        h: 'How long we keep it',
        body: `Account and purchase records are kept while your account is active and as long as tax and accounting laws require. Server logs are kept for a limited period for security. You can ask us to delete your account at any time.`,
      },
      {
        h: 'Your rights',
        body: `You can ask to see, correct or delete your personal information, or withdraw consent, by writing to ${b.email}. We respond within 30 days. These rights include those under India’s Digital Personal Data Protection Act, 2023, and, where it applies, the GDPR.`,
      },
      {
        h: 'Children',
        body: `The site is not directed at children under 13. Learners under 18 should use the site, and make any purchase, with the consent of a parent or guardian.`,
      },
      {
        h: 'Security',
        body: `Connections are encrypted with HTTPS, passwords are hashed, and sign-in sessions use secure, HTTP-only cookies. No method of transmission or storage is completely secure, but we work to protect your information.`,
      },
      {
        h: 'Changes and contact',
        body: `We’ll update this page if the policy changes and change the date above. Questions? Write to ${b.email} or to ${b.tradeName}, ${b.address}.`,
      },
    ],
  },

  terms: {
    title: 'Terms of use',
    description: `The terms for using ${brand}, its free lessons and its paid courses.`,
    intro: `These terms apply when you use ${brand}, operated by ${b.tradeName}${legalLine} (GSTIN ${b.gstin}). By using the site you agree to them. Last updated ${updated}.`,
    sections: [
      {
        h: 'Prices and GST',
        body: `Course prices are in Indian rupees and **include GST at ${b.gstRate}%**. Payments are processed securely by Razorpay; we never see or store your card, UPI or bank details. You’ll see the full price before you pay, with no hidden charges.`,
      },
      {
        h: 'Free lessons',
        body: `You may read and use the free lessons for your own learning. You may use the code examples in your own projects. You may not copy lessons in bulk, republish them or sell them.`,
      },
      {
        h: 'Accounts',
        body: `Keep your password safe and your details accurate. You’re responsible for activity on your account. Don’t share an account; one account is for one person.`,
      },
      {
        h: 'Paid courses',
        body: `Buying a course gives you a personal, non-transferable licence to access it for as long as it’s offered on the site. You may not download, record, share or redistribute course videos or materials.`,
      },
      {
        h: 'Prices and payment',
        body: `Prices are shown in Indian rupees and include applicable taxes unless stated otherwise. Payments are processed securely by Razorpay. We may change prices, but not for courses you’ve already bought.`,
      },
      {
        h: 'Refunds',
        body: `Refunds are covered by our refund policy.`,
      },
      {
        h: 'Acceptable use',
        body: `Don’t misuse the site: no attempts to break its security, scrape it at scale, overload it, abuse the AI tutor, or use it for anything unlawful. We may suspend accounts that do.`,
      },
      {
        h: 'AI tutor',
        body: `The AI tutor can make mistakes. Check important answers against the lessons or official documentation.`,
      },
      {
        h: 'Disclaimer and liability',
        body: `Content is provided for learning, as is, without guarantees of any particular result. To the extent the law allows, our total liability for any claim is limited to the amount you paid us in the 12 months before it arose.`,
      },
      {
        h: 'Changes, law and contact',
        body: `We may update these terms and will change the date above when we do. These terms are governed by the laws of India, and the courts of ${b.jurisdiction} have jurisdiction. Contact: ${b.email}.`,
      },
    ],
  },

  refunds: {
    title: 'Refund and cancellation policy',
    description: `When and how you can get a refund for a ${brand} course.`,
    intro: `We want you to be happy with every course. If a course isn’t right for you, here’s how refunds work. Last updated ${updated}.`,
    sections: [
      {
        h: 'Eligibility',
        body: `You can request a full refund within **${b.refundDays} days** of purchase if you’ve completed less than 25% of the course’s lectures.`,
      },
      {
        h: 'How to request one',
        body: `Email ${b.email} from your account’s email address with the order’s payment ID (shown on your Orders page) and, if you like, a line on why the course didn’t suit you.`,
      },
      {
        h: 'Processing',
        body: `Approved refunds are for the full amount paid, including GST, and go back to the original payment method through Razorpay within 5 to 7 working days. Your bank may take a few more days to show it. Your access to the course ends when the refund is issued.`,
      },
      {
        h: 'When refunds aren’t available',
        body: `- After ${b.refundDays} days from purchase.
- When more than 25% of the course has been completed.
- Free courses.
- Repeated buy-and-refund use, or accounts that break our terms.`,
      },
      {
        h: 'Cancellations',
        body: `Courses are one-time purchases, not subscriptions, so there’s nothing to cancel and you’ll never be charged again automatically.`,
      },
    ],
  },

  contact: {
    title: 'Contact us',
    description: `How to reach ${brand} for help with courses, payments, accounts and privacy.`,
    intro: `We read every message and reply within two working days.`,
    sections: [
      {
        h: 'Email',
        body: `${b.email}`,
      },
      {
        h: 'Payment or course problems',
        body: `Include the payment ID from your Orders page so we can find your order quickly.`,
      },
      {
        h: 'Privacy requests',
        body: `To see, correct or delete your information, write from your account’s email address.`,
      },
      {
        h: 'Business details',
        body: `**${b.tradeName}**
${b.address}
GSTIN: ${b.gstin}`,
      },
      {
        h: 'Grievance officer',
        body: `Under the Consumer Protection (E-Commerce) Rules, 2020:
- **${officer}**
- Email: ${b.email}
- We acknowledge every complaint within 48 hours and resolve it within one month.`,
      },
    ],
  },

  delivery: {
    title: 'Delivery policy',
    description: `How ${brand} courses are delivered after you pay.`,
    intro: `All ${brand} courses are digital. Nothing is shipped: you get access online, straight away. Last updated ${updated}.`,
    sections: [
      {
        h: 'How courses are delivered',
        body: `Courses are delivered online through your ${brand} account. There are no physical goods and no shipping charges.`,
      },
      {
        h: 'When you get access',
        body: `Access starts as soon as Razorpay confirms your payment, usually within seconds. The course appears under My courses, and you can start immediately on any device by logging in with the same email.`,
      },
      {
        h: 'If access doesn’t appear',
        body: `If your payment went through but the course doesn’t appear within 30 minutes, email ${b.email} with the payment ID from your Razorpay receipt. We’ll give you access or a full refund within one working day.`,
      },
      {
        h: 'How long access lasts',
        body: `Courses are one-time purchases with no expiry, including every future update to the course, for as long as ${brand} is available. See the refund policy for refunds.`,
      },
    ],
  },
};
