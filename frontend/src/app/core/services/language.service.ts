import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'hi';

const STORAGE_KEY = 'emitra.ui.language';

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    brandName: 'RK Online Centre',
    navHome: '🏠 Home',
    navContact: '📞 Contact Us',
    navLogin: 'Login',
    navLogout: 'Logout',
    navSignUp: 'Sign Up',
    navLanguage: 'Language',
    heroTitle: 'RK Online Centre',
    heroSubtitle: 'All-in-one portal for citizen services, online forms, bill payments, and secure assistance.',
    contactCtaTitle: 'Contact Us',
    contactCtaText: 'Need help with payments, forms, or authentication? Visit the dedicated contact page.',
    openContactPage: 'Open Contact Page',
    popularServices: 'Popular Services',
    selectServiceHelp: 'Click a service to view details.',
    serviceModalTitle: 'Service Details',
    serviceOpenPage: 'Open Contact Page',
    close: 'Close',
    updatesTitle: 'Latest Updates',
    updatesLoading: 'Loading updates...',
    activityTitle: 'Your Activity',
    activityLoginPrompt: 'Login to view activity.',
    activityLoading: 'Loading activity...',
    footerDesc: 'Trusted digital services centre for payments, forms, chatbot support, and citizen service guidance.',
    footerQuickLinks: 'Quick Links',
    footerContactInfo: 'Contact Info',
    footerHome: 'Home',
    footerContact: 'Contact Us',
    footerPhone: 'Phone',
    footerEmail: 'Email',
    footerHours: 'Hours',
    footerHoursValue: 'Mon-Sat, 9:00 AM - 7:00 PM (IST)',
    authOrContinue: 'Or continue with',
    authLoginFailed: 'Sign in failed. Please check your email and password.',
    authSignupFailed: 'Sign up failed. Please verify details and try again.',
    authEmail: 'Email',
    authPassword: 'Password',
    authFullName: 'Full Name',
    authCreateAccount: 'Create Account'
  },
  hi: {
    brandName: 'आरके ऑनलाइन सेंटर',
    navHome: '🏠 होम',
    navContact: '📞 संपर्क करें',
    navLogin: 'लॉगिन',
    navLogout: 'लॉगआउट',
    navSignUp: 'साइन अप',
    navLanguage: 'भाषा',
    heroTitle: 'आरके ऑनलाइन सेंटर',
    heroSubtitle: 'नागरिक सेवाओं, ऑनलाइन फॉर्म, बिल भुगतान और सुरक्षित सहायता के लिए एक ही पोर्टल।',
    contactCtaTitle: 'संपर्क करें',
    contactCtaText: 'भुगतान, फॉर्म या ऑथेंटिकेशन में मदद चाहिए? संपर्क पेज खोलें।',
    openContactPage: 'संपर्क पेज खोलें',
    popularServices: 'लोकप्रिय सेवाएं',
    selectServiceHelp: 'विवरण देखने के लिए किसी सेवा पर क्लिक करें।',
    serviceModalTitle: 'सेवा विवरण',
    serviceOpenPage: 'संपर्क पेज खोलें',
    close: 'बंद करें',
    updatesTitle: 'नवीनतम अपडेट',
    updatesLoading: 'अपडेट लोड हो रहे हैं...',
    activityTitle: 'आपकी गतिविधि',
    activityLoginPrompt: 'गतिविधि देखने के लिए लॉगिन करें।',
    activityLoading: 'गतिविधि लोड हो रही है...',
    footerDesc: 'भुगतान, फॉर्म, चैटबॉट सहायता और नागरिक सेवाओं के मार्गदर्शन के लिए भरोसेमंद डिजिटल सेवा केंद्र।',
    footerQuickLinks: 'त्वरित लिंक',
    footerContactInfo: 'संपर्क जानकारी',
    footerHome: 'होम',
    footerContact: 'संपर्क करें',
    footerPhone: 'फोन',
    footerEmail: 'ईमेल',
    footerHours: 'समय',
    footerHoursValue: 'सोम-शनि, सुबह 9:00 - शाम 7:00 (IST)',
    authOrContinue: 'या इससे जारी रखें',
    authLoginFailed: 'साइन इन विफल रहा। कृपया ईमेल और पासवर्ड जांचें।',
    authSignupFailed: 'साइन अप विफल रहा। कृपया विवरण जांचें।',
    authEmail: 'ईमेल',
    authPassword: 'पासवर्ड',
    authFullName: 'पूरा नाम',
    authCreateAccount: 'खाता बनाएं'
  }
};

function isLanguage(value: string | null): value is AppLanguage {
  return value === 'en' || value === 'hi';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly language = signal<AppLanguage>(this.resolveInitialLanguage());

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  t(key: string): string {
    const current = TRANSLATIONS[this.language()];
    return current[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  private resolveInitialLanguage(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) {
      return stored;
    }

    return navigator.language.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  }
}
