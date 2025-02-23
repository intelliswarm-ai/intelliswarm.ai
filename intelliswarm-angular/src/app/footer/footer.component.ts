import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer>
      <div class="footer-content">
        <p class="copyright">&copy; 2025 IntelliSwarm</p>
        <div class="social-links">
          <a href="https://github.com/intelliswarm-ai" target="_blank">GitHub</a>
          <a href="https://twitter.com/intelliswarm" target="_blank">Twitter</a>
          <a href="https://linkedin.com/company/intelliswarm" target="_blank">LinkedIn</a>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.scss'
})
export class FooterComponent {}
