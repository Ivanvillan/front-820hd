import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageRoutingModule } from './manage-routing.module';
import { ManageComponent } from './manage.component';
import { BannerModule } from '../banner/banner.module';
import { HeaderModule } from '../header/header.module';


@NgModule({
  declarations: [
    ManageComponent
  ],
  imports: [
    CommonModule,
    ManageRoutingModule,
    HeaderModule,
    BannerModule
  ]
})
export class ManageModule { }
