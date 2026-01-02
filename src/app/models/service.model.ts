export interface Service {
  idcs: number;        // ID principal del servicio (tabla [servicios])
  nombre: string;
  costo1: number;
  costo2: number;
  comentario: string;
  id1rs?: number;      // Campo legacy (obsoleto, tabla [1reqservicios])
}
