import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgSelectModule } from '@ng-select/ng-select';

import { FilterBarComponent, FilterConfig } from './filter-bar.component';

describe('FilterBarComponent', () => {
  let component: FilterBarComponent;
  let fixture: ComponentFixture<FilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterBarComponent ],
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        NgSelectModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    
    const mockFilters: FilterConfig[] = [
      { type: 'text', name: 'search', label: 'Buscar', placeholder: 'Buscar...' },
      { 
        type: 'ng-select', 
        name: 'status', 
        label: 'Estado', 
        placeholder: 'Seleccionar estado',
        options: [
          { label: 'Activo', value: 'Activo' },
          { label: 'Inactivo', value: 'Inactivo' }
        ],
        optionLabel: 'label',
        optionValue: 'value'
      }
    ];
    component.filters = mockFilters;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with filter controls', () => {
    expect(component.filterForm.get('search')).toBeTruthy();
    expect(component.filterForm.get('status')).toBeTruthy();
  });

  it('should emit filter values after debounce time', fakeAsync(() => {
    let emittedValues: any;
    component.filterChange.subscribe(values => {
      emittedValues = values;
    });

    component.filterForm.patchValue({ search: 'test', status: 'Activo' });
    
    tick(100); // Before debounce
    expect(emittedValues).toBeUndefined();
    
    tick(300); // After debounce (total 400ms)
    expect(emittedValues).toEqual({ search: 'test', status: 'Activo' });
  }));

  it('should clear filters when clearFilters is called', () => {
    component.filterForm.patchValue({ search: 'test', status: 'Activo' });
    
    let emittedValues: any;
    component.filterChange.subscribe(values => {
      emittedValues = values;
    });
    
    component.clearFilters();
    
    expect(component.filterForm.get('search')?.value).toBeFalsy();
    expect(component.filterForm.get('status')?.value).toBeFalsy();
    expect(emittedValues).toEqual({});
  });

  it('should filter out empty values', fakeAsync(() => {
    let emittedValues: any;
    component.filterChange.subscribe(values => {
      emittedValues = values;
    });

    component.filterForm.patchValue({ search: 'test', status: '' });
    tick(400);

    expect(emittedValues).toEqual({ search: 'test' });
    expect(emittedValues.status).toBeUndefined();
  }));
});

