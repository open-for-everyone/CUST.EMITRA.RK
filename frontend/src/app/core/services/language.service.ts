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
    heroJourneyTitle: 'Start quickly',
    heroJourneyHome: 'Browse services and updates',
    heroJourneyAuth: 'Sign in for secure history',
    heroJourneyChat: 'Ask the AI assistant instantly',
    heroJourneyContact: 'Reach support with map and WhatsApp',
    heroJourneyActivity: 'Track login and action records',
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
    mfaCodePrompt: 'Please enter your MFA code to complete login.',
    authEmail: 'Email',
    authPassword: 'Password',
    authFullName: 'Full Name',
    authCreateAccount: 'Create Account',
    forgotPasswordLink: 'Forgot password?',
    forgotPasswordTitle: 'Reset your password',
    forgotPasswordDesc: 'Enter your email address and we will send reset instructions.',
    forgotPasswordSubmit: 'Send reset link',
    forgotPasswordSuccess: 'If the email is registered, reset instructions have been sent.',
    forgotPasswordBack: 'Back to login',
    resetPasswordTitle: 'Set a new password',
    resetPasswordDesc: 'Enter your new password below.',
    resetPasswordNewPwd: 'New Password',
    resetPasswordConfirm: 'Confirm New Password',
    resetPasswordSubmit: 'Reset Password',
    resetPasswordSuccess: 'Your password has been reset. You can now log in.',
    resetPasswordInvalidToken: 'The reset link is invalid or has expired. Please request a new one.',
    changePasswordTitle: '🔐 Change Password',
    changePasswordCurrent: 'Current Password',
    changePasswordNew: 'New Password',
    changePasswordConfirm: 'Confirm New Password',
    changePasswordSubmit: 'Change Password',
    changePasswordSuccess: 'Password changed successfully.',
    changePasswordMismatch: 'New passwords do not match.',
    changePasswordFailed: 'Failed to change password. Please check your current password.',
    loginActivityTitle: 'Login History',
    loginActivityEmpty: 'No login events recorded yet.',
    actionActivityTitle: 'Recent Actions',
    actionActivityEmpty: 'No actions recorded yet.',
    themeToggleLight: 'Switch to light mode',
    themeToggleDark: 'Switch to dark mode',
    searchPlaceholder: 'Search a location...',
    searchNoResults: 'No results found.'
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
    heroJourneyTitle: 'जल्दी शुरू करें',
    heroJourneyHome: 'सेवाएं और अपडेट देखें',
    heroJourneyAuth: 'सुरक्षित हिस्ट्री के लिए साइन इन करें',
    heroJourneyChat: 'AI सहायक से तुरंत पूछें',
    heroJourneyContact: 'मैप और व्हाट्सऐप से सहायता प्राप्त करें',
    heroJourneyActivity: 'लॉगिन और गतिविधि रिकॉर्ड देखें',
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
    mfaCodePrompt: 'लॉगिन पूरा करने के लिए कृपया अपना MFA कोड दर्ज करें।',
    authEmail: 'ईमेल',
    authPassword: 'पासवर्ड',
    authFullName: 'पूरा नाम',
    authCreateAccount: 'खाता बनाएं',
    forgotPasswordLink: 'पासवर्ड भूल गए?',
    forgotPasswordTitle: 'पासवर्ड रीसेट करें',
    forgotPasswordDesc: 'अपना ईमेल पता दर्ज करें और हम रीसेट निर्देश भेजेंगे।',
    forgotPasswordSubmit: 'रीसेट लिंक भेजें',
    forgotPasswordSuccess: 'यदि ईमेल पंजीकृत है, तो रीसेट निर्देश भेज दिए गए हैं।',
    forgotPasswordBack: 'लॉगिन पर वापस',
    resetPasswordTitle: 'नया पासवर्ड सेट करें',
    resetPasswordDesc: 'नीचे अपना नया पासवर्ड दर्ज करें।',
    resetPasswordNewPwd: 'नया पासवर्ड',
    resetPasswordConfirm: 'नए पासवर्ड की पुष्टि करें',
    resetPasswordSubmit: 'पासवर्ड रीसेट करें',
    resetPasswordSuccess: 'आपका पासवर्ड रीसेट हो गया है। अब आप लॉगिन कर सकते हैं।',
    resetPasswordInvalidToken: 'रीसेट लिंक अमान्य या समाप्त हो गया है। कृपया नया अनुरोध करें।',
    changePasswordTitle: '🔐 पासवर्ड बदलें',
    changePasswordCurrent: 'वर्तमान पासवर्ड',
    changePasswordNew: 'नया पासवर्ड',
    changePasswordConfirm: 'नए पासवर्ड की पुष्टि करें',
    changePasswordSubmit: 'पासवर्ड बदलें',
    changePasswordSuccess: 'पासवर्ड सफलतापूर्वक बदल दिया गया।',
    changePasswordMismatch: 'नए पासवर्ड मेल नहीं खाते।',
    changePasswordFailed: 'पासवर्ड बदलने में विफल। कृपया वर्तमान पासवर्ड जांचें।',
    loginActivityTitle: 'लॉगिन इतिहास',
    loginActivityEmpty: 'अभी तक कोई लॉगिन इवेंट नहीं।',
    actionActivityTitle: 'हाल की गतिविधियां',
    actionActivityEmpty: 'अभी तक कोई गतिविधि नहीं।',
    themeToggleLight: 'लाइट मोड पर स्विच करें',
    themeToggleDark: 'डार्क मोड पर स्विच करें',
    searchPlaceholder: 'स्थान खोजें...',
    searchNoResults: 'कोई परिणाम नहीं मिला।'
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

    const browserLanguage = navigator.language.split('-')[0].toLowerCase();
    return browserLanguage === 'hi' ? 'hi' : 'en';
  }
}
