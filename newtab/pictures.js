modules.pictures = async function() {
    var pictureContainer = document.createElement("div");
    pictureContainer.className = "photo";
    document.querySelector("main").appendChild(pictureContainer);

    var creditsContainer = document.createElement("div");
    creditsContainer.className = "photo-credits";
    document.querySelector("main").appendChild(creditsContainer);

    var controlsContainer = document.createElement("div");
    controlsContainer.className = "controls photo-controls";
    document.querySelector("main").appendChild(controlsContainer);

    function getRandomHexPart() {
        return ("00" + Math.floor(Math.random() * 256).toString(16)).slice(-2)
    }
    function isColorDark(color) {
        if(!color || !color.substring(1)) return false;
        // https://alienryderflex.com/hsp.html
        return Math.sqrt(
            0.299 * parseInt(color.substring(1, 3), 16) ** 2
            + 0.587 * parseInt(color.substring(3, 5), 16) ** 2
            + 0.114 * parseInt(color.substring(5, 7), 16) ** 2
        ) < 127.5;
    }
    function setBodyColor(color) {
        document.body.style.color = color;
        var oppositeColor = {white: "black", black: "white"}[color];
        document.body.style.textShadow = `0 0 5px ${oppositeColor}`;
    }

    class Picture extends Gettable {
        constructor({ url, pageURL, userLink, username, platform, blurhash }) {
            super();
            this.url = url || "";
            this.pageURL = pageURL || "";
            this.userLink = userLink || "";
            this.username = username || "";
            this.platform = platform || "";
            this.blurhash = blurhash || "";
        }
        static get platforms() {
            return ["unsplash"];
        }
        static get automaticPlatforms() {
            return ["gradient"];
        }
        static get fallbackPlatform() {
            return "gradient";
        }
        static async fetch(platform) {
            if(platform == "gradient") {
                var color1 = "#" + getRandomHexPart() + getRandomHexPart() + getRandomHexPart();
                var color2 = "#" + getRandomHexPart() + getRandomHexPart() + getRandomHexPart();
                var angle = Math.floor(Math.random() * 360);
                return [new Picture({url: `linear-gradient(${angle}deg, ${color1}, ${color2})`, platform: "gradient"})];
            }
            if(platform == "unsplash") {
                var clientID = (await browser.storage.local.get())?.unsplashClientID || localStorage.getItem("unsplashClientID");
                var endpoint = (
                    clientID
                    ? "https://api.unsplash.com/photos/random?count=10"
                    : "https://lfnewtab.vercel.app/unsplash/photos/random?count=10"
                );
                try {
                    var resp = await fetch(
                        endpoint,
                        {
                            "headers": clientID ? {
                                "Authorization": "Client-ID " + clientID,
                            } : {},
                        },
                    )
                    var data = await resp.json();
                    var pictures = data.map(item => {
                        var picture = new this({
                            url: item.urls.raw,
                            pageURL: item.links.html,
                            userLink: item.user.links.html,
                            username: item.user.name,
                            platform: "unsplash",
                            blurhash: item.blur_hash,
                        });

                        fetch(picture.getCompressedURL())
                        .catch(err => console.error("Couldn't prefetch picture:", err))

                        return picture;
                    });
                    return pictures;
                } catch(err) {
                    console.error("Couldn't fetch picture list:", err);
                    return [];
                }
            }
        }
        getCompressedURL() {
            return (
                this.url
                + `${this.url.includes("?") ? "&" : "?"}w=${screen.width}&h=${screen.height}&fit=crop&auto=compress,format`
            );
        }
        async display() {
            document.body.style.backgroundImage = null;
            pictureContainer.src = null;
            pictureContainer.style.backgroundImage = null;
            pictureContainer.classList.remove("loaded");
            creditsContainer.textContent = "";
            creditsContainer.appendChild(this.getCredits());

            if(this.platform == "gradient") {
                pictureContainer.style.backgroundImage = this.url;
                pictureContainer.classList.add("loaded");
                var match = /linear-gradient\(\d+deg, (#[\da-f]{6}), (#[\da-f]{6})\)/.exec(this.url);
                if(match) {
                    if(!isColorDark(match[1]) && !isColorDark(match[2]))
                        setBodyColor("black");
                    else
                        setBodyColor("white");
                }
                return;
            }

            var blurhashCallback;
            var blurhash = this.blurhash;
            if(blurhash) {
                var color = getMainColor(blurhash);
                if(isColorDark(color))
                    setBodyColor("white");
                else
                    setBodyColor("black");

                // don't render a wrong blurhash
                try {
                    blurhashCallback = function() {
                        document.body.style.backgroundImage = `url(${blurhashToURL(blurhash, innerWidth, innerHeight)})`;
                    };
                    blurhashCallback();
                    window.addEventListener("resize", blurhashCallback);
                } catch(err) {
                    console.warn("Wrong blurhash:", err);
                }
            }

            var resp = await fetch(this.getCompressedURL());
            var blob = await resp.blob();
            var url = URL.createObjectURL(blob);
            pictureContainer.style.backgroundImage = `url(${url})`;
            pictureContainer.classList.add("loaded");
            document.body.style.backgroundImage = "";
            if(blurhashCallback)
                window.removeEventListener("resize", blurhashCallback);
        }
        getCredits() {
            if(this.platform == "gradient") return document.createTextNode("Dégradé aléatoire");

            var urlRemainder = "?utm_source=lfnewtab&utm_medium=referral";

            var platformURL = {
                "unsplash": "https://unsplash.com/"
            }[this.platform] || this.platform;
            var platformName = {
                "unsplash": "Unsplash",
            }[this.platform] || this.platform;

            if(!this.pageURL && !this.username && !this.platformURL) return document.createTextNode("");

            var credits = document.createDocumentFragment();

            // Photo / link to photo
            if (this.pageURL) {
                var photoLink = document.createElement("a");
                photoLink.href = this.pageURL + urlRemainder;
                photoLink.target = "_blank";
                photoLink.textContent = "Photo";
                credits.appendChild(photoLink);
                credits.appendChild(document.createTextNode(" "));
            } else {
                credits.appendChild(document.createTextNode("Photo "));
            }

            // Author
            if (this.username) {
                if (this.userLink) {
                    credits.appendChild(document.createTextNode("par "));
                    var userLink = document.createElement("a");
                    userLink.href = this.userLink + urlRemainder;
                    userLink.target = "_blank";
                    userLink.textContent = this.username;
                    credits.appendChild(userLink);
                    credits.appendChild(document.createTextNode(" "));
                } else {
                    credits.appendChild(document.createTextNode("par " + this.username + " "));
                }
            }

            // Platform
            var platformLink = document.createElement("a");
            platformLink.href = platformURL + urlRemainder;
            platformLink.target = "_blank";
            platformLink.textContent = platformName;
            credits.appendChild(document.createTextNode("sur "));
            credits.appendChild(platformLink);

            return credits;
        }
    }

    await Picture.addControls(controlsContainer);

    setTimeout(async () => await Picture.updateInitial(), 0);

    creditsContainer.addEventListener("dblclick", async function() {
        var clientID = localStorage.getItem("unsplashClientID") || "";
        clientID = prompt("ID client Unsplash :", clientID);
        if(clientID == null) return;
        clientID = (clientID || "").trim();
        await browser.storage.local.set({unsplashClientID: clientID});
        Picture.update();
    });

    return function() {
        clearInterval(Picture.nextIntv);
        pictureContainer.remove();
        creditsContainer.remove();
        controlsContainer.remove();
    };
};
