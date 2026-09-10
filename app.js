async function loadStatus() {
  const res = await fetch('status.json', { cache: 'no-store' });
  const data = await res.json();

  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  data.services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${service.name}</h3>
      <span class="badge ${service.status}">${service.status}</span>
      <div class="meta">
        HTTP: ${service.httpStatus ?? 'n/a'}<br>
        Latency: ${service.latencyMs ?? 'n/a'} ms<br>
        Last checked: ${new Date(service.lastChecked).toLocaleString()}
      </div>
    `;
    grid.appendChild(card);
  });

  document.getElementById('updated').textContent =
    'Last updated: ' + new Date(data.updatedAt).toLocaleString();
}

loadStatus();
setInterval(loadStatus, 60000);