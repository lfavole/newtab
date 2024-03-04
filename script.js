window.addEventListener("DOMContentLoaded", () => {
    var clockContainer = document.querySelector(".clock");
    var hoursContainer = document.querySelector(".hours");
    var minutesContainer = document.querySelector(".minutes");
    var secondsContainer = document.querySelector(".seconds");
    var last = new Date(0);
    last.setUTCHours(-1);

    var first = true;

    function updateTime() {
        var now = new Date();

        updateContainer(secondsContainer, last.getSeconds(), now.getSeconds())
        && tick()
        && updateContainer(minutesContainer, last.getMinutes(), now.getMinutes())
        && updateContainer(hoursContainer, last.getHours(), now.getHours());

        last = now;
        first = false;
    }
    function tick() {
        clockContainer.classList.toggle("tick-hidden");
        updateGreeting();
        return 1;
    }
    function updateContainer(container, oldTime, newTime) {
        if(!first && oldTime == newTime) return;

        var oldTime = ("00" + oldTime).slice(-2);
        var newTime = ("00" + newTime).slice(-2);

        for(var i = 0, l = newTime.length; i < l; i++) {
            if(first || oldTime[i] != newTime[i])
                updateNumber(container.children[i], newTime[i]);
        }

        return 1;
    }
    function updateNumber(element, number) {
        if(first) {
            element.firstElementChild.textContent = number;
            return;
        }

        var second = document.createElement("div");
        second.className = "number";
        second.textContent = number;

        element.appendChild(second);
        element.classList.add("move");

        setTimeout(function () {
            element.removeChild(element.firstElementChild);
            element.classList.remove("move");
        }, 600);
    }
    setInterval(updateTime, 100);

    function updateGreeting() {
        var now = new Date();
        var hour = now.getHours();
        var message;
        if(hour < 12) {
            message = "Bonjour";
        } else if(hour < 18) {
            message = "Bonne après-midi";
        } else {
            message = "Bonne soirée";
        }
        document.querySelector(".message").textContent = message;
    }
    function getName() {
        return localStorage.getItem("greetingName") || "Laurent";
    }
    function updateName() {
        document.querySelector(".name").textContent = getName();
    }

    document.querySelector(".name").addEventListener("dblclick", () => {
        var name = (prompt("Nom :", getName()) || "").trim();
        localStorage.setItem("greetingName", name);
        updateName();
    });
    updateName();

    function deleteImageMetadata() {
        document.body.style.backgroundImage = null;
        document.querySelector(".photo").style.backgroundImage = null;
        document.querySelector(".photo-credits").innerHTML = "";
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
    function updateBackgroundGradient() {
        deleteImageMetadata();
        var color1 = "#" + getHexPart() + getHexPart() + getHexPart();
        var color2 = "#" + getHexPart() + getHexPart() + getHexPart();
        var angle = Math.floor(Math.random() * 360);
        document.body.style.backgroundImage = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
        if(!isColorDark(color1) && !isColorDark(color2))
            document.body.style.color = "black";
        else
            document.body.style.color = "white";
        document.querySelector(".photo-credits").innerHTML = "Dégradé aléatoire";
    }
    updateBackgroundGradient();
    function updateTextColor(blurhash) {
        var color = getMainColor(blurhash);
        if(isColorDark(color))
            document.body.style.color = "white";
        else
            document.body.style.color = "black";
    }

    var allQuestions = getDepartementsQuestions();
    function getRandomQuestion() {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    function getQuestion(newQuestion = false) {
        if(!newQuestion) {
            try {
                var question = localStorage.getItem("question");
                if(question) return JSON.parse(question);
            } catch(err) {}
        }
        return getRandomQuestion();
    }
    function updateQuestion(newQuestion = false) {
        var question = getQuestion(newQuestion);

        localStorage.setItem("question", JSON.stringify(question));

        document.querySelector(".flashcard").classList.remove("revealed");
        document.querySelector(".question").innerHTML = question[0];
    }
    document.querySelector(".question-container input").addEventListener("click", () => {
        document.querySelector(".answer").innerHTML = getQuestion()[1];
        document.querySelector(".flashcard").classList.add("revealed");
    });
    document.querySelector(".answer-container input").addEventListener("click", () => {
        updateQuestion(true);
    });
    updateQuestion();

    function updatePicture() {
        deleteImageMetadata();
        var clientID = localStorage.getItem("unsplashClientID");
        if(!clientID) return;
        fetch(
            "https://api.unsplash.com/photos/random",
            {
                "headers": {
                    "Authorization": "Client-ID " + clientID,
                },
            },
        )
        .then(resp => resp.json())
        .then((data) => {
            document.querySelector(".photo").style.backgroundImage = `url(${data.urls.raw}${data.urls.raw.includes("?") ? "&" : "?"}w=${innerWidth}&h=${innerHeight}&fit=crop&auto=compress,format)`;
            document.querySelector(".photo-credits").innerHTML = (
                `<a href="${data.links.html}?utm_source=lfnewtab&utm_medium=referral">Photo</a> `
                + `par <a href="${data.user.links.html}?utm_source=lfnewtab&utm_medium=referral">${data.user.name}</a> `
                + `sur <a href="https://unsplash.com/?utm_source=lfnewtab&utm_medium=referral">Unsplash</a>`
            );
            document.body.style.backgroundImage = `url(${blurhashToURL(data.blur_hash, innerWidth, innerHeight)})`;
            updateTextColor(data.blur_hash);
        });
    }
    updatePicture();

    document.querySelector(".photo-credits").addEventListener("dblclick", function() {
        var clientID = localStorage.getItem("unsplashClientID") || "";
        clientID = (prompt("ID client Unsplash :", clientID) || "").trim();
        localStorage.setItem("unsplashClientID", clientID);
        if(clientID)
            updatePicture();
        else
            updateBackgroundGradient();
    });
});