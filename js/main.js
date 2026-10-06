document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-menu]');
  const menuButton = document.querySelector('[data-menu-button]');
  const menuLabel = menuButton?.querySelector('.menu-button__label');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const closeMenu = () => {
    if (!menu || !menuButton) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = 'Меню';
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menu || !menuButton) return;
    menu.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    if (menuLabel) menuLabel.textContent = 'Закрыть';
    document.body.classList.add('menu-open');
    menu.querySelector('a')?.focus();
  };

  menuButton?.addEventListener('click', () => {
    menuButton.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) {
      closeMenu();
      return;
    }
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      window.history.pushState(null, '', href);
    });
  }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  }

  const heroVisual = document.querySelector('[data-hero-visual]');
  if (heroVisual && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 10;
      const y = (event.clientY / window.innerHeight - 0.5) * 8;
      heroVisual.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
  }

  const lightManifest = document.querySelector('[data-light-manifest]');
  if (lightManifest) {
    const lightScene = lightManifest.querySelector('.manifest-scene--light') || lightManifest;
    if (reduceMotion || !('IntersectionObserver' in window)) lightManifest.classList.add('is-lit');
    else new IntersectionObserver(([entry]) => {
      lightManifest.classList.toggle('is-lit', entry.isIntersecting && entry.intersectionRatio >= 0.88);
    }, { threshold: [0, 0.35, 0.65, 0.8, 0.88, 0.94, 1] }).observe(lightScene);
  }

  const contactForm = document.querySelector('[data-contact-form]');
  contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const message = `Здравствуйте! Меня зовут ${data.get('name') || '—'}.\nКонтакт: ${data.get('contact') || '—'}\nО проекте: ${data.get('project') || '—'}`;
    try { await navigator.clipboard.writeText(message); } catch (_) {}
    const status = contactForm.querySelector('[data-contact-status]');
    if (status) status.textContent = 'Открываю Telegram с готовым сообщением…';
    const telegramUrl = `https://t.me/lhopeso?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  });

  const perceptionScene = document.querySelector('[data-perception-scene]');
  if (perceptionScene) {
    if (reduceMotion || !('IntersectionObserver' in window)) perceptionScene.classList.add('is-visible');
    else new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      perceptionScene.classList.add('is-visible');
      observer.disconnect();
    }, { threshold: 0.28 }).observe(perceptionScene);
  }

  const waveCanvas = document.querySelector('[data-type-wave]');
  if (waveCanvas) {
    const context = waveCanvas.getContext('2d');
    const section = waveCanvas.closest('.skills');
    let width = 0;
    let height = 0;
    let visible = true;
    let frame = 0;
    let lastTime = 0;
    let pointer = { x: 0, y: 0, active: false };
    let ripples = [];
    const phrase = 'СВЕТ · ВОЛНА · ПРОСТРАНСТВО · ДВИЖЕНИЕ · ГЛУБИНА · ПАМЯТЬ · МОРЕ · ТЕНЬ · ОТРАЖЕНИЕ · СИГНАЛ · ';

    const resizeWave = () => {
      const rect = waveCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      width = rect.width;
      height = rect.height;
      waveCanvas.width = Math.max(1, Math.round(width * ratio));
      waveCanvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!pointer.active) pointer = { x: width * .58, y: height * .48, active: false };
    };

    const addRipple = (x, y, strength = 1) => {
      const previous = ripples[ripples.length - 1];
      if (previous && Math.hypot(previous.x - x, previous.y - y) < 18) return;
      ripples.push({ x, y, age: 0, strength });
      if (ripples.length > 12) ripples.shift();
    };

    const updatePointer = (event) => {
      const rect = section.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      addRipple(pointer.x, pointer.y, .95);
    };

    section.addEventListener('pointermove', updatePointer, { passive: true });
    section.addEventListener('pointerenter', updatePointer, { passive: true });
    section.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

    const drawWave = (time = 0, delta = 16) => {
      context.clearRect(0, 0, width, height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const fontSize = Math.max(10, Math.min(14, width / 105));
      context.font = `${fontSize}px "Roboto Mono", monospace`;
      const rowStep = Math.max(29, height / 27);
      const columnStep = Math.max(16, width / 92);
      const rows = Math.ceil(height / rowStep) + 3;
      const columns = Math.ceil(width / columnStep) + 4;
      const phase = time * 0.00022;

      ripples.forEach((ripple) => { ripple.age += delta * .001; });
      ripples = ripples.filter((ripple) => ripple.age < 2.8);

      for (let row = 0; row < rows; row += 1) {
        const baseY = (row - 1) * rowStep;
        for (let column = -2; column < columns; column += 1) {
          const baseX = column * columnStep + (row % 2) * columnStep * .35;
          let offsetX = Math.sin(baseY * .012 + phase * 3.2) * 2.2;
          let offsetY = Math.sin(baseX * .008 + row * .31 + phase) * 4;
          let energy = .06;

          for (const ripple of ripples) {
            const dx = baseX - ripple.x;
            const dy = baseY - ripple.y;
            const distance = Math.hypot(dx, dy) || 1;
            const radius = ripple.age * 190;
            const band = Math.exp(-Math.pow((distance - radius) / 66, 2));
            const decay = Math.exp(-ripple.age * .72) * ripple.strength;
            const force = band * decay * 24;
            offsetX += (dx / distance) * force;
            offsetY += (dy / distance) * force + Math.sin(distance * .075 - ripple.age * 9) * band * decay * 8;
            energy += band * decay;
          }

          if (pointer.active) {
            const dx = baseX - pointer.x;
            const dy = baseY - pointer.y;
            const distance = Math.hypot(dx, dy) || 1;
            const near = Math.max(0, 1 - distance / 145);
            offsetX += (dx / distance) * near * 17;
            offsetY += (dy / distance) * near * 17;
            energy += near * .75;
          }

          const letter = phrase[(column + row * 7 + phrase.length * 10) % phrase.length];
          const alpha = Math.min(.58, .08 + energy * .42);
          context.fillStyle = `rgba(202,232,244,${alpha})`;
          context.save();
          context.translate(baseX + offsetX, baseY + offsetY);
          context.rotate(Math.atan2(offsetY, columnStep * 2) * .35);
          context.fillText(letter, 0, 0);
          context.restore();
        }
      }
    };

    const animateWave = (time) => {
      const delta = Math.min(34, time - lastTime || 16);
      if (visible && time - lastTime >= 1000 / 40) {
        drawWave(time, delta);
        lastTime = time;
      }
      frame = window.requestAnimationFrame(animateWave);
    };

    resizeWave();
    window.addEventListener('resize', resizeWave, { passive: true });
    if ('IntersectionObserver' in window && section) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '20%' }).observe(section);
    }
    if (reduceMotion) drawWave(0);
    else frame = window.requestAnimationFrame(animateWave);
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
  }
});
