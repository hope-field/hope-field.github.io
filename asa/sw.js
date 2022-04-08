const version = '5.13';

const cacheName = 'cache-' + version;

const resourcesToPreserve = [
    '/asa/',
    '/asa/index.html',
    '/asa/serial.js',
    '/asa/favicon.ico',        
    '/asa/img/icon-72.png',
    '/asa/img/icon-96.png',
    '/asa/img/icon-144.png',
    '/asa/img/icon-192.png',
    '/asa/img/icon-256.png',
    '/asa/img/icon-512.png',
    '/asa/img/white_36dp_check.svg',
    '/asa/img/white_36dp_play.svg',
    '/asa/img/white_36dp_stop.svg',
    '/asa/RobotoMono-Regular.ttf'
];

self.addEventListener('install', event => {    
    event.waitUntil(
        caches.open(cacheName)
            .then(cache => {
                return cache.addAll(resourcesToPreserve);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cn => {
                    return cn !== cacheName;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(cacheName)
            .then(cache => {
                return cache.match(event.request)
                    .then(response => {
                        const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    })
                return response || fetchPromise;
            })
        })        
    );      
});

self.addEventListener('message', event => {    
    if (event.data === 'version') {
        event.source.postMessage({msg: 'version', version: version });
    }    
});
