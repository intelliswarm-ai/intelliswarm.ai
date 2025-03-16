import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feature-item',
  template: `
    <div class="feature-item">
      <img [src]="getImgSource()" alt="icon" width="80" height="80" />
      <h3>{{ title }}</h3>
      <p>{{ content }}</p>
      <ng-container *ngIf="link">
        <a class="btn btn-secondary" [routerLink]="link">View examples</a>
      </ng-container>
    </div>
  `,
  styleUrls: ['./feature-item.component.css'],
})
export class FeatureItemComponent {
  @Input() img: string = '';
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() link?: string;

  getImgSource(): string {
    return `../../../assets/img/icon/${this.img}.svg`;
  }
}
