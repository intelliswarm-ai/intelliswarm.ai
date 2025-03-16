import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  isMobileMenuOpen = false;
  navItems = [
    { path: '/', label: 'Home' },
    { path: '/examples', label: 'Examples' },
    { path: '/services', label: 'Services' },
    { path: '/integrations', label: 'Integrations' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/contact', label: 'Contact' }
  ];
  logoText = 'INTELLISWARM.AI';

  constructor(private router: Router) {}

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenuAndNavigate(route: string) {
    this.isMobileMenuOpen = false;
    this.router.navigate([route]);
  }
}
