import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../core/account.service';
import { UiService } from '../core/ui.service';

/** Header: "Log in" when signed out, or the learner's menu when signed in. Hidden if there's no backend. */
@Component({
  selector: 'app-account-menu',
  imports: [RouterLink],
  host: { '(document:click)': 'onDocClick($event)', '(document:keydown.escape)': 'open.set(false)' },
  template: `
    @if (account.checked() && account.online()) {
      @if (account.me(); as me) {
        <div class="acct-wrap">
          <button type="button" class="acct-btn" aria-haspopup="menu" [attr.aria-expanded]="open()" (click)="open.set(!open())">
            <span class="avatar" aria-hidden="true">{{ initial() }}</span><span class="acct-name">{{ firstName() }}</span>
          </button>
          @if (open()) {
            <div class="menu" role="menu">
              <div class="who">{{ me.email }}</div>
              <a role="menuitem" routerLink="/my/learning" (click)="open.set(false)">My learning</a>
              <a role="menuitem" routerLink="/my/courses" (click)="open.set(false)">My courses</a>
              <a role="menuitem" routerLink="/my/orders" (click)="open.set(false)">Orders and receipts</a>
              <a role="menuitem" routerLink="/feedback" (click)="open.set(false)">Send feedback</a>
              @if (account.isAdmin()) {
                <a role="menuitem" routerLink="/admin" (click)="open.set(false)">Admin</a>
              }
              <button type="button" role="menuitem" (click)="logout()">Log out</button>
            </div>
          }
        </div>
      } @else {
        <button type="button" class="btn btn-ghost btn-sm" (click)="ui.auth(null, 'login')">Log in</button>
      }
    }
  `,
})
export class AccountMenuComponent {
  protected readonly account = inject(AccountService);
  protected readonly ui = inject(UiService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly open = signal(false);
  protected readonly firstName = computed(() => this.account.me()?.name.split(' ')[0] ?? '');
  protected readonly initial = computed(() => (this.account.me()?.name.trim()[0] ?? '?').toUpperCase());

  protected onDocClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  protected async logout(): Promise<void> {
    this.open.set(false);
    await this.account.logout();
    this.ui.toast('You’re logged out.');
    if (/^\/(my|admin)/.test(this.router.url)) void this.router.navigateByUrl('/courses');
  }
}
