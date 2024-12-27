import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginGuard } from './guards/login.guard';
import { AuthGuard } from './guards/auth.guard';
import { DashboardGuard } from './guards/dashboard.guard';
import { DashboardComponent } from './modules/shared/components/dashboard/dashboard.component';
import { DashboardAuthComponent } from './modules/shared/components/dashboard-auth/dashboard-auth.component';

const routes: Routes = [
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
  {
    path: 'signin',
    loadChildren: () => import('./modules/signin/signin.module').then(m => m.SigninModule),
    canActivate: [LoginGuard]
  },
  {
    path: 'home',
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-view',
    component: DashboardComponent,
    canActivate: [DashboardGuard]
  },
  {
    path: 'dashboard',
    component: DashboardAuthComponent
  },
  { path: 'supplies', loadChildren: () => import('./modules/supplies/supplies.module').then(m => m.SuppliesModule) }, 
  { path: 'assistance', loadChildren: () => import('./modules/assistance/assistance.module').then(m => m.AssistanceModule) }, 
  { path: 'header', loadChildren: () => import('./modules/header/header.module').then(m => m.HeaderModule) }, 
  { path: 'banner', loadChildren: () => import('./modules/banner/banner.module').then(m => m.BannerModule) },
  { path: 'manage/:selectedIndex', loadChildren: () => import('./modules/manage/manage.module').then(m => m.ManageModule) },
  { path: '**', redirectTo: '/signin'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
