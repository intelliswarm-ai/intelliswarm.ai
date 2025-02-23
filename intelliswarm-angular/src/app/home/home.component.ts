import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home-container">
      <section class="hero">
        <h1>Welcome to IntelliSwarm</h1>
        <p>Empowering your business with intelligent AI agents</p>
      </section>

      <section class="features">
        <div class="feature-card">
          <h2>AI Automation</h2>
          <p>Streamline your workflows with intelligent automation solutions</p>
        </div>
        <div class="feature-card">
          <h2>Smart Analytics</h2>
          <p>Gain valuable insights with our advanced analytics platform</p>
        </div>
        <div class="feature-card">
          <h2>Agent Collaboration</h2>
          <p>Enable seamless collaboration between AI agents</p>
        </div>
      </section>
    </div>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent {}
