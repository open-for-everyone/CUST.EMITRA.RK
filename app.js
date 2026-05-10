const brandInput = document.getElementById('brandInput');
const brandTargets = document.querySelectorAll('[data-brand]');
const newsList = document.getElementById('newsList');
const year = document.getElementById('year');
const pwaStatus = document.getElementById('pwaStatus');
const authStatus = document.getElementById('authStatus');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const logoutButton = document.getElementById('logoutButton');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const activityList = document.getElementById('activityList');

const fallbackUpdates = [
  'AEPS cash withdrawal window extended to 8:00 PM.',
  'Aadhaar demographic correction requests now available daily.',
  'New POP pension enrollment guidance desk active this week.',
  'Digital receipt download enabled for all utility transactions.',
  'Secure login and AI chatbot support are now available.'
];

const apiBaseUrl = (window.EMITRA_API_BASE_URL || '').trim().replace(/\/$/, '');
const authStorageKey = 'emitra.auth.token';

const state = {
  token: localStorage.getItem(authStorageKey) || '',
  user: null
};

function updateBrand(name) {
  const value = (name || '').trim() || 'RK';
  brandTargets.forEach((node) => {
    node.textContent = value;
  });
}

function renderUpdates(items) {
  newsList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    newsList.appendChild(li);
  });
}

function renderChatLine(label, text) {
  const p = document.createElement('p');
  p.className = 'chat-line';
  const strong = document.createElement('strong');
  strong.textContent = `${label}:`;
  p.appendChild(strong);
  p.append(` ${text}`);
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setAuthStatus(message, isOk = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle('ok', isOk);
}

function setToken(token) {
  state.token = token;
  if (token) {
    localStorage.setItem(authStorageKey, token);
  } else {
    localStorage.removeItem(authStorageKey);
  }
}

function shouldUseFallback(baseUrl) {
  if (!baseUrl) {
    return true;
  }

  try {
    const parsedUrl = new URL(baseUrl);
    return parsedUrl.hostname === 'your-render-service.onrender.com';
  } catch {
    return true;
  }
}

async function apiRequest(path, options = {}) {
  if (shouldUseFallback(apiBaseUrl)) {
    throw new Error('Backend API URL not configured.');
  }

  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

async function loadUpdates() {
  if (shouldUseFallback(apiBaseUrl)) {
    renderUpdates(fallbackUpdates);
    return;
  }

  try {
    const data = await apiRequest('/api/updates');
    if (Array.isArray(data) && data.length) {
      renderUpdates(data.map((item) => String(item)));
      return;
    }
  } catch (error) {
    console.warn('Could not load updates from backend:', error);
  }

  renderUpdates(fallbackUpdates);
}

async function refreshProfile() {
  if (!state.token) {
    state.user = null;
    setAuthStatus('Not logged in.');
    logoutButton.hidden = true;
    return;
  }

  try {
    const profile = await apiRequest('/api/auth/me');
    state.user = profile;
    setAuthStatus(`Logged in as ${profile.name}`, true);
    logoutButton.hidden = false;
    await Promise.all([loadActivity(), loadChatHistory()]);
  } catch (error) {
    console.warn('Profile refresh failed:', error);
    setToken('');
    state.user = null;
    setAuthStatus('Session expired. Please login again.');
    logoutButton.hidden = true;
  }
}

async function loadActivity() {
  activityList.innerHTML = '';

  if (!state.token) {
    const li = document.createElement('li');
    li.textContent = 'Login to view your activity logs.';
    activityList.appendChild(li);
    return;
  }

  try {
    const items = await apiRequest('/api/activity');
    if (!Array.isArray(items) || !items.length) {
      const li = document.createElement('li');
      li.textContent = 'No activity yet.';
      activityList.appendChild(li);
      return;
    }

    items.forEach((item) => {
      const li = document.createElement('li');
      const time = new Date(item.createdAtUtc).toLocaleString();
      li.textContent = `${item.action.toUpperCase()} • ${item.metadata || '-'} • ${time}`;
      activityList.appendChild(li);
    });
  } catch (error) {
    const li = document.createElement('li');
    li.textContent = `Could not load activity: ${error.message}`;
    activityList.appendChild(li);
  }
}

async function loadChatHistory() {
  chatMessages.innerHTML = '';

  if (!state.token) {
    renderChatLine('System', 'Please login to use the chatbot.');
    return;
  }

  try {
    const history = await apiRequest('/api/chat/history');
    const items = Array.isArray(history) ? [...history].reverse() : [];
    if (!items.length) {
      renderChatLine('System', 'Start a conversation with the assistant.');
      return;
    }

    items.forEach((item) => {
      renderChatLine('You', item.message);
      renderChatLine('Assistant', item.reply);
    });
  } catch (error) {
    renderChatLine('System', `Could not load chat history: ${error.message}`);
  }
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: document.getElementById('signupName').value,
    email: document.getElementById('signupEmail').value,
    password: document.getElementById('signupPassword').value
  };

  try {
    const result = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setToken(result.token);
    setAuthStatus(`Welcome ${result.name}! Account created.`, true);
    await refreshProfile();
    signupForm.reset();
  } catch (error) {
    setAuthStatus(`Signup failed: ${error.message}`);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  };

  try {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setToken(result.token);
    setAuthStatus(`Welcome back ${result.name}!`, true);
    await refreshProfile();
    loginForm.reset();
  } catch (error) {
    setAuthStatus(`Login failed: ${error.message}`);
  }
});

logoutButton.addEventListener('click', async () => {
  setToken('');
  state.user = null;
  setAuthStatus('Logged out.');
  logoutButton.hidden = true;
  await Promise.all([loadActivity(), loadChatHistory()]);
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.token) {
    renderChatLine('System', 'Please login first.');
    return;
  }

  const message = chatInput.value.trim();
  if (!message) {
    return;
  }

  renderChatLine('You', message);
  chatInput.value = '';

  try {
    const result = await apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    renderChatLine('Assistant', result.reply);
    await loadActivity();
  } catch (error) {
    renderChatLine('System', `Chat failed: ${error.message}`);
  }
});

year.textContent = new Date().getFullYear();
updateBrand(brandInput.value);
loadUpdates();
loadActivity();
refreshProfile();

brandInput.addEventListener('input', (event) => {
  updateBrand(event.target.value);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
      pwaStatus.hidden = false;
      pwaStatus.textContent = 'Offline install features are currently unavailable on this device/browser.';
    });
  });
}
