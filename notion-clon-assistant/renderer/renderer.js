// ── CONSTANTES ──────────────────────────────────────────────────────────────
const SESSION_KEY = 'nc_sessions'
const TOKEN_KEY   = 'nc_token'
const CLEANUP_DAYS = 3

let BACKEND_URL = 'http://localhost:5162'
let token = localStorage.getItem(TOKEN_KEY)
let pendingAction = null
let contextActive = false   // si el próximo mensaje lleva historial adjunto

// ── STORAGE DE SESIONES ──────────────────────────────────────────────────────

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || { activeId: null, list: [] }
  } catch {
    return { activeId: null, list: [] }
  }
}

function saveData(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

function createSession(name) {
  const data = loadData()
  const session = {
    id: crypto.randomUUID(),
    name: name || 'Nueva conversación',
    createdAt: new Date().toISOString(),
    messages: []
  }
  data.list.unshift(session)
  data.activeId = session.id
  saveData(data)
  return session
}

function getActiveSession() {
  const data = loadData()
  return data.list.find(s => s.id === data.activeId) || null
}

function setActiveSession(id) {
  const data = loadData()
  if (data.list.find(s => s.id === id)) {
    data.activeId = id
    saveData(data)
    return true
  }
  return false
}

function deleteSession(id) {
  const data = loadData()
  data.list = data.list.filter(s => s.id !== id)
  if (data.activeId === id) {
    data.activeId = data.list[0]?.id || null
  }
  saveData(data)
}

function renameSession(id, name) {
  const data = loadData()
  const s = data.list.find(s => s.id === id)
  if (s) { s.name = name.trim() || 'Sin nombre'; saveData(data) }
}

function addMessageToSession(role, content, actions = []) {
  const data = loadData()
  const session = data.list.find(s => s.id === data.activeId)
  if (!session) return
  session.messages.push({ role, content, timestamp: new Date().toISOString(), actions })
  saveData(data)
}

// ── AUTO-LIMPIEZA ────────────────────────────────────────────────────────────

async function checkAndCleanup() {
  const data = loadData()
  const now = Date.now()
  const oldSessions = data.list.filter(s => {
    const age = (now - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return age >= CLEANUP_DAYS && s.messages.length > 0
  })

  for (const session of oldSessions) {
    if (token) await summarizeAndSave(session)
    deleteSession(session.id)
  }

  if (oldSessions.length > 0) {
    const data2 = loadData()
    if (!data2.activeId && data2.list.length > 0) {
      data2.activeId = data2.list[0].id
      saveData(data2)
    }
  }
}

async function summarizeAndSave(session) {
  try {
    const backendOk = await window.assistant.checkBackend()
    if (!backendOk) return

    const resumen = session.messages
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n')

    const prompt = `Crea una página en NotionClon con el resumen de esta conversación. ` +
      `Título: "Resumen: ${session.name}". ` +
      `Contenido: haz un resumen breve de los puntos clave.\n\n${resumen}`

    await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ Mensaje: prompt })
    })
  } catch { /* silencioso si falla */ }
}

// ── EXPORTAR ─────────────────────────────────────────────────────────────────

function exportAsMarkdown(session) {
  const lines = [
    `# ${session.name}`,
    `*Creada: ${new Date(session.createdAt).toLocaleString()}*`,
    '',
    ...session.messages.map(m => {
      const quien = m.role === 'user' ? '**Tú**' : '**Asistente**'
      const hora = new Date(m.timestamp).toLocaleTimeString()
      let text = `${quien} *(${hora})*\n${m.content}`
      if (m.actions?.length) {
        text += '\n' + m.actions.map(a => `> ✓ ${a}`).join('\n')
      }
      return text
    })
  ]
  downloadFile(`${session.name}.md`, lines.join('\n\n'), 'text/markdown')
}

function exportAsJSON(session) {
  downloadFile(`${session.name}.json`, JSON.stringify(session, null, 2), 'application/json')
}

function exportAllSessions() {
  const data = loadData()
  downloadFile('notionClon-chats.json', JSON.stringify(data, null, 2), 'application/json')
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── RENDER DE SESIONES ───────────────────────────────────────────────────────

function renderSessionsList() {
  const data = loadData()
  const list = document.getElementById('sessions-list')
  list.innerHTML = ''

  if (data.list.length === 0) {
    list.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:12px;text-align:center">Sin conversaciones guardadas</p>'
    return
  }

  // Botón exportar todo
  const exportAll = document.createElement('button')
  exportAll.className = 'btn-new-session'
  exportAll.style.cssText = 'width:100%;margin-bottom:8px;background:var(--surface3);color:var(--text)'
  exportAll.textContent = '↓ Exportar todas (JSON)'
  exportAll.onclick = exportAllSessions
  list.appendChild(exportAll)

  data.list.forEach(session => {
    const item = document.createElement('div')
    item.className = `session-item${session.id === data.activeId ? ' active' : ''}`

    const age = Math.floor((Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    const ageText = age === 0 ? 'hoy' : age === 1 ? 'ayer' : `hace ${age} días`
    const msgCount = session.messages.length

    item.innerHTML = `
      <div class="session-item-info">
        <div class="session-item-name">${escapeHtml(session.name)}</div>
        <div class="session-item-meta">${ageText} · ${msgCount} mensaje${msgCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="session-item-actions">
        <button class="session-action-btn" data-action="rename" title="Renombrar">✏️</button>
        <button class="session-action-btn" data-action="export-md" title="Exportar Markdown">MD</button>
        <button class="session-action-btn" data-action="export-json" title="Exportar JSON">{ }</button>
        <button class="session-action-btn danger" data-action="delete" title="Eliminar">🗑</button>
      </div>
    `

    // Click en el item → abrir sesión
    item.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return
      switchToSession(session.id)
    })

    // Acciones
    item.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const action = btn.dataset.action

        if (action === 'delete') {
          if (confirm(`¿Eliminar "${session.name}"?`)) {
            deleteSession(session.id)
            renderSessionsList()
            updateSessionNameHeader()
          }
        } else if (action === 'export-md') {
          exportAsMarkdown(session)
        } else if (action === 'export-json') {
          exportAsJSON(session)
        } else if (action === 'rename') {
          const nameEl = item.querySelector('.session-item-name')
          const currentName = session.name
          nameEl.outerHTML = `<input class="session-item-name-input" value="${escapeHtml(currentName)}" maxlength="60">`
          const input = item.querySelector('.session-item-name-input')
          input.focus()
          input.select()
          const save = () => {
            renameSession(session.id, input.value)
            renderSessionsList()
            updateSessionNameHeader()
          }
          input.addEventListener('blur', save)
          input.addEventListener('keydown', e => { if (e.key === 'Enter') save() })
        }
      })
    })

    list.appendChild(item)
  })
}

function switchToSession(id) {
  setActiveSession(id)
  hideSessions()
  renderMessages()
  updateSessionNameHeader()
  resetContext()
}

function updateSessionNameHeader() {
  const session = getActiveSession()
  document.getElementById('session-name-display').textContent = session?.name || 'Nueva conversación'
}

// ── RENDER DE MENSAJES ───────────────────────────────────────────────────────

function renderMessages() {
  const messagesEl = document.getElementById('messages')
  const session = getActiveSession()

  if (!session || session.messages.length === 0) {
    messagesEl.innerHTML = `
      <div class="empty-state">
        <span class="logo-big">✦</span>
        Soy tu asistente de NotionClon.<br>
        Puedo crear páginas, editar bloques,<br>
        buscar contenido y más.<br>
        <br>¿En qué te ayudo?
      </div>`
    return
  }

  messagesEl.innerHTML = ''
  session.messages.forEach(msg => {
    if (msg.role === 'user') {
      appendUserBubble(msg.content)
    } else {
      appendBotBubble(msg.content, msg.actions || [])
    }
  })
  scrollToBottom()
}

// ── DOM HELPERS ──────────────────────────────────────────────────────────────

function appendUserBubble(text) {
  const messagesEl = document.getElementById('messages')
  const div = document.createElement('div')
  div.className = 'msg user'
  div.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`
  messagesEl.appendChild(div)
  scrollToBottom()
}

function appendBotBubble(text, actions = []) {
  const messagesEl = document.getElementById('messages')
  const div = document.createElement('div')
  div.className = 'msg bot'
  let html = `<div class="bubble">${escapeHtml(text)}`
  if (actions.length) {
    html += `<div class="actions-executed">${actions.map(a => `<span>✓ ${escapeHtml(a)}</span>`).join('')}</div>`
  }
  html += `</div>`
  div.innerHTML = html
  messagesEl.appendChild(div)
  scrollToBottom()
  return div
}

function addTyping() {
  const messagesEl = document.getElementById('messages')
  const div = document.createElement('div')
  div.className = 'msg bot typing'
  div.innerHTML = '<div class="bubble">Pensando...</div>'
  messagesEl.appendChild(div)
  scrollToBottom()
  return div
}

function scrollToBottom() {
  const el = document.getElementById('messages')
  el.scrollTop = el.scrollHeight
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

function setInputDisabled(disabled) {
  document.getElementById('message-input').disabled = disabled
  document.getElementById('send-btn').disabled = disabled
}

function showPendingAction(accion) {
  document.getElementById('pending-desc').textContent = accion.descripcion
  document.getElementById('pending-action').classList.remove('hidden')
}

function hidePendingAction() {
  document.getElementById('pending-action').classList.add('hidden')
  document.getElementById('pending-desc').textContent = ''
}

// ── CONTEXTO ─────────────────────────────────────────────────────────────────

function toggleContext() {
  contextActive = !contextActive
  document.getElementById('context-btn').classList.toggle('active', contextActive)
  document.getElementById('context-badge').classList.toggle('hidden', !contextActive)
}

function resetContext() {
  contextActive = false
  document.getElementById('context-btn').classList.remove('active')
  document.getElementById('context-badge').classList.add('hidden')
}

function buildContexto() {
  const session = getActiveSession()
  if (!session || session.messages.length === 0) return null
  return session.messages
    .map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
    .join('\n')
}

// ── ENVIAR MENSAJE ───────────────────────────────────────────────────────────

async function sendMessage(texto, confirmarAccion = null) {
  document.getElementById('message-input').value = ''
  setInputDisabled(true)
  hidePendingAction()

  if (!confirmarAccion) {
    addMessageToSession('user', texto)
    appendUserBubble(texto)
  }

  // Capturar y limpiar contexto ANTES del await
  const contextoEnviar = contextActive ? buildContexto() : null
  if (contextActive) resetContext()

  const typing = addTyping()

  try {
    const backendOk = await window.assistant.checkBackend()
    if (!backendOk) {
      typing.remove()
      const msg = '⚠️ El backend no está disponible. Abre NotionClon primero.'
      addMessageToSession('bot', msg)
      appendBotBubble(msg)
      return
    }

    const body = { Mensaje: texto }
    if (confirmarAccion) body.ConfirmarAccionPendiente = confirmarAccion
    if (contextoEnviar) body.ContextoConversacion = contextoEnviar

    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    })

    typing.remove()

    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      token = null
      showLogin()
      return
    }

    if (!res.ok) throw new Error(`Error ${res.status}`)

    const data = await res.json()
    const actions = (data.accionesEjecutadas || []).map(a => a.descripcion)

    addMessageToSession('bot', data.respuesta, actions)
    appendBotBubble(data.respuesta, actions)

    if (data.accionPendiente) {
      pendingAction = data.accionPendiente
      showPendingAction(data.accionPendiente)
    }

  } catch (err) {
    typing.remove()
    const msg = `Error de conexión: ${err.message}`
    addMessageToSession('bot', msg)
    appendBotBubble(msg)
  } finally {
    setInputDisabled(false)
    document.getElementById('message-input').focus()
  }
}

// ── SESSIONS PANEL UI ────────────────────────────────────────────────────────

function showSessions() {
  renderSessionsList()
  document.getElementById('sessions-panel').classList.remove('hidden')
}

function hideSessions() {
  document.getElementById('sessions-panel').classList.add('hidden')
}

// ── SCREENS ──────────────────────────────────────────────────────────────────

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden')
  document.getElementById('chat-screen').classList.add('hidden')
}

function showChat() {
  document.getElementById('login-screen').classList.add('hidden')
  document.getElementById('chat-screen').classList.remove('hidden')

  // Asegurar sesión activa
  const data = loadData()
  if (!data.activeId || !data.list.find(s => s.id === data.activeId)) {
    createSession()
  }

  renderMessages()
  updateSessionNameHeader()
  document.getElementById('message-input').focus()
}

// ── STATUS ───────────────────────────────────────────────────────────────────

function startStatusCheck() {
  async function check() {
    const ok = await window.assistant.checkBackend()
    const dot = document.getElementById('status-dot')
    dot.classList.toggle('online', ok)
    dot.classList.toggle('offline', !ok)
    dot.title = ok ? 'Backend online' : 'Backend offline'
  }
  check()
  setInterval(check, 5000)
}

// ── EVENT LISTENERS ──────────────────────────────────────────────────────────

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const loginBtn = document.getElementById('login-btn')
  const loginError = document.getElementById('login-error')

  loginBtn.disabled = true
  loginBtn.textContent = 'Entrando...'
  loginError.classList.add('hidden')

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Credenciales incorrectas')
    const data = await res.json()
    token = data.token
    localStorage.setItem(TOKEN_KEY, token)
    showChat()
  } catch (err) {
    loginError.textContent = err.message
    loginError.classList.remove('hidden')
  } finally {
    loginBtn.disabled = false
    loginBtn.textContent = 'Entrar'
  }
})

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY)
  token = null
  pendingAction = null
  resetContext()
  showLogin()
})

// Cerrar ventana
document.getElementById('close-btn').addEventListener('click', () => window.assistant.hideWindow())

// Chat form
document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = document.getElementById('message-input').value.trim()
  if (!text) return
  await sendMessage(text)
})

// Confirmación
document.getElementById('confirm-btn').addEventListener('click', async () => {
  if (!pendingAction) return
  const accion = pendingAction
  pendingAction = null
  hidePendingAction()
  await sendMessage('[confirmación]', accion)
})

document.getElementById('cancel-btn').addEventListener('click', () => {
  pendingAction = null
  hidePendingAction()
  const msg = 'Acción cancelada.'
  addMessageToSession('bot', msg)
  appendBotBubble(msg)
})

// Sessions
document.getElementById('sessions-btn').addEventListener('click', showSessions)
document.getElementById('close-sessions-btn').addEventListener('click', hideSessions)

document.getElementById('new-session-btn').addEventListener('click', () => {
  createSession()
  hideSessions()
  renderMessages()
  updateSessionNameHeader()
  resetContext()
})

// Contexto
document.getElementById('context-btn').addEventListener('click', toggleContext)
document.getElementById('remove-context-btn').addEventListener('click', resetContext)

// ── INIT ─────────────────────────────────────────────────────────────────────

async function init() {
  BACKEND_URL = await window.assistant.getBackendUrl()

  if (token) {
    await checkAndCleanup()
    showChat()
  } else {
    showLogin()
  }

  startStatusCheck()
}

init()
