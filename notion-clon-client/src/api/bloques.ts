import { api } from './client'
import type { BloqueDto, TipoBloque, VersionBloqueDto } from '../types'

export const bloquesApi = {
  crear: (paginaId: string, tipo: TipoBloque, orden: number) =>
    api.post<BloqueDto>('/bloques', { paginaId, tipo, orden }).then((r) => r.data),

  actualizar: (id: string, contenido: Record<string, unknown>) =>
    api.put(`/bloques/${id}`, { contenido }),

  reordenar: (paginaId: string, ordenIds: string[]) =>
    api.put(`/bloques/reordenar/${paginaId}`, { ordenIds }),

  eliminar: (id: string) => api.delete(`/bloques/${id}`),

  obtenerVersiones: (bloqueId: string) =>
    api.get<VersionBloqueDto[]>(`/versiones/bloque/${bloqueId}`).then((r) => r.data),

  restaurarVersion: (versionId: string) =>
    api.post(`/versiones/${versionId}/restaurar`),
}
