import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Offer } from 'src/app/models/offers.model';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { OffersService } from 'src/app/services/offers/offers.service';
import { DialogComponent } from '../../components/dialog/dialog.component';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.css']
})
export class OffersComponent implements OnInit {

  isAdmin: boolean = false;
  offers: Offer[] = [];

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
  ngOnInit(): void {
    this.offersService.readStandard().subscribe({
      next: (res) => {
        this.offers = res
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

  openDialog(offer: Offer): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '500px',
      height: '250px',
      data: offer
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

}
