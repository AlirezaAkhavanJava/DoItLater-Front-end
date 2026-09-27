import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const RATE_LIMIT = { maxAttempts: 3, windowMs: 30_000 };

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirm = '';
  terms = false;
  showPassword = false;
  showConfirm = false;

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly confirmHint = signal<{ text: string; cls: string }>({ text: '', cls: '' });
  readonly strength = signal<{ pct: number; label: string; cls: string }>({
    pct: 0, label: 'Enter a password', cls: '',
  });
  readonly ruleState = signal<Record<string, boolean>>({});

  private rateLimit = { attempts: 0, resetAt: 0 };

  private readonly COMMON_PASSWORDS = new Set([
    'password', 'password1', 'password123', '12345678', '123456789',
    'qwerty', 'qwerty123', 'letmein', 'welcome', 'admin', 'iloveyou',
    'monkey', 'dragon', 'sunshine', 'princess', 'football', 'baseball',
  ]);

  private readonly rules: Record<string, (v: string) => boolean> = {
    length:   (v) => v.length >= 8,
    upper:    (v) => /[A-Z]/.test(v),
    lower:    (v) => /[a-z]/.test(v),
    digit:    (v) => /\d/.test(v),
    symbol:   (v) => /[^A-Za-z0-9]/.test(v),
    nospace:  (v) => v.length > 0 && !/\s/.test(v),
    noRepeat: (v) => !/(.)\1{2,}/.test(v),
    noCommon: (v) => v.length > 0 && !this.COMMON_PASSWORDS.has(v.toLowerCase()),
  };

  togglePassword(): void { this.showPassword = !this.showPassword; }
  toggleConfirm(): void { this.showConfirm = !this.showConfirm; }

  onUsernameInput(): void {
    this.username = String(this.username ?? '').replace(/[^a-zA-Z0-9_.-]/g, '');
  }

  onPasswordInput(): void {
    this.updateStrength();
    this.updateRules();
    if (this.confirm.length > 0) this.checkConfirm();
  }

  onConfirmInput(): void { this.checkConfirm(); }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    if (this.rateLimitExceeded()) {
      this.errorMessage.set('Too many attempts. Please wait 30 seconds.');
      return;
    }

    const username = this.username.trim();
    const email = String(this.email ?? '').toLowerCase().replace(/\s/g, '');
    const password = this.password;
    const confirm = this.confirm;

    if (username.length < 3 || username.length > 30) {
      this.errorMessage.set('Username must be 3–30 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      this.errorMessage.set('Username may only contain letters, numbers, _, ., -');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    const score = Object.values(this.rules).filter((fn) => fn(password)).length;
    if (score < 6) {
      this.errorMessage.set('Password does not meet the requirements.');
      return;
    }
    if (password !== confirm) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    if (!this.terms) {
      this.errorMessage.set('You must accept the Terms and Privacy Policy.');
      return;
    }

    this.submitting.set(true);

    this.auth.signup({ username, email, password }).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { registered: 1 } }),
      error: (err) => {
        const status = err?.status;
        if (status === 409) this.errorMessage.set('That username or email is already taken.');
        else if (status === 400) this.errorMessage.set('Please check your input and try again.');
        else if (status === 429) this.errorMessage.set('Too many attempts. Please wait a minute.');
        else this.errorMessage.set('Sign up failed. Please try again.');
        this.submitting.set(false);
      },
      complete: () => this.submitting.set(false),
    });
  }

  private checkConfirm(): void {
    if (this.confirm.length === 0) {
      this.confirmHint.set({ text: '', cls: '' });
      return;
    }
    if (this.password === this.confirm) {
      this.confirmHint.set({ text: 'Passwords match', cls: 'ok' });
    } else {
      this.confirmHint.set({ text: 'Passwords do not match', cls: 'error' });
    }
  }

  private updateStrength(): void {
    const v = this.password;
    const score = Object.values(this.rules).filter((fn) => fn(v)).length;

    let pct = 0, label = 'Enter a password', cls = '';
    if (v.length === 0)      { pct = 0;   label = 'Enter a password'; }
    else if (score <= 3)     { pct = 25;  label = 'Weak password';        cls = 'weak'; }
    else if (score === 4)    { pct = 45;  label = 'Fair password';        cls = 'fair'; }
    else if (score === 5)    { pct = 65;  label = 'Good password';        cls = 'good'; }
    else if (score === 6)    { pct = 82;  label = 'Strong password';      cls = 'strong'; }
    else                     { pct = 100; label = 'Very strong password'; cls = 'strong'; }

    this.strength.set({ pct, label, cls });
  }

  private updateRules(): void {
    const v = this.password;
    const state: Record<string, boolean> = {};
    for (const [name, fn] of Object.entries(this.rules)) state[name] = fn(v);
    this.ruleState.set(state);
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