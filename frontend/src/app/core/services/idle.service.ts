import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

@Injectable({ providedIn: 'root' })
export class IdleService {
  private ngZone = inject(NgZone);
  private router = inject(Router);
  private authService = inject(AuthService);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private readonly onActivity = () => this.resetTimer();

  start() {
    if (this.running) return;
    this.running = true;

    // Les listeners d'activité (mousemove...) déclenchent trop souvent pour
    // faire tourner la détection de changements Angular à chaque fois.
    this.ngZone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, this.onActivity, { passive: true }));
      this.resetTimer();
    });
  }

  stop() {
    this.running = false;
    ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, this.onActivity));
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  private resetTimer() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => this.onIdleTimeout(), IDLE_TIMEOUT_MS);
  }

  private onIdleTimeout() {
    this.stop();
    this.ngZone.run(() => {
      this.authService.logout().subscribe({
        complete: () => this.router.navigate(['/auth/login']),
        error: () => this.router.navigate(['/auth/login']),
      });
    });
  }
}
