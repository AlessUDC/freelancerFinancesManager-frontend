export interface DummyUser {
  id: string;
  email: string;
  passwordHash: string; // En un escenario real, nunca guardes passwords en texto plano
  name: string;
  role: 'admin' | 'freelancer';
  avatar?: string;
}

// Estos son nuestros usuarios "mockeados" que residen en memoria.
export const dummyUsers: DummyUser[] = [
  {
    id: '1',
    email: 'admin@freelancer.com',
    passwordHash: 'admin123', // Simulando el password plano para la demo (Mala práctica en prod)
    name: 'Admin System',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  },
  {
    id: '2',
    email: 'dev@freelancer.com',
    passwordHash: 'dev123',
    name: 'Frontend Dev',
    role: 'freelancer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev'
  },
  {
    id: '3',    // único usuario añadido
    email: 'user@freelancer.com',
    passwordHash: 'user123',
    name: 'John Doe',
    role: 'freelancer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  }
];

/**
 * Simula una llamada a una base de datos o API externa para autenticar.
 */
export const authenticateUser = async (email: string, password: string): Promise<DummyUser | null> => {
  // Simulamos el delay de una petición real (ej. 800ms)
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = dummyUsers.find(u => u.email === email && u.passwordHash === password);

  if (user) {
    // Si queremos emular aún más la realidad, omitimos la contraseña en la respuesta
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as DummyUser;
  }

  return null;
};
