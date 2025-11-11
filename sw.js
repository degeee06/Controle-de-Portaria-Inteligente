const CACHE_NAME = 'gate-control-cache-v3'; // Bump version
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
    // Add external CDN dependencies to the cache
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0',
    'https://aistudiocdn.com/@google/genai@^1.27.0'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Use addAll with a request object to handle potential redirect issues with CDNs
        const requests = urlsToCache.map(url => new Request(url, { mode: 'no-cors' }));
        return cache.addAll(requests);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service Worker: Failed to cache urls:', err);
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
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then(
            (networkResponse) => {
              // We only cache successful responses
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            }
          ).catch(error => {
            console.error('Service Worker: fetch failed with error:', error);
            // On fetch error, you might want to return a fallback page if you have one
            // for now, we just let the error propagate
            throw error;
          });

          // Return cached response immediately if available, and update cache in background
          return cachedResponse || fetchPromise;
        });
    })
  );
});