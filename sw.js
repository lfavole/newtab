var VERSION = "dev";

self.addEventListener("install", evt => {
	async function init() {
		await caches.open(VERSION);
		await caches.open("pictures");
	}
	evt.waitUntil(init());
});

function isPictureResponse(response) {
	return response.url.match(/^https?:\/\/images.unsplash.com\//);
}

self.addEventListener("fetch", async evt => {
	async function getResponse(evt) {
		try {
			var response = await fetch(evt.request);

			if(VERSION == "dev" && response.url.startsWith(registration.scope) || response.url.match(/\bapi\b/)) {
				// don't cache assets during development
				// or API requests
			} else {
				console.log(`Storing ${response.url}`);
				var cache = await caches.open(isPictureResponse(response) ? "pictures" : VERSION);
				await cache.put(response.clone());
			}

			return response;
		} catch(err) {
			return caches.match(evt.request);
		}
	}
	evt.respondWith(await getResponse(evt));
});
