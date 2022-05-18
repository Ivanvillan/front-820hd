import { Component, OnInit } from '@angular/core';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service'
import { MatSnackBar } from '@angular/material/snack-bar';

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
    id7c: 0
  }

  constructor(
    private ordersService: OrdersService,
    private credentialsService: CredentialsService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {
  }

  create() {
    const data = JSON.parse(this.credentialsService.getCredentials()!);
    this.order.id7 = data.idClient;
    this.order.id7c = data.idContact;

    if (window.location.href.includes('/supplies'))
      this.order.insu = 1;
    else this.order.sopo = 2;

    this.ordersService.create(this.order).subscribe({
      next: (res) => {
        this._snackBar.open('Pedido solicitado con éxito', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      },
      error: (err) => {
        this._snackBar.open('Error al solicitar pedido', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    })
  }
}
