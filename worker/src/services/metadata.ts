// Goal: Extract metadata from URLs
// Fetches page title, description, and Open Graph data

import { JSDOM } from 'jsdom';

export interface LinkMetadata {
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

/**
 * Fetch and extract metadata from a URL
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    console.log(`[Metadata] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract metadata
    const metadata: LinkMetadata = {
      url,
      title: extractTitle(document, url),
      description: extractDescription(document),
      image: extractImage(document, url),
      siteName: extractSiteName(document),
    };

    console.log(`[Metadata] ✓ Extracted: ${metadata.title}`);
    return metadata;
  } catch (error) {
    console.error(`[Metadata] ✗ Error fetching ${url}:`, error);
    
    // Return minimal metadata on error
    return {
      url,
      title: url,
    };
  }
}

function extractTitle(document: Document, fallbackUrl: string): string {
  // Try Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) return ogTitle;

  // Try Twitter title
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
  if (twitterTitle) return twitterTitle;

  // Try page title
  const pageTitle = document.querySelector('title')?.textContent;
  if (pageTitle) return pageTitle.trim();

  // Fallback to URL
  return fallbackUrl;
}

function extractDescription(document: Document): string | undefined {
  // Try Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (ogDescription) return ogDescription;

  // Try Twitter description
  const twitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
  if (twitterDescription) return twitterDescription;

  // Try meta description
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (metaDescription) return metaDescription;

  return undefined;
}

function extractImage(document: Document, baseUrl: string): string | undefined {
  // Try Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) return resolveUrl(ogImage, baseUrl);

  // Try Twitter image
  const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  if (twitterImage) return resolveUrl(twitterImage, baseUrl);

  return undefined;
}

function extractSiteName(document: Document): string | undefined {
  // Try Open Graph site name
  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  if (ogSiteName) return ogSiteName;

  return undefined;
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    // If URL is already absolute, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Otherwise, resolve relative to base URL
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  } catch {
    return url;
  }
}

/**
 * Extract main content text from HTML
 */
export function extractContentText(html: string): string {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script and style tags
    document.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove());

    // Get text content
    const text = document.body.textContent || '';
    
    // Clean up whitespace
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to first 5000 chars
  } catch {
    return '';
  }
}

