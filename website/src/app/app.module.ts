import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HeaderComponent } from './components/header/header.component';
import { BrandComponent } from './components/brand/brand.component';
import { ChatComponent } from './components/chat/chat.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { FaqComponent } from './components/faq/faq.component';
import { FeatureItemComponent } from './components/feature-item/feature-item.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeroComponent } from './components/hero/hero.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';
import { PageHeroComponent } from './components/page-hero/page-hero.component';
import { PriceComponent } from './components/price/price.component';
import { SolutionComponent } from './components/solution/solution.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { ExamplesComponent } from './pages/examples/examples.component';
import { HomeComponent } from './components/home/home.component';
import { IntegrationsComponent } from './pages/integrations/integrations.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { ServicesComponent } from './components/services/services.component';
import { ResumeChatComponent } from './components/resume-chat/resume-chat.component';
import { ChatPageComponent } from './pages/chat/chat.component';
import { BenchmarksComponent } from './pages/benchmarks/benchmarks.component';
import { DocsComponent } from './pages/docs/docs.component';
import { ContributeComponent } from './pages/contribute/contribute.component';
import { LedgerComponent } from './pages/ledger/ledger.component';
import { NewsComponent } from './pages/news/news.component';
import { AdminComponent } from './pages/admin/admin.component';
import { BlogListComponent } from './pages/blog/blog-list/blog-list.component';
import { BlogPostComponent } from './pages/blog/blog-post/blog-post.component';
import { DemosListComponent } from './pages/demos/demos-list/demos-list.component';
import { DemoDetailComponent } from './pages/demos/demo-detail/demo-detail.component';
import { TracePlayerComponent } from './pages/demos/trace-player/trace-player.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    BrandComponent,
    ChatComponent,
    ContactFormComponent,
    FaqComponent,
    FeatureItemComponent,
    FooterComponent,
    HeroComponent,
    NewsletterComponent,
    PageHeroComponent,
    PriceComponent,
    SolutionComponent,
    ContactComponent,
    ConversationsComponent,
    ExamplesComponent,
    HomeComponent,
    IntegrationsComponent,
    NotFoundComponent,
    PricingComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
    ServicesComponent,
    ResumeChatComponent,
    ChatPageComponent,
    BenchmarksComponent,
    DocsComponent,
    ContributeComponent,
    LedgerComponent,
    NewsComponent,
    AdminComponent,
    BlogListComponent,
    BlogPostComponent,
    DemosListComponent,
    DemoDetailComponent,
    TracePlayerComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    AppRoutingModule,
  ],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
