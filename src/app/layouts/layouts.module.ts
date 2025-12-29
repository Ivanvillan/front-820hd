import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

// Layout components
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { UserLayoutComponent } from './user-layout/user-layout.component';

// Shared modules (para UserLayout - clientes)
import { HeaderModule } from '../modules/header/header.module';
import { BannerModule } from '../modules/banner/banner.module';

// New components (para AdminLayout - admin y técnicos)
import { TopNavbarModule } from '../components/top-navbar/top-navbar.module';

/**
 * LayoutsModule - Módulo de layouts reutilizables
 * ✅ AdminLayout usa TopNavbarComponent (nuevo diseño)
 * ✅ UserLayout usa HeaderComponent + BannerComponent (diseño original para clientes)
 */
@NgModule({
  declarations: [
    AdminLayoutComponent,
    UserLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    // Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    // Nuevos componentes para Admin/Técnicos
    TopNavbarModule,
    // Componentes originales para Clientes
    HeaderModule,
    BannerModule
  ],
  exports: [
    AdminLayoutComponent,
    UserLayoutComponent
  ]
})
export class LayoutsModule { }

