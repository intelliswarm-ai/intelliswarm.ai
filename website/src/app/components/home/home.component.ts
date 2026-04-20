import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { SeoService } from '../../services/seo.service';

const FALLBACK_VERSION = '1.0.0';
const SHIELDS_VERSION_URL =
  'https://img.shields.io/maven-central/v/ai.intelliswarm/swarmai-core.json';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  installCopied = false;
  latestVersion = FALLBACK_VERSION;
  installSnippet = this.buildSnippet(FALLBACK_VERSION);

  constructor(
    private seo: SeoService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    this.seo.update({
      title: 'Enterprise AI Agent Orchestration for Java',
      description: 'Enterprise-grade multi-agent orchestration framework for Java. 7 process types, YAML DSL, built-in governance, budget tracking, and 38 tools. Powered by Spring AI & Spring Boot.',
      keywords: 'AI agent orchestration, Java, Spring Boot, multi-agent framework, YAML DSL, enterprise AI',
    });

    // Fetch latest version from Maven Central (browser only — skip during SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.http
        .get<{ value?: string }>(SHIELDS_VERSION_URL)
        .pipe(catchError(() => of(null)))
        .subscribe((response) => {
          const raw = response?.value ?? '';
          const version = raw.replace(/^v/, '').trim();
          if (version) {
            this.latestVersion = version;
            this.installSnippet = this.buildSnippet(version);
          }
        });
    }
  }

  copyInstallSnippet(): void {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(this.installSnippet).then(() => {
      this.installCopied = true;
      setTimeout(() => (this.installCopied = false), 2000);
    });
  }

  private buildSnippet(version: string): string {
    return `<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>ai.intelliswarm</groupId>
            <artifactId>swarmai-bom</artifactId>
            <version>${version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>ai.intelliswarm</groupId>
        <artifactId>swarmai-core</artifactId>
    </dependency>
    <dependency>
        <groupId>ai.intelliswarm</groupId>
        <artifactId>swarmai-tools</artifactId>
    </dependency>
    <dependency>
        <groupId>ai.intelliswarm</groupId>
        <artifactId>swarmai-dsl</artifactId>
    </dependency>
</dependencies>`;
  }
}
