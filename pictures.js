modules.pictures = function() {
    var pictureContainer = document.createElement("div");
    pictureContainer.className = "photo";
    document.querySelector("main").appendChild(pictureContainer);

    var creditsContainer = document.createElement("div");
    creditsContainer.className = "photo-credits";
    document.querySelector("main").appendChild(creditsContainer);

    function deleteImageMetadata() {
        document.body.style.backgroundImage = null;
        pictureContainer.src = null;
        pictureContainer.style.backgroundImage = null;
        pictureContainer.classList.remove("loaded");
        creditsContainer.innerHTML = "";
    }

    function getHexPart() {
        return ("00" + Math.floor(Math.random() * 256).toString(16)).slice(-2)
    }
    function square(x) {
        return x * x;
    }
    function isColorDark(color) {
        // https://alienryderflex.com/hsp.html
        return Math.sqrt(
            0.299 * square(parseInt(color.substring(1, 3), 16))
            + 0.587 * square(parseInt(color.substring(3, 5), 16))
            + 0.114 * square(parseInt(color.substring(5, 7), 16))
        ) < 127.5;
    }

    var platforms = ["unsplash"];

    function Picture(url, pageURL, userLink, username, platform, blurhash) {
        if(!(this instanceof Picture))
            throw Error("Picture objects must be instantiated with the 'new' operator.");
        this.url = url;
        this.pageURL = pageURL;
        this.userLink = userLink;
        this.username = username;
        this.platform = platform;
        this.blurhash = blurhash;
    }
    Picture.prototype.getArray = function() {
        return [
            this.url || "",
            this.pageURL || "",
            this.userLink || "",
            this.username || "",
            this.platform || "",
            this.blurhash || "",
        ];
    };
    Picture.fromArray = function(array) {
        return new Picture(
            array[0] || "",
            array[1] || "",
            array[2] || "",
            array[3] || "",
            array[4] || "",
            array[5] || "",
            array[6] || "",
        );
    };
    Picture.update = async function() {
        // get the next pictures (the next API result) for each provider
        var nextPictures = [];
        for(var pictureIndex, picture, i = 0, l = platforms.length; i < l; i++) {
            pictureIndex = Picture.getIndex(platforms[i]);
            picture = await Picture.get(platforms[i], pictureIndex, false);
            if(picture)
                nextPictures.push(picture);
        }

        var picture;
        var random = false;
        if(nextPictures.length) {
            // take one of the next pictures
            picture = nextPictures[Math.floor(Math.random() * nextPictures.length)];
        } else {
            // try all providers to get one picture
            for(var i = 0, l = platforms.length; i < l; i++) {
                try {
                    picture = await Picture.fetch(platforms[i]);
                    if(picture) break;
                } catch(err) {}
            }
            if(!picture) {
                // get a random image from one platform
                random = true;
                var lastPictures = [];
                for(var pictureIndex, picture, i = 0, l = platforms.length; i < l; i++) {
                    picture = await Picture.get(platforms[i], -1, false);
                    if(picture)
                        lastPictures.push(picture);
                }
                if(lastPictures.length)
                    picture = lastPictures[Math.floor(Math.random() * lastPictures.length)];
                else
                    picture = await Picture.fetch("gradient");
            }
        }
        await picture.display(random);
    };

    Picture.fetch = async function(platform) {
        if(platform == "gradient") {
            var color1 = "#" + getHexPart() + getHexPart() + getHexPart();
            var color2 = "#" + getHexPart() + getHexPart() + getHexPart();
            var angle = Math.floor(Math.random() * 360);
            return new Picture(`linear-gradient(${angle}deg, ${color1}, ${color2})`, "", "", "", "gradient");
        }
        if(platform == "unsplash") {
            var clientID = localStorage.getItem("unsplashClientID");
            if(!clientID) return;
            try {
                var resp = await fetch(
                    "https://api.unsplash.com/photos/random?count=10",
                    {
                        "headers": {
                            "Authorization": "Client-ID " + clientID,
                        },
                    },
                )
                var data = await resp.json();
                var firstPicture;
                for(var item, i = 0, l = data.length; i < l; i++) {
                    item = data[i];
                    var picture = new Picture(
                        item.urls.raw,
                        item.links.html,
                        item.user.links.html,
                        item.user.name,
                        "unsplash",
                        item.blur_hash,
                    )
                    picture.add();
                    if(!firstPicture)
                        firstPicture = picture;

                    fetch(picture.getCompressedURL())
                    .catch(err => console.error("Couldn't prefetch picture:", err))
                }
                return firstPicture;
            } catch(err) {
                console.error("Couldn't fetch picture list:", err);
            }
            return;
        }
    };
    Picture.getIndex = function(platform) {
        if(platform == "gradient") return 0;
        return +(localStorage.getItem("picturesIndex--" + (platform || "other")) || 0);
    };

    Picture.prototype.next = function() {
        if(this.platform == "gradient") return;
        var platform = this.platform || "other";
        var pictureIndex = +(localStorage.getItem("picturesIndex--" + platform) || 0);
        localStorage.setItem("picturesIndex--" + this.platform, pictureIndex + 1);
    };
    Picture.prototype.add = function() {
        var pictures = localStorage.getItem("picturesList--" + (this.platform || "other"));
        if(pictures) {
            try {
                pictures = JSON.parse(pictures);
            } catch(err) {}
        }
        pictures = pictures || [];
        pictures.push(this.getArray());
        localStorage.setItem("picturesList--" + (this.platform || "other"), JSON.stringify(pictures));
    };
    Picture.get = async function(platform, index, download = true) {
        var pictures = localStorage.getItem("picturesList--" + (platform || "other"));
        if(!pictures) return;
        try {
            pictures = JSON.parse(pictures);
        } catch(err) {
            return;
        }
        if(index == null) return pictures[Math.floor(Math.random() * pictures.length)];
        if(pictures.length >= index) {
            if(download) return await Picture.fetch(platform);
        }
        try {
            return Picture.fromArray(pictures[index >= 0 ? index : pictures.length + index]);
        } catch(err) {}
    };

    Picture.prototype.getCompressedURL = function() {
        return (
            this.url
            + `${this.url.includes("?") ? "&" : "?"}w=${screen.width}&h=${screen.height}&fit=crop&auto=compress,format`
        );
    };
    Picture.prototype.display = async function(random = false) {
        deleteImageMetadata();
        creditsContainer.innerHTML = this.getCredits();

        if(this.platform == "gradient") {
            pictureContainer.style.backgroundImage = this.url;
            pictureContainer.classList.add("loaded");
            var match = /linear-gradient\(\d+deg, (#[\da-f]{6}), (#[\da-f]{6})\)/.exec(this.url);
            if(match) {
                if(!isColorDark(match[1]) && !isColorDark(match[2]))
                    document.body.style.color = "black";
                else
                    document.body.style.color = "white";
            }
            return;
        }

        var blurhashCallback;
        if(this.blurhash) {
            var color = getMainColor(this.blurhash);
            if(isColorDark(color))
                document.body.style.color = "white";
            else
                document.body.style.color = "black";

            // don't render a wrong blurhash
            try {
                blurhashCallback = function() {
                    document.body.style.backgroundImage = `url(${blurhashToURL(this.blurhash, innerWidth, innerHeight)})`;
                };
                blurhashCallback();
                window.addEventListener("resize", blurhashCallback);
            } catch(err) {}
        }

        var resp = await fetch(this.getCompressedURL());
        var blob = await resp.blob();
        var url = URL.createObjectURL(blob);
        pictureContainer.style.backgroundImage = `url(${url})`;
        pictureContainer.classList.add("loaded");
        if(blurhashCallback)
            window.removeEventListener("resize", blurhashCallback);

        if(!random) this.next();
    };
    Picture.prototype.getCredits = function() {
        if(this.platform == "gradient") return "Dégradé aléatoire";

        var urlRemainder = "?utm_source=lfnewtab&utm_medium=referral";

        var platformURL = {
            "unsplash": "https://unsplash.com/"
        }[this.platform] || this.platform;
        var platformName = {
            "unsplash": "Unsplash",
        }[this.platform] || this.platform;

        if(!this.pageURL && !this.username && !this.platformURL) return "";

        return (
            (this.pageURL ? `<a href="${this.pageURL}${urlRemainder}" target="_blank">Photo</a> ` : "Photo ")
            + (
                this.username
                ? (
                    this.userLink
                    ? `par <a href="${this.userLink}${urlRemainder}" target="_blank">${this.username}</a> `
                    : `par ${this.username} `
                )
                : ""
            )
            + `sur <a href="${platformURL}${urlRemainder}" target="_blank">${platformName}</a>`
        );
    };

    setTimeout(async () => {
        (await Picture.fetch("gradient")).display();
        await Picture.update();
    }, 0);

    creditsContainer.addEventListener("dblclick", function() {
        var clientID = localStorage.getItem("unsplashClientID") || "";
        clientID = prompt("ID client Unsplash :", clientID);
        if(clientID == null) return;
        clientID = (clientID || "").trim();
        localStorage.setItem("unsplashClientID", clientID);
        if(clientID)
            Picture.update();
        else
            updateBackgroundGradient();
    });
};