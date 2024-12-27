import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Offer } from 'src/app/models/offers.model';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OffersService } from 'src/app/services/offers/offers.service';
import SwiperCore, { Navigation, Pagination, Swiper, Autoplay } from "swiper";
import { DialogComponent } from '../../components/dialog/dialog.component';


SwiperCore.use([Navigation, Pagination, Autoplay]);

@Component({
  selector: 'app-weekoffers',
  templateUrl: './weekoffers.component.html',
  styleUrls: ['./weekoffers.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class WeekoffersComponent implements OnInit {

  isAdmin: boolean = false;
  weekoffers: Offer[] = [];
  API_URI: string = '';


  constructor(
    private credentialsService: CredentialsService, 
    private offersService: OffersService,
    public dialog: MatDialog
  ) { 
    const data = JSON.parse(this.credentialsService.getCredentials()!)
    if(data.type !== 'customer') {
      this.isAdmin = true;
    }
    if(window.location.hostname.includes('localhost')){   
      this.API_URI = 'http://localhost:3001/images';
    }
    if (!window.location.hostname.includes('localhost')) {
      this.API_URI = 'https://api.820hd.com.ar/images'
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
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '480px',
      height: '360px',
      data: weekoffer
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
      dialogRef.close();
    });
  }

}
