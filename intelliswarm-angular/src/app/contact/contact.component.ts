import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `
    <div class="contact-container">
      <h1>Contact Us</h1>
      <div class="contact-info">
        <p><span class="material-icons">email</span> info&#64;intelliswarm.com</p>
        <p><span class="material-icons">location_on</span> Our Location</p>
        <p><span class="material-icons">phone</span> +1 (555) 123-4567</p>
      </div>
    </div>
  `,
  styles: [`
    .contact-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    h1 {
      color: #2d3741;
      margin-bottom: 2rem;
    }

    .contact-info {
      background: #f5f7f9;
      padding: 2rem;
      border-radius: 8px;

      p {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
        color: #666;

        .material-icons {
          color: #2d3741;
        }
      }
    }
  `]
})
export class ContactComponent {}
