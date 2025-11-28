import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class AppService {

  constructor (private http: HttpClient) {
  }

  getHolidays(year: string): Observable<{[date: string]: string}> {
    return this.http.get<{[date: string]: string}>(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`);
  }
}
