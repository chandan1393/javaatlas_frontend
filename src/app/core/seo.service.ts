import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SETTINGS } from '../app.settings';

export interface SeoData {
  /** Page title without the brand; the brand is appended. */
  title: string;
  description: string;
  /** Path of the page, e.g. '/learn/streams'. */
  path: string;
  type?: 'website' | 'article';
  /** Absolute or site-relative image for social previews (1200×630). */
  image?: string;
  /** Keep the page out of search results (account, admin and paid pages). */
  noindex?: boolean;
  /** Structured data objects (schema.org), added as JSON-LD. */
  jsonLd?: object[];
  /** Use the title exactly as given (the home page). */
  rawTitle?: boolean;
}

/** Absolute URL for a site path, or '' when SETTINGS.siteUrl isn't set. */
export function absUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return SETTINGS.siteUrl ? SETTINGS.siteUrl.replace(/\/+$/, '') + (path.startsWith('/') ? path : '/' + path) : '';
}

export const ORGANIZATION = {
  '@type': 'Organization',
  name: SETTINGS.brand,
  ...(SETTINGS.siteUrl ? { url: absUrl('/'), logo: absUrl('/icon-512.png') } : {}),
};

/**
 * Sets everything search engines and social networks read from a page.
 * Runs during prerendering too, so the tags are in the static HTML.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  set(d: SeoData): void {
    const fullTitle = d.rawTitle ? d.title : `${d.title} | ${SETTINGS.brand}`;
    const description = d.description.replace(/\s+/g, ' ').trim().slice(0, 158);
    const url = absUrl(d.path);
    const image = absUrl(d.image ?? '/og-image.png');

    this.title.setTitle(fullTitle);
    this.tag('name', 'description', description);
    this.tag('name', 'robots', d.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');
    this.tag('property', 'og:site_name', SETTINGS.brand);
    this.tag('property', 'og:type', d.type ?? 'website');
    this.tag('property', 'og:title', fullTitle);
    this.tag('property', 'og:description', description);
    this.tag('property', 'og:locale', 'en_IN');
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:image', image);
    this.tag('name', 'twitter:card', 'summary_large_image');
    this.tag('name', 'twitter:title', fullTitle);
    this.tag('name', 'twitter:description', description);
    this.tag('name', 'twitter:image', image);
    if (SETTINGS.googleSiteVerification) this.tag('name', 'google-site-verification', SETTINGS.googleSiteVerification);
    this.canonical(d.noindex ? '' : url);
    this.structuredData(d.jsonLd ?? []);
  }

  /** Breadcrumb structured data from [name, path] pairs. */
  breadcrumbs(items: [string, string][]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map(([name, path], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        ...(absUrl(path) ? { item: absUrl(path) } : {}),
      })),
    };
  }

  /** FAQ structured data from question/answer pairs. */
  faq(pairs: [string, string][]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    };
  }

  private tag(attr: 'name' | 'property', key: string, content: string): void {
    const selector = `${attr}="${key}"`;
    if (!content) {
      this.meta.removeTag(selector);
      return;
    }
    this.meta.updateTag({ [attr]: key, content }, selector);
  }

  private canonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private structuredData(items: object[]): void {
    const head = this.document.head;
    head.querySelectorAll('script[data-seo]').forEach((el) => el.remove());
    for (const item of items) {
      const script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', '');
      // Escape "<" so text can never close the script tag.
      script.textContent = JSON.stringify(item).replace(/</g, '\\u003c');
      head.appendChild(script);
    }
  }
}
