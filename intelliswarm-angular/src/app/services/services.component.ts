import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col">
      <section class="hero-section relative overflow-hidden glow-bg py-32 flex items-center justify-center">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-green-400/20 opacity-50"></div>
        <div class="container mx-auto px-6 relative z-10 text-center">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-text">Our Services</h1>
            <p class="text-xl text-gray-300 max-w-2xl mx-auto">
              Enhance your workflows with our cutting-edge tools and integrations designed for agentic processes.
            </p>
          </div>
        </div>
      </section>

      <section class="py-20 flex-grow">
        <div class="container mx-auto px-6 text-center">
          <h2 class="text-4xl md:text-5xl font-bold mb-16 bg-gradient-text">Why Choose Our Services?</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div class="glass-card p-8" data-aos="fade-up">
              <h3 class="text-2xl font-bold mb-4">Development Tools</h3>
              <p class="text-gray-400">Leverage our powerful development tools to create custom agentic workflows tailored to your needs.</p>
            </div>
            <div class="glass-card p-8" data-aos="fade-up" data-aos-delay="100">
              <h3 class="text-2xl font-bold mb-4">Seamless Integrations</h3>
              <p class="text-gray-400">Easily integrate with existing systems and tools to enhance your operational efficiency.</p>
            </div>
            <div class="glass-card p-8" data-aos="fade-up" data-aos-delay="200">
              <h3 class="text-2xl font-bold mb-4">Custom Solutions</h3>
              <p class="text-gray-400">Work with our team to develop custom solutions that fit your unique business requirements.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['../styles/shared.scss']
})
export class ServicesComponent {}
