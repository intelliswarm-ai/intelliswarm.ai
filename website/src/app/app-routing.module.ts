import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ConversationsComponent } from './pages/conversations/conversations.component';
import { ExamplesComponent } from './pages/examples/examples.component';
import { IntegrationsComponent } from './pages/integrations/integrations.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ServicesComponent } from './components/services/services.component';
import { ChatPageComponent } from './pages/chat/chat.component';
import { BenchmarksComponent } from './pages/benchmarks/benchmarks.component';
import { DocsComponent } from './pages/docs/docs.component';
import { ContributeComponent } from './pages/contribute/contribute.component';
import { LedgerComponent } from './pages/ledger/ledger.component';
import { NewsComponent } from './pages/news/news.component';
import { AdminComponent } from './pages/admin/admin.component';
import { BlogListComponent } from './pages/blog/blog-list/blog-list.component';
import { BlogPostComponent } from './pages/blog/blog-post/blog-post.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'conversations', component: ConversationsComponent },
  { path: 'examples', component: ExamplesComponent },
  { path: 'integrations', component: IntegrationsComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-of-service', component: TermsOfServiceComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'chat', component: ChatPageComponent },
  { path: 'benchmarks', component: BenchmarksComponent },
  { path: 'docs', component: DocsComponent },
  { path: 'contribute', component: ContributeComponent },
  { path: 'ledger', component: LedgerComponent },
  { path: 'news', component: NewsComponent },
  { path: 'blog', component: BlogListComponent },
  { path: 'blog/:slug', component: BlogPostComponent },
  { path: 'admin/contributions', component: AdminComponent },
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
