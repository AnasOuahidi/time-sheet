import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class AppService {

  constructor (private http: HttpClient) {
  }

  getHolidays (year: string): Observable<{ date: string, nom_jour_ferie: string }[]> {
    return this.http.get<{ date: string, nom_jour_ferie: string }[]>(`https://jours-feries-france.antoine-augusti.fr/api/${year}`);
  }
}
