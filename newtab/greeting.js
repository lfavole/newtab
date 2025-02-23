window.modules = window.modules || {};
modules.greeting = () => {
    var greetingContainer = document.createElement("div");
    greetingContainer.className = "greeting";
    document.querySelector("main").appendChild(greetingContainer);

    var messageContainer = document.createElement("span");
    messageContainer.className = "message";
    greetingContainer.appendChild(messageContainer);

    greetingContainer.appendChild(document.createTextNode(" "));

    var nameContainer = document.createElement("span");
    nameContainer.className = "name";
    greetingContainer.appendChild(nameContainer);

    function updateGreeting() {
        var hour = new Date().getHours();

        var message;
        if(hour < 12)
            message = "Bonjour";
        else if(hour < 18)
            message = "Bonne après-midi";
        else
            message = "Bonne soirée";

        messageContainer.textContent = message;
    }
    function getName() {
        return localStorage.getItem("greetingName") || "Laurent";
    }
    function updateName() {
        nameContainer.textContent = getName();
    }

    nameContainer.addEventListener("dblclick", () => {
        var name = prompt("Nom :", getName());
        if(name == null) return;
        name = (name || "").trim();
        localStorage.setItem("greetingName", name);
        updateName();
    });
    updateName();

    var intv = setInterval(updateGreeting, 1000);
    updateGreeting();

    return function() {
        clearInterval(intv);
        greetingContainer.remove();
    };
};
