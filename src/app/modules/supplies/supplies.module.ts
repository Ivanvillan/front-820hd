import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuppliesRoutingModule } from './supplies-routing.module';
import { SuppliesComponent } from './supplies.component';
import { HeaderModule } from '../header/header.module';
import { BannerModule } from '../banner/banner.module';


@NgModule({
  declarations: [
    SuppliesComponent
  ],
  imports: [
    CommonModule,
    SuppliesRoutingModule,
    BannerModule,
    HeaderModule
  ]
})
export class SuppliesModule { }
