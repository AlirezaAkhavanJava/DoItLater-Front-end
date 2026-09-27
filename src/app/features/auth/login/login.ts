import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const RATE_LIMIT = { maxAttempts: 3, windowMs: 30_000 };

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  identifier = '';
  password = '';
  remember = false;
  showPassword = false;

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private rateLimit = { attempts: 0, resetAt: 0 };

  constructor() {
    try {
      const remembered = localStorage.getItem('doitlater.rememberedUser');
      if (remembered) {
        this.identifier = remembered;
        this.remember = true;
      }
    } catch { /* ignore */ }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    if (this.rateLimitExceeded()) {
      this.errorMessage.set('Too many attempts. Please wait 30 seconds.');
      return;
    }

    const identifier = this.sanitizeInput(this.identifier);
    const password = this.password;

    if (!identifier) {
      this.errorMessage.set('Please enter your username or email.');
      return;
    }
    if (!password) {
      this.errorMessage.set('Please enter your password.');
      return;
    }

    this.submitting.set(true);

    this.auth.login({ identifier, password }).subscribe({
      next: () => {
        try {
          if (this.remember) localStorage.setItem('doitlater.rememberedUser', identifier);
          else localStorage.removeItem('doitlater.rememberedUser');
        } catch { /* ignore */ }
        this.router.navigateByUrl('/habits');
      },
      error: (err) => {
        console.warn('[auth] login error:', err);
        const status = err?.status;
        if (status === 401 || status === 403) {
          this.errorMessage.set('Invalid credentials.');
        } else if (status === 429) {
          this.errorMessage.set('Too many attempts. Please wait a minute.');
        } else {
          this.errorMessage.set('Login failed. Please try again.');
        }
        this.submitting.set(false);
      },
      complete: () => this.submitting.set(false),
    });
  }

  private sanitizeInput(value: string): string {
    return String(value ?? '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private rateLimitExceeded(): boolean {
    const now = Date.now();
    if (now > this.rateLimit.resetAt) {
      this.rateLimit = { attempts: 0, resetAt: now + RATE_LIMIT.windowMs };
    }
    this.rateLimit.attempts++;
    return this.rateLimit.attempts > RATE_LIMIT.maxAttempts;
  }
}