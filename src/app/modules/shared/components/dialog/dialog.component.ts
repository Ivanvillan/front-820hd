import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OrdersService } from 'src/app/services/orders/orders.service';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent {
  quantity: number | string = '';

  order = {
    descripcion: '',
    insu: 0,
    sopo: 0,
    id7: 0,
    id7c: 0,
    name: '',
    email: '',
    cantidad: 0
  }

  randomNumber: number = 0;

  API_URI: string = '';

  @ViewChild('quantityInput') quantityInput?: ElementRef;

  Number = Number;

  constructor(
    private credentialsService: CredentialsService,
    private ordersService: OrdersService,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { 
    if(window.location.hostname.includes('localhost')){   
      this.API_URI = 'http://localhost:3001/images';
    }
    if (!window.location.hostname.includes('localhost')) {
      this.API_URI = 'https://api.820hd.com.ar/images'
    } 
    this.randomNumber = Math.floor(Math.random() * 3) + 1;   
  }

  ngAfterViewInit(): void {
    if(this.quantityInput) {
      this.quantityInput.nativeElement.focus();
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  send() {
    const credential = JSON.parse(this.credentialsService.getCredentials()!);
    this.order.id7 = credential.idClient;
    this.order.id7c = credential.idContact;
    this.order.descripcion = `[Ofertas] ${this.quantity} ${this.data.title} ${this.data.description}`
    this.order.name = credential.name;
    this.order.email = credential.email;
    this.order.cantidad = Number(this.quantity);
    if(this.data?.type == 1) {
      this.order.insu = 1;
    } else {
      this.order.sopo = 1;
    }    
    
    this.ordersService.create(this.order).subscribe({
      next: (res) => {
        this._snackBar.open('Pedido solicitado con éxito', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
        this.dialogRef.close();
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

  incrementQuantity(): void {
    if (typeof this.quantity === 'string') {
      this.quantity = parseInt(this.quantity) || 0;
    }
    this.quantity = Number(this.quantity) + 1;
  }

  decrementQuantity(): void {
    if (typeof this.quantity === 'string') {
      this.quantity = parseInt(this.quantity) || 0;
    }
    if (this.quantity > 1) {
      this.quantity = Number(this.quantity) - 1;
    }
  }

  validateNumber(event: KeyboardEvent): boolean {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}
