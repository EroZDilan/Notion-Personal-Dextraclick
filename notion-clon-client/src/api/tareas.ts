import { api as client } from './client'
import type { TareaDto, TareaDetalleDto, SubtareaDto, PasoDto } from '../types'

export async function listarTareas(estado?: string, prioridad?: string): Promise<TareaDto[]> {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  if (prioridad) params.set('prioridad', prioridad)
  const qs = params.toString()
  const res = await client.get<TareaDto[]>(`/api/tareas${qs ? '?' + qs : ''}`)
  return res.data
}

export async function obtenerTarea(id: string): Promise<TareaDetalleDto> {
  const res = await client.get<TareaDetalleDto>(`/api/tareas/${id}`)
  return res.data
}

export async function crearTarea(data: { titulo: string; prioridad?: string; descripcion?: string; fechaLimite?: string }): Promise<TareaDto> {
  const res = await client.post<TareaDto>('/api/tareas', data)
  return res.data
}

export async function actualizarTarea(id: string, data: Partial<{
  titulo: string; descripcion: string; prioridad: string; estado: string;
  fechaLimite: string; clearFechaLimite: boolean
}>): Promise<void> {
  await client.put(`/api/tareas/${id}`, data)
}

export async function eliminarTarea(id: string): Promise<void> {
  await client.delete(`/api/tareas/${id}`)
}

// Subtareas
export async function crearSubtarea(tareaId: string, titulo: string): Promise<SubtareaDto> {
  const res = await client.post<SubtareaDto>(`/api/tareas/${tareaId}/subtareas`, { titulo })
  return res.data
}

export async function actualizarSubtarea(id: string, titulo: string): Promise<void> {
  await client.put(`/api/tareas/subtareas/${id}`, { titulo })
}

export async function eliminarSubtarea(id: string): Promise<void> {
  await client.delete(`/api/tareas/subtareas/${id}`)
}

// Pasos
export async function crearPasoEnTarea(tareaId: string, titulo: string): Promise<PasoDto> {
  const res = await client.post<PasoDto>(`/api/tareas/${tareaId}/pasos`, { titulo })
  return res.data
}

export async function crearPasoEnSubtarea(subtareaId: string, titulo: string): Promise<PasoDto> {
  const res = await client.post<PasoDto>(`/api/tareas/subtareas/${subtareaId}/pasos`, { titulo })
  return res.data
}

export async function actualizarPaso(id: string, data: { titulo?: string; completado?: boolean }): Promise<void> {
  await client.put(`/api/tareas/pasos/${id}`, data)
}

export async function eliminarPaso(id: string): Promise<void> {
  await client.delete(`/api/tareas/pasos/${id}`)
}
