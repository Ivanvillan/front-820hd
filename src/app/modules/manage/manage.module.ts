import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageRoutingModule } from './manage-routing.module';
import { ManageComponent } from './manage.component';
import { BannerModule } from '../banner/banner.module';
import { SharedModule } from '../shared/shared.module';
import { LayoutsModule } from 'src/app/layouts/layouts.module';


@NgModule({
  declarations: [
    ManageComponent
  ],
  imports: [
    CommonModule,
    ManageRoutingModule,
    LayoutsModule,
    BannerModule,
    SharedModule
  ]
})
export class ManageModule { }
