import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';

/**
 * OrdersContainerComponent - Contenedor unificado para pedidos
 * ✅ Reemplaza los módulos separados supplies/assistance
 * ✅ El tipo de orden se determina por la ruta actual
 */
@Component({
  selector: 'app-orders-container',
  templateUrl: './orders-container.component.html',
  styleUrls: ['./orders-container.component.scss']
})
export class OrdersContainerComponent implements OnInit {
  userType: string = '';
  orderType: 'supplies' | 'assistance' = 'supplies';
  
  constructor(
    private router: Router,
    private credentialsService: CredentialsService
  ) {}

  ngOnInit(): void {
    // Determinar tipo de usuario
    const credentials = this.credentialsService.getCredentialsParsed();
    if (credentials) {
      this.userType = credentials.type || '';
    }
    
    // Determinar tipo de orden según la URL
    this.determineOrderType();
  }

  /**
   * Determina el tipo de orden basándose en la URL
   */
  private determineOrderType(): void {
    const url = this.router.url;
    
    if (url.includes('/supplies')) {
      this.orderType = 'supplies';
    } else if (url.includes('/assistance')) {
      this.orderType = 'assistance';
    } else {
      this.orderType = 'supplies'; // Default
    }
  }

  /**
   * Título dinámico según el tipo de orden
   */
  get pageTitle(): string {
    return this.orderType === 'supplies' 
      ? 'Pedidos de Insumos' 
      : 'Pedidos de Servicios';
  }

  /**
   * Descripción dinámica según el tipo de orden
   */
  get pageDescription(): string {
    return this.orderType === 'supplies'
      ? 'Gestiona tus pedidos de insumos y materiales'
      : 'Gestiona tus solicitudes de servicio técnico y soporte';
  }
}

