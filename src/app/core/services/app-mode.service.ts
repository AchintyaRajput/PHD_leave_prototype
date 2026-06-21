import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppMode = 'student' | 'admin';

@Injectable({ providedIn: 'root' })
export class AppModeService {
  private readonly modeSubject = new BehaviorSubject<AppMode>('student');

  /** Observable of the current application mode. */
  readonly currentMode$: Observable<AppMode> = this.modeSubject.asObservable();

  /** Returns the current mode synchronously. */
  get currentMode(): AppMode {
    return this.modeSubject.value;
  }

  /** Sets the mode directly. */
  setMode(mode: AppMode): void {
    this.modeSubject.next(mode);
  }

  /** Toggles between student and admin modes. Returns the default route for the new mode. */
  toggleMode(): string {
    const newMode: AppMode = this.modeSubject.value === 'student' ? 'admin' : 'student';
    this.modeSubject.next(newMode);
    return newMode === 'admin' ? '/admin/phd-leave/search' : '/phd-leave/dashboard';
  }
}
