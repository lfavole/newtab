window.addEventListener("DOMContentLoaded", () => {
    var hoursContainer = document.querySelector(".hours");
    var minutesContainer = document.querySelector(".minutes");
    var secondsContainer = document.querySelector(".seconds");
    var tickElements = Array.from(document.querySelectorAll(".tick"));
    var last = new Date(0);
    last.setUTCHours(-1);
    var tickState = true;
    function updateTime() {
        var now = new Date;

        var lastHours = last.getHours().toString();
        var nowHours = now.getHours().toString();
        if (lastHours !== nowHours)
            updateContainer(hoursContainer, nowHours);

        var lastMinutes = last.getMinutes().toString();
        var nowMinutes = now.getMinutes().toString();
        if (lastMinutes !== nowMinutes)
            updateContainer(minutesContainer, nowMinutes);

            var lastSeconds = last.getSeconds().toString();
        var nowSeconds = now.getSeconds().toString();
        if (lastSeconds !== nowSeconds) {
            tick();
            updateContainer(secondsContainer, nowSeconds);
        }
        last = now;
    }
    function tick() {
        tickState = !tickState;
        if(tickState)
            tickElements.forEach(t => t.classList.add("tick-hidden"));
        else
            tickElements.forEach(t => t.classList.remove("tick-hidden"));
    }
    function updateContainer(container, newTime) {
        var time = newTime.split("");
        if (time.length === 1)
            time.unshift("0");

        var first = container.firstElementChild;
        if (first.lastElementChild.textContent !== time[0])
            updateNumber(first, time[0]);
        
        var last = container.lastElementChild;
        if (last.lastElementChild.textContent !== time[1])
            updateNumber(last, time[1]);
    }
    function updateNumber(element, number) {
        var second = element.lastElementChild.cloneNode(true);
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