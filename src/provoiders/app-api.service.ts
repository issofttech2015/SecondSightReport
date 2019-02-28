import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppApiService {
  endpoint:any="http://localhost:53366";

  constructor(protected http: Http) { }

  // public get headers() {
  //   let h: Headers;
  //   h = new Headers();
  //   h.append('Content-Type', 'application/json');
  //   h.append('enterprise_id', "1");
  //   h.append('access_token', "");
  //   h.append('api_token', this.rlLocalStorageService.restApi.apiToken);
  //   return h;
  // }

  protected POST<T>(url: string, data: any): Observable<T> {
    return this.http.post(`${this.endpoint}${url}`, data)
      .pipe(map(res => res.json()));
  }

  protected GET<T>(url: string): Observable<T> {
    return this.http.get(`${this.endpoint}${url}`)
      .pipe(map(res => res.json()));
  }
}
