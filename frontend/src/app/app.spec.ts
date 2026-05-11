import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { PublicSettingsService } from './core/services/public-settings.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: PublicSettingsService,
          useValue: {
            getPublicContact: () => of({
              language: 'en',
              phone: '+91 9982761929',
              whatsapp: '+91 9982761929',
              email: 'support@rkemitra.in',
              supportNotice: ''
            })
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
