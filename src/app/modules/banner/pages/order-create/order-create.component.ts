import { Component, OnInit } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.css']
})
export class OrderCreateComponent implements OnInit {

  showNews: boolean = true;

  constructor(private credentialsService: CredentialsService) { }

  ngOnInit() {
    // Ocultar noticias para técnicos y admin
    const credentials = this.credentialsService.getCredentialsParsed();
    const userType = credentials?.type;
    this.showNews = userType !== 'technician' && userType !== 'admin';
  }

}
