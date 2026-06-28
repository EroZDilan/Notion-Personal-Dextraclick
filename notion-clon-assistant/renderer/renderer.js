let BACKEND_URL = 'http://localhost:5162'
let token = localStorage.getItem('nc_token')
let pendingAction = null

// Elementos
const loginScreen = document.getElementById('login-screen')
const chatScreen = document.getElementById('chat-screen')
const loginForm = document.getElementById('login-form')
const loginBtn = document.getElementById('login-btn')
const loginError = document.getElementById('login-error')
const messages = document.getElementById('messages')
const chatForm = document.getElementById('chat-form')
const messageInput = document.getElementById('message-input')
const sendBtn = document.getElementById('send-btn')
const logoutBtn = document.getElementById('logout-btn')
const closeBtn = document.getElementById('close-btn')
const statusDot = document.getElementById('status-dot')
const pendingEl = document.getElementById('pending-action')
const pendingDesc = document.getElementById('pending-desc')
const confirmBtn = document.getElementById('confirm-btn')
const cancelBtn = document.getElementById('cancel-btn')

// Init
async function init() {
  BACKEND_URL = await window.assistant.getBackendUrl()
  if (token) {
    showChat()
  } else {
    showLogin()
  }
  startStatusCheck()
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  loginBtn.disabled = true
  loginBtn.textContent = 'Entrando...'
  loginError.classList.add('hidden')

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Credenciales incorrectas')
    }

    const data = await res.json()
    token = data.token
    localStorage.setItem('nc_token', token)
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
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('nc_token')
  token = null
  pendingAction = null
  messages.innerHTML = `<div class="msg bot"><div class="bubble">Hola! Soy tu asistente de NotionClon. Puedo crear páginas, editar bloques, buscar contenido y más. ¿En qué te ayudo?</div></div>`
  hidePendingAction()
  showLogin()
})

closeBtn.addEventListener('click', () => window.assistant.hideWindow())

// Chat
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = messageInput.value.trim()
  if (!text) return

  await sendMessage(text)
})

async function sendMessage(texto, confirmarAccion = null) {
  messageInput.value = ''
  setInputDisabled(true)

  if (!confirmarAccion) {
    addMessage('user', texto)
  }
  hidePendingAction()

  const typing = addTyping()

  try {
    const backendOk = await window.assistant.checkBackend()
    if (!backendOk) {
      removeTyping(typing)
      addMessage('bot', '⚠️ El backend de NotionClon no está disponible. Abre el software primero.')
      return
    }

    const body = { mensaje: texto }
    if (confirmarAccion) body.confirmarAccionPendiente = confirmarAccion

    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    removeTyping(typing)

    if (res.status === 401) {
      localStorage.removeItem('nc_token')
      token = null
      showLogin()
      return
    }

    if (!res.ok) throw new Error(`Error ${res.status}`)

    const data = await res.json()
    addBotMessage(data)

    if (data.accionPendiente) {
      pendingAction = data.accionPendiente
      showPendingAction(data.accionPendiente)
    }

  } catch (err) {
    removeTyping(typing)
    addMessage('bot', `Error de conexión: ${err.message}`)
  } finally {
    setInputDisabled(false)
    messageInput.focus()
  }
}

// Confirmación
confirmBtn.addEventListener('click', async () => {
  if (!pendingAction) return
  const accion = pendingAction
  pendingAction = null
  await sendMessage('[confirmación]', accion)
})

cancelBtn.addEventListener('click', () => {
  pendingAction = null
  hidePendingAction()
  addMessage('bot', 'Acción cancelada.')
})

// UI helpers
function showLogin() {
  loginScreen.classList.remove('hidden')
  chatScreen.classList.add('hidden')
}

function showChat() {
  loginScreen.classList.add('hidden')
  chatScreen.classList.remove('hidden')
  messageInput.focus()
}

function addMessage(role, text) {
  const div = document.createElement('div')
  div.className = `msg ${role}`
  div.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`
  messages.appendChild(div)
  scrollToBottom()
  return div
}

function addBotMessage(data) {
  const div = document.createElement('div')
  div.className = 'msg bot'
  let html = `<div class="bubble">${escapeHtml(data.respuesta)}`

  if (data.accionesEjecutadas && data.accionesEjecutadas.length > 0) {
    html += `<div class="actions-executed">`
    data.accionesEjecutadas.forEach(a => {
      html += `<span>✓ ${escapeHtml(a.descripcion)}</span>`
    })
    html += `</div>`
  }

  html += `</div>`
  div.innerHTML = html
  messages.appendChild(div)
  scrollToBottom()
}

function addTyping() {
  const div = document.createElement('div')
  div.className = 'msg bot typing'
  div.innerHTML = '<div class="bubble">Pensando...</div>'
  messages.appendChild(div)
  scrollToBottom()
  return div
}

function removeTyping(el) {
  el?.remove()
}

function showPendingAction(accion) {
  pendingDesc.textContent = accion.descripcion
  pendingEl.classList.remove('hidden')
}

function hidePendingAction() {
  pendingEl.classList.add('hidden')
  pendingDesc.textContent = ''
}

function setInputDisabled(disabled) {
  messageInput.disabled = disabled
  sendBtn.disabled = disabled
}

function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

// Status check
function startStatusCheck() {
  async function check() {
    const ok = await window.assistant.checkBackend()
    statusDot.classList.toggle('online', ok)
    statusDot.classList.toggle('offline', !ok)
    statusDot.title = ok ? 'Backend online' : 'Backend offline'
  }
  check()
  setInterval(check, 5000)
}

init()
