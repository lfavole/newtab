window.modules = window.modules || {};
modules.settings = async () => {
    var settingsContainer = document.createElement("details");
    settingsContainer.className = "settings-container";
    document.querySelector("main").appendChild(settingsContainer);

    var summary = document.createElement("summary");
    summary.textContent = "Paramètres";
    settingsContainer.appendChild(summary);

    var modulesContainer = document.createElement("ul");
    modulesContainer.className = "modules-container";
    settingsContainer.appendChild(modulesContainer);

    var deactivators = {};

    async function getEnabledModules() {
        var enabledModules = ((await browser.storage.local.get())?.modules || localStorage.getItem("modules") || "").split(",").filter(mod => existingModules.includes(mod));
        return enabledModules.length ? enabledModules : defaultModules;
    }

    async function updateEnabledModules() {
        var enabledModules = [];
        for(var i = 0, l = modulesList.length; i < l; i++) {
            if(modulesChecked[i])
                enabledModules.push(modulesList[i]);
        }
        if(enabledModules.length == defaultModules.length && enabledModules.every((val, index) => val == defaultModules[index]))
            await browser.storage.local.set({modules: ""});
        else
            await browser.storage.local.set({modules: enabledModules.join(",")});
        Object.values(deactivators).forEach(deactivate => deactivate());
        deactivators = {};
        for(var module of enabledModules) {
            deactivators[module] = modules[module]();
        }
    }

    async function check({target}) {
        var itemIndex;
        var list = modulesContainer.children;
        for(var i = 0; i < list.length; i += 1) {
            if(list[i] === target.parentElement){
                itemIndex = i;
                break;
            }
        }
        modulesChecked[itemIndex] = target.checked;
        await updateEnabledModules();
    }

    var defaultModules = ["clock", "greeting", "quotes", "pictures"];
    var existingModules = Object.keys(modules);
    existingModules.splice(existingModules.indexOf("settings"), 1);

    var modulesList = await getEnabledModules();
    // the first modules are always enabled
    var modulesChecked = Array(modulesList.length).fill(true).concat(Array(existingModules.length - modulesList.length).fill(false));
    for(var mod of existingModules) {
        if(!modulesList.includes(mod))
            modulesList.push(mod);
    }

    for(var i = 0, l = modulesList.length; i < l; i++) {
        var item = document.createElement("li");
        item.draggable = true;
        item.dataset.id = i;
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = modulesChecked[i];
        checkbox.addEventListener("change", check);
        item.appendChild(checkbox);
        var text = document.createTextNode(modulesList[i]);
        item.appendChild(text);
        modulesContainer.appendChild(item);
    }

    // https://stackoverflow.com/a/59536432
    var dragged;
    var id;
    var index;
    var indexDrop;

    modulesContainer.addEventListener("dragstart", ({target}) => {
        dragged = target;
        id = target.dataset.id;
        var list = modulesContainer.children;
        for(var i = 0; i < list.length; i += 1) {
            if(list[i] === dragged){
                index = i;
                break;
            }
        }
    });

    modulesContainer.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    modulesContainer.addEventListener("drop", async ({target}) => {
        if(target.parentElement == modulesContainer && target.dataset.id !== id) {
            var module = modulesList[index];
            var moduleChecked = modulesChecked[index];
            modulesList.splice(index, 1);
            modulesChecked.splice(index, 1);
            var list = modulesContainer.children;
            for(let i = 0; i < list.length; i += 1) {
                if(list[i] === target) {
                    indexDrop = i;
                    break;
                }
            }
            dragged.remove(dragged);
            modulesList.splice(indexDrop, 0, module);
            modulesChecked.splice(indexDrop, 0, moduleChecked);
            if(index > indexDrop) {
                target.before(dragged);
            } else {
                target.after(dragged);
            }
            await updateEnabledModules();
        }
    });

    await updateEnabledModules();
};
