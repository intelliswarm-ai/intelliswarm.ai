import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Contact Us',
      description: 'Get in touch with the IntelliSwarm.ai team. Questions about enterprise AI agent orchestration, custom development, integration support, or partnerships.',
      keywords: 'contact IntelliSwarm, AI consulting, enterprise AI support',
    });
  }
}
