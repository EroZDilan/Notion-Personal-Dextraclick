import { api } from './client'
import type { PaginaDto, PaginaConBloquesDto, ResultadoBusquedaDto } from '../types'

export const paginasApi = {
  obtenerArbol: () =>
    api.get<PaginaDto[]>('/paginas').then((r) => r.data),

  obtener: (id: string) =>
    api.get<PaginaConBloquesDto>(`/paginas/${id}`).then((r) => r.data),

  obtenerPublica: (id: string) =>
    api.get<PaginaConBloquesDto>(`/publico/paginas/${id}`).then((r) => r.data),

  crear: (padreId?: string) =>
    api.post<PaginaDto>('/paginas', { padreId }).then((r) => r.data),

  actualizarTitulo: (id: string, titulo: string, emoji: string) =>
    api.patch(`/paginas/${id}`, { titulo, emoji }),

  actualizarCover: (id: string, coverUrl: string | null) =>
    api.patch(`/paginas/${id}/cover`, { coverUrl }),

  actualizarVisibilidad: (id: string, esPublica: boolean) =>
    api.patch(`/paginas/${id}/visibilidad`, { esPublica }),

  archivar: (id: string) => api.delete(`/paginas/${id}`),

  restaurar: (id: string) => api.post(`/paginas/${id}/restaurar`),

  obtenerPapelera: () =>
    api.get<PaginaDto[]>('/paginas/papelera').then((r) => r.data),

  buscar: (q: string) =>
    api.get<ResultadoBusquedaDto[]>('/paginas/buscar', { params: { q } }).then((r) => r.data),

  subirImagen: (archivo: File) => {
    const form = new FormData()
    form.append('archivo', archivo)
    return api.post<{ url: string }>('/paginas/imagen', form).then((r) => r.data.url)
  },
}
