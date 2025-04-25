// Store the last visited URL
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to get the response from the network
          const response = await fetch(event.request);
          
          // If successful, store the URL
          if (response.ok) {
            try {
              await self.registration.index.add({
                id: 'lastUrl',
                url: event.request.url,
                timestamp: new Date().getTime(),
              });
            } catch (error) {
              // If indexing fails, use localStorage as fallback
              localStorage.setItem('pwa_last_url', event.request.url);
            }
          }
          
          return response;
        } catch (error) {
          // If offline, try to get the last known URL
          let lastUrl;
          try {
            const index = await self.registration.index.getAll();
            lastUrl = index.find(entry => entry.id === 'lastUrl')?.url;
          } catch (error) {
            // Fallback to localStorage
            lastUrl = localStorage.getItem('pwa_last_url');
          }
          
          if (lastUrl) {
            return Response.redirect(lastUrl);
          }
          
          // If no last URL is found, return the offline page
          const cache = await caches.open('offlineCache');
          return cache.match('/offline') || Response.redirect('/');
        }
      })()
    );
  }
}); 