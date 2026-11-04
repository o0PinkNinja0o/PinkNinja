(() => {
  const loader = document.createElement("div");
  loader.className = "site-loader";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-label", "Loading");
  loader.innerHTML = `
    <div class="site-loader-inner">
      <img src="../images/visual_vault/orig_characters/personas_1/main_1/2st.gif" alt="" />
      <span>Loading</span>
    </div>
  `;
  document.body.prepend(loader);

  const hideLoader = () => {
    requestAnimationFrame(() => loader.classList.add("is-hidden"));
  };

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }

  window.setTimeout(hideLoader, 4000);
})();
