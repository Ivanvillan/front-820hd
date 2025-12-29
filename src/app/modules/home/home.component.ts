import { Component, OnInit } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  showNews: boolean = true;

  constructor(private credentialsService: CredentialsService) { }

  ngOnInit(): void {
    // Ocultar noticias para técnicos y admin
    const credentials = this.credentialsService.getCredentialsParsed();
    const userType = credentials?.type;
    this.showNews = userType !== 'technician' && userType !== 'admin';
  }

}
