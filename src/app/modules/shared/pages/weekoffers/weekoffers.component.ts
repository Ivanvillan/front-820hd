import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Offer } from 'src/app/models/offers.model';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OffersService } from 'src/app/services/offers/offers.service';
import SwiperCore, { Navigation, Pagination, Swiper } from "swiper";
import { DialogComponent } from '../../components/dialog/dialog.component';


SwiperCore.use([Navigation, Pagination]);

@Component({
  selector: 'app-weekoffers',
  templateUrl: './weekoffers.component.html',
  styleUrls: ['./weekoffers.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class WeekoffersComponent implements OnInit {

  isAdmin: boolean = false;
  weekoffers: Offer[] = [];

  constructor(
    private credentialsService: CredentialsService, 
    private offersService: OffersService,
    public dialog: MatDialog
  ) { 
    const data = JSON.parse(this.credentialsService.getCredentials()!)
    if(data.type !== 'customer') {
      this.isAdmin = true;
    }
  }

  ngOnInit() {
    this.offersService.readWeekly().subscribe({
      next: (res) => {
        this.weekoffers = res        
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  openDialog(weekoffer: Offer): void {
    const data = {
      title: weekoffer.title,
      description: weekoffer.description,
      additional: weekoffer.additional,
      discount: weekoffer.discount,
      price: weekoffer.price
    }
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '500px',
      height: '250px',
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

}
