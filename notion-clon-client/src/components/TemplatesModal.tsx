import './TemplatesModal.css'

export interface Template {
  id: string
  nombre: string
  emoji: string
  descripcion: string
  bloques: { tipo: string; contenido: Record<string, unknown> }[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'reunion',
    nombre: 'Notas de reunión',
    emoji: '🤝',
    descripcion: 'Agenda, participantes y puntos de acción',
    bloques: [
      { tipo: 'Heading1', contenido: { texto: '<h1>Reunión</h1>' } },
      { tipo: 'Llamada', contenido: { emoji: '📅', texto: 'Fecha: ', color: 'azul' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Participantes</h2>' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>Nombre</li></ul>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Agenda</h2>' } },
      { tipo: 'ListaNumerada', contenido: { texto: '<ol><li>Punto 1</li></ol>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Puntos de acción</h2>' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>[ ] Tarea pendiente</li></ul>' } },
    ],
  },
  {
    id: 'proyecto',
    nombre: 'Documento de proyecto',
    emoji: '🚀',
    descripcion: 'Objetivo, alcance, hitos y recursos',
    bloques: [
      { tipo: 'Heading1', contenido: { texto: '<h1>Nombre del proyecto</h1>' } },
      { tipo: 'Llamada', contenido: { emoji: '🎯', texto: 'Objetivo principal del proyecto', color: 'amarillo' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Alcance</h2>' } },
      { tipo: 'Parrafo', contenido: { texto: '<p>Descripción del alcance...</p>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Hitos</h2>' } },
      { tipo: 'ListaNumerada', contenido: { texto: '<ol><li>Hito 1</li></ol>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Recursos</h2>' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>Recurso necesario</li></ul>' } },
      { tipo: 'Divisor', contenido: {} },
      { tipo: 'Parrafo', contenido: { texto: '<p>Notas adicionales...</p>' } },
    ],
  },
  {
    id: 'diario',
    nombre: 'Diario personal',
    emoji: '📔',
    descripcion: 'Reflexión diaria y notas personales',
    bloques: [
      { tipo: 'Heading1', contenido: { texto: '<h1>Mi día de hoy</h1>' } },
      { tipo: 'Llamada', contenido: { emoji: '☀️', texto: '¿Cómo me siento hoy?', color: 'amarillo' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Lo que pasó</h2>' } },
      { tipo: 'Parrafo', contenido: { texto: '<p>Escribe aquí...</p>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Aprendizajes</h2>' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>Aprendizaje del día</li></ul>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Mañana</h2>' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>Prioridad</li></ul>' } },
    ],
  },
  {
    id: 'blog',
    nombre: 'Artículo de blog',
    emoji: '✍️',
    descripcion: 'Estructura lista para publicar',
    bloques: [
      { tipo: 'Heading1', contenido: { texto: '<h1>Título del artículo</h1>' } },
      { tipo: 'Llamada', contenido: { emoji: '💡', texto: 'Resumen en una línea: ¿De qué trata este artículo?', color: 'azul' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Introducción</h2>' } },
      { tipo: 'Parrafo', contenido: { texto: '<p>Gancha al lector aquí...</p>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Desarrollo</h2>' } },
      { tipo: 'Parrafo', contenido: { texto: '<p>Punto principal 1...</p>' } },
      { tipo: 'Heading2', contenido: { texto: '<h2>Conclusión</h2>' } },
      { tipo: 'Parrafo', contenido: { texto: '<p>Cierre y llamada a la acción...</p>' } },
    ],
  },
  {
    id: 'tareas',
    nombre: 'Lista de tareas',
    emoji: '✅',
    descripcion: 'Organiza tus pendientes por prioridad',
    bloques: [
      { tipo: 'Heading1', contenido: { texto: '<h1>Mis tareas</h1>' } },
      { tipo: 'Llamada', contenido: { emoji: '🔥', texto: 'Alta prioridad', color: 'rojo' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>[ ] Tarea urgente</li></ul>' } },
      { tipo: 'Llamada', contenido: { emoji: '📌', texto: 'Media prioridad', color: 'amarillo' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>[ ] Tarea importante</li></ul>' } },
      { tipo: 'Llamada', contenido: { emoji: '🕐', texto: 'Baja prioridad', color: 'gris' } },
      { tipo: 'ListaBullets', contenido: { texto: '<ul><li>[ ] Cuando haya tiempo</li></ul>' } },
    ],
  },
]

interface Props {
  onSeleccionar: (template: Template) => void
  onCerrar: () => void
}

export default function TemplatesModal({ onSeleccionar, onCerrar }: Props) {
  return (
    <div className="templates-overlay" onClick={onCerrar}>
      <div className="templates-modal" onClick={e => e.stopPropagation()}>
        <div className="templates-header">
          <span className="templates-titulo">Plantillas</span>
          <button className="templates-close" onClick={onCerrar}>✕</button>
        </div>
        <div className="templates-grid">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              className="template-card"
              onClick={() => { onSeleccionar(t); onCerrar() }}
            >
              <span className="template-emoji">{t.emoji}</span>
              <span className="template-nombre">{t.nombre}</span>
              <span className="template-desc">{t.descripcion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
