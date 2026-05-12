export interface PaginaDto {
  id: string
  titulo: string
  emoji: string
  paginaPadreId: string | null
  subPaginas: PaginaDto[]
  actualizadaEn?: string
}

export interface BloqueDto {
  id: string
  tipo: TipoBloque
  contenido: Record<string, unknown>
  orden: number
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
