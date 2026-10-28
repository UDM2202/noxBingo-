import { useEffect } from 'react';

// The one official address. index.html, robots.txt and sitemap.xml
// all use this same origin — keep them in sync if it ever changes.
export const SITE_URL = 'https://www.noxbingo.io';

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector(selector);
  const previous = el?.getAttribute(attr) ?? null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
  return () => {
    if (previous !== null) el?.setAttribute(attr, previous);
  };
}

/**
 * Sets the title, description, canonical link and og:url for a page.
 * `path` is the page's own path (e.g. '/leaderboard'), so each indexable
 * page declares itself as canonical instead of inheriting the home
 * page's canonical from index.html.
 */
export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const url = SITE_URL + path;
    const restore = [
      setTag('meta[name="description"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        return m;
      }, 'content', description),
      setTag('link[rel="canonical"]', () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      }, 'href', url),
      setTag('meta[property="og:url"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:url');
        return m;
      }, 'content', url),
    ];

    return () => {
      document.title = previousTitle;
      restore.forEach(fn => fn());
    };
  }, [title, description, path]);
}
