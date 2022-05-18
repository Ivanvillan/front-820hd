import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule} from '@angular/material/snack-bar'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SigninRoutingModule } from './signin-routing.module';
import { SigninComponent } from './signin.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthComponent } from './components/auth/auth.component';


@NgModule({
  declarations: [
    SigninComponent,
    LoginComponent,
    AuthComponent
  ],
  imports: [
    CommonModule,
    SigninRoutingModule,
    FormsModule,
    FontAwesomeModule,
    MatSnackBarModule
  ]
})
export class SigninModule { }
