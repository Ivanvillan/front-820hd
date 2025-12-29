import { Component } from '@angular/core';

/**
 * AdminLayoutComponent - Layout para usuarios administradores y técnicos
 * ✅ Componente específico para roles admin y technician
 * ✅ Utiliza TopNavbarComponent para navegación
 * ✅ Diseño consistente Material Design 13
 */
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  // Este componente ahora es simplemente un contenedor
  // La lógica de navegación y usuario está en TopNavbarComponent
  constructor() {}
}

