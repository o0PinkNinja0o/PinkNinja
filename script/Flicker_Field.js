(() => {
  document.querySelectorAll(".video-entry").forEach((entry) => {
    const fullVideo = entry.querySelector(".full-video");
    entry.addEventListener("toggle", () => {
      if (entry.open) {
        fullVideo.pause();
        return;
      }

      fullVideo.pause();
      fullVideo.currentTime = 0;
    });
  });
})();
