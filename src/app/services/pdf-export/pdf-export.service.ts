import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ticket } from 'src/app/models/ticket.model';
import { getOrderTypeCategory } from 'src/app/shared/utils/order-status.utils';

/**
 * Servicio para exportar órdenes de trabajo a PDF
 * Genera PDFs profesionales con encabezado corporativo y footer
 */
@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  
  // Configuración corporativa de ASSI
  private readonly COMPANY_INFO = {
    name: 'ASSI',
    fullName: 'ASSI - Asesoramiento y Servicios en Sistemas Informáticos',
    address: 'Av. Alberdi 321 - B2900ALD San Nicolás - Buenos Aires - Argentina',
    phone: 'Tel. 03461-15-568034 / 03461-424296 / 03461-15-661602',
    email: 'E-Mail: sistemas@pcassi.com / daniel.polito@pcassi.com'
  };

  // Logo en base64 (será cargado dinámicamente)
  private logoBase64: string = '';
  private logoLoaded: boolean = false;

  constructor() {
    this.loadLogo();
  }

  /**
   * Carga el logo corporativo y lo convierte a base64
   */
  private loadLogo(): void {
    // Cargar el logo desde assets
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
    img.src = 'assets/pcassi-logo.png';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          this.logoBase64 = canvas.toDataURL('image/png');
          this.logoLoaded = true;
        }
      } catch (error) {
        console.warn('Error al convertir logo a base64:', error);
        this.logoLoaded = false;
      }
    };
    img.onerror = () => {
      console.warn('No se pudo cargar el logo desde assets');
      this.logoLoaded = false;
    };
  }

  /**
   * Exporta una orden individual a PDF
   * @param order - Orden a exportar
   */
  exportOrderToPdf(order: Ticket): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar margenes
    const marginLeft = 15;
    const marginRight = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Agregar encabezado
    this.addHeader(doc, marginLeft, pageWidth, contentWidth);

    // Agregar información de la orden
    this.addOrderInfo(doc, order, marginLeft, contentWidth);

    // Agregar footer
    this.addFooter(doc, pageWidth);

    // Generar nombre de archivo
    const fileName = this.generateFileName(order);

    // Descargar PDF
    doc.save(fileName);
  }

  /**
   * Agrega el encabezado corporativo al PDF
   */
  private addHeader(doc: jsPDF, marginLeft: number, pageWidth: number, contentWidth: number): void {
    const startY = 15;
    const logoWidth = 20;
    const logoHeight = 20;
    const logoTextSpacing = 1; // Espacio entre logo y texto "PCASSI"

    // Agregar logo si está disponible y cargado
    if (this.logoLoaded && this.logoBase64) {
      try {
        doc.addImage(this.logoBase64, 'PNG', marginLeft, startY, logoWidth, logoHeight);
      } catch (error) {
        console.warn('No se pudo agregar el logo al PDF:', error);
      }
    }

    // Agregar texto "PCASSI" al lado del logo
    const pcassiTextX = marginLeft + logoWidth;
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('PCASSI', pcassiTextX, startY + 14);

    // Agregar tagline debajo del logo y texto, en negritas y alineado a la izquierda
    const taglineY = startY + logoHeight + 3;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Asesoramiento y Servicios en Sistemas Informáticos', 20, taglineY, { align: 'left' });

    // Línea separadora
    const separatorY = taglineY + 5;
    doc.setLineWidth(0.5);
    doc.line(marginLeft, separatorY, pageWidth - marginLeft, separatorY);
  }

  /**
   * Divide texto largo en líneas más cortas
   */
  private splitText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Agrega la información de la orden al PDF
   */
  private addOrderInfo(doc: jsPDF, order: Ticket, marginLeft: number, contentWidth: number): void {
    // Título principal "SISTEMA DE ORDENES DE TRABAJO" centrado
    const titleY = 55;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA DE ORDENES DE TRABAJO', 20, titleY, { align: 'left' });

    const startY = titleY + 5;

    // Configurar estilos de tabla
    const headerStyles = {
      fillColor: [192, 192, 192] as [number, number, number],
      textColor: [0, 0, 0] as [number, number, number],
      fontStyle: 'bold' as const,
      fontSize: 9
    };

    const bodyStyles = {
      fontSize: 8,
      cellPadding: 3
    };

    // Información básica de la orden
    const basicInfoData = [
      ['N° de OT', order.numero || 'N/A'],
      ['Fecha Solicitada', this.formatDate(order.fecha) || 'N/A'],
      ['Cliente', this.getClientName(order)],
      ['Contacto', order.contacto || 'N/A'],
      ['Email', order.email || '-'],
      ['Teléfono', order.telefono || '-']
    ];

    autoTable(doc, {
      startY: startY,
      head: [['Detalle', '']],
      body: basicInfoData,
      margin: { left: marginLeft, right: marginLeft },
      headStyles: headerStyles,
      bodyStyles: bodyStyles,
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: contentWidth - 50 }
      }
    });

    // Fechas de ejecución - Usar campos correctos
    const lastY2 = (doc as any).lastAutoTable.finalY + 5;
    
    // Construir fecha/hora de inicio y fin usando los campos correctos
    const fechaInicio = this.buildWorkDateTime(order.fechaini, order.horaini, order.fecha);
    const fechaFin = this.buildWorkDateTime(order.fechafin, order.horafin);
    const horasTotales = this.formatHorasTotales(order.htotal);

    const datesData = [
      ['Fecha Inicio', fechaInicio],
      ['Fecha Fin', fechaFin || 'Sin finalizar'],
      ['Horas Totales', horasTotales]
    ];

    autoTable(doc, {
      startY: lastY2,
      head: [['Fechas de Ejecución', '']],
      body: datesData,
      margin: { left: marginLeft, right: marginLeft },
      headStyles: headerStyles,
      bodyStyles: bodyStyles,
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: contentWidth - 50 }
      }
    });

    // Información del servicio
    const lastY = (doc as any).lastAutoTable.finalY + 5;
    
    const serviceInfoData = [
      ['Tipo de Orden', this.getOrderType(order)],
      ['Tipo de Servicio', this.getServiceType(order)],
      ['Técnico Asignado', this.getAssignedTechnician(order)],
      ['Sector', order.sector || 'N/A'],
      ['Estado', order.estado || 'N/A']
    ];

    autoTable(doc, {
      startY: lastY,
      head: [['Servicio Solicitado', '']],
      body: serviceInfoData,
      margin: { left: marginLeft, right: marginLeft },
      headStyles: headerStyles,
      bodyStyles: bodyStyles,
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: contentWidth - 50 }
      }
    });

    // Descripción del problema (solo descripción, sin materiales mezclados)
    const lastY3 = (doc as any).lastAutoTable.finalY + 5;
    const descripcion = order.descripcion || 'Sin descripción';

    autoTable(doc, {
      startY: lastY3,
      head: [['Descripción del Problema']],
      body: [[descripcion]],
      margin: { left: marginLeft, right: marginLeft },
      headStyles: headerStyles,
      bodyStyles: bodyStyles,
      theme: 'grid'
    });

    // Materiales utilizados - Usar campo txtmateriales directamente
    let lastY4 = (doc as any).lastAutoTable.finalY + 5;
    const materiales = this.getMateriales(order);

    if (materiales) {
      // Dividir materiales por saltos de línea para mejor visualización en PDF
      const materialesLines = materiales.split('\n').filter(line => line.trim());
      autoTable(doc, {
        startY: lastY4,
        head: [['Materiales Utilizados']],
        body: materialesLines.length > 0 ? materialesLines.map(line => [line]) : [[materiales]],
        margin: { left: marginLeft, right: marginLeft },
        headStyles: headerStyles,
        bodyStyles: bodyStyles,
        theme: 'grid'
      });
      lastY4 = (doc as any).lastAutoTable.finalY + 5;
    }

    // Observaciones - Usar campo observaciones directamente (texto plano)
    const observaciones = this.getObservaciones(order);
    
    autoTable(doc, {
      startY: lastY4,
      head: [['Observaciones']],
      body: [[observaciones]],
      margin: { left: marginLeft, right: marginLeft },
      headStyles: headerStyles,
      bodyStyles: bodyStyles,
      theme: 'grid'
    });
  }

  /**
   * Formatea las horas totales de manera legible
   * Si es menos de 1 hora, muestra en minutos
   * Si es 1 hora o más, muestra en horas con formato legible
   */
  private formatHorasTotales(htotal: number | undefined | null): string {
    if (!htotal || htotal === 0) return 'N/A';
    
    // Si es menos de 1 hora, mostrar en minutos
    if (htotal < 1) {
      const minutos = Math.round(htotal * 60);
      return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
    }
    
    // Si es 1 hora exacta, mostrar "1 HS"
    if (htotal === 1) {
      return '1 HS';
    }
    
    // Si es más de 1 hora, redondear a 2 decimales y mostrar
    const horasRedondeadas = Math.round(htotal * 100) / 100;
    
    // Si el decimal es .00, mostrar sin decimales con "HS"
    if (horasRedondeadas % 1 === 0) {
      return `${horasRedondeadas} HS`;
    }
    
    // Mostrar con 2 decimales máximo y "HS"
    return `${horasRedondeadas.toFixed(2)} HS`;
  }

  /**
   * Construye fecha/hora de trabajo combinando los campos
   */
  private buildWorkDateTime(fecha: string | undefined, hora: string | undefined, fallbackFecha?: string): string {
    if (!fecha && !fallbackFecha) return 'N/A';
    
    const fechaToUse = fecha || fallbackFecha;
    const formattedDate = this.formatDateOnly(fechaToUse);
    
    if (hora) {
      return `${formattedDate} ${hora}`;
    }
    
    return formattedDate;
  }

  /**
   * Formatea solo la fecha (sin hora) al formato DD/MM/YYYY
   */
  private formatDateOnly(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  }

  /**
   * Obtiene los materiales utilizados
   * Prioriza txtmateriales, luego intenta extraer de descripción legacy
   */
  private getMateriales(order: Ticket): string | null {
    // Prioridad 1: Campo txtmateriales (nuevo y correcto)
    if (order.txtmateriales && order.txtmateriales.trim()) {
      return order.txtmateriales.trim();
    }
    
    // Prioridad 2: Extraer de descripción legacy (compatibilidad hacia atrás)
    const { materiales } = this.parseDescripcionYMateriales(order.descripcion);
    if (materiales) {
      return materiales;
    }
    
    // Prioridad 3: Extraer de observaciones legacy (compatibilidad hacia atrás)
    const { materiales: materialesFromObs } = this.parseObservaciones(order.observaciones);
    return materialesFromObs;
  }

  /**
   * Obtiene las observaciones como texto plano
   * Si es JSON legacy, lo convierte a texto legible
   */
  private getObservaciones(order: Ticket): string {
    if (!order.observaciones || !order.observaciones.trim()) {
      return 'Sin observaciones';
    }
    
    // Intentar parsear como JSON (datos legacy)
    try {
      const parsed = JSON.parse(order.observaciones);
      if (Array.isArray(parsed)) {
        // Filtrar notas de material y formatear
        const regularNotes = parsed
          .filter((note: any) => note.type !== 'material' && note.tipo !== 'material')
          .map((note: any) => {
            const content = note.content || note.text || note.texto || '';
            const technician = note.technician || note.tecnico || '';
            const timestamp = note.timestamp 
              ? new Date(note.timestamp).toLocaleString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: false
                })
              : '';
            
            if (timestamp && technician && technician !== 'Sistema') {
              return `[${timestamp}] ${technician}: ${content}`;
            } else if (technician && technician !== 'Sistema') {
              return `${technician}: ${content}`;
            }
            return content;
          })
          .filter((text: string) => text.trim());
        
        return regularNotes.length > 0 
          ? regularNotes.join('\n\n')
          : 'Sin observaciones';
      }
    } catch {
      // No es JSON, retornar como texto plano
    }
    
    return order.observaciones;
  }

  /**
   * Agrega el footer al PDF
   */
  private addFooter(doc: jsPDF, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(15, footerY, pageWidth - 15, footerY);
  }

  /**
   * Genera el nombre del archivo PDF
   */
  private generateFileName(order: Ticket): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `Orden_${order.numero}_${dateStr}.pdf`;
  }

  /**
   * Formatea una fecha al formato DD/MM/YYYY HH:mm (UTC)
   */
  private formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Formatea una fecha con hora al formato DD/MM/YYYY HH:mm (UTC)
   */
  private formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Obtiene el nombre del cliente
   */
  private getClientName(order: Ticket): string {
    return order.empresa || order.nombre || 'N/A';
  }

  /**
   * Obtiene el tipo de orden
   */
  private getOrderType(order: Ticket): string {
    return getOrderTypeCategory(order);
  }

  /**
   * Obtiene el tipo de servicio
   * Lógica idéntica a getOrderType de order-status.utils
   * 1. Si tiene servicio específico (tipoServicioNombre) → mostrar ese
   * 2. Si no, mostrar según flags: insu → "Insumos", sopo → "Soporte"
   */
  private getServiceType(order: Ticket): string {
    if (!order) return 'General';
    
    // Prioridad 1: Servicio específico asignado
    if (order.tipoServicioNombre && order.tipoServicioNombre.trim()) {
      return order.tipoServicioNombre;
    }
    
    // Prioridad 2: Tipo de pedido según flags (mismo que getOrderType de utils)
    if (order.insu) return 'Insumos';
    if (order.sopo) return 'Soporte';
    if (order.mant) return 'Mantenimiento';
    if (order.limp) return 'Limpieza';
    if (order.mda) return 'Mantenimiento'; // Legacy fallback
    
    return 'General';
  }

  /**
   * Obtiene el técnico asignado
   */
  private getAssignedTechnician(order: Ticket): string {
    if (order.nombreAsignado) {
      return order.nombreAsignado;
    }
    
    if (order.referente) {
      return order.referente;
    }
    
    return 'Sin asignar';
  }

  /**
   * Obtiene el texto de prioridad formateado
   */
  private getPriorityText(priority: string | undefined): string {
    if (!priority) return 'Sin prioridad';
    
    const priorityMap: { [key: string]: string } = {
      'baja': 'Baja',
      'media': 'Media',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    
    return priorityMap[priority.toLowerCase()] || priority;
  }

  /**
   * Parsea el campo descripción para separar materiales utilizados
   * Si la descripción contiene "Materiales utilizados:", lo separa
   */
  private parseDescripcionYMateriales(descripcion: string | undefined): { descripcion: string; materiales: string | null } {
    if (!descripcion || !descripcion.trim()) {
      return { descripcion: 'Sin descripción', materiales: null };
    }

    // Buscar el patrón "Materiales utilizados:" (case insensitive)
    const materialesPattern = /materiales utilizados:/i;
    const match = descripcion.match(materialesPattern);

    if (match) {
      // Separar en dos partes
      const parts = descripcion.split(materialesPattern);
      const descripcionLimpia = parts[0].trim();
      const materialesTexto = parts[1] ? parts[1].trim() : null;

      return {
        descripcion: descripcionLimpia || 'Sin descripción',
        materiales: materialesTexto
      };
    }

    // Si no hay materiales en la descripción, retornar todo como descripción
    return { descripcion, materiales: null };
  }

  /**
   * Parsea el campo observaciones para extraer materiales y observaciones
   */
  private parseObservaciones(observaciones: string | undefined): { materiales: string | null; observaciones: string } {
    if (!observaciones || !observaciones.trim()) {
      return { materiales: null, observaciones: 'Sin observaciones' };
    }

    try {
      // Intentar parsear como JSON
      const notes = JSON.parse(observaciones);
      
      if (Array.isArray(notes)) {
        // Ordenar notas por timestamp descendente (más reciente primero)
        const sortedNotes = [...notes].sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA; // Orden descendente
        });
        
        // Formatear notas con timestamp y técnico
        const formattedNotes = sortedNotes.map(note => {
          const content = note.content || note.text || note.texto || '';
          const technician = note.technician || note.tecnico || 'N/A';
          const timestamp = note.timestamp ? new Date(note.timestamp).toLocaleString('es-AR') : '';
          
          // Verificar si es una nota de material
          const isMaterial = note.type === 'material' || note.tipo === 'material';
          
          if (timestamp && technician !== 'Sistema') {
            return {
              text: `[${timestamp}] ${technician}: ${content}`,
              isMaterial
            };
          } else if (technician !== 'Sistema') {
            return {
              text: `${technician}: ${content}`,
              isMaterial
            };
          } else {
            return {
              text: content,
              isMaterial
            };
          }
        });
        
        // Separar materiales y observaciones
        const materialNotes = formattedNotes.filter(note => note.isMaterial);
        const regularNotes = formattedNotes.filter(note => !note.isMaterial);
        
        const materiales = materialNotes.length > 0
          ? materialNotes.map(note => note.text).join('\n\n')
          : null;
        
        const obs = regularNotes.length > 0
          ? regularNotes.map(note => note.text).join('\n\n')
          : 'Sin observaciones';
        
        return { materiales, observaciones: obs };
      }
    } catch (e) {
      // Si no es JSON válido, retornar como texto plano
      return { materiales: null, observaciones };
    }

    return { materiales: null, observaciones };
  }
}



