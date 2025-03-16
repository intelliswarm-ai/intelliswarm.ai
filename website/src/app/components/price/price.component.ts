import { Component } from '@angular/core';

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.css'],
})
export class PriceComponent {
  planType: string = 'monthly';

  pricingItems: any[] = [
    {
      name: 'Starter',
      description: 'Perfect for individuals.',
      monthlyPrice: '$9',
      yearlyPrice: '$99',
      pauseCancelText: 'Pause or cancel anytime',
      features: [
        'Team members: 1',
        'Users: Unlimited',
        'Integrations: Unlimited',
        'Total message: 150',
        'Assistants: 2',
      ],
    },
    {
      name: 'Business <img src="assets/img/pro-btn.svg" alt="pro">',
      description: 'Perfect for small businesses.',
      monthlyPrice: '$29',
      yearlyPrice: '$269',
      pauseCancelText: 'Pause or cancel anytime',
      features: [
        'Team members: 3',
        'Users: Unlimited',
        'Integrations: Unlimited',
        'Total message: 650',
        'Assistants: 5',
      ],
    },
    {
      name: 'Professional',
      description: 'Perfect for larger businesses.',
      monthlyPrice: '$59',
      yearlyPrice: '$699',
      pauseCancelText: 'Pause or cancel anytime',
      features: [
        'Team members: 10',
        'Users: Unlimited',
        'Integrations: Unlimited',
        'Total message: 1650',
        'Assistants: 12',
      ],
    },
  ];

  togglePricing(type: string, button: any): void {
    // If DOM manipulation is required, adapt the logic here
    // For example, you can use Angular Renderer2 for DOM manipulation
    // Renderer2 is used to perform DOM manipulations in a way that's compatible with both the server and browser environments.
  }

  handleButtonClick(type: string, button: any): void {
    this.planType = type;
    this.togglePricing(type, button);
  }
}
