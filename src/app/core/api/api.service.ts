import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  private baseUrl = 'https://etnoapp-production.up.railway.app';

  constructor(private http: HttpClient) {}

  async syncLogin(token: string) {
    return await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/sync/login`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
    );
  }
}