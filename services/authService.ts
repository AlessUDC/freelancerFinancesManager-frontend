import api from '@/lib/axios';
import { LoginPayload, RegisterPayload, UpdateUserPayload, Usuario } from '@/types';

interface LoginResponse extends Usuario {
  token: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: Usuario; token: string }> {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    // Store token separately from user profile
    localStorage.setItem('token', data.token);
    
    // Extract user fields, omitting token
    const { token, ...userFields } = data;
    const user: Usuario = userFields;
    
    localStorage.setItem('usuario', JSON.stringify(user));
    return { user, token: data.token };
  },

  async register(payload: RegisterPayload): Promise<void> {
    await api.post('/auth/register', payload);
  },

  async getUser(id: number): Promise<Usuario> {
    const { data } = await api.get<Usuario>(`/auth/${id}`);
    return data;
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<Usuario> {
    const { data } = await api.put<Usuario>(`/auth/${id}`, payload);
    return data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/auth/${id}`);
  },
};
