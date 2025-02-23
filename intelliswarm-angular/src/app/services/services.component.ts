import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex flex-col bg-[#0A0A0A]">
      <!-- Hero Section -->
      <section class="hero-section relative overflow-hidden min-h-[60vh] flex items-center justify-center">
        <div class="absolute inset-0 bg-gradient-to-br from-[#14F195]/20 via-transparent to-[#9945FF]/20"></div>
        <div class="container mx-auto px-6 relative z-10 text-center">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-6xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#14F195] to-[#9945FF]">
              AI Agentic Solutions
            </h1>
            <p class="text-xl md:text-2xl text-[#848895] mb-8">
              Comprehensive AI solutions for modern enterprises. Transform your business with intelligent agentic workflows.
            </p>
          </div>
        </div>
      </section>

      <!-- Main Service Categories -->
      <section class="py-20 relative">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- AI-Powered Automation -->
            <div class="service-card group" routerLink="/automation">
              <div class="p-8">
                <span class="material-icons text-[#14F195] text-4xl mb-4">auto_awesome</span>
                <h3 class="text-2xl font-bold mb-4 text-white">AI-Powered Automation</h3>
                <ul class="text-[#848895] space-y-2">
                  <li>• End-to-End Workflow Automation</li>
                  <li>• AI-Orchestrated Task Management</li>
                  <li>• Robotic Process Automation + AI</li>
                </ul>
              </div>
            </div>

            <!-- AI Agent Development -->
            <div class="service-card group" routerLink="/development">
              <div class="p-8">
                <span class="material-icons text-[#9945FF] text-4xl mb-4">developer_board</span>
                <h3 class="text-2xl font-bold mb-4 text-white">AI Agent Development</h3>
                <ul class="text-[#848895] space-y-2">
                  <li>• Custom AI Agent Development</li>
                  <li>• Multi-Agent Collaboration</li>
                  <li>• Autonomous Decision Systems</li>
                </ul>
              </div>
            </div>

            <!-- Business Optimization -->
            <div class="service-card group" routerLink="/optimization">
              <div class="p-8">
                <span class="material-icons text-[#14F195] text-4xl mb-4">trending_up</span>
                <h3 class="text-2xl font-bold mb-4 text-white">Business Optimization</h3>
                <ul class="text-[#848895] space-y-2">
                  <li>• Predictive Business Intelligence</li>
                  <li>• AI-Powered Process Mining</li>
                  <li>• Dynamic Resource Allocation</li>
                </ul>
              </div>
            </div>

            <!-- Knowledge Management -->
            <div class="service-card group" routerLink="/knowledge">
              <div class="p-8">
                <span class="material-icons text-[#9945FF] text-4xl mb-4">psychology</span>
                <h3 class="text-2xl font-bold mb-4 text-white">Knowledge Management</h3>
                <ul class="text-[#848895] space-y-2">
                  <li>• Intelligent Knowledge Base</li>
                  <li>• Document Processing</li>
                  <li>• Internal Support AI Agents</li>
                </ul>
              </div>
            </div>

            <!-- Customer Service & Sales -->
            <div class="service-card group" routerLink="/customer-service">
              <div class="p-8">
                <span class="material-icons text-[#14F195] text-4xl mb-4">support_agent</span>
                <h3 class="text-2xl font-bold mb-4 text-white">Customer Service & Sales</h3>
                <ul class="text-[#848895] space-y-2">
                  <li>• AI Support Agents</li>
                  <li>• Sales Assistants</li>
                  <li>• Market Research Automation</li>
                </ul>
              </div>
            </div>

            <!-- Development & Engineering -->
            <div class="service-card group" routerLink="/engineering">
              <div class="p-8">
                <span class="material-icons text-[#9945FF] text-4xl mb-4">code</span>
                <h3 class="text-2xl font-bold mb-4 text-white">Development & Engineering</h3>
                <ul class="text-[#848895] space-y-2">
                  <li>• AI Software Engineering</li>
                  <li>• Autonomous DevOps</li>
                  <li>• Code Optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .service-card {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-5px);
        border-color: #14F195;
        background: rgba(255, 255, 255, 0.03);
      }
    }

    .industry-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.03);
      }

      .material-icons {
        font-size: 2rem;
      }
    }
  `]
})
export class ServicesComponent {}
