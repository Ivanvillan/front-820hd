import { TestBed } from '@angular/core/testing';

import { ColumnSelectorService, ColumnConfig } from './column-selector.service';

describe('ColumnSelectorService', () => {
  let service: ColumnSelectorService;
  const mockUserId = '123';
  const mockTableId = 'orders_admin';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColumnSelectorService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and load column preferences', () => {
    const columns: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: true, mandatory: true },
      { id: 'name', label: 'Name', visible: true },
      { id: 'email', label: 'Email', visible: false }
    ];

    service.saveColumnPreferences(mockTableId, mockUserId, columns);
    const loaded = service.loadColumnPreferences(mockTableId, mockUserId);

    expect(loaded).toBeTruthy();
    expect(loaded?.length).toBe(3);
    expect(loaded?.find(c => c.id === 'email')?.visible).toBe(false);
  });

  it('should return null when no preferences are saved', () => {
    const loaded = service.loadColumnPreferences('nonexistent', mockUserId);
    expect(loaded).toBeNull();
  });

  it('should restore defaults by removing preferences', () => {
    const columns: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: true }
    ];

    service.saveColumnPreferences(mockTableId, mockUserId, columns);
    expect(service.hasPreferences(mockTableId, mockUserId)).toBe(true);

    service.restoreDefaults(mockTableId, mockUserId);
    expect(service.hasPreferences(mockTableId, mockUserId)).toBe(false);
  });

  it('should get visible columns with saved preferences', () => {
    const defaultColumns: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: true, mandatory: true },
      { id: 'name', label: 'Name', visible: true },
      { id: 'email', label: 'Email', visible: true }
    ];

    const savedPrefs = [
      { id: 'id', visible: true, order: 0 },
      { id: 'name', visible: false, order: 1 },
      { id: 'email', visible: true, order: 2 }
    ];

    service.saveColumnPreferences(mockTableId, mockUserId, savedPrefs as ColumnConfig[]);
    const visibleColumns = service.getVisibleColumns(mockTableId, mockUserId, defaultColumns);

    expect(visibleColumns.length).toBe(2); // id and email
    expect(visibleColumns.find(c => c.id === 'name')).toBeUndefined();
  });

  it('should return default visible columns when no preferences exist', () => {
    const defaultColumns: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: true },
      { id: 'name', label: 'Name', visible: true },
      { id: 'email', label: 'Email', visible: false }
    ];

    const visibleColumns = service.getVisibleColumns(mockTableId, mockUserId, defaultColumns);

    expect(visibleColumns.length).toBe(2); // id and name
    expect(visibleColumns.find(c => c.id === 'email')).toBeUndefined();
  });

  it('should check if preferences exist', () => {
    expect(service.hasPreferences(mockTableId, mockUserId)).toBe(false);

    const columns: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: true }
    ];
    service.saveColumnPreferences(mockTableId, mockUserId, columns);

    expect(service.hasPreferences(mockTableId, mockUserId)).toBe(true);
  });

  it('should handle different users and tables separately', () => {
    const columns1: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: true }
    ];
    const columns2: ColumnConfig[] = [
      { id: 'id', label: 'ID', visible: false }
    ];

    service.saveColumnPreferences('table1', 'user1', columns1);
    service.saveColumnPreferences('table2', 'user2', columns2);

    const loaded1 = service.loadColumnPreferences('table1', 'user1');
    const loaded2 = service.loadColumnPreferences('table2', 'user2');

    expect(loaded1?.find(c => c.id === 'id')?.visible).toBe(true);
    expect(loaded2?.find(c => c.id === 'id')?.visible).toBe(false);
  });
});

