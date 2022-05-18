import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateOfferDTO, Offer } from 'src/app/models/offers.model';
import { OffersService } from 'src/app/services/offers/offers.service';

@Component({
  selector: 'app-offer-admin',
  templateUrl: './offer-admin.component.html',
  styleUrls: ['./offer-admin.component.css'],
})
export class OfferAdminComponent implements OnInit {
  imgToShow: any;
  columns: string[] = ['Titulo', 'Descripcion', 'Precio', 'Descuento', 'Tipo', 'Semanal'];
  fileUpload: any;
  base64textString = '';
  imageType = '';
  dataTable: Offer[] = [];
  clickedRows = new Set<Offer>();
  dataDescribe: Offer = {
    title: '',
    description: '',
    additional: '',
    price: 0,
    discount: 0,
    type: 0,
    weekly: false,
    idadvertisement: 0,
    more_info: '',
  }
  offer: CreateOfferDTO = {
    title: '',
    description: '',
    additional: '',
    price: 0,
    discount: 0,
    type: 0,
    weekly: false,
  }

  constructor(private offersService: OffersService, private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.readOffers();
  }

  readURL(event: any): void {
    if (event?.target?.files && event.target.files[0]) {
      this.fileUpload = event.target.files;
      const file = event.target.files[0];
      const reader = new FileReader();
      this.imageType = file.type.split('/')[1];
      reader.onload = e => this.imgToShow = reader.result;
      reader.readAsDataURL(file);
    }
  }
  handleFileSelect() {
    const files = this.fileUpload;
    const file = files[0];
    if (files && file) {
      const reader = new FileReader();
      reader.onload = this._handleReaderLoaded.bind(this);
      reader.readAsBinaryString(file);
    }
  }
  _handleReaderLoaded(readerEvt: any) {
    var binaryString = readerEvt.target.result;
    this.base64textString = `data:image/${this.imageType};base64,${btoa(binaryString)}`;
    this.offer.additional = this.base64textString;

    this.offersService.create(this.offer).subscribe({
      next: (res) => {
        this.readOffers();
        this._snackBar.open('La oferta se creo correctamente', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      },
      error: (err) => {
        this._snackBar.open('Error al crear oferta', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      }
    })
  }
  readOffers() {
    this.offersService.readAll().subscribe({
      next: (res) => {
        this.dataTable = res
      },
      error: (err) => {
        console.log(err);
      }
    })
  }
  describeOffer(data: Offer) {
    this.dataDescribe = data;
  }
  create() {
    this.handleFileSelect();
  }
}
