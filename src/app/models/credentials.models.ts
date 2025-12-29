export interface Credentials {
    id7c: number;
    contacto: string;
    id7: number;
    nombre: string;
    email: string;
    type: string; // 'admin' | 'customer' | 'technician'
    token: string;
    area?: string; // 'campo' | 'laboratorio' | '820hd' | 'general' (solo para technicians)
}