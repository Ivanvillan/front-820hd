import { Component, OnInit } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { TwitterService } from 'src/app/services/repository/twitter.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  twitts: any[] = [];
  API_URI: string = '';
  userId: string = '';

  constructor(
    private twitterService: TwitterService,
    private credentialsService: CredentialsService,
    private configService: ConfigService
  ) { 
    // ✅ Usar configuración centralizada
    this.API_URI = this.configService.IMAGE_URL;

    const credential = this.credentialsService.getCredentialsParsed();
    this.userId = credential?.idContact;
  }

  ngOnInit(): void {
    this.twitterService.readAll(this.userId).subscribe({
      next: (res) => {
        this.twitts = this.twitts.concat(res as any[]);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

}
