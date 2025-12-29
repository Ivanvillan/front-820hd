import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface AreaOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-area-selection',
  templateUrl: './area-selection.component.html',
  styleUrls: ['./area-selection.component.css']
})
export class AreaSelectionComponent implements OnInit {

  areas: AreaOption[] = [
    {
      id: 'campo',
      name: 'Campo',
      description: 'Órdenes de trabajo en campo',
      icon: 'location_on',
      color: '#4CAF50'
    },
    {
      id: 'laboratorio',
      name: 'Laboratorio',
      description: 'Órdenes de trabajo en laboratorio',
      icon: 'science',
      color: '#2196F3'
    },
    {
      id: '820hd',
      name: '820HD',
      description: 'Órdenes de trabajo en 820HD',
      icon: 'business',
      color: '#FF9800'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  /**
   * Navega a la vista de órdenes del área seleccionada
   * @param areaId - ID del área seleccionada
   */
  selectArea(areaId: string): void {
    this.router.navigate(['/technician/orders', areaId]);
  }

  /**
   * Navega de vuelta a la gestión de órdenes
   */
  goBackToOrderManagement(): void {
    this.router.navigate(['/manage/ordenes']);
  }
}
