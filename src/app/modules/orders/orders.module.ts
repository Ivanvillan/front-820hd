import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Material imports
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Components
import { OrdersContainerComponent } from './pages/orders-container/orders-container.component';

// Shared modules
import { BannerModule } from '../banner/banner.module';
import { HeaderModule } from '../header/header.module';

/**
 * OrdersModule - Módulo unificado para gestión de pedidos
 * ✅ Unifica /supplies y /assistance en un solo módulo
 * ✅ El tipo de orden (insumos/servicios) se determina por la ruta
 */

const routes: Routes = [
  {
    path: '',
    component: OrdersContainerComponent
  }
];

@NgModule({
  declarations: [
    OrdersContainerComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // Material
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    // Shared
    BannerModule,
    HeaderModule
  ]
})
export class OrdersModule { }

