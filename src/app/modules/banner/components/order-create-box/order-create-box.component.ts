import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service'
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServicesService } from 'src/app/services/services/services.service';
import { Service } from 'src/app/models/service.model';

@Component({
  selector: 'app-order-create-box',
  templateUrl: './order-create-box.component.html',
  styleUrls: ['./order-create-box.component.css']
})
export class OrderCreateBoxComponent implements OnInit {

  order = {
    descripcion: '',
    insu: 0,
    sopo: 0,
    id7: 0,
    id7c: 0,
    email: '',
    name: '',
    tiposerv: null
  }

  services: Service[] = [];

  constructor(
    private ordersService: OrdersService,
    private credentialsService: CredentialsService,
    private _snackBar: MatSnackBar,
    private servicesService: ServicesService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.servicesService.getServices().subscribe({
      next: (services: Service[]) => {
        this.services = services;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this._snackBar.open('Error al cargar los servicios', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  create() {
    const data = this.credentialsService.getCredentialsParsed();
    this.order.id7 = data?.idClient;
    this.order.id7c = data?.idContact;
    this.order.email = data?.email;
    this.order.name = data?.name;
    
    // ✅ Usar router.url en lugar de window.location
    const currentUrl = this.router.url;
    if (currentUrl.includes('/supplies'))
      this.order.insu = 1;
    else this.order.sopo = 1;

    this.ordersService.createIssue(this.order).subscribe({
      next: (res: any) => {
        this._snackBar.open('Pedido solicitado con éxito', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      },
      error: (err: any) => {
        this._snackBar.open('Error al solicitar pedido', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    })
  }
}
