window.modules = window.modules || {};
modules.quotes = () => {
    var quotesContainer = document.createElement("div");
    quotesContainer.className = "quote-container";
    document.querySelector("main").appendChild(quotesContainer);

    var quoteElement = document.createElement("div");
    quoteElement.className = "quote";
    quotesContainer.appendChild(quoteElement);

    var authorElement = document.createElement("div");
    authorElement.className = "author";
    quotesContainer.appendChild(authorElement);

    var bookElement = document.createElement("div");
    bookElement.className = "book";
    quotesContainer.appendChild(bookElement);

    var quoteChangerElement = document.createElement("div");
    quoteChangerElement.className = "quote-changer";
    quotesContainer.appendChild(quoteChangerElement);

    var previousButton = document.createElement("button");
    previousButton.textContent = "←";
    quoteChangerElement.appendChild(previousButton);

    var progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    quoteChangerElement.appendChild(progressBar);

    var pauseButton = document.createElement("button");
    pauseButton.textContent = "⏸︎";
    quoteChangerElement.appendChild(pauseButton);

    var nextButton = document.createElement("button");
    nextButton.textContent = "→";
    quoteChangerElement.appendChild(nextButton);

    class Quote extends Gettable {
        constructor({ platform, quote, author, book }) {
            super();
            this.platform = platform || "";
            this.quote = quote || "";
            this.author = author || "";
            this.book = book || "";
        }
        static get platforms() {
            return [
                "fr/general",
                "fr/cats",
                "it/general",
            ];
        }
        static async getRepositoryInfo(repository) {
            var resp = await fetch("https://lfavole.github.io/quotes/" + repository + "/0.json");
            var data = await resp.json();
            return data;
        }
        static async fetch(repository, index) {
            if(!repository) {
                var counts = await Promise.all(quotesRepositories.map(repo => this.getRepositoryInfo(repo))).then(data => data.map(d => d.total));
                var totalCount = counts.reduce((a, b) => a + b, 0);
                var randomIndex = Math.floor(Math.random() * totalCount);
                var index = 0;
                for(var i = 0; i < counts.length; i++) {
                    if(index + counts[i] > randomIndex) {
                        repository = quotesRepositories[i];
                        break;
                    }
                    index += counts[i];
                }
            }
            var info = await this.getRepositoryInfo(repository);
            var quoteIndex = Math.floor(Math.random() * info.total);
            var chunkIndex = Math.floor(quoteIndex / info.chunk_size) + 1;
            var resp = await fetch("https://lfavole.github.io/quotes/" + repository + "/" + chunkIndex + ".json");
            var data = await resp.json();
            var quoteData = data[quoteIndex % info.chunk_size];
            return [new this({
                platform: repository,
                quote: quoteData[0],
                author: quoteData[1],
                book: quoteData[2],
            })];
        }
        display() {
            quoteElement.textContent = this.quote;
            authorElement.textContent = this.author;
            bookElement.textContent = this.book;
        }
    }

    var counterMax = 60000;
    var counter = counterMax;

    var nextIntv;
    function updatePause() {
        pauseButton.textContent = Quote.paused ? "▶" : "⏸️";
        if(!Quote.paused) {
            nextIntv = setInterval(() => {
                counter -= 500;
                progressBar.style.width = (counter / counterMax) * 100 + "%";
                if(counter == 0) {
                    counter = counterMax;
                    Quote.update();
                }
            }, 500);
        } else {
            clearInterval(nextIntv);
            counter = counterMax;
            progressBar.style.width = "100%";
        }
    }

    setTimeout(async () => await Quote.updateInitial(), 0);
    updatePause();

    previousButton.addEventListener("click", async () => await Quote.update(-1));
    nextButton.addEventListener("click", async () => await Quote.update(1));

    pauseButton.addEventListener("click", () => {
        Quote.setPaused();
        updatePause();
    });

    return function() {
        clearInterval(nextIntv);
        quotesContainer.remove();
    };
};
