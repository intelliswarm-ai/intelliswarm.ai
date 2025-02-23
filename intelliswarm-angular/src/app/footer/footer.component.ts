import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer>
      <div class="footer-content">
        <p class="copyright">&copy; 2025 IntelliSwarm</p>
        <div class="social-links">
          <a href="https://github.com/intelliswarm-ai" target="_blank">GitHub</a>
          <a href="https://twitter.com/intelliswarm-ai" target="_blank">Twitter</a>
          <a href="https://linkedin.com/company/intelliswarm-ai" target="_blank">LinkedIn</a>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  constructor(private router: Router) {}

  loadInfo(section: string) {
    switch (section) {
      case 'getStarted':
        console.log('Loading Get Started information...');
        // Load or display information for "Get Started"
        break;
      case 'learnMore':
        console.log('Loading Learn More information...');
        // Load or display information for "Learn More"
        break;
      case 'intelligentAutomation':
        console.log('Loading Intelligent Automation information...');
        // Load or display information for "Intelligent Automation"
        break;
      case 'seamlessIntegration':
        console.log('Loading Seamless Integration information...');
        // Load or display information for "Seamless Integration"
        break;
      case 'advancedAnalytics':
        console.log('Loading Advanced Analytics information...');
        // Load or display information for "Advanced Analytics"
        break;
      default:
        console.log('Unknown section');
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
