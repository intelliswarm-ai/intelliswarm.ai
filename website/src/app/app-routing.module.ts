import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { ExamplesComponent } from './pages/examples/examples.component';
import { IntegrationsComponent } from './pages/integrations/integrations.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'conversations', component: ConversationsComponent },
  { path: 'examples', component: ExamplesComponent },
  { path: 'integrations', component: IntegrationsComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-of-service', component: TermsOfServiceComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
