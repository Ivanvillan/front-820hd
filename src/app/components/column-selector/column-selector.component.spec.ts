import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ColumnSelectorComponent, ColumnSelectorData } from './column-selector.component';
import { ColumnConfig } from '../../services/column-selector/column-selector.service';

describe('ColumnSelectorComponent', () => {
  let component: ColumnSelectorComponent;
  let fixture: ComponentFixture<ColumnSelectorComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ColumnSelectorComponent>>;

  const mockColumns: ColumnConfig[] = [
    { id: 'id', label: 'ID', visible: true, mandatory: true },
    { id: 'name', label: 'Name', visible: true },
    { id: 'email', label: 'Email', visible: false },
    { id: 'actions', label: 'Actions', visible: true, mandatory: true }
  ];

  const mockData: ColumnSelectorData = {
    columns: mockColumns,
    title: 'Test Columns'
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [ ColumnSelectorComponent ],
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatCheckboxModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
        MatTooltipModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    })
    .compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ColumnSelectorComponent>>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColumnSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided columns', () => {
    expect(component.columns.length).toBe(4);
    expect(component.title).toBe('Test Columns');
  });

  it('should count visible columns correctly', () => {
    expect(component.getVisibleCount()).toBe(3); // id, name, actions
  });

  it('should identify mandatory columns', () => {
    const idColumn = component.columns.find(c => c.id === 'id');
    const nameColumn = component.columns.find(c => c.id === 'name');
    
    expect(component.isMandatory(idColumn!)).toBe(true);
    expect(component.isMandatory(nameColumn!)).toBe(false);
  });

  it('should toggle non-mandatory columns', () => {
    const nameColumn = component.columns.find(c => c.id === 'name');
    const initialVisible = nameColumn!.visible;
    
    component.toggleColumn(nameColumn!);
    
    expect(nameColumn!.visible).toBe(!initialVisible);
  });

  it('should not toggle mandatory columns', () => {
    const idColumn = component.columns.find(c => c.id === 'id');
    const initialVisible = idColumn!.visible;
    
    component.toggleColumn(idColumn!);
    
    expect(idColumn!.visible).toBe(initialVisible); // No change
  });

  it('should detect changes', () => {
    expect(component.hasChanges()).toBe(false);
    
    const nameColumn = component.columns.find(c => c.id === 'name');
    component.toggleColumn(nameColumn!);
    
    expect(component.hasChanges()).toBe(true);
  });

  it('should restore defaults', () => {
    const nameColumn = component.columns.find(c => c.id === 'name');
    const originalVisible = nameColumn!.visible;
    
    component.toggleColumn(nameColumn!);
    expect(nameColumn!.visible).toBe(!originalVisible);
    
    component.restoreDefaults();
    expect(nameColumn!.visible).toBe(originalVisible);
  });

  it('should close dialog with null on cancel', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog with columns on apply', () => {
    component.onApply();
    expect(dialogRef.close).toHaveBeenCalledWith(component.columns);
  });

  it('should assign order on apply', () => {
    component.onApply();
    
    component.columns.forEach((col, index) => {
      expect(col.order).toBe(index);
    });
  });
});

