import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiperModule } from 'swiper/angular';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog'

import { SharedRoutingModule } from './shared-routing.module';
import { SharedComponent } from './shared.component';
import { OffersComponent } from './pages/offers/offers.component';
import { WeekoffersComponent } from './pages/weekoffers/weekoffers.component';
import { NewsComponent } from './pages/news/news.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [
    SharedComponent,
    OffersComponent,
    WeekoffersComponent,
    NewsComponent,
    DialogComponent
  ],
  imports: [
    CommonModule,
    SharedRoutingModule,
    SwiperModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  exports: [
    OffersComponent,
    WeekoffersComponent,
    NewsComponent
  ]
})
export class SharedModule { }
