import { api } from './client'
import type { BloqueDto, TipoBloque } from '../types'

export const bloquesApi = {
  crear: (paginaId: string, tipo: TipoBloque, orden: number) =>
    api.post<BloqueDto>('/bloques', { paginaId, tipo, orden }).then((r) => r.data),

  actualizar: (id: string, contenido: Record<string, unknown>) =>
    api.put(`/bloques/${id}`, { contenido }),

  reordenar: (paginaId: string, ordenIds: string[]) =>
    api.put(`/bloques/reordenar/${paginaId}`, { ordenIds }),

  eliminar: (id: string) => api.delete(`/bloques/${id}`),
}
