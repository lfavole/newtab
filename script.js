window.addEventListener("DOMContentLoaded", () => {
    var clockContainer = document.querySelector(".clock");
    var hoursContainer = document.querySelector(".hours");
    var minutesContainer = document.querySelector(".minutes");
    var secondsContainer = document.querySelector(".seconds");
    var last = new Date(0);
    last.setUTCHours(-1);

    var first = true;

    function updateTime() {
        var now = new Date;

        updateContainer(secondsContainer, last.getSeconds(), now.getSeconds())
        && tick()
        && updateContainer(minutesContainer, last.getMinutes(), now.getMinutes())
        && updateContainer(hoursContainer, last.getHours(), now.getHours());

        last = now;
        first = false;
    }
    function tick() {
        clockContainer.classList.toggle("tick-hidden");
        return 1;
    }
    function updateContainer(container, oldTime, newTime) {
        if(oldTime == newTime) return;

        var oldTime = ("00" + oldTime).slice(-2);
        var newTime = ("00" + newTime).slice(-2);

        for(var i = 0, l = newTime.length; i < l; i++) {
            if(oldTime[i] != newTime[i])
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
});