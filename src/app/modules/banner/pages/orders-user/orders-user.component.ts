import { Component, OnInit } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OrdersService } from 'src/app/services/orders/orders.service';

import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { faDisplay } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-orders-user',
  templateUrl: './orders-user.component.html',
  styleUrls: ['./orders-user.component.css']
})
export class OrdersUserComponent implements OnInit {

  faCalendar = faCalendar;
  faDisplay = faDisplay;
  firstDate: string = '';
  secondDate: string = '';
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
    this.readAll();
  }

  describeOrder(data: any) {
    this.dataDescribe = data;
  }
  readAll() {
    const data = JSON.parse(this.credentialsService.getCredentials()!);
    this.dataDescribe.contacto = data.contact;
    this.ordersService.readAll(data.idClient).subscribe({
      next: (res) => {
        this.dataTable = [];
        this.dataTable = this.dataTable.concat(res)
      },
      error: (err) => {
        console.log(err);
      }
    })
  }
  search() {
    const data = JSON.parse(this.credentialsService.getCredentials()!);
    if(this.firstDate && this.secondDate) {
      this.ordersService.readByDate(data.idClient, this.firstDate, this.secondDate).subscribe({
        next: (res) => {
          if(res) {
            this.dataTable = [];
            this.dataTable = this.dataTable.concat(res)
          }
        },
        error: (err) => {
          console.log(err);
        }
      })
    } else {
      this.readAll();
    }
  }
}
