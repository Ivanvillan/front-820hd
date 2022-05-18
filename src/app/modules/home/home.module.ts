import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { BannerModule } from '../banner/banner.module';
import { HeaderModule } from '../header/header.module';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    HomeRoutingModule,
    BannerModule,
    HeaderModule,
    SharedModule
  ]
})
export class HomeModule { }
