function getRandomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

/**
 * A class that can fetch items from multiple platforms.
 * The class must be extended and the fetch method must be implemented.
 */
class Gettable {
    constructor() {
        if(this.constructor == Gettable)
            throw Error("Gettable class must be extended.");
    }
    /**
     * Returns the platforms to use to fetch items.
     */
    static get platforms() {
        return [];
    }
    /**
     * Returns the platform to use as a fallback if no item can be fetched.
     * This platform must return a response immediately.
     * If null, no fallback item is displayed.
     * By default, it is null.
     */
    static get fallbackPlatform() {
        return null;
    }
    /**
     * Returns the key to use in the local storage.
     * This key should be unique to the class.
     * By default, it is the class name.
     */
    static get key() {
        return this.name.toLowerCase() + "s";
    }
    /**
     * Returns the array representation of the item to store in the local storage.
     */
    getArray() {
        throw Error("getArray method not implemented.");
    }
    /**
     * Instantiates an item from an array.
     */
    static fromArray(array) {
        return new this(...array);
    }
    static async update(step = 1) {
        // get the next items for each platform
        var nextItems = (
            await Promise.all(this.platforms.map(async platform => {
                return await this.get(platform, await this.getIndex(platform) + step, false);
            }))
        ).filter(item => item);

        if(nextItems.length) {
            // take one of the next items and display it
            var item = getRandomItem(nextItems);
            await item.display();
            this.setIndex(item.platform, await this.getIndex(item.platform) + step);
            return;
        }

        // display a random item from one platform while the real item is loading
        var lastItems = (
            await Promise.all(this.platforms.map(async platform => {
                return await this.get(platform, -1, false);
            }))
        ).filter(item => item);

        if(lastItems.length)
            await getRandomItem(lastItems).display();
        else if(this.fallbackPlatform)
            await (await this.fetchOne(this.fallbackPlatform)).display();

        // try all providers to get one item, stop when one item is fetched
        var items = (
            await Promise.all(this.platforms.map(platform => this.fetchOne(platform)))
        ).filter(item => item);
        if(items.length) {
            await getRandomItem(items).display();
            return;
        }

        // display the first item of one provider if no item was fetched
        var firstItems = this.platforms.map(async platform => {
            return await this.get(platform, 0, false);
        }).filter(item => item);
        if(firstItems.length)
            await getRandomItem(firstItems).display();
    }
    /**
     * Fetches a list of items for a platform.
     */
    static async fetch(platform) {
        throw Error("fetch method not implemented.");
    }
    /***
     * Fetches a list of items for a platform, adding them to the local storage if relevant.
     * Returns the first item.
     */
    static async fetchOne(platform) {
        var items = await this.fetch(platform);
        items.forEach(item => item.add());
        return items[0];
    }
    /**
     * Returns the index of the current item for a platform.
     */
    static async getIndex(platform) {
        return +(localStorage.getItem(`${this.key}Index--${platform}`) || 0);
    }
    static async setIndex(platform, index) {
        var items = this.getList(platform);
        localStorage.setItem(`${this.key}Index--${platform}`, (index >= 0 ? index : items.length + index) % items.length);
    }
    /**
     * Adds the current item to the list corresponding to its platform.
     */
    add() {
        var items = this.constructor.getList(this.platform);
        items.push(this.getArray());
        localStorage.setItem(`${this.key}List--${this.platform}`, JSON.stringify(items));
    }
    /**
     * Returns the previously fetched items for a platform.
     */
    static getList(platform) {
        var items = localStorage.getItem(`${this.key}List--${platform}`);
        if(!items) return [];
        try {
            var data = JSON.parse(items);
        } catch(err) {
            return [];
        }
        return data.map(item => this.fromArray(item));
    }
    /**
     * Returns the item corresponding to the index for a platform, downloading it if specified.
     * If download is false, returns null if the item is not in the list.
     */
    static async get(platform, index, download = true) {
        var items = this.getList(platform);

        // If the index is null, return a random item
        if(index == null && items.length)
            return items[Math.floor(Math.random() * items.length)];

        // If the index is out of bounds or the list is empty, download an item
        if(index >= items.length || !items.length)
            if(download)
                return await this.fetchOne(platform);
            else
                return null;

        // Otherwise, return the item corresponding to the index
        try {
            return items[(index >= 0 ? index : items.length + index) % items.length];
        } catch(err) {}
    }
    /**
     * Displays the current item.
     */
    async display() {
        throw Error("display method not implemented.");
    }
    /**
     * Returns whether we should display the next item or not.
     */
    static get paused() {
        return !!+localStorage.getItem(`${this.key}Paused`);
    }
    /**
     * Pauses or unpauses the display of items.
     */
    static setPaused(paused = null) {
        if(paused == null)
            paused = !this.paused;
        localStorage.setItem(`${this.key}Paused`, +paused);
    }
    /**
     * Display the first item, advancing the list if we are not paused.
     */
    static async updateInitial() {
        await this.update(this.paused ? 0 : 1);
    }
}
