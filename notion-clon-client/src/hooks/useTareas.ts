import { useState, useCallback, useEffect } from 'react'
import type { TareaDto, TareaDetalleDto } from '../types'
import * as api from '../api/tareas'

export function useTareas() {
  const [tareas, setTareas] = useState<TareaDto[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [ocultarHechas, setOcultarHechas] = useState(false)

  const recargar = useCallback(async () => {
    const data = await api.listarTareas()
    setTareas(data)
  }, [])

  useEffect(() => { recargar() }, [recargar])

  const tareasFiltradas = tareas.filter(t => {
    if (ocultarHechas && t.estado === 'Hecho') return false
    if (filtroEstado && t.estado !== filtroEstado) return false
    return true
  })

  const crear = useCallback(async (titulo: string, prioridad = 'Media') => {
    const nueva = await api.crearTarea({ titulo, prioridad })
    await recargar()
    return nueva
  }, [recargar])

  const actualizar = useCallback(async (id: string, data: Parameters<typeof api.actualizarTarea>[1]) => {
    await api.actualizarTarea(id, data)
    await recargar()
  }, [recargar])

  const eliminar = useCallback(async (id: string) => {
    await api.eliminarTarea(id)
    setTareas(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    tareas: tareasFiltradas,
    todasLasTareas: tareas,
    filtroEstado, setFiltroEstado,
    ocultarHechas, setOcultarHechas,
    recargar, crear, actualizar, eliminar
  }
}

export function useTareaDetalle(id: string | null) {
  const [tarea, setTarea] = useState<TareaDetalleDto | null>(null)
  const [cargando, setCargando] = useState(false)

  const recargar = useCallback(async () => {
    if (!id) { setTarea(null); return }
    setCargando(true)
    try {
      const data = await api.obtenerTarea(id)
      setTarea(data)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => { recargar() }, [recargar])

  return { tarea, cargando, recargar }
}
