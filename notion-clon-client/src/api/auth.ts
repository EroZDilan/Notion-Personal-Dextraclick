import { api } from './client'
import type { AuthResponseDto } from '../types'

export const authApi = {
  register: (email: string, password: string, nombreCompleto: string) =>
    api.post<AuthResponseDto>('/auth/register', { email, password, nombreCompleto }).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<AuthResponseDto>('/auth/login', { email, password }).then((r) => r.data),
}
