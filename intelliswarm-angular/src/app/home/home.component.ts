import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="hero-section">
      <div class="container">
        <h1>Transform Your Workflow with AI</h1>
        <p class="subtitle">Empower your business with intelligent agentic solutions that streamline operations and boost productivity</p>
        <div class="cta-buttons">
          <button class="primary-btn">Get Started</button>
          <button class="secondary-btn">Learn More</button>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="container">
        <h2>Why Choose IntelliSwarm</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <span class="material-icons">auto_awesome</span>
            <h3>Intelligent Automation</h3>
            <p>Leverage AI-powered agents to automate complex workflows with precision</p>
          </div>
          <div class="feature-card">
            <span class="material-icons">integration_instructions</span>
            <h3>Seamless Integration</h3>
            <p>Easily integrate with your existing tools and systems</p>
          </div>
          <div class="feature-card">
            <span class="material-icons">insights</span>
            <h3>Advanced Analytics</h3>
            <p>Gain valuable insights with real-time monitoring and reporting</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent {}
