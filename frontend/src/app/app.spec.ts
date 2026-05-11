import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { PublicSettingsService } from './core/services/public-settings.service';
import { DEFAULT_PUBLIC_CONTACT } from './core/constants/public-contact.defaults';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: PublicSettingsService,
          useValue: {
            getPublicContact: () => of(DEFAULT_PUBLIC_CONTACT)
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
