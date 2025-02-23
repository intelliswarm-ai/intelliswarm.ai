import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  recaptcha: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = 'your-api-endpoint'; // Replace with your actual API endpoint

  constructor(private http: HttpClient) {}

  sendEmail(data: EmailData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
} 