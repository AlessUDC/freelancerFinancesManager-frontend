import { Usuario } from '@/types';

export interface DummyUser extends Usuario {
  passwordHash: string; // Para simular la validación de contraseña
}

export const dummyUsers: DummyUser[] = [
  {
    id: 1,
    email: 'admin@freelancer.com',
    passwordHash: 'admin123',
    nombres: 'Admin',
    apellidoPaterno: 'System',
    apellidoMaterno: 'Dev',
    monedaBase: 'USD',
  },
  {
    id: 2,
    email: 'dev@freelancer.com',
    passwordHash: 'dev123',
    nombres: 'Frontend',
    apellidoPaterno: 'Dev',
    apellidoMaterno: 'User',
    monedaBase: 'MXN',
  },
  {
    id: 3,
    email: 'user@freelancer.com',
    passwordHash: 'user123',
    nombres: 'John',
    apellidoPaterno: 'Doe',
    apellidoMaterno: 'Smith',
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
