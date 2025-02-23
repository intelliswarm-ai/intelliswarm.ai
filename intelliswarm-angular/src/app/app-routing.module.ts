import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ServicesComponent } from './services/services.component';
import { CaseStudiesComponent } from './case-studies/case-studies.component';
import { ContactComponent } from './contact/contact.component';
import { AboutComponent } from './about/about.component';
import { GetStartedComponent } from './get-started/get-started.component';
import { LearnMoreComponent } from './learn-more/learn-more.component';
import { IntelligentAutomationComponent } from './intelligent-automation/intelligent-automation.component';
import { SeamlessIntegrationComponent } from './seamless-integration/seamless-integration.component';
import { AdvancedAnalyticsComponent } from './advanced-analytics/advanced-analytics.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'case-studies', component: CaseStudiesComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'about', component: AboutComponent },
  { path: 'get-started', component: GetStartedComponent },
  { path: 'learn-more', component: LearnMoreComponent },
  { path: 'intelligent-automation', component: IntelligentAutomationComponent },
  { path: 'seamless-integration', component: SeamlessIntegrationComponent },
  { path: 'advanced-analytics', component: AdvancedAnalyticsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
    constructor(){
        console.log('Routes:', routes);
    }

}
