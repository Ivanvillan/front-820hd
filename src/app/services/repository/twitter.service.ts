import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TwitterService {

  API_URI = `${environment.API_URL}/api/twitter`;
  
  constructor(private http: HttpClient) { }

readAll() {
  return this.http.get(this.API_URI)
}

}
