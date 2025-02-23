import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="about-container">
      <h1>About IntelliSwarm</h1>
      <p>We are pioneering the future of workflow automation through our innovative Agentic Workflow Platform.</p>
      
      <section class="mission">
        <h2>Our Mission</h2>
        <p>To empower organizations with intelligent automation solutions that transform business processes and enhance productivity.</p>
      </section>

      <section class="vision">
        <h2>Our Vision</h2>
        <p>Creating a world where AI-driven workflows seamlessly integrate with human expertise to achieve unprecedented efficiency and innovation.</p>
      </section>
    </div>
  `,
  styles: [`
    .about-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    h1 {
      color: #2d3741;
      margin-bottom: 2rem;
    }

    section {
      margin: 3rem 0;
      padding: 2rem;
      background: #f5f7f9;
      border-radius: 8px;

      h2 {
        color: #2d3741;
        margin-bottom: 1rem;
      }

      p {
        line-height: 1.6;
        color: #666;
      }
    }
  `]
})
export class AboutComponent {}
