import { useState, useCallback, useEffect } from 'react'
import { usePaginas } from '../hooks/usePaginas'
import Sidebar from '../components/Sidebar/Sidebar'
import EditorPage from '../components/Editor/EditorPage'
import Breadcrumb from '../components/Editor/Breadcrumb'
import BusquedaModal from '../components/BusquedaModal'

export default function Workspace() {
  const { paginas, crear, actualizar, archivar, recargar } = usePaginas()
  const [paginaActivaId, setPaginaActivaId] = useState<string | null>(null)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)

  // Cmd+K / Ctrl+K global
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setBusquedaAbierta(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleCrear = useCallback(async (padreId?: string) => {
    const nueva = await crear(padreId)
    setPaginaActivaId(nueva.id)
  }, [crear])

  const handleEliminar = useCallback(async (id: string) => {
    await archivar(id)
    if (paginaActivaId === id) setPaginaActivaId(null)
  }, [archivar, paginaActivaId])

  return (
    <div className="workspace">
      <Sidebar
        paginas={paginas}
        paginaActivaId={paginaActivaId}
        onSeleccionar={setPaginaActivaId}
        onCrear={handleCrear}
        onRenombrar={actualizar}
        onEliminar={handleEliminar}
        onBuscar={() => setBusquedaAbierta(true)}
        onRecargar={recargar}
      />

      <main className="editor-area">
        {paginaActivaId ? (
          <>
            <Breadcrumb
              paginas={paginas}
              paginaActivaId={paginaActivaId}
              onNavegar={setPaginaActivaId}
            />
            <EditorPage
              key={paginaActivaId}
              paginaId={paginaActivaId}
              onTituloChange={actualizar}
            />
          </>
        ) : (
          <div className="empty-state">
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</p>
              <h2 style={{ marginBottom: '8px' }}>Bienvenido a NotionClon</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                Selecciona o crea una página desde la barra lateral
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Usa <kbd style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem' }}>Ctrl+K</kbd> para buscar
              </p>
            </div>
          </div>
        )}
      </main>

      {busquedaAbierta && (
        <BusquedaModal
          onSeleccionar={setPaginaActivaId}
          onCerrar={() => setBusquedaAbierta(false)}
        />
      )}
    </div>
  )
}
