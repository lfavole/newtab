window.modules = window.modules || {};
modules.greeting = async () => {
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
    async function getName() {
        return (await browser.storage.local.get())?.greetingName || localStorage.getItem("greetingName") || "Laurent";
    }
    async function updateName() {
        nameContainer.textContent = await getName();
    }

    nameContainer.addEventListener("dblclick", async () => {
        var name = prompt("Nom :", await getName());
        if(name == null) return;
        name = (name || "").trim();
        await browser.storage.local.set({greetingName: name});
        await updateName();
    });
    await updateName();

    var intv = setInterval(updateGreeting, 1000);
    updateGreeting();

    return function() {
        clearInterval(intv);
        greetingContainer.remove();
    };
};
