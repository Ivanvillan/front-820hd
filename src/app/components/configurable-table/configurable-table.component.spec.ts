import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ConfigurableTableComponent } from './configurable-table.component';
import { ColumnSelectorService, ColumnConfig } from '../../services/column-selector/column-selector.service';
import { CredentialsService } from '../../services/credentials/credentials.service';

describe('ConfigurableTableComponent', () => {
  let component: ConfigurableTableComponent;
  let fixture: ComponentFixture<ConfigurableTableComponent>;
  let columnSelectorService: jasmine.SpyObj<ColumnSelectorService>;
  let credentialsService: jasmine.SpyObj<CredentialsService>;

  const mockColumns: ColumnConfig[] = [
    { id: 'id', label: 'ID', visible: true, mandatory: true },
    { id: 'name', label: 'Name', visible: true },
    { id: 'email', label: 'Email', visible: false }
  ];

  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(async () => {
    const columnSelectorServiceSpy = jasmine.createSpyObj('ColumnSelectorService', [
      'getVisibleColumns',
      'getAllColumns',
      'saveColumnPreferences'
    ]);
    const credentialsServiceSpy = jasmine.createSpyObj('CredentialsService', [
      'getCredentialsParsed'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ ConfigurableTableComponent ],
      imports: [
        NoopAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule
      ],
      providers: [
        { provide: ColumnSelectorService, useValue: columnSelectorServiceSpy },
        { provide: CredentialsService, useValue: credentialsServiceSpy }
      ]
    })
    .compileComponents();

    columnSelectorService = TestBed.inject(ColumnSelectorService) as jasmine.SpyObj<ColumnSelectorService>;
    credentialsService = TestBed.inject(CredentialsService) as jasmine.SpyObj<CredentialsService>;
  });

  beforeEach(() => {
    credentialsService.getCredentialsParsed.and.returnValue({
      idContact: 123,
      type: 'admin'
    } as any);

    columnSelectorService.getVisibleColumns.and.returnValue(
      mockColumns.filter(col => col.visible)
    );

    fixture = TestBed.createComponent(ConfigurableTableComponent);
    component = fixture.componentInstance;
    component.tableId = 'test_table';
    component.defaultColumns = mockColumns;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user id on init', () => {
    expect(component.userId).toBe('123');
  });

  it('should load visible columns on init', () => {
    expect(columnSelectorService.getVisibleColumns).toHaveBeenCalledWith(
      'test_table',
      '123',
      mockColumns
    );
    expect(component.visibleColumns.length).toBe(2); // id and name
  });

  it('should update displayed columns', () => {
    expect(component.displayedColumns).toEqual(['id', 'name']);
  });

  it('should update data source', () => {
    expect(component.dataSource.data).toEqual(mockData);
  });

  it('should emit row click event', () => {
    let clickedRow: any;
    component.rowClick.subscribe(row => {
      clickedRow = row;
    });

    component.onRowClick(mockData[0]);
    expect(clickedRow).toEqual(mockData[0]);
  });

  it('should emit action click event', () => {
    let emittedEvent: any;
    component.actionClick.subscribe(event => {
      emittedEvent = event;
    });

    const mockEvent = new Event('click');
    component.onActionClick('edit', mockData[0], mockEvent);
    
    expect(emittedEvent).toEqual({ action: 'edit', row: mockData[0] });
  });

  it('should get cell value for simple property', () => {
    const value = component.getCellValue(mockData[0], 'name');
    expect(value).toBe('John Doe');
  });

  it('should get cell value for nested property', () => {
    const nestedData = { id: 1, user: { name: 'John' } };
    const value = component.getCellValue(nestedData, 'user.name');
    expect(value).toBe('John');
  });

  it('should apply filter to data source', () => {
    component.applyFilter('John');
    expect(component.dataSource.filter).toBe('john');
  });
});

