(() => {
  const entries = Array.from(document.querySelectorAll(".video-entry")).filter((entry) =>
    entry.querySelector(".preview-video")
  );
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!entries.length || reduceMotion || !("IntersectionObserver" in window)) {
    return;
  }

  const previewDuration = 5;
  const visibleEntries = new Set();
  let activeEntry = null;

  const getPreview = (entry) => entry.querySelector(".preview-video");

  const startNextPreview = () => {
    if (activeEntry || document.hidden || entries.some((entry) => entry.open)) {
      return;
    }

    const entry = entries.find((candidate) => {
      const preview = getPreview(candidate);
      return (
        visibleEntries.has(candidate) &&
        !candidate.open &&
        preview.dataset.finished !== "true" &&
        preview.dataset.failed !== "true"
      );
    });

    if (!entry) {
      return;
    }

    activeEntry = entry;
    playPreview(entry);
  };

  const waitForMetadata = (video) =>
    new Promise((resolve, reject) => {
      const cleanUp = () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
      };
      const onLoaded = () => {
        cleanUp();
        resolve();
      };
      const onError = () => {
        cleanUp();
        reject(video.error || new Error("Video preview metadata could not be loaded."));
      };

      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.load();
    });

  const seekTo = (video, time) =>
    new Promise((resolve, reject) => {
      if (Math.abs(video.currentTime - time) < 0.05) {
        resolve();
        return;
      }

      const cleanUp = () => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
      };
      const onSeeked = () => {
        cleanUp();
        resolve();
      };
      const onError = () => {
        cleanUp();
        reject(video.error || new Error("Video preview could not seek to its preview scene."));
      };

      video.addEventListener("seeked", onSeeked, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.currentTime = time;
    });

  async function playPreview(entry) {
    const preview = getPreview(entry);

    try {
      preview.muted = true;
      if (preview.readyState < HTMLMediaElement.HAVE_METADATA) {
        await waitForMetadata(preview);
      }

      if (activeEntry !== entry || entry.open || !visibleEntries.has(entry)) {
        return;
      }

      if (preview.dataset.positioned !== "true") {
        const previewStart = Math.min(
          Number(preview.dataset.previewStart) || 0,
          Math.max(0, preview.duration - previewDuration)
        );
        preview.dataset.previewStart = String(previewStart);
        await seekTo(preview, previewStart);
        preview.dataset.positioned = "true";
      }

      if (activeEntry === entry && !entry.open && visibleEntries.has(entry)) {
        await preview.play();
      }
    } catch (error) {
      preview.dataset.failed = "true";
      activeEntry = activeEntry === entry ? null : activeEntry;
      console.warn(`Could not play the preview for ${entry.querySelector("summary strong").textContent}.`, error);
      startNextPreview();
    }
  }

  entries.forEach((entry) => {
    const preview = getPreview(entry);
    const fullVideo = entry.querySelector(".full-video");
    const previewStart = Number(preview.dataset.previewStart) || 0;

    preview.addEventListener("timeupdate", () => {
      if (activeEntry === entry && preview.currentTime >= previewStart + previewDuration) {
        preview.pause();
        preview.dataset.finished = "true";
        activeEntry = null;
        startNextPreview();
      }
    });

    preview.addEventListener("ended", () => {
      if (activeEntry === entry) {
        preview.dataset.finished = "true";
        activeEntry = null;
        startNextPreview();
      }
    });

    entry.addEventListener("toggle", () => {
      if (entry.open) {
        if (activeEntry) {
          getPreview(activeEntry).pause();
          activeEntry = null;
        }
        preview.pause();
        preview.dataset.positioned = "false";
        fullVideo.pause();
        startNextPreview();
        return;
      }

      fullVideo.pause();
      fullVideo.currentTime = 0;
      preview.dataset.finished = "false";
      preview.dataset.failed = "false";
      preview.dataset.positioned = "false";
      if (activeEntry === entry) {
        activeEntry = null;
      }
      startNextPreview();
    });
  });

  const observer = new IntersectionObserver(
    (observations) => {
      observations.forEach(({ target, isIntersecting, intersectionRatio }) => {
        if (isIntersecting && intersectionRatio >= 0.35) {
          visibleEntries.add(target);
          return;
        }

        visibleEntries.delete(target);
        if (activeEntry === target) {
          getPreview(target).pause();
          activeEntry = null;
        }
      });

      startNextPreview();
    },
    { threshold: [0, 0.35] }
  );

  entries.forEach((entry) => observer.observe(entry));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && activeEntry) {
      getPreview(activeEntry).pause();
      activeEntry = null;
      return;
    }

    startNextPreview();
  });
})();
