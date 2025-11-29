function getRandomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

/**
 * A class that can fetch items from multiple platforms.
 * The class must be extended and the fetch method must be implemented.
 * It must have a platform attribute.
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
     * Returns the platforms that are automatic, e.g. that don't need to be stored.
     */
    static get automaticPlatforms() {
        return [];
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
     * Go ahead/behind from a given step, downloading and displaying the new item if necessary.
     */
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
            var randomItem = await getRandomItem(items);
            this.setIndex(randomItem.platform, await this.getIndex(randomItem.platform) + step);
            randomItem.display();
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
        for (var item of items)
            await item.add();
        return items[0];
    }
    /**
     * Returns the index of the current item for a platform.
     */
    static async getIndex(platform) {
        return +((await browser.storage.local.get())?.[`${this.key}Index--${platform}`] || localStorage.getItem(`${this.key}Index--${platform}`) || 0);
    }
    static async setIndex(platform, index) {
        var items = await this.getList(platform);
        if(!items.length) return;
        await browser.storage.local.set({[`${this.key}Index--${platform}`]: (index >= 0 ? index : items.length + index) % items.length});
    }
    /**
     * Adds the current item to the list corresponding to its platform.
     */
    async add() {
        if(this.constructor.automaticPlatforms.includes(this.platform)) return;
        var items = await this.constructor.getList(this.platform);
        items.push(this);
        await browser.storage.local.set({[`${this.constructor.key}List--${this.platform}`]: JSON.stringify(items)});
    }
    /**
     * Returns the previously fetched items for a platform.
     */
    static async getList(platform) {
        var items = (await browser.storage.local.get())?.[`${this.key}List--${platform}`] || localStorage.getItem(`${this.key}List--${platform}`);
        if(!items) return [];
        try {
            var data = JSON.parse(items);
        } catch(err) {
            return [];
        }
        return data.map(item => new this(item));
    }
    /**
     * Returns the item corresponding to the index for a platform, downloading it if specified.
     * If download is false and the item is not in the list, do not attempt to download it and return null.
     */
    static async get(platform, index, download = true) {
        var items = await this.getList(platform);

        // If the index is null, return a random item
        if(index == null && items.length)
            return getRandomItem(items);

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
     * Returns whether we should automatically display the next item or not.
     */
    static async getPaused() {
        return !!+((await browser.storage.local.get())?.[`${this.key}Paused`] ?? localStorage.getItem(`${this.key}Paused`));
    }
    /**
     * Pauses or unpauses the display of items.
     */
    static async setPaused(paused = null) {
        if(paused == null)
            paused = !(await this.getPaused());
        await browser.storage.local.set({[`${this.key}Paused`]: +paused});
        await this.updatePause();
    }
    /**
     * Display the first item, advancing the list if we are not paused.
     * Otherwise, when does the list advance?
     * If it's the first run (there are no items), always display the first item,
     * otherwise we never see it.
     */
    static async updateInitial() {
        var areThereItems = false;
        for (var platform of this.platforms) {
            if ((await this.getList(platform)).length) {
                areThereItems = true;
                break;
            }
        }
        await this.update(await this.getPaused() || !areThereItems ? 0 : 1);
    }
    /**
     * Update the contents of the pause button.
     */
    static async updatePause() {
        var paused = await this.getPaused();
        this.pauseButton.value = paused ? "▶" : "⏸︎";

        // don't recreate the interval if it's not needed
        // (it's already there and playing, or it's not there and paused)
        if (this.nextIntv && !paused || !this.nextIntv && paused) return;

        var counterMax = 60000;
        var counter = counterMax;

        this.nextIntv = setInterval(async () => {
            if(!(await this.getPaused())) {
                counter -= 500;
                this.progressBar.style.setProperty("--width", (counter / counterMax) * 100 + "%");
                if(counter == 0) {
                    counter = counterMax;
                    this.update();
                }
            } else {
                clearInterval(this.nextIntv);
                counter = counterMax;
                this.progressBar.style.setProperty("--width", "100%");
            }
        }, 500);
    }
    /**
     * Add HTML controls in the specified container to control these elements.
     */
    static async addControls(controlsContainer) {
        function createButton(text) {
            var button = document.createElement("input");
            button.type = "button";
            button.value = text;
            controlsContainer.appendChild(button);
            return button;
        }

        var left = createButton("←");
        var pause = createButton("⏸︎");
        var right = createButton("→");

        var progressBar = document.createElement("div");
        progressBar.className = "progress-bar";
        controlsContainer.appendChild(progressBar);
        this.progressBar = progressBar;

        this.pauseButton = pause;
        this.nextIntv = null;

        left.addEventListener("click", async () => await this.update(-1));
        right.addEventListener("click", async () => await this.update(1));
        pause.addEventListener("click", async () => await this.setPaused());
        await this.updatePause();
    }
}
