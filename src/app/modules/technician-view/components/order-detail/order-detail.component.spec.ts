import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Material Design
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

// Componentes
import { OrderDetailComponent } from './order-detail.component';

// Servicios
import { OrdersService } from 'src/app/services/orders/orders.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;
  let mockOrdersService: jasmine.SpyObj<OrdersService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const ordersServiceSpy = jasmine.createSpyObj('OrdersService', ['getOrderById', 'updateOrder']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [ OrderDetailComponent ],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        MatCardModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatChipsModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule
      ],
      providers: [
        { provide: OrdersService, useValue: ordersServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
    .compileComponents();

    mockOrdersService = TestBed.inject(OrdersService) as jasmine.SpyObj<OrdersService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty order data', () => {
    expect(component.order).toBeNull();
    expect(component.orderId).toBe('');
    expect(component.area).toBe('');
  });

  it('should have a valid note form', () => {
    expect(component.noteForm).toBeTruthy();
    expect(component.noteForm.get('content')).toBeTruthy();
  });

  it('should have available statuses defined', () => {
    expect(component.availableStatuses).toBeTruthy();
    expect(component.availableStatuses.length).toBeGreaterThan(0);
  });
});
