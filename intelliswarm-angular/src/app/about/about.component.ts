import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="about-container">
      <h1>About IntelliSwarm.ai</h1>
      <p>We are pioneering the future of workflow automation through our innovative Agentic Workflow Platform.</p>
      
      <section class="mission">
        <h2>Our Mission</h2>
        <p>{{ mission }}</p>
      </section>

      <section class="vision">
        <h2>Our Vision</h2>
        <p>{{ vision }}</p>
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
export class AboutComponent {
  mission: string = 'At IntelliSwarm, we harness the power of AI-driven agentic workflows to revolutionize business operations, enabling seamless automation, intelligent decision-making, and optimized collaboration between humans and AI. Our mission is to empower organizations with autonomous, adaptive, and scalable AI solutions that enhance efficiency, drive innovation, and unlock new levels of productivity. By integrating cutting-edge AI orchestration, we transform complexity into streamlined intelligence—helping businesses operate smarter, faster, and with greater agility in an ever-evolving digital landscape.';
  vision: string = 'To pioneer a future where AI-driven agentic workflows seamlessly integrate into every industry, enabling businesses to operate with unparalleled efficiency, intelligence, and autonomy. We envision a world where AI agents collaborate dynamically with humans, transforming complex processes into effortless automation, fostering innovation, and unlocking limitless potential. By continuously advancing AI orchestration, we strive to redefine productivity, making intelligent, self-optimizing workflows the standard for modern enterprises.';
}
