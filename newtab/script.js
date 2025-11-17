window.addEventListener("DOMContentLoaded", async () => {
    if("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
        .then(function(reg) {
            console.log(`Service worker registration succeeded. Scope is ${reg.scope}`);
        })
        .catch(function(error) {
            console.error("Service worker registration failed:", error);
        });
    }

    await modules.settings();
});
