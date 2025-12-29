import { Injectable, OnDestroy } from '@angular/core';
import { SessionService } from './session.service';
import { Subscription } from 'rxjs';

/**
 * Servicio para advertir a técnicos antes de cerrar navegador
 */
@Injectable({
  providedIn: 'root'
})
export class SessionWarningService implements OnDestroy {
  
  private sessionSubscription?: Subscription;
  private beforeUnloadListener?: (event: BeforeUnloadEvent) => void;

  constructor(private sessionService: SessionService) {
    this.initialize();
  }

  private initialize(): void {
    // Suscribirse a cambios de sesión
    this.sessionSubscription = this.sessionService.session$.subscribe(session => {
      if (session?.type === 'technician' && session.area && session.area !== 'general') {
        this.addBeforeUnloadListener();
      } else {
        this.removeBeforeUnloadListener();
      }
    });
  }

  private addBeforeUnloadListener(): void {
    if (this.beforeUnloadListener) return; // Ya existe
    
    this.beforeUnloadListener = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '¿Estás seguro de que quieres salir?';
      return event.returnValue;
    };
    
    window.addEventListener('beforeunload', this.beforeUnloadListener);
  }

  private removeBeforeUnloadListener(): void {
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = undefined;
    }
  }

  ngOnDestroy(): void {
    this.removeBeforeUnloadListener();
    this.sessionSubscription?.unsubscribe();
  }
}

