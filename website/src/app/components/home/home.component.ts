import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Enterprise AI Agent Orchestration for Java',
      description: 'The only self-improving, multi-agent orchestration framework for Java. 7 process types, YAML DSL, built-in governance, budget tracking, and 24 tools. Powered by Spring AI & Spring Boot.',
      keywords: 'AI agent orchestration, Java, Spring Boot, multi-agent framework, self-improving AI, YAML DSL, enterprise AI',
    });
  }
} 