import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feature-item',
  template: `
    <div class="feature-item">
      <img [src]="getImgSource()" alt="icon" width="80" height="80" />
      <h3>{{ title }}</h3>
      <p>{{ content }}</p>
      <ng-container *ngIf="link">
        <a class="btn btn-secondary" 
           [attr.href]="isExternalLink(link) ? link : null" 
           [routerLink]="!isExternalLink(link) ? link : null"
           [attr.target]="isExternalLink(link) ? '_blank' : null"
           [attr.rel]="isExternalLink(link) ? 'noopener noreferrer' : null">
           {{ getLinkText() }}
        </a>
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

  isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  getLinkText(): string {
    return this.isExternalLink(this.link || '') ? 'View on GitHub' : 'View examples';
  }
}
