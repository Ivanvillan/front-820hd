import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TwitterService {
  
  API_URI: string = 'http://localhost:3002/api/twitter';

  constructor(private http: HttpClient) { }

readAll() {
  return this.http.get(this.API_URI)
}

}
