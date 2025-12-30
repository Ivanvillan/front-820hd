export interface Auth {
    email: string; // Mantener para compatibilidad
    identifier?: string; // Nuevo: usuario o email (usado para técnicos)
    password: string;
}