import { Component, inject, signal } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

interface ServiceItem {
  icon: string;
  title: Record<'en' | 'hi', string>;
  details: Record<'en' | 'hi', string>;
}

@Component({
  selector: 'app-services',
  standalone: true,
  templateUrl: './services.component.html'
})
export class ServicesComponent {
  readonly language = inject(LanguageService);
  readonly selectedService = signal<ServiceItem | null>(null);

  readonly services: ServiceItem[] = [
    {
      icon: '💸',
      title: { en: 'Money Withdrawal (AEPS)', hi: 'मनी विदड्रॉल (AEPS)' },
      details: {
        en: 'Quick Aadhaar-enabled cash withdrawal and mini statement services.',
        hi: 'आधार आधारित त्वरित नकद निकासी और मिनी स्टेटमेंट सेवा।'
      }
    },
    {
      icon: '🪪',
      title: { en: 'Aadhaar Update & Authentication', hi: 'आधार अपडेट और प्रमाणीकरण' },
      details: {
        en: 'Support for Aadhaar correction, verification, and biometric assistance.',
        hi: 'आधार सुधार, सत्यापन और बायोमेट्रिक सहायता उपलब्ध।'
      }
    },
    {
      icon: '💡',
      title: { en: 'Electricity, Water & Mobile Recharge', hi: 'बिजली, पानी और मोबाइल रिचार्ज' },
      details: {
        en: 'Pay daily utility bills and recharge mobile numbers in one place.',
        hi: 'दैनिक यूटिलिटी बिल भुगतान और मोबाइल रिचार्ज एक ही जगह।'
      }
    },
    {
      icon: '📄',
      title: { en: 'PAN, Insurance & Certificates', hi: 'पैन, बीमा और प्रमाण पत्र' },
      details: {
        en: 'PAN services, insurance enrollment, and certificate application help.',
        hi: 'पैन सेवाएं, बीमा नामांकन और प्रमाण पत्र आवेदन सहायता।'
      }
    },
    {
      icon: '👵',
      title: { en: 'Pension & Social Scheme Support', hi: 'पेंशन और सामाजिक योजना सहायता' },
      details: {
        en: 'Enrollment and status tracking for pension and welfare schemes.',
        hi: 'पेंशन और कल्याणकारी योजनाओं में पंजीकरण और स्टेटस सहायता।'
      }
    },
    {
      icon: '🛂',
      title: { en: 'Passport & eDistrict Services', hi: 'पासपोर्ट और ई-डिस्ट्रिक्ट सेवाएं' },
      details: {
        en: 'Online appointment booking and document support for citizen services.',
        hi: 'ऑनलाइन अपॉइंटमेंट और नागरिक दस्तावेज़ सहायता उपलब्ध।'
      }
    },
    {
      icon: '📝',
      title: { en: 'Government Form Assistance', hi: 'सरकारी फॉर्म सहायता' },
      details: {
        en: 'Help with online forms, uploads, and final submission verification.',
        hi: 'ऑनलाइन फॉर्म भरने, अपलोड और सबमिशन सत्यापन में मदद।'
      }
    }
  ];

  openService(service: ServiceItem): void {
    this.selectedService.set(service);
  }

  closeService(): void {
    this.selectedService.set(null);
  }

  openContactPage(): void {
    const opened = window.open('/contact', '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = '/contact';
    }
  }
}
