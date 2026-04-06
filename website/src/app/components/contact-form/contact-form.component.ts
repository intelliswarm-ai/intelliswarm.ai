import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css'],
})
export class ContactFormComponent implements OnInit {
  contactForm!: FormGroup;
  submitting = false;
  submitted = false;
  errorMessage = '';

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.contactForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      companyName: ['', Validators.required],
      jobTitle: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      message: ['', Validators.required],
      agreedTerms: [false, Validators.requiredTrue],
    });
  }

  async handleSubmit(): Promise<void> {
    if (!this.contactForm.valid || this.submitting) return;

    this.submitting = true;
    this.errorMessage = '';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.contactForm.value),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      this.submitted = true;
      this.contactForm.reset({ agreedTerms: false });
    } catch {
      this.errorMessage = 'Failed to send message. Please email us at contact@intelliswarm.ai instead.';
    } finally {
      this.submitting = false;
    }
  }
}
