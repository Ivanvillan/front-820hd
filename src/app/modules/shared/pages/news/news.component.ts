import { Component, OnInit } from '@angular/core';
import { TwitterService } from 'src/app/services/repository/twitter.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  twitts: any[] = [];
  API_URI: string = '';

  constructor(private twitterService: TwitterService) { 
    if(window.location.hostname.includes('localhost')){   
      this.API_URI = 'http://localhost:3001/images';
    }
    if (!window.location.hostname.includes('localhost')) {
      this.API_URI = 'https://api.820hd.com.ar/images'
    }
  }

  ngOnInit(): void {
    this.twitterService.readAll().subscribe({
      next: (res) => {
        this.twitts = this.twitts.concat(res);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

}
