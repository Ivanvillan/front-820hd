import { Component, OnInit } from '@angular/core';
import { TwitterService } from 'src/app/services/repository/twitter.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  twitts: any[] = [];

  constructor(private twitterService: TwitterService) { }

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
