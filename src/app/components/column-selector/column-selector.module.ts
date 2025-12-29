import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
// Future: import { DragDropModule } from '@angular/cdk/drag-drop';

import { ColumnSelectorComponent } from './column-selector.component';

@NgModule({
  declarations: [
    ColumnSelectorComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule
    // Future: DragDropModule
  ],
  exports: [
    ColumnSelectorComponent
  ]
})
export class ColumnSelectorModule { }

