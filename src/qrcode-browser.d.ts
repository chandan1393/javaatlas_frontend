/** The browser build of the qrcode package (no Node.js PNG renderer). */
declare module 'qrcode/lib/browser' {
  export function toDataURL(text: string, options?: { width?: number; margin?: number; errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): Promise<string>;
}

/** The browser build of tus-js-client (resumable uploads). */
declare module 'tus-js-client/lib.esm/browser/index.js' {
  export * from 'tus-js-client';
}
