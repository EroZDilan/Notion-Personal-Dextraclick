import { useState, useEffect, useCallback } from 'react'
import { paginasApi } from '../api/paginas'
import type { PaginaDto } from '../types'

export function usePaginas() {
  const [paginas, setPaginas] = useState<PaginaDto[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const data = await paginasApi.obtenerArbol()
      setPaginas(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const crear = useCallback(async (padreId?: string) => {
    const nueva = await paginasApi.crear(padreId)
    await cargar()
    return nueva
  }, [cargar])

  const actualizar = useCallback(async (id: string, titulo: string, emoji: string) => {
    await paginasApi.actualizarTitulo(id, titulo, emoji)
    setPaginas(prev => actualizarEnArbol(prev, id, titulo, emoji))
  }, [])

  const archivar = useCallback(async (id: string) => {
    await paginasApi.archivar(id)
    await cargar()
  }, [cargar])

  return { paginas, loading, crear, actualizar, archivar, recargar: cargar }
}

function actualizarEnArbol(paginas: PaginaDto[], id: string, titulo: string, emoji: string): PaginaDto[] {
  return paginas.map(p => {
    if (p.id === id) return { ...p, titulo, emoji }
    if (p.subPaginas.length > 0) return { ...p, subPaginas: actualizarEnArbol(p.subPaginas, id, titulo, emoji) }
    return p
  })
}
