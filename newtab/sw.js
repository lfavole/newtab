var VERSION = "dev";

self.addEventListener("install", evt => {
	async function init() {
		var keys = await caches.keys();
		for(var key, i = 0, l = keys.length; i < l; i++) {
			key = keys[i];
			if(key == VERSION || key == "pictures") continue;
			console.log(`Deleting cache ${key}`);
			caches.delete(key);
		}
		console.log(`Opening ${VERSION} cache`);
		await caches.open(VERSION);
		console.log("Opening pictures cache");
		await caches.open("pictures");
	}
	evt.waitUntil(init());
});

function isPictureResponse(response) {
	return response.url.match(/^https?:\/\/images.unsplash.com\//);
}

self.addEventListener("fetch", async evt => {
	async function fetchFromCache(request) {
		var ret = await caches.match(request);
		console.log(`Fetching ${request.url} from cache${ret ? "" : ", does not exist"}`);
		return ret;
	}
	async function getResponse(evt) {
		var request = evt.request;
		if(VERSION != "dev") {
			var cachedResponse = await fetchFromCache(request);
			if(cachedResponse) return cachedResponse;
		}
		try {
			var response = await fetch(request);

			var clonedResponse = response.clone();

			evt.waitUntil(
				caches.open(isPictureResponse(response) ? "pictures" : VERSION)
				.then(cache => {
					console.log(`Storing ${response.url}`);
					return cache.put(request, clonedResponse);
				})
				.catch(console.error)
			);

			return response;
		} catch(err) {
			if(VERSION == "dev") {
				var cachedResponse = await fetchFromCache(request);
				if(cachedResponse)
					return cachedResponse;
				else
					throw err;
			}
		}
	}
	evt.respondWith(getResponse(evt));
});
