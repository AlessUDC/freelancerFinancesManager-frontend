import api from '@/lib/axios';
import { LoginPayload, RegisterPayload, UpdateUserPayload, Usuario } from '@/types';
import { authenticateUser } from '@/lib/dummyUsers';

export const authService = {
  async login(payload: LoginPayload): Promise<Usuario> {
    const user = await authenticateUser(payload.email, payload.password);
    if (!user) {
      throw new Error('Credenciales incorrectas');
    }
    return user;
  },

  async register(payload: RegisterPayload): Promise<void> {
    await api.post('/register', payload);
  },

  async getUser(id: number): Promise<Usuario> {
    const { data } = await api.get<Usuario>(`/${id}`);
    return data;
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<Usuario> {
    const { data } = await api.put<Usuario>(`/${id}`, payload);
    return data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/${id}`);
  },
};
