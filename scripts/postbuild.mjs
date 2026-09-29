// Runs after `ng build`. Writes, into the built site:
//   sitemap.xml  every prerendered public page (so search engines find all lessons)
//   robots.txt   allows the public site, blocks account/admin/paid pages, points to the sitemap
//   ads.txt      authorises your AdSense publisher id (only when one is set)
// The site address and AdSense id come from src/app/app.settings.ts (SITE_URL env var overrides the address).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist/javaatlas-web/browser';
const settings = readFileSync('src/app/app.settings.ts', 'utf8');
const setting = (name) => (settings.match(new RegExp(`${name}:\\s*'([^']*)'`)) ?? [])[1] ?? '';

const site = (process.env.SITE_URL || setting('siteUrl')).replace(/\/+$/, '');
const adsClient = setting('adsenseClient');
const today = new Date().toISOString().slice(0, 10);

// Pages that must never be indexed, even if a static file exists for them.
const PRIVATE = [/^\/admin/, /^\/my\//, /^\/reset-password/, /^\/courses\/[^/]+\/learn/];

function pages(dir, route = '') {
  const out = [];
  if (existsSync(join(dir, 'index.html'))) out.push(route || '/');
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory() && name !== 'media') out.push(...pages(full, `${route}/${name}`));
  }
  return out;
}

const routes = pages(dist)
  .filter((r) => r !== '/learn' && !PRIVATE.some((re) => re.test(r)))
  .sort((a, b) => a.localeCompare(b));
// The course catalog renders in the browser, so it has no static file; list it anyway.
if (!routes.includes('/courses')) routes.push('/courses');

const priority = (r) => (r === '/' ? '1.0' : /^\/(learn|paths|topics)/.test(r) ? '0.8' : '0.5');

let robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /my/
Disallow: /reset-password
Disallow: /api/
Disallow: /courses/*/learn
`;

if (site) {
  const urls = routes
    .map((r) => `  <url><loc>${site}${r}</loc><lastmod>${today}</lastmod><priority>${priority(r)}</priority></url>`)
    .join('\n');
  writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  robots += `\nSitemap: ${site}/sitemap.xml\n`;
  console.log(`sitemap.xml: ${routes.length} pages for ${site}`);
} else {
  console.warn('\n⚠  siteUrl is empty in src/app/app.settings.ts: sitemap.xml was not written and pages have no canonical links.');
  console.warn('   Set it to your https:// address before deploying, or search engines will struggle to index the site.\n');
}
writeFileSync(join(dist, 'robots.txt'), robots);

if (adsClient) {
  const pub = adsClient.replace(/^ca-/, '');
  writeFileSync(join(dist, 'ads.txt'), `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`ads.txt: written for ${pub}`);
}

// Launch check: the legal pages are public, and Razorpay and AdSense review them.
const placeholders = [
  ['business.legalName', /legalName:\s*'Your Company Name'/],
  ['business.address', /address:\s*'Your City, State, India'/],
  ['business.jurisdiction', /jurisdiction:\s*'Your City, India'/],
].filter(([, re]) => re.test(settings)).map(([name]) => name);
if (placeholders.length) {
  console.warn(`\n⚠  Still placeholders in src/app/app.settings.ts: ${placeholders.join(', ')}.`);
  console.warn('   They appear on the About, Contact, Privacy, Terms and Refund pages. Fill them in before going live.\n');
}
