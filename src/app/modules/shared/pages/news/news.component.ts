import { Component, OnInit } from '@angular/core';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { TwitterService } from 'src/app/services/repository/twitter.service';

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
    private credentialsService: CredentialsService
  ) { 
    if(window.location.hostname.includes('localhost')){   
      this.API_URI = 'http://localhost:3001/images';
    }
    if (!window.location.hostname.includes('localhost')) {
      this.API_URI = 'https://api.820hd.com.ar/images'
    }

    const credential = JSON.parse(this.credentialsService.getCredentials()!);
    this.userId = credential.idContact;
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
