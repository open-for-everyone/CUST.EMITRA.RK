const brandInput = document.getElementById('brandInput');
const brandTargets = document.querySelectorAll('[data-brand]');
const newsList = document.getElementById('newsList');
const year = document.getElementById('year');

const updates = [
  'AEPS cash withdrawal window extended to 8:00 PM.',
  'Aadhaar demographic correction requests now available daily.',
  'New POP pension enrollment guidance desk active this week.',
  'Digital receipt download enabled for all utility transactions.'
];

function updateBrand(name) {
  const value = (name || '').trim() || 'RK';
  brandTargets.forEach((node) => {
    node.textContent = value;
  });
}

updates.forEach((item) => {
  const li = document.createElement('li');
  li.textContent = item;
  newsList.appendChild(li);
});

year.textContent = new Date().getFullYear();
updateBrand(brandInput.value);

brandInput.addEventListener('input', (event) => {
  updateBrand(event.target.value);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Silently fail: service workers are a progressive enhancement for supported environments.
    });
  });
}
