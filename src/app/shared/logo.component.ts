import { Component, input } from '@angular/core';

let uid = 0;

/**
 * The JavaAtlas logo: a gradient tile with a "J", an orbit ring (the atlas) and a small planet.
 * Used in the header, footer and admin area; public/favicon.svg and the app icons use the same mark.
 */
@Component({
  selector: 'app-logo',
  template: `
    <span class="logo" [class.on-dark]="tone() === 'light'" [style.--logo-size.px]="size()">
      <svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient [attr.id]="gid" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#FF7A45" />
            <stop offset="0.5" stop-color="#FF3D7F" />
            <stop offset="1" stop-color="#6C4DFF" />
          </linearGradient>
          <linearGradient [attr.id]="hid" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#fff" stop-opacity=".28" />
            <stop offset="0.5" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" [attr.fill]="'url(#' + gid + ')'" />
        <rect width="40" height="40" rx="11" [attr.fill]="'url(#' + hid + ')'" />
        <ellipse cx="20" cy="22" rx="15" ry="6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.8" transform="rotate(-22 20 22)" />
        <path d="M24.5 9.5v13.2a6.2 6.2 0 0 1-12.4 0" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" />
        <circle cx="31" cy="11.5" r="3" fill="#FFD166" />
      </svg>
      @if (wordmark()) {
        <span class="logo-word">Java<span>Atlas</span></span>
      }
    </span>
  `,
})
export class LogoComponent {
  readonly size = input(32);
  readonly wordmark = input(true);
  /** 'light' for dark backgrounds. */
  readonly tone = input<'auto' | 'light'>('auto');
  protected readonly gid = `lg${++uid}`;
  protected readonly hid = `lh${uid}`;
}
