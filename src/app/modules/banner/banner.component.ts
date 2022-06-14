import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
})
export class BannerComponent {

  faChevronDown = faChevronDown;
  isHome: boolean = false;
  isAdmin: boolean = false;
  isUser: boolean = false;
  isSupplies: boolean = false;
  offerButton: number = 0;

  constructor(private activatedRoute: ActivatedRoute) {
    if (window.location.href.includes('/home')) {
      this.isHome = true;
      this.isAdmin = false;
      this.isUser = false;
    }
    if (window.location.href.includes('/manage')) {
      const params = this.activatedRoute.snapshot.params;
      this.isAdmin = true;
      this.isUser = false;
      this.isHome = false;
      if(params) {
        this.offerButton = params['selectedIndex'];
      }
    }
    if (window.location.href.includes('/supplies')) {
      this.isUser = true;
      this.isAdmin = false;
      this.isHome = false;
      this.isSupplies = true;
    }
    if (window.location.href.includes('/assistance')) {
      this.isUser = true;
      this.isAdmin = false;
      this.isHome = false;
      this.isSupplies = false;
    }
  }

  ngOnInit(): void {
    
  }

}
