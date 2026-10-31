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
  let tradeStage = 0;
  let allowTradeScrollAdvance = false;

  const setTradeStage = (stage) => {
    if (!tradeGallery) return;
    tradeStage = Math.max(0, Math.min(tradeStageLabels.length - 1, stage));
    tradeGallery.dataset.stage = String(tradeStage);
    const nextAction = tradeStage < tradeStageLabels.length - 1
      ? " Click or press Enter to advance to the next system view."
      : " Final system view.";
    tradeGallery.setAttribute("aria-label", `${tradeStageLabels[tradeStage]}.${nextAction}`);
  };

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
  tradeGallery?.addEventListener("click", () => {
    if (tradeStage < tradeStageLabels.length - 1) setTradeStage(tradeStage + 1);
  });
  tradeGallery?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (tradeStage < tradeStageLabels.length - 1) setTradeStage(tradeStage + 1);
  });
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
