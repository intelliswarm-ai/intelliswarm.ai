import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface Language {
  code: string;
  label: string;
  flag: string;
}

function getSavedLang(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('lang') || 'en';
    }
  } catch {}
  return 'en';
}

function saveLang(code: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('lang', code);
    }
  } catch {}
}

function setDocDir(code: string): void {
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = code;
    }
  } catch {}
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isLangMenuOpen = false;
  logoText = 'INTELLISWARM.AI';

  languages: Language[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  ];

  currentLang: Language;

  private routerSub!: Subscription;

  constructor(private router: Router, private translate: TranslateService) {
    const saved = getSavedLang();
    this.translate.setDefaultLang('en');
    this.translate.use(saved);
    this.currentLang = this.languages.find(l => l.code === saved) || this.languages[0];
  }

  ngOnInit(): void {
    // Close mobile menu on every route change
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobileMenu();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  switchLanguage(lang: Language): void {
    this.translate.use(lang.code);
    this.currentLang = lang;
    this.isLangMenuOpen = false;
    saveLang(lang.code);
    setDocDir(lang.code);
  }

  toggleLangMenu(): void {
    this.isLangMenuOpen = !this.isLangMenuOpen;
  }

  closeLangMenu(): void {
    this.isLangMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.setBodyScrollLock(this.isMobileMenuOpen);
  }

  closeMobileMenu(): void {
    if (this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
      this.setBodyScrollLock(false);
    }
  }

  closeMobileMenuAndNavigate(route: string): void {
    this.closeMobileMenu();
    this.router.navigate([route]);
  }

  private setBodyScrollLock(lock: boolean): void {
    try {
      if (typeof document !== 'undefined') {
        if (lock) {
          document.body.classList.add('mobile-menu-open');
          document.body.style.overflow = 'hidden';
        } else {
          document.body.classList.remove('mobile-menu-open');
          document.body.style.overflow = '';
        }
      }
    } catch {}
  }
}
