import { Component } from '@angular/core';

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.css'],
})
export class PriceComponent {
  pricingItems: any[] = [
    {
      name: 'Community Support',
      description: 'Free open-source support for developers and small teams.',
      price: 'Free',
      priceSubtext: 'Open Source',
      engagementText: 'Community-driven support via GitHub',
      isPopular: false,
      features: [
        'GitHub Issues & Discussions',
        'Documentation & Examples',
        'Community Forum Access',
        'Basic Troubleshooting',
        'Regular Updates & Releases',
      ],
    },
    {
      name: 'Professional Support <img src="assets/img/pro-btn.svg" alt="pro">',
      description: 'Dedicated support for growing organizations.',
      price: 'From $2,500',
      priceSubtext: '/month',
      engagementText: 'Annual engagement with dedicated support',
      isPopular: true,
      features: [
        'Priority Support Response (4-8 hours)',
        'Custom Implementation Guidance',
        'Training & Workshops',
        'Performance Optimization',
        'Integration Support',
        'Monthly Check-ins',
      ],
    },
    {
      name: 'Enterprise Solutions',
      description: 'Full-service implementation for large enterprises.',
      price: 'Custom Pricing',
      priceSubtext: 'Enterprise',
      engagementText: 'Tailored solutions and dedicated team',
      isPopular: false,
      features: [
        'Dedicated Support Engineer',
        'Custom Development & Integration',
        'On-site Training & Workshops',
        'Performance Audits & Optimization',
        '24/7 Emergency Support',
        'Quarterly Business Reviews',
        'Custom Feature Development',
        'Compliance & Security Reviews',
      ],
    },
  ];

  togglePricing(type: string, button: any): void {
    // If DOM manipulation is required, adapt the logic here
    // For example, you can use Angular Renderer2 for DOM manipulation
    // Renderer2 is used to perform DOM manipulations in a way that's compatible with both the server and browser environments.
  }

  handleButtonClick(type: string, button: any): void {
    // This function is no longer needed as pricingItems is static
    // this.planType = type;
    // this.togglePricing(type, button);
  }
}
