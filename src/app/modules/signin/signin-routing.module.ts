import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginGuard } from 'src/app/guards/login.guard';
import { SigninComponent } from './signin.component';

const routes: Routes = [{ path: '', component: SigninComponent, canActivate: [ LoginGuard ] }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SigninRoutingModule { }
