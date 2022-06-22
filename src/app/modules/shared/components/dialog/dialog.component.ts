import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Offer } from 'src/app/models/offers.model';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OrdersService } from 'src/app/services/orders/orders.service';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent {

  order = {
    descripcion: '',
    insu: 0,
    sopo: 0,
    id7: 0,
    id7c: 0
  }

  API_URI: string = '';

  constructor(
    private credentialsService: CredentialsService,
    private ordersService: OrdersService,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Offer,
  ) { 
    if(window.location.hostname.includes('localhost')){   
      this.API_URI = 'http://localhost:3001/images';
    }
    if (!window.location.hostname.includes('localhost')) {
      this.API_URI = 'https://api.820hd.com.ar/images'
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  send() {
    const credential = JSON.parse(this.credentialsService.getCredentials()!);
    this.order.id7 = credential.idClient;
    this.order.id7c = credential.idContact;
    this.order.descripcion = `[Oferta] ${this.data.title} ${this.data.description}`

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
