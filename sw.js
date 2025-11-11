const CACHE_NAME = 'gate-control-cache-v5'; // Versão incrementada para forçar a atualização
const APP_SHELL_FALLBACK = '/index.html';

// Lista de arquivos essenciais da "casca" do aplicativo.
// Estes são os arquivos mínimos necessários para a aplicação carregar.
const urlsToCache = [
    '/',
    APP_SHELL_FALLBACK,
    '/vite.svg',
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/hooks/useVehicleLog.ts',
    '/services/offlineStorageService.ts',
    // Adicionando os componentes mais críticos para a UI inicial
    '/components/MovementModal.tsx',
    '/components/RegistrationModal.tsx',
    '/components/HistoryView.tsx',
    '/components/HistoryCard.tsx',
    '/components/ConfirmationModal.tsx',
    '/components/DriverModal.tsx',
    // Adicionando ícones usados na tela principal
    '/components/icons/PlusIcon.tsx',
    '/components/icons/ArrowDownTrayIcon.tsx',
    '/components/icons/ArrowUpTrayIcon.tsx',
    '/components/icons/UsersIcon.tsx',
    '/components/icons/ArrowLeftOnRectangleIcon.tsx',
    '/components/icons/ArrowRightOnRectangleIcon.tsx',
    '/components/icons/MagnifyingGlassIcon.tsx',
    '/components/icons/TrashIcon.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service Worker: Failed to cache app shell:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET e não sejam para recursos web (http/https)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se o recurso já estiver no cache, retorna ele imediatamente.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se não estiver no cache, busca na rede.
        return fetch(event.request).then(
          (networkResponse) => {
            // Se a resposta da rede for válida, clona, armazena no cache e retorna.
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(() => {
            // **A MUDANÇA CRÍTICA:** Se a rede falhar, verifica se é uma navegação de página.
            // Se for, retorna o index.html do cache (o "app shell").
            if (event.request.mode === 'navigate') {
                console.log('Fetch failed, returning offline fallback page.');
                return caches.match(APP_SHELL_FALLBACK);
            }
            // Para outros tipos de requisição que falharem (ex: imagens não cacheadas, API),
            // a falha é simplesmente propagada, o que é o comportamento esperado.
        });
      })
  );
});
