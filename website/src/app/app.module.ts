import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';

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
import { HomeComponent } from './pages/home/home.component';
import { IntegrationsComponent } from './pages/integrations/integrations.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';

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
  ],
  imports: [BrowserModule, ReactiveFormsModule, AppRoutingModule],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
