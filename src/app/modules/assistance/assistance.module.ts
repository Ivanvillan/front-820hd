import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssistanceRoutingModule } from './assistance-routing.module';
import { AssistanceComponent } from './assistance.component';
import { HeaderModule } from '../header/header.module';
import { BannerModule } from '../banner/banner.module';


@NgModule({
  declarations: [
    AssistanceComponent
  ],
  imports: [
    CommonModule,
    AssistanceRoutingModule,
    BannerModule,
    HeaderModule
  ]
})
export class AssistanceModule { }
