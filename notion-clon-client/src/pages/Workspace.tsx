import { useState, useCallback, useEffect } from 'react'
import { usePaginas } from '../hooks/usePaginas'
import { useTareas } from '../hooks/useTareas'
import Sidebar from '../components/Sidebar/Sidebar'
import EditorPage from '../components/Editor/EditorPage'
import Breadcrumb from '../components/Editor/Breadcrumb'
import BusquedaModal from '../components/BusquedaModal'
import TemplatesModal, { type Template } from '../components/TemplatesModal'
import TareaDetalle from '../components/Tareas/TareaDetalle'

type VistaActiva = { tipo: 'nota'; id: string } | { tipo: 'tarea'; id: string } | null

export default function Workspace() {
  const { paginas, crear, actualizar, archivar, recargar: recargarPaginas } = usePaginas()
  const {
    tareas, filtroEstado, setFiltroEstado, ocultarHechas, setOcultarHechas,
    recargar: recargarTareas, crear: crearTarea, eliminar: eliminarTarea
  } = useTareas()

  const [vistaActiva, setVistaActiva] = useState<VistaActiva>(null)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [templatesAbierto, setTemplatesAbierto] = useState(false)
  const [templatePendiente, setTemplatePendiente] = useState<Template | null>(null)

  // Ctrl+K global
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setBusquedaAbierta(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Páginas ──
  const handleCrearPagina = useCallback(async (padreId?: string) => {
    const nueva = await crear(padreId)
    setVistaActiva({ tipo: 'nota', id: nueva.id })
  }, [crear])

  const handleCrearDesdeTemplate = useCallback(async (template: Template) => {
    const nueva = await crear()
    setVistaActiva({ tipo: 'nota', id: nueva.id })
    setTemplatePendiente(template)
  }, [crear])

  const handleEliminarPagina = useCallback(async (id: string) => {
    await archivar(id)
    if (vistaActiva?.tipo === 'nota' && vistaActiva.id === id) setVistaActiva(null)
  }, [archivar, vistaActiva])

  // ── Tareas ──
  const handleCrearTarea = useCallback(async () => {
    const nueva = await crearTarea('Nueva tarea')
    setVistaActiva({ tipo: 'tarea', id: nueva.id })
  }, [crearTarea])

  const handleEliminarTarea = useCallback(async (id: string) => {
    await eliminarTarea(id)
    if (vistaActiva?.tipo === 'tarea' && vistaActiva.id === id) setVistaActiva(null)
  }, [eliminarTarea, vistaActiva])

  const paginaActivaId = vistaActiva?.tipo === 'nota' ? vistaActiva.id : null
  const tareaActivaId  = vistaActiva?.tipo === 'tarea' ? vistaActiva.id : null

  return (
    <div className="workspace">
      <Sidebar
        paginas={paginas}
        paginaActivaId={paginaActivaId}
        tareas={tareas}
        tareaActivaId={tareaActivaId}
        ocultarHechas={ocultarHechas}
        filtroEstado={filtroEstado}
        onSeleccionarPagina={id => setVistaActiva({ tipo: 'nota', id })}
        onCrearPagina={handleCrearPagina}
        onRenombrarPagina={actualizar}
        onEliminarPagina={handleEliminarPagina}
        onBuscar={() => setBusquedaAbierta(true)}
        onRecargarPaginas={recargarPaginas}
        onSeleccionarTarea={id => setVistaActiva({ tipo: 'tarea', id })}
        onCrearTarea={handleCrearTarea}
        onSetOcultarHechas={setOcultarHechas}
        onSetFiltroEstado={setFiltroEstado}
      />

      <main className="editor-area">
        {vistaActiva?.tipo === 'nota' && (
          <>
            <Breadcrumb paginas={paginas} paginaActivaId={vistaActiva.id} onNavegar={id => setVistaActiva({ tipo: 'nota', id })} />
            <EditorPage
              key={vistaActiva.id}
              paginaId={vistaActiva.id}
              onTituloChange={actualizar}
              paginas={paginas}
              onNavegar={id => setVistaActiva({ tipo: 'nota', id })}
              templatePendiente={templatePendiente}
              onTemplatePendienteConsumido={() => setTemplatePendiente(null)}
            />
          </>
        )}

        {vistaActiva?.tipo === 'tarea' && (
          <TareaDetalle
            key={vistaActiva.id}
            tareaId={vistaActiva.id}
            onEliminar={handleEliminarTarea}
            onActualizado={recargarTareas}
          />
        )}

        {!vistaActiva && (
          <div className="empty-state">
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</p>
              <h2 style={{ marginBottom: '8px' }}>Bienvenido a NotionClon</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                Selecciona una página o tarea desde la barra lateral
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleCrearPagina()}
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  + Nueva página
                </button>
                <button
                  onClick={handleCrearTarea}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' }}
                >
                  ✅ Nueva tarea
                </button>
                <button
                  onClick={() => setTemplatesAbierto(true)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' }}
                >
                  📋 Usar plantilla
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '16px' }}>
                Usa{' '}
                <kbd style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem' }}>Ctrl+K</kbd>
                {' '}para buscar
              </p>
            </div>
          </div>
        )}
      </main>

      {busquedaAbierta && (
        <BusquedaModal
          onSeleccionar={id => { setVistaActiva({ tipo: 'nota', id }); setBusquedaAbierta(false) }}
          onCerrar={() => setBusquedaAbierta(false)}
        />
      )}

      {templatesAbierto && (
        <TemplatesModal
          onSeleccionar={handleCrearDesdeTemplate}
          onCerrar={() => setTemplatesAbierto(false)}
        />
      )}
    </div>
  )
}
