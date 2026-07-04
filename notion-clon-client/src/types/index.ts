export interface PaginaDto {
  id: string
  titulo: string
  emoji: string
  coverUrl?: string | null
  esPublica: boolean
  paginaPadreId: string | null
  subPaginas: PaginaDto[]
  actualizadaEn?: string
}

export interface BloqueDto {
  id: string
  tipo: TipoBloque
  contenido: Record<string, unknown>
  orden: number
  totalComentarios: number
}

export interface PaginaConBloquesDto extends PaginaDto {
  bloques: BloqueDto[]
}

export type TipoBloque =
  | 'Parrafo'
  | 'Heading1'
  | 'Heading2'
  | 'Heading3'
  | 'ListaBullets'
  | 'ListaNumerada'
  | 'Codigo'
  | 'Imagen'
  | 'Divisor'
  | 'Llamada'
  | 'Cita'

export interface AuthResponseDto {
  token: string
  email: string
  nombreCompleto: string
}

export interface ResultadoBusquedaDto {
  paginaId: string
  titulo: string
  emoji: string
  fragmento?: string
  tipo: 'pagina' | 'bloque'
}

export interface VersionBloqueDto {
  id: string
  contenidoJson: string
  tipoStr: string
  creadaEn: string
}

export interface ComentarioDto {
  id: string
  bloqueId: string
  usuarioId: string
  nombreUsuario: string
  texto: string
  creadaEn: string
}

export type Prioridad = 'Alta' | 'Media' | 'Baja'
export type EstadoTarea = 'Todo' | 'EnProgreso' | 'Hecho'

export interface TareaDto {
  id: string
  titulo: string
  descripcion?: string | null
  prioridad: Prioridad
  estado: EstadoTarea
  fechaLimite?: string | null
  creadaEn: string
  actualizadaEn: string
  totalPasos: number
  pasosCompletados: number
}

export interface PasoDto {
  id: string
  titulo: string
  completado: boolean
  orden: number
  subtareaId?: string | null
}

export interface SubtareaDto {
  id: string
  titulo: string
  estado: EstadoTarea
  orden: number
  pasos: PasoDto[]
}

export interface TareaDetalleDto extends TareaDto {
  subtareas: SubtareaDto[]
  pasos: PasoDto[]
}
