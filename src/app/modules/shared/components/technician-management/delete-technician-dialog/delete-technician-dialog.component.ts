import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Technician } from 'src/app/services/personnel/personnel.service';

export interface DeleteTechnicianDialogData {
  technician: Technician;
}

@Component({
  selector: 'app-delete-technician-dialog',
  templateUrl: './delete-technician-dialog.component.html',
  styleUrls: ['./delete-technician-dialog.component.scss']
})
export class DeleteTechnicianDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<DeleteTechnicianDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteTechnicianDialogData
  ) {}

  /**
   * Cancela la eliminación del técnico
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Confirma la eliminación del técnico
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
