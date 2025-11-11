const CACHE_NAME = 'gate-control-cache-v4'; // Versão incrementada para forçar a atualização
// Apenas os arquivos locais essenciais são pré-cacheados.
// Dependências de CDN serão cacheadas dinamicamente pelo evento 'fetch'.
const urlsToCache = [
    '/',
    '/index.html',
    '/vite.svg',
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/hooks/useVehicleLog.ts',
    '/services/geminiService.ts',
    '/services/offlineStorageService.ts',
    '/components/MovementModal.tsx',
    '/components/RegistrationModal.tsx',
    '/components/ReportModal.tsx',
    '/components/HistoryView.tsx',
    '/components/HistoryCard.tsx',
    '/components/ConfirmationModal.tsx',
    '/components/DriverModal.tsx',
    '/components/icons/CarIcon.tsx',
    '/components/icons/PlusIcon.tsx',
    '/components/icons/ArrowRightOnRectangleIcon.tsx',
    '/components/icons/ArrowLeftOnRectangleIcon.tsx',
    '/components/icons/DocumentTextIcon.tsx',
    '/components/icons/XMarkIcon.tsx',
    '/components/icons/ArrowUturnLeftIcon.tsx',
    '/components/icons/ArrowDownTrayIcon.tsx',
    '/components/icons/ArrowUpTrayIcon.tsx',
    '/components/icons/TrashIcon.tsx',
    '/components/icons/ExclamationTriangleIcon.tsx',
    '/components/icons/DocumentArrowDownIcon.tsx',
    '/components/icons/MagnifyingGlassIcon.tsx',
    '/components/icons/UsersIcon.tsx',
    '/components/icons/UserPlusIcon.tsx',
    '/components/icons/CheckCircleIcon.tsx',
    '/components/ArrivalModal.tsx',
    '/components/ManualLogModal.tsx',
    '/components/VehicleCard.tsx',
    '/components/LogModal.tsx',
    '/components/icons/ClipboardDocumentCheckIcon.tsx',
    '/components/icons/UserIcon.tsx',
    '/services/supabaseService.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Apenas os arquivos locais são cacheados, tornando a instalação mais robusta.
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
        ).catch(error => {
          // Em caso de falha na rede (offline), o erro será propagado
          // e o navegador mostrará a página de erro padrão.
          console.error('Service Worker: fetch failed with error:', error);
          throw error;
        });
      })
  );
});