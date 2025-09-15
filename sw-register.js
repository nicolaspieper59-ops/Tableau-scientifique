if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(
      reg => console.log("ServiceWorker OK:", reg.scope),
      err => console.error("ServiceWorker FAIL:", err)
    );
  });
}
