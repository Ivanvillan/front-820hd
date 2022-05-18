import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuppliesComponent } from './supplies.component';

const routes: Routes = [{ path: '', component: SuppliesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuppliesRoutingModule { }
