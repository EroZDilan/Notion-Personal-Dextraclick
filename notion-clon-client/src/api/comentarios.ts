import { api } from './client'
import type { ComentarioDto } from '../types'

export const comentariosApi = {
  obtenerPorBloque: (bloqueId: string) =>
    api.get<ComentarioDto[]>(`/comentarios/bloque/${bloqueId}`).then((r) => r.data),

  agregar: (bloqueId: string, texto: string) =>
    api.post<ComentarioDto>('/comentarios', { bloqueId, texto }).then((r) => r.data),

  eliminar: (id: string) => api.delete(`/comentarios/${id}`),
}
