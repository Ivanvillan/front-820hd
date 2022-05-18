import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
  { path: 'signin', loadChildren: () => import('./modules/signin/signin.module').then(m => m.SigninModule) }, 
  { path: 'home', loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule) }, 
  { path: 'supplies', loadChildren: () => import('./modules/supplies/supplies.module').then(m => m.SuppliesModule) }, 
  { path: 'assistance', loadChildren: () => import('./modules/assistance/assistance.module').then(m => m.AssistanceModule) }, 
  { path: 'header', loadChildren: () => import('./modules/header/header.module').then(m => m.HeaderModule) }, 
  { path: 'banner', loadChildren: () => import('./modules/banner/banner.module').then(m => m.BannerModule) },
  { path: 'manage/:selectedIndex', loadChildren: () => import('./modules/manage/manage.module').then(m => m.ManageModule) },
  { path: 'shared', loadChildren: () => import('./modules/shared/shared.module').then(m => m.SharedModule) },
  { path: '**', redirectTo: '/signin'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
