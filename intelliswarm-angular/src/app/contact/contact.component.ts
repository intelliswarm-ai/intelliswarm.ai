import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmailService } from '../services/email.service';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RecaptchaModule,
    RecaptchaFormsModule
  ],
  template: `
    <div class="min-h-screen bg-[#0A0A0A]">
      <!-- Hero Section -->
      <section class="hero-section relative overflow-hidden min-h-[60vh] flex items-center justify-center">
        <!-- Background Image -->
        <div class="absolute inset-0 bg-cover bg-center bg-no-repeat"
             style="background-image: url('../../assets/images/robot-hand.png');">
          <div class="absolute inset-0 bg-black/50"></div>
        </div>

        <!-- Animated Overlay -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#14F195]/20 via-transparent to-[#9945FF]/20"></div>
        
        <!-- Grid Pattern Overlay -->
        <div class="absolute inset-0 bg-grid-pattern opacity-20"></div>

        <!-- Content -->
        <div class="container mx-auto px-6 relative z-10 text-center">
          <h1 class="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#14F195] to-[#9945FF]">
            Contact Us
          </h1>
          <p class="text-xl text-[#848895] max-w-2xl mx-auto">
            Get in touch with our team of AI experts and discover how we can transform your business
          </p>
        </div>
      </section>

      <!-- Contact Form Section -->
      <section class="py-20 relative">
        <!-- Background Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <!-- Left Robot Arm Image -->
          <div class="absolute -left-20 top-1/4 w-64 h-64 opacity-10">
            <img src="/assets/images/robot-hand.png" alt="" class="w-full h-full object-contain">
          </div>
          
          <!-- Right Robot Arm Image -->
          <div class="absolute -right-20 bottom-1/4 w-64 h-64 opacity-10">
            <img src="/assets/images/robot-arm-2.png" alt="" class="w-full h-full object-contain">
          </div>
          
          <!-- Circuit Pattern -->
          <div class="absolute inset-0 bg-circuit-pattern opacity-5"></div>
        </div>

        <!-- Form Container -->
        <div class="container mx-auto px-6">
          <div class="max-w-3xl mx-auto">
            <div class="glass-card p-8 md:p-12 relative">
              <!-- Glowing Border Effect -->
              <div class="absolute inset-0 rounded-lg glow-border"></div>
              
              <!-- Form Content -->
              <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="space-y-8 relative z-10">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <!-- Name Field -->
                  <div class="form-group">
                    <label class="block text-[#14F195] mb-2 font-medium">Name</label>
                    <input 
                      type="text" 
                      formControlName="name"
                      class="w-full bg-[#111111] border border-gray-800 rounded-lg p-3 text-white focus:border-[#14F195] focus:outline-none transition-colors"
                      [ngClass]="{'border-red-500': submitted && f['name'].errors}"
                    >
                    <div *ngIf="submitted && f['name'].errors" class="text-red-500 mt-2 text-sm">
                      <span *ngIf="f['name'].errors['required']">Name is required</span>
                    </div>
                  </div>

                  <!-- Email Field -->
                  <div class="form-group">
                    <label class="block text-[#14F195] mb-2 font-medium">Email</label>
                    <input 
                      type="email" 
                      formControlName="email"
                      class="w-full bg-[#111111] border border-gray-800 rounded-lg p-3 text-white focus:border-[#14F195] focus:outline-none transition-colors"
                      [ngClass]="{'border-red-500': submitted && f['email'].errors}"
                    >
                    <div *ngIf="submitted && f['email'].errors" class="text-red-500 mt-2 text-sm">
                      <span *ngIf="f['email'].errors['required']">Email is required</span>
                      <span *ngIf="f['email'].errors['email']">Please enter a valid email</span>
                    </div>
                  </div>
                </div>

                <!-- Subject Field -->
                <div class="form-group">
                  <label class="block text-[#14F195] mb-2 font-medium">Subject</label>
                  <input 
                    type="text" 
                    formControlName="subject"
                    class="w-full bg-[#111111] border border-gray-800 rounded-lg p-3 text-white focus:border-[#14F195] focus:outline-none transition-colors"
                    [ngClass]="{'border-red-500': submitted && f['subject'].errors}"
                  >
                  <div *ngIf="submitted && f['subject'].errors" class="text-red-500 mt-2 text-sm">
                    <span *ngIf="f['subject'].errors['required']">Subject is required</span>
                  </div>
                </div>

                <!-- Message Field -->
                <div class="form-group">
                  <label class="block text-[#14F195] mb-2 font-medium">Message</label>
                  <textarea 
                    rows="6" 
                    formControlName="message"
                    class="w-full bg-[#111111] border border-gray-800 rounded-lg p-3 text-white focus:border-[#14F195] focus:outline-none transition-colors resize-none"
                    [ngClass]="{'border-red-500': submitted && f['message'].errors}"
                  ></textarea>
                  <div *ngIf="submitted && f['message'].errors" class="text-red-500 mt-2 text-sm">
                    <span *ngIf="f['message'].errors['required']">Message is required</span>
                  </div>
                </div>

                <!-- reCAPTCHA -->
                <div class="flex justify-center bg-[#111111] p-4 rounded-lg">
                  <re-captcha
                    formControlName="recaptcha"
                    siteKey="6LcXdsfewewsdsdf"
                  ></re-captcha>
                </div>

                <!-- Submit Button -->
                <div class="flex justify-center mt-8">
                  <button 
                    type="submit"
                    class="px-8 py-3 bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    [disabled]="loading"
                  >
                    <span *ngIf="!loading">Send Message</span>
                    <span *ngIf="loading" class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  </button>
                </div>

                <!-- Success/Error Messages -->
                <div *ngIf="success" class="text-[#14F195] text-center mt-4 p-4 bg-[#14F195]/10 rounded-lg">
                  Message sent successfully! We'll get back to you soon.
                </div>
                <div *ngIf="error" class="text-red-500 text-center mt-4 p-4 bg-red-500/10 rounded-lg">
                  {{ error }}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`    .bg-grid-pattern {
      background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    .bg-circuit-pattern {
      background-image: url('/assets/images/circuit-pattern.svg');
      background-repeat: repeat;
      background-size: 200px;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .glow-border {
      pointer-events: none;
      border: 1px solid transparent;
      border-radius: inherit;
      animation: borderGlow 4s linear infinite;
      background: linear-gradient(90deg, 
        rgba(20, 241, 149, 0.1),
        rgba(153, 69, 255, 0.1),
        rgba(20, 241, 149, 0.1)
      );
    }

    @keyframes borderGlow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 30%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(20, 241, 149, 0.1) 0%, transparent 70%);
      filter: blur(60px);
      z-index: 1;
    }

    .hero-section::after {
      content: '';
      position: absolute;
      top: 20%;
      right: 20%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(153, 69, 255, 0.1) 0%, transparent 70%);
      filter: blur(60px);
      z-index: 1;
    }
  `]
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup; // Using the definite assignment assertion
  submitted = false;
  loading = false;
  success = false;
  error = '';
  mission: string = 'At IntelliSwarm, we harness the power of AI-driven agentic workflows to revolutionize business operations, enabling seamless automation, intelligent decision-making, and optimized collaboration between humans and AI. Our mission is to empower organizations with autonomous, adaptive, and scalable AI solutions that enhance efficiency, drive innovation, and unlock new levels of productivity. By integrating cutting-edge AI orchestration, we transform complexity into streamlined intelligence—helping businesses operate smarter, faster, and with greater agility in an ever-evolving digital landscape.';
  vision: string = 'To pioneer a future where AI-driven agentic workflows seamlessly integrate into every industry, enabling businesses to operate with unparalleled efficiency, intelligence, and autonomy. We envision a world where AI agents collaborate dynamically with humans, transforming complex processes into effortless automation, fostering innovation, and unlocking limitless potential. By continuously advancing AI orchestration, we strive to redefine productivity, making intelligent, self-optimizing workflows the standard for modern enterprises.';

  constructor(
    private formBuilder: FormBuilder,
    private emailService: EmailService
  ) {
    // Initialize the form in constructor
    this.contactForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      recaptcha: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Additional initialization if needed
  }

  get f() {
    return this.contactForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.success = false;

    if (this.contactForm.invalid) {
      return;
    }

    this.loading = true;

    this.emailService.sendEmail(this.contactForm.value).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.contactForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        this.error = 'Failed to send message. Please try again later.';
        this.loading = false;
        console.error('Email sending error:', error);
      }
    });
  }
}

