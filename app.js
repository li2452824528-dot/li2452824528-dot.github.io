(() => {
  const doc = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const progressBar = document.querySelector(".scroll-progress span");
  const header = document.querySelector(".site-header");
  const projects = [...document.querySelectorAll(".project")];

  requestAnimationFrame(() => doc.classList.add("page-ready"));

  const updateScrollState = () => {
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(1, window.scrollY / maxScroll);
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 16);

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
      updateScrollState();
      scrollFrame = 0;
    });
  }, { passive: true });
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

  const canvas = document.querySelector("#signal-canvas");
  if (canvas && !reducedMotion.matches) {
    const context = canvas.getContext("2d", { alpha: true });
    const nodes = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let pointer = { x: .62, y: .42, active: false };

    const buildNodes = () => {
      nodes.length = 0;
      const count = Math.max(26, Math.min(58, Math.round(width / 18)));
      for (let index = 0; index < count; index += 1) {
        const lane = index % 3;
        nodes.push({
          x: .08 + Math.random() * .84,
          y: .10 + Math.random() * .80,
          baseX: 0,
          baseY: 0,
          radius: 1.2 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          speed: .00025 + Math.random() * .00034,
          lane
        });
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildNodes();
    };

    const palette = ["49,91,214", "21,138,107", "217,95,77"];
    const draw = (time) => {
      context.clearRect(0, 0, width, height);

      nodes.forEach((node) => {
        node.baseX = node.x * width + Math.sin(time * node.speed + node.phase) * 13;
        node.baseY = node.y * height + Math.cos(time * node.speed * .72 + node.phase) * 10;
        if (pointer.active) {
          const dx = pointer.x * width - node.baseX;
          const dy = pointer.y * height - node.baseY;
          const distance = Math.hypot(dx, dy);
          if (distance < 180 && distance > 0) {
            node.baseX -= dx * (1 - distance / 180) * .045;
            node.baseY -= dy * (1 - distance / 180) * .045;
          }
        }
      });

      for (let first = 0; first < nodes.length; first += 1) {
        for (let second = first + 1; second < nodes.length; second += 1) {
          const a = nodes[first];
          const b = nodes[second];
          const distance = Math.hypot(a.baseX - b.baseX, a.baseY - b.baseY);
          if (distance > 118) continue;
          context.beginPath();
          context.moveTo(a.baseX, a.baseY);
          context.lineTo(b.baseX, b.baseY);
          context.strokeStyle = `rgba(16,24,32,${(1 - distance / 118) * .11})`;
          context.lineWidth = .7;
          context.stroke();
        }
      }

      nodes.forEach((node) => {
        context.beginPath();
        context.arc(node.baseX, node.baseY, node.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${palette[node.lane]},${node.radius > 2.5 ? .76 : .45})`;
        context.fill();
      });

      animationFrame = requestAnimationFrame(draw);
    };

    const setPointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height,
        active: true
      };
    };

    const hero = canvas.closest(".hero");
    hero?.addEventListener("pointermove", setPointer);
    hero?.addEventListener("pointerleave", () => { pointer.active = false; });
    window.addEventListener("resize", resize);
    resize();
    animationFrame = requestAnimationFrame(draw);

    reducedMotion.addEventListener?.("change", (event) => {
      if (event.matches) cancelAnimationFrame(animationFrame);
    });
  }

})();
