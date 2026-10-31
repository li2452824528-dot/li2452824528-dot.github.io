(() => {
  const doc = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const progressBar = document.querySelector(".scroll-progress span");
  const header = document.querySelector(".site-header");
  const projects = [...document.querySelectorAll(".project")];
  const tradeProject = document.querySelector('[data-project="tradeguard"]');
  const tradeGallery = tradeProject?.querySelector(".tradeguard-gallery");
  const tradeStageLabels = [
    "TradeGuard application architecture",
    "TradeGuard control loop",
    "TradeGuard runtime topology"
  ];
  const tradeStageNames = [
    "Application architecture",
    "Control loop",
    "Runtime topology"
  ];
  const tradeAdvanceButton = tradeGallery?.querySelector(".trade-stage-hitarea");
  const tradeStageStatus = tradeGallery?.querySelector(".trade-stage-status");
  let tradeStage = 0;
  let allowTradeScrollAdvance = false;
  let tradeTouchStart = null;
  let suppressTradeClick = false;

  const setTradeStage = (stage) => {
    if (!tradeGallery) return;
    tradeStage = Math.max(0, Math.min(tradeStageLabels.length - 1, stage));
    tradeGallery.dataset.stage = String(tradeStage);
    const current = String(tradeStage + 1).padStart(2, "0");
    const total = String(tradeStageLabels.length).padStart(2, "0");
    const isFinalStage = tradeStage === tradeStageLabels.length - 1;
    tradeGallery.setAttribute("aria-label", `${tradeStageLabels[tradeStage]}. View ${current} of ${total}.${isFinalStage ? " Final view." : " Click the diagram to advance."}`);
    if (tradeStageStatus) tradeStageStatus.textContent = isFinalStage ? `${current} / ${total} · Final view` : `${current} / ${total} · Click to continue`;
    if (tradeAdvanceButton) {
      tradeAdvanceButton.disabled = isFinalStage;
      tradeAdvanceButton.setAttribute("aria-label", isFinalStage ? "Final TradeGuard view" : `Show ${tradeStageNames[tradeStage + 1]}`);
    }
  };

  const moveTradeStage = (offset) => setTradeStage(tradeStage + offset);

  const updateScrollState = (advanceTradeStage = false) => {
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(1, window.scrollY / maxScroll);
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 16);

    if (tradeProject && tradeGallery) {
      const galleryRect = tradeGallery.getBoundingClientRect();
      const isMobile = window.innerWidth < 681;
      const firstStageLine = window.innerHeight * (isMobile ? .68 : .62);
      const secondStageLine = window.innerHeight * (isMobile ? .34 : .30);
      const isWithinSequence = galleryRect.bottom > window.innerHeight * .24 && galleryRect.top < window.innerHeight * .82;
      if (advanceTradeStage && isWithinSequence) {
        const scrollStage = galleryRect.top < secondStageLine ? 2 : galleryRect.top < firstStageLine ? 1 : 0;
        if (scrollStage > tradeStage) setTradeStage(tradeStage + 1);
      }
    }

    if (!reducedMotion.matches) {
      projects.forEach((project) => {
        const visual = project.querySelector(".project-visual");
        if (!visual || window.innerWidth < 681) return;
        const rect = project.getBoundingClientRect();
        const centerDelta = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        visual.style.setProperty("--project-shift", `${Math.max(-22, Math.min(22, centerDelta * -18))}px`);
      });
    }
  };

  let scrollFrame = 0;
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateScrollState(allowTradeScrollAdvance);
      allowTradeScrollAdvance = false;
      scrollFrame = 0;
    });
  }, { passive: true });
  const markTradeScrollIntent = () => { allowTradeScrollAdvance = true; };
  window.addEventListener("wheel", markTradeScrollIntent, { passive: true });
  window.addEventListener("touchmove", markTradeScrollIntent, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "PageDown", " ", "End"].includes(event.key)) markTradeScrollIntent();
  });
  window.addEventListener("resize", updateScrollState);
  tradeAdvanceButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (suppressTradeClick) {
      suppressTradeClick = false;
      return;
    }
    moveTradeStage(1);
  });
  tradeGallery?.addEventListener("click", (event) => {
    if (event.target.closest(".trade-stage-hitarea")) return;
    moveTradeStage(1);
  });
  tradeGallery?.addEventListener("keydown", (event) => {
    if (event.target.closest(".trade-stage-hitarea")) return;
    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      moveTradeStage(1);
    }
  });
  tradeGallery?.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    tradeTouchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  tradeGallery?.addEventListener("touchend", (event) => {
    if (!tradeTouchStart || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - tradeTouchStart.x;
    const deltaY = touch.clientY - tradeTouchStart.y;
    tradeTouchStart = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    suppressTradeClick = true;
    window.setTimeout(() => { suppressTradeClick = false; }, 450);
    if (deltaX < 0) moveTradeStage(1);
  }, { passive: true });
  setTradeStage(0);
  updateScrollState();

  if ("IntersectionObserver" in window) {
    const projectObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting));
    }, { threshold: .42 });
    projects.forEach((project) => projectObserver.observe(project));
  } else {
    projects.forEach((project) => project.classList.add("is-active"));
  }

  if (!reducedMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".project-visual").forEach((visual) => {
      visual.addEventListener("pointermove", (event) => {
        const bounds = visual.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        visual.style.setProperty("--tilt-x", `${x * 3.2}deg`);
        visual.style.setProperty("--tilt-y", `${y * -3.2}deg`);
      });
      visual.addEventListener("pointerleave", () => {
        visual.style.setProperty("--tilt-x", "0deg");
        visual.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

})();
