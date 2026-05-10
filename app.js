const brandInput = document.getElementById('brandInput');
const brandTargets = document.querySelectorAll('[data-brand]');
const newsList = document.getElementById('newsList');
const year = document.getElementById('year');
const pwaStatus = document.getElementById('pwaStatus');

const fallbackUpdates = [
  'AEPS cash withdrawal window extended to 8:00 PM.',
  'Aadhaar demographic correction requests now available daily.',
  'New POP pension enrollment guidance desk active this week.',
  'Digital receipt download enabled for all utility transactions.'
];

const apiBaseUrl = (window.EMITRA_API_BASE_URL || '').trim().replace(/\/$/, '');

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

async function loadUpdates() {
  if (shouldUseFallback(apiBaseUrl)) {
    renderUpdates(fallbackUpdates);
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/updates`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length) {
      renderUpdates(data.map((item) => String(item)));
      return;
    }
  } catch (error) {
    console.warn('Could not load updates from backend:', error);
  }

  renderUpdates(fallbackUpdates);
}

year.textContent = new Date().getFullYear();
updateBrand(brandInput.value);
loadUpdates();

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
