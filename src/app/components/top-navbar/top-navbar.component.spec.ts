import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';

import { TopNavbarComponent } from './top-navbar.component';
import { AuthService } from '../../services/auth/auth.service';
import { CredentialsService } from '../../services/credentials/credentials.service';

describe('TopNavbarComponent', () => {
  let component: TopNavbarComponent;
  let fixture: ComponentFixture<TopNavbarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let credentialsService: jasmine.SpyObj<CredentialsService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const credentialsServiceSpy = jasmine.createSpyObj('CredentialsService', ['getCredentialsParsed']);

    await TestBed.configureTestingModule({
      declarations: [ TopNavbarComponent ],
      imports: [
        RouterTestingModule,
        MatToolbarModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CredentialsService, useValue: credentialsServiceSpy }
      ]
    })
    .compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    credentialsService = TestBed.inject(CredentialsService) as jasmine.SpyObj<CredentialsService>;
  });

  beforeEach(() => {
    credentialsService.getCredentialsParsed.and.returnValue({
      contact: 'Test User',
      type: 'admin'
    } as any);

    fixture = TestBed.createComponent(TopNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    expect(component.userName).toBe('Test User');
    expect(component.userRole).toBe('Administrador');
  });

  it('should logout when logout is called', () => {
    authService.logout.and.returnValue(of({}));
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });
});

