import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PdfExportConfirmationDialogData {
  orderNumber: string | number;
  message?: string;
}

@Component({
  selector: 'app-pdf-export-confirmation-dialog',
  templateUrl: './pdf-export-confirmation-dialog.component.html',
  styleUrls: ['./pdf-export-confirmation-dialog.component.scss']
})
export class PdfExportConfirmationDialogComponent {
  orderNumber: string | number;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<PdfExportConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PdfExportConfirmationDialogData
  ) {
    this.orderNumber = data.orderNumber;
    this.message = data.message || 
      `La orden #${data.orderNumber} está por finalizarse. ¿Deseas exportarla a PDF antes de continuar?`;
  }

  /**
   * Usuario acepta exportar PDF
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Usuario rechaza exportar PDF, solo quiere finalizar
   */
  onDismiss(): void {
    this.dialogRef.close(false);
  }
}
