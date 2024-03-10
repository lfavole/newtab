modules.clock = () => {
    var clockContainer = document.createElement("div");
    clockContainer.className = "clock";
    document.querySelector("main").appendChild(clockContainer);

    var containers = {};

    var parts = ["hours", "tick", "minutes", "tick", "seconds"];
    for(var i = 0; i < 5; i++) {
        var part = document.createElement("div");
        part.className = parts[i];
        clockContainer.appendChild(part);
        if(parts[i] == "tick") {
            part.textContent = ":";
            continue;
        }
        containers[parts[i]] = part;
        for(var j = 0; j < 2; j++) {
            var numberContainer = document.createElement("div");
            part.appendChild(numberContainer)

            var numberElement = document.createElement("div");
            numberElement.className = "number";
            numberContainer.appendChild(numberElement);
        }
    }

    var last = new Date;
    var first = true;

    function updateTime() {
        var now = new Date();

        updateContainer(containers.seconds, last.getSeconds(), now.getSeconds())
        && tick()
        && updateContainer(containers.minutes, last.getMinutes(), now.getMinutes())
        && updateContainer(containers.hours, last.getHours(), now.getHours());

        last = now;
        first = false;
    }
    function tick() {
        clockContainer.classList.toggle("tick-hidden");
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
};
