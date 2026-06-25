import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * This version is browser-safe.
 */
export function sanitizeHtml(html: string): string {
  // On the server (SSR), we skip sanitization or use a different approach
  // In the browser, DOMPurify works natively.
  if (typeof window === 'undefined') {
    return html;
  }
  return DOMPurify.sanitize(html);
}
