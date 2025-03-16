import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-hero',
  templateUrl: './page-hero.component.html',
  styleUrls: ['./page-hero.component.css'],
})
export class PageHeroComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() content: string = '';

  constructor() {
    // Initialize properties here if needed
  }
}
