(() => {
  const entries = Array.from(document.querySelectorAll(".video-entry")).filter((entry) =>
    entry.querySelector(".preview-video")
  );
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!entries.length || reduceMotion) {
    return;
  }

  const previewDuration = 5;
  const states = entries.map((entry) => {
    const preview = entry.querySelector(".preview-video");
    const requestedStart = Number(preview.dataset.previewStart) || 0;

    return {
      entry,
      preview,
      fullVideo: entry.querySelector(".full-video"),
      start: requestedStart,
      failed: false,
      starting: false,
    };
  });
  let loopOrigin = null;

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

  const waitForPlaybackReady = (video) =>
    new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        resolve();
        return;
      }

      const cleanUp = () => {
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("error", onError);
      };
      const onReady = () => {
        cleanUp();
        resolve();
      };
      const onError = () => {
        cleanUp();
        reject(video.error || new Error("Video preview data could not be loaded."));
      };

      video.addEventListener("canplay", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
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

  const preparePreview = async (state) => {
    const { preview } = state;

    try {
      preview.muted = true;
      if (preview.readyState < HTMLMediaElement.HAVE_METADATA) {
        await waitForMetadata(preview);
      }

      state.start = Math.min(state.start, Math.max(0, preview.duration - previewDuration));
      await seekTo(preview, state.start);
      await waitForPlaybackReady(preview);
    } catch (error) {
      state.failed = true;
      console.warn(
        `Could not prepare the preview for ${state.entry.querySelector("summary strong").textContent}.`,
        error
      );
    }
  };

  const prepared = Promise.all(states.map(preparePreview));

  const preparePreviewPlayback = async (state, phase) => {
    if (state.failed || state.entry.open || state.starting || !state.preview.paused) {
      return false;
    }

    state.starting = true;
    try {
      await seekTo(state.preview, state.start + phase);
      await waitForPlaybackReady(state.preview);
      const ready = !document.hidden && !state.entry.open;
      if (!ready) {
        state.starting = false;
      }
      return ready;
    } catch (error) {
      state.failed = true;
      console.warn(
        `Could not play the preview for ${state.entry.querySelector("summary strong").textContent}.`,
        error
      );
      state.starting = false;
      return false;
    }
  };

  const startPreviews = async (targets) => {
    await prepared;
    if (document.hidden) {
      return;
    }

    const phase = loopOrigin === null ? 0 : ((performance.now() - loopOrigin) / 1000) % previewDuration;
    const readyStates = await Promise.all(
      targets.map(async (state) =>
        (await preparePreviewPlayback(state, phase)) ? state : null
      )
    );
    if (document.hidden) {
      readyStates.forEach((state) => {
        if (state) {
          state.starting = false;
        }
      });
      return;
    }

    if (loopOrigin === null) {
      loopOrigin = performance.now();
    }

    await Promise.all(
      readyStates.filter(Boolean).map(async (state) => {
        try {
          if (!state.entry.open) {
            await state.preview.play();
          }
        } catch (error) {
          state.failed = true;
          console.warn(
            `Could not play the preview for ${state.entry.querySelector("summary strong").textContent}.`,
            error
          );
        } finally {
          state.starting = false;
        }
      })
    );
  };

  states.forEach((state) => {
    const { entry, preview, fullVideo, start } = state;

    preview.addEventListener("timeupdate", () => {
      if (preview.currentTime >= start + previewDuration) {
        preview.currentTime = start;
      }
    });

    entry.addEventListener("toggle", () => {
      if (entry.open) {
        preview.pause();
        fullVideo.pause();
        return;
      }

      fullVideo.pause();
      fullVideo.currentTime = 0;
      startPreviews([state]);
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      states.forEach(({ entry, preview }) => {
        if (!entry.open) {
          preview.pause();
        }
      });
      return;
    }

    startPreviews(states);
  });

  startPreviews(states);
})();
