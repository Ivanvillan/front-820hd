import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Offer } from 'src/app/models/offers.model';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OffersService } from 'src/app/services/offers/offers.service';
import { ConfigService } from 'src/app/services/config/config.service';
import SwiperCore, { Navigation, Pagination, Swiper, Autoplay } from "swiper";
import { DialogComponent } from '../../components/dialog/dialog.component';


SwiperCore.use([Navigation, Pagination, Autoplay]);

@Component({
  selector: 'app-weekoffers',
  templateUrl: './weekoffers.component.html',
  styleUrls: ['./weekoffers.component.css']
})
export class WeekoffersComponent implements OnInit {

  isAdmin: boolean = false;
  weekoffers: Offer[] = [];
  API_URI: string = '';


  constructor(
    private credentialsService: CredentialsService, 
    private offersService: OffersService,
    public dialog: MatDialog,
    private configService: ConfigService
  ) { 
    const data = this.credentialsService.getCredentialsParsed();
    if(data && data.type !== 'customer') {
      this.isAdmin = true;
    }
    // ✅ Usar configuración centralizada
    this.API_URI = this.configService.IMAGE_URL;
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
