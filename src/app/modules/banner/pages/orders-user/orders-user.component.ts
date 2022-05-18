import { Component, OnInit } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OrdersService } from 'src/app/services/orders/orders.service';

@Component({
  selector: 'app-orders-user',
  templateUrl: './orders-user.component.html',
  styleUrls: ['./orders-user.component.css']
})
export class OrdersUserComponent implements OnInit {

  columns: string[] = ['Contacto', 'Descripcion', 'Observación', 'Fecha', 'Tipo'];
  imageType = '';
  dataTable: any = [];
  dataDescribe = {
    fecha: '',
    descripcion: '',
    contacto: '',
    observaciones: '',
    insu: false,
    sopo: false
  }

  constructor(private ordersService: OrdersService, private credentialsService: CredentialsService) { }

  ngOnInit() {
    const data = JSON.parse(this.credentialsService.getCredentials()!);
    this.ordersService.readAll(data.idClient).subscribe({
      next: (res) => {
        console.log(res);
        this.dataTable = this.dataTable.concat(res)
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  describeOrder(data: any) {
    this.dataDescribe = data;
  }
}
