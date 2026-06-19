import api from '@/lib/axios';
import { LoginPayload, RegisterPayload, UpdateUserPayload, Usuario } from '@/types';

export const authService = {
  async login(payload: LoginPayload): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/login', payload);
    return data;
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
