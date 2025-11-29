window.modules = window.modules || {};
modules.settings = async () => {
    var settingsContainer = document.createElement("details");
    settingsContainer.className = "settings-container";
    document.querySelector("main").appendChild(settingsContainer);

    var summary = document.createElement("summary");
    summary.textContent = "Paramètres";
    settingsContainer.appendChild(summary);

    var explanations = document.createTextNode("Choisissez les modules activés. Vous pouvez les réorganiser.");
    settingsContainer.appendChild(explanations);

    var resetButton = document.createElement("input");
    resetButton.type = "button";
    resetButton.value = "Réinitialiser";
    settingsContainer.appendChild(resetButton);

    var modulesContainer = document.createElement("ul");
    modulesContainer.className = "modules-container";
    settingsContainer.appendChild(modulesContainer);

    class ModuleSelector {
        constructor(modulesContainer) {
            this.modulesContainer = modulesContainer;
            this.defaultModuleNames = ["clock", "greeting", "quotes", "pictures"];
            this.existingModuleNames = Object.keys(modules).slice();
            const settingsIndex = this.existingModuleNames.indexOf("settings");
            if (settingsIndex !== -1) this.existingModuleNames.splice(settingsIndex, 1);

            this.allModules = [];
            this.deactivators = {};

            this.dragged = null;
            this.index = null;
            this.indexDrop = null;

            this.modulesContainer.addEventListener("dragstart", (e) => this.onDragStart(e));
            this.modulesContainer.addEventListener("dragover", (e) => this.onDragOver(e));
            this.modulesContainer.addEventListener("drop", (e) => this.onDrop(e));
        }

        async getEnabledModuleNames() {
            var enabledModuleNames = ((await browser.storage.local.get())?.modules || localStorage.getItem("modules") || "").split(",").filter(mod => this.existingModuleNames.includes(mod));
            return enabledModuleNames.length ? enabledModuleNames : this.defaultModuleNames;
        }

        async updateEnabledModules() {
            var enabledModuleNames = this.allModules.map(([moduleName, enabled]) => enabled && moduleName).filter(x => x);
            if (
                enabledModuleNames.length == this.defaultModuleNames.length
                && enabledModuleNames.every((val, index) => val == this.defaultModuleNames[index])
            )
                await browser.storage.local.set({modules: ""});
            else
                await browser.storage.local.set({modules: enabledModuleNames.join(",")});

            Object.values(this.deactivators).forEach(deactivate => deactivate?.());
            this.deactivators = {};
            for (var module of enabledModuleNames) {
                this.deactivators[module] = await modules[module]?.();
            }
        }

        async tickBox(event) {
            var target = event.target;
            var list = this.modulesContainer.children;
            for (var i = 0; i < list.length; i += 1) {
                if (list[i] !== target.parentElement) continue;
                this.allModules[i][1] = target.checked;
                await this.updateEnabledModules();
                break;
            }
        }

        async initModulesList(reset = false) {
            while (this.modulesContainer.firstChild)
                this.modulesContainer.firstChild.remove();

            this.allModules = (reset ? this.defaultModuleNames : await this.getEnabledModuleNames()).map(m => [m, true]);

            for (var moduleName of this.existingModuleNames) {
                if (!this.allModules.find(([name]) => name == moduleName))
                    this.allModules.push([moduleName, false]);
            }

            for (var [moduleName, enabled] of this.allModules) {
                var item = document.createElement("li");
                item.draggable = true;
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = enabled;
                checkbox.addEventListener("change", this.tickBox.bind(this));
                item.appendChild(checkbox);
                var text = document.createTextNode(moduleName);
                item.appendChild(text);
                this.modulesContainer.appendChild(item);
            }

            await this.updateEnabledModules();
        }

        // Source: https://stackoverflow.com/a/59536432

        onDragStart({ target }) {
            this.dragged = target;
            this.index = [...this.modulesContainer.children].findIndex(child => child === this.dragged);
        }

        onDragOver(event) {
            event.preventDefault();
        }

        async onDrop({ target }) {
            if (target.parentElement === this.modulesContainer && target !== this.dragged) {
                // temporarily store it and remove it
                var [moduleName, enabled] = this.allModules[this.index];
                this.allModules.splice(this.index, 1);
                this.dragged.remove();
                // find where we will drop it (in the list without the element)
                var indexDrop = [...this.modulesContainer.children].findIndex(el => el === target);
                if (indexDrop < this.index) {
                    // if we dropped it before where it currently is, put it before
                    // because if 2 is dragged over 1, it won't move with after()
                    target.before(this.dragged);
                } else {
                    // otherwise, put it after
                    target.after(this.dragged);
                    indexDrop++;
                }
                this.allModules.splice(indexDrop, 0, [moduleName, enabled]);
                // re-enable the modules in the correct order
                await this.updateEnabledModules();
            }
        }
    }

    var moduleSelector = new ModuleSelector(modulesContainer);
    resetButton.addEventListener("click", () => moduleSelector.initModulesList(true));
    await moduleSelector.initModulesList();
};
