const CACHE_NAME = 'gate-control-cache-v2'; // Bump version
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
    'https://cdn.tailwindcss.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
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
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || !networkResponse.ok) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error('Service Worker: fetch failed with error:', error);
        });
      })
  );
});