import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

export interface FilterConfig {
  type: 'text' | 'ng-select';
  name: string;
  label: string;
  placeholder?: string;
  options?: any[];
  optionLabel?: string;
  optionValue?: string;
  defaultValue?: any;
}

export interface FilterValues {
  [key: string]: any;
}

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss']
})
export class FilterBarComponent implements OnInit, OnDestroy {
  @Input() filters: FilterConfig[] = [];
  @Input() showClearButton: boolean = true;
  @Input() debounceTime: number = 300; // milliseconds
  @Output() filterChange = new EventEmitter<FilterValues>();

  filterForm: FormGroup = new FormGroup({});
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.setupValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    if (!this.filters || this.filters.length === 0) {
      return;
    }
    this.filters.forEach(filter => {
      // Si tiene defaultValue, usarlo; sino usar null para ng-select o '' para text
      let initialValue: any;
      if (filter.defaultValue !== undefined && filter.defaultValue !== null) {
        initialValue = filter.defaultValue;
      } else {
        initialValue = filter.type === 'ng-select' ? null : '';
      }
      this.filterForm.addControl(filter.name, new FormControl(initialValue));
    });
    
    // Emitir valores por defecto si existen
    const hasDefaults = this.filters.some(f => f.defaultValue !== undefined && f.defaultValue !== null);
    if (hasDefaults) {
      // Usar setTimeout para emitir después de que el form esté completamente inicializado
      setTimeout(() => {
        this.emitFilterValues(this.filterForm.value);
      }, 0);
    }
  }

  private setupValueChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(values => {
        this.emitFilterValues(values);
      });
  }

  private emitFilterValues(values: FilterValues): void {
    // Filtrar valores vacíos (tanto '' como null/undefined)
    const nonEmptyValues: FilterValues = {};
    Object.keys(values).forEach(key => {
      const value = values[key];
      // Considerar vacío: null, undefined, string vacío
      if (value !== null && value !== undefined && value !== '') {
        nonEmptyValues[key] = value;
      }
    });
    
    this.filterChange.emit(nonEmptyValues);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filterChange.emit({});
  }

  getFilterControl(filterName: string): FormControl {
    return this.filterForm.get(filterName) as FormControl;
  }

  isTextFilter(filter: FilterConfig): boolean {
    return filter.type === 'text';
  }

  isNgSelectFilter(filter: FilterConfig): boolean {
    return filter.type === 'ng-select';
  }

  getOptionLabel(filter: FilterConfig, option: any): string {
    if (filter.optionLabel && typeof option === 'object') {
      return option[filter.optionLabel];
    }
    return option;
  }

  getOptionValue(filter: FilterConfig, option: any): any {
    if (filter.optionValue && typeof option === 'object') {
      return option[filter.optionValue];
    }
    return option;
  }
}

