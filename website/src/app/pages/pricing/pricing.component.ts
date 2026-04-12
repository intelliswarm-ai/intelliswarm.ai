import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css'
})
export class PricingComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Pricing',
      description: 'SwarmAI pricing plans: free open-source community support, professional support from $500/month, and custom enterprise solutions with dedicated engineers.',
      keywords: 'SwarmAI pricing, AI framework cost, enterprise AI support, open source AI',
    });
  }
}
