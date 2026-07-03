import { Usuario } from '@/types';

export interface DummyUser extends Usuario {
  passwordHash: string; // Para simular la validación de contraseña
}

export const dummyUsers: DummyUser[] = [
  {
    id: 1,
    email: 'admin@freelancer.com',
    passwordHash: 'admin123',
    nombre: 'Admin System',
    monedaBase: 'USD',
  },
  {
    id: 2,
    email: 'dev@freelancer.com',
    passwordHash: 'dev123',
    nombre: 'Frontend Dev',
    monedaBase: 'MXN',
  },
  {
    id: 3,
    email: 'user@freelancer.com',
    passwordHash: 'user123',
    nombre: 'John Doe',
    monedaBase: 'EUR',
  }
];

export const authenticateUser = async (email: string, password: string): Promise<Usuario | null> => {
  // Simulamos el delay de una petición real (ej. 800ms)
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = dummyUsers.find(u => u.email === email && u.passwordHash === password);
  
  if (user) {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as Usuario;
  }
  
  return null;
};
