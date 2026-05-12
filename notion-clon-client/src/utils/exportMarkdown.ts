import type { BloqueDto, PaginaConBloquesDto } from '../types'

function htmlToText(html: string): string {
  return html
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p><p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function extractListItems(html: string): string[] {
  const matches = [...html.matchAll(/<li>(.*?)<\/li>/gi)]
  return matches.map(m => htmlToText(m[1]))
}

function bloqueToMarkdown(bloque: BloqueDto): string {
  const c = bloque.contenido as Record<string, string>

  switch (bloque.tipo) {
    case 'Heading1':
      return `# ${htmlToText(c.texto || '')}`
    case 'Heading2':
      return `## ${htmlToText(c.texto || '')}`
    case 'Heading3':
      return `### ${htmlToText(c.texto || '')}`
    case 'Parrafo':
    case 'Cita': {
      const texto = htmlToText(c.texto || '')
      return bloque.tipo === 'Cita' ? texto.split('\n').map(l => `> ${l}`).join('\n') : texto
    }
    case 'ListaBullets': {
      const items = extractListItems(c.texto || '')
      return items.length ? items.map(i => `- ${i}`).join('\n') : `- ${htmlToText(c.texto || '')}`
    }
    case 'ListaNumerada': {
      const items = extractListItems(c.texto || '')
      return items.length ? items.map((i, idx) => `${idx + 1}. ${i}`).join('\n') : `1. ${htmlToText(c.texto || '')}`
    }
    case 'Codigo':
      return `\`\`\`${c.lenguaje || ''}\n${c.codigo || ''}\n\`\`\``
    case 'Imagen':
      return c.url ? `![${c.alt || ''}](${c.url})` : ''
    case 'Divisor':
      return '---'
    case 'Llamada':
      return `> ${c.emoji || ''} ${htmlToText(c.texto || '')}`
    default:
      return htmlToText(c.texto || '')
  }
}

export function exportarMarkdown(pagina: PaginaConBloquesDto): void {
  const lineas: string[] = [
    `# ${pagina.emoji} ${pagina.titulo || 'Sin título'}`,
    '',
    ...pagina.bloques
      .filter(b => b.tipo !== 'Divisor' || true)
      .map(bloqueToMarkdown)
      .filter(l => l.length > 0)
      .flatMap(l => [l, ''])
  ]

  const contenido = lineas.join('\n')
  const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pagina.titulo || 'pagina'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
