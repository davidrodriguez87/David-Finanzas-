// ⚠️ IMPORTANTE: cada vez que subas una actualización de tu código
// (index.html, style.css o app.js), sube también este archivo y
// cambia el número de versión de aquí abajo (por ejemplo v1 -> v2).
// Eso es lo que le avisa al teléfono que hay una versión nueva.
const CACHE_VERSION = 'david-finanzas-v1';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
];

// Al instalar: guarda una copia de los archivos principales de la app
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Al activar: borra versiones anteriores guardadas en el teléfono
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Al pedir un archivo: intenta primero por internet (para traer lo más nuevo),
// y si no hay conexión, usa la copia guardada para que la app siga abriendo.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
