import fs from 'fs';

const config = JSON.parse(fs.readFileSync('checks.config.json', 'utf-8'));

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

async function runCheck(check) {
  const start = Date.now();
  try {
    const headers = { ...(check.headers || {}) };
    if (check.authEnv) {
      headers['Authorization'] = process.env[check.authEnv] || '';
    }

    const options = { method: check.method || 'GET', headers };
    if (check.method === 'POST' && check.body) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(check.body);
    }

    const res = await fetch(check.url, options);
    const latency = Date.now() - start;
    let ok = res.status === (check.expectedStatus || 200);

    if (ok && check.expectedBodyField) {
      const json = await res.json().catch(() => ({}));
      ok = getPath(json, check.expectedBodyField) === check.expectedBodyValue;
    }

    return {
      name: check.name,
      status: ok ? 'operational' : 'degraded',
      httpStatus: res.status,
      latencyMs: latency,
      lastChecked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: check.name,
      status: 'down',
      error: err.message,
      lastChecked: new Date().toISOString(),
    };
  }
}

const results = await Promise.all(config.checks.map(runCheck));

const output = {
  updatedAt: new Date().toISOString(),
  services: results,
};

fs.writeFileSync('status.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));