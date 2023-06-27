import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OrdersService } from 'src/app/services/orders/orders.service';

import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { faDisplay } from '@fortawesome/free-solid-svg-icons';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';


@Component({
  selector: 'app-orders-user',
  templateUrl: './orders-user.component.html',
  styleUrls: ['./orders-user.component.css']
})
export class OrdersUserComponent implements OnInit {

  @ViewChild('ordersTable',{static: true}) ordersTable?: ElementRef;
  faCalendar = faCalendar;
  faDisplay = faDisplay;
  firstDate: string = '';
  secondDate: string = '';
  columns: string[] = ['Inicio', 'Contacto', 'Problema', 'Resolución', 'Tipo', 'Responsable', 'Fin'];
  imageType = '';
  dataTable: any[] = [];
  dataDescribe = {
    fechaini: '',
    contacto: '',
    descripcion: '',
    observaciones: '',
    insu: false,
    sopo: false,
    referente: '',
    fechafin: ''
  }
  searchButtonText: string = 'Buscar';
  contactName: string = '';
  userType: string = '';
  clients: any[] = [];
  client: any;
  selectOrderList: object[] = [
    {list: 'personales'},
    {list: 'general'}
  ]
  selectedOrderList: string = 'personales';

  constructor(private ordersService: OrdersService, private credentialsService: CredentialsService) { 
    const data = JSON.parse(this.credentialsService.getCredentials()!);    
    this.contactName = data.contact;
    this.userType = data.type;
  }

  ngOnInit() {
    if(this.userType === 'admin') {
      this.readAllClients();
    }
    if(this.userType === 'customer') {
      this.readAll();
    }    
  }

  describeOrder(data: any) {
    this.dataDescribe = data; 
    this.contactName = this.dataDescribe?.contacto       
  }
  readAll() {
    const data = JSON.parse(this.credentialsService.getCredentials()!);    
    let contact = data?.idContact;
    this.searchButtonText = 'Buscando...';
    this.dataTable = [];
    this.ordersService.readAllByContact(contact).subscribe({
      next: (res) => {        
        this.searchButtonText = 'Buscar';
        if (window.location.href.includes('/supplies')) {
          this.dataTable = this.dataTable.concat(res);
          this.dataTable = this.dataTable.filter(
            (el: { insu: any; sopo: any }) => el.insu == true || (el.insu == false && el.sopo == false) )
        }
        if (window.location.href.includes('/assistance')) {
          this.dataTable = this.dataTable.concat(res);
          this.dataTable = this.dataTable.filter(
            (el: { insu: any; sopo: any }) => el.sopo == true || (el.insu == false && el.sopo == false))
        }
      },
      error: (err) => {
        this.searchButtonText = 'Buscar';
        console.log(err);
      }
    })
  }
  searchByClient() {
    this.searchButtonText = 'Buscando...';
    this.dataTable = [];
    this.ordersService.readByDate(this.client?.id7, this.firstDate, this.secondDate).subscribe({
      next: (res) => {
        this.searchButtonText = 'Buscar';
        if(res) {
          this.dataTable = this.dataTable.concat(res)
        }
      },
      error: (err) => {
        this.searchButtonText = 'Buscar';
        console.log(err);
      }
    })
  }

  searchByDateAndClient() {
    this.searchButtonText = 'Buscando...';
    const data = JSON.parse(this.credentialsService.getCredentials()!);    
    let client = data?.idClient;
    this.dataTable = [];
    this.ordersService.readByDate(client, this.firstDate, this.secondDate).subscribe({
      next: (res) => {
        this.searchButtonText = 'Buscar';
        if(res) {
          this.dataTable = this.dataTable.concat(res)
        }
      },
      error: (err) => {
        this.searchButtonText = 'Buscar';
        console.log(err);
      }
    })
  }

  readAllByClient() {
    this.searchButtonText = 'Buscando...';
    const data = JSON.parse(this.credentialsService.getCredentials()!);    
    let client = data?.idClient;
    this.dataTable = [];
    this.ordersService.readAll(client).subscribe({
      next: (res) => {
        this.searchButtonText = 'Buscar';
        if(res) {
          this.dataTable = this.dataTable.concat(res)
        }
      },
      error: (err) => {
        this.searchButtonText = 'Buscar';
        console.log(err);
      }
    })

  }

  searchByContact() {
    const data = JSON.parse(this.credentialsService.getCredentials()!);    
    let contact = data?.idContact;
    this.searchButtonText = 'Buscando...';
    this.dataTable = [];
    this.ordersService.readByDateAndContact(contact, this.firstDate, this.secondDate).subscribe({
      next: (res) => {
        this.searchButtonText = 'Buscar';
        if(res) {
          this.dataTable = this.dataTable.concat(res)
        }
      },
      error: (err) => {
        this.searchButtonText = 'Buscar';
        console.log(err);
      }
    })
  }


  readAllClients() {
    this.ordersService.readAllClients().subscribe({
      next: (res) => {
        this.clients = [res].flat();
      }, 
      error: (err) => {
        console.log(err);
      }
    });
  } 

  readCustomClient(): void {
    this.searchButtonText = 'Buscando...';
    this.dataTable = [];
    this.ordersService.readAll(this.client?.id7).subscribe({
      next: (res) => {    
        this.searchButtonText = 'Buscar';
        if (window.location.href.includes('/supplies')) {
          this.dataTable = this.dataTable.concat(res);
          this.dataTable = this.dataTable.filter(
            (el: { insu: any; sopo: any }) => el.insu == true || (el.insu == false && el.sopo == false) )
          }
        if (window.location.href.includes('/assistance')) {
          this.dataTable = this.dataTable.concat(res);
          this.dataTable = this.dataTable.filter(
            (el: { insu: any; sopo: any }) => el.sopo == true || (el.insu == false && el.sopo == false))
        }
      },
      error: (err) => {
        this.searchButtonText = 'Buscar';
        console.log(err);
      }
    })
  }


  onSearch() {
    if(this.client && this.firstDate && this.secondDate)
      return this.searchByClient();
    if(this.client && !this.firstDate && !this.secondDate)
      return this.readCustomClient();
    if(this.selectedOrderList === 'personales' && !this.client && this.firstDate && this.secondDate)
      return this.searchByContact();
    if(this.selectedOrderList === 'personales' && !this.client && !this.firstDate && !this.secondDate)
      return this.readAll();
    if(this.selectedOrderList === 'general' && !this.client && this.firstDate && this.secondDate)
      return this.searchByDateAndClient();
    if(this.selectedOrderList === 'general' && !this.client && !this.firstDate && !this.secondDate) 
      return this.readAllByClient();
  }

  formatDate(date: string): string {
    let formattedDate = new Date(date);
    let year = formattedDate.getFullYear();
    let month = formattedDate.getMonth() + 1;
    let day = formattedDate.getDate();
    return `${day}-${month}-${year}`;
  }

  PDFExport() { 
    const doc = new jsPDF(); // Create a new jsPDF instance

    // Define column headers and row data
    const headers = [this.columns];
    const data: any[] = [];

    this.dataTable.map( row => {
      let type = '';
      let fechaini = this.formatDate(row.fechaini) ?? '';
      let fechafin = this.formatDate(row.fechafin) ?? '';
      if(row.insu) type = 'Insumo';
      if(row.sopo) type = 'Servicio';
      data.push([fechaini, row.contacto, row.descripcion, row.observaciones, type, row.referente, fechafin])
    })
    // Set column widths
    const columnWidths = [20, 25, 40, 40, 18, 25, 20];
  
    // Define the table styles
    const tableStyles: Partial<Styles> = {
      fillColor: [255, 255, 255], // White background color
      textColor: [0, 0, 0], // Black text color
      cellPadding: 3, // Set cell padding to 3
      fontSize: 8, // Set font size to 8
    };

    const headerStyles: Partial<Styles> = {
      fillColor: [192, 192, 192], // Gray background color
      textColor: [255, 255, 255], // White text color
      fontStyle: 'bold' // Set font style to bold
    };

    // Generate the PDF table and add it to the document
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20, // Start position from top of page
      margin: { horizontal: 10 }, // Left and right margin
      styles: tableStyles,
      headStyles: headerStyles,
      columnStyles: { 
        0: { cellWidth: columnWidths[0] }, 
        1: { cellWidth: columnWidths[1] }, 
        2: { cellWidth: columnWidths[2] },
        3: { cellWidth: columnWidths[3] },
        4: { cellWidth: columnWidths[4] }, 
        5: { cellWidth: columnWidths[5] }, 
        6: { cellWidth: columnWidths[6] }
      } // Set column widths
    });
  
    // Set file name with current date and time
    const date = new Date();
    const fileName = `Reporte de ordenes ${this.client?.nombre ?? 'PCASSI'} ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}.pdf`;
  
    // Download the PDF file
    doc.save(fileName)
  }

  XLSXExport() { 
      const date = new Date();
      const fileName = `Reporte de ordenes ${this.client?.nombre ?? 'PCASSI'} ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}.xlsx`;
      const table = document.getElementById('order-table');
    
      // Create a worksheet from the table
      const worksheet = XLSX.utils.table_to_sheet(table);
    
      // Set column widths
      const columnWidths = [
        { wch: 10 },
        { wch: 15 },
        { wch: 80 },
        { wch: 80 },
        { wch: 10 },
        { wch: 15 },
        { wch: 10 }
      ];
      worksheet['!cols'] = columnWidths;
    
      // Set header style
      const headerStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'C0C0C0' } } // Light gray background color
      };
      Object.keys(worksheet).forEach(cell => {
        if (cell.startsWith('A1')) { // First cell is the header cell
          XLSX.utils.format_cell(worksheet[cell], headerStyle);
        }
      });
    
      // Set body style
      const bodyStyle = {
        font: { bold: false },
        fill: { fgColor: { rgb: 'FFFFFF' } } // White background color
      };
      Object.keys(worksheet).forEach(cell => {
        if (cell.startsWith('A2')) { // Skip header cell
          XLSX.utils.format_cell(worksheet[cell], bodyStyle);
        }
      });
    
      // Create a new workbook and add the worksheet to it
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, fileName);
  }

  customSearchFn(term: string, item: any) {
    term = term.toLocaleLowerCase();
    return item.nombre.toLocaleLowerCase().indexOf(term) > -1;
  }
}
