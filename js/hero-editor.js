(() => {
  const stage = document.querySelector('[data-stage]');
  const layers = Object.fromEntries([...document.querySelectorAll('[data-layer]')].map((node) => [node.dataset.layer, node]));
  const defaults = {
    eclipse: { x: 18, y: 27, size: 42, opacity: 72, motion: 28 },
    horizon: { x: 50, y: 42, size: 108, opacity: 90, motion: 14 },
    beam: { x: 86, y: 18, size: 44, opacity: 24, motion: 20 },
  };
  let state;
  try { state = { ...defaults, ...JSON.parse(localStorage.getItem('oksanaHeroLayout') || '{}') }; }
  catch { state = structuredClone(defaults); }
  let selected = 'eclipse';
  let dragging = false;

  const size = document.querySelector('[data-control="size"]');
  const opacity = document.querySelector('[data-control="opacity"]');
  const motion = document.querySelector('[data-control="motion"]');
  const status = document.querySelector('[data-status]');

  const save = () => localStorage.setItem('oksanaHeroLayout', JSON.stringify(state));
  const render = () => {
    Object.entries(layers).forEach(([name, node]) => {
      const item = state[name];
      node.style.left = `${item.x}%`;
      node.style.top = `${item.y}%`;
      node.style.width = `${item.size}%`;
      node.style.opacity = item.opacity / 100;
      node.style.setProperty('--drift', `${item.motion * .22}px`);
      node.style.setProperty('--duration', `${Math.max(7, 25 - item.motion * .16)}s`);
      node.style.animationPlayState = item.motion === 0 ? 'paused' : '';
      node.classList.toggle('is-selected', name === selected);
    });
    const item = state[selected];
    size.value = item.size;
    opacity.value = item.opacity;
    motion.value = item.motion;
    document.querySelectorAll('[data-select]').forEach((button) => button.classList.toggle('is-active', button.dataset.select === selected));
    save();
  };

  const select = (name) => { selected = name; status.textContent = `Выбран слой «${name}»`; render(); };
  document.querySelectorAll('[data-select]').forEach((button) => button.addEventListener('click', () => select(button.dataset.select)));
  Object.entries(layers).forEach(([name, node]) => node.addEventListener('pointerdown', (event) => {
    select(name); dragging = true; node.setPointerCapture(event.pointerId);
  }));
  stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const rect = stage.getBoundingClientRect();
    state[selected].x = Math.max(-20, Math.min(120, (event.clientX - rect.left) / rect.width * 100));
    state[selected].y = Math.max(-20, Math.min(120, (event.clientY - rect.top) / rect.height * 100));
    render();
  });
  stage.addEventListener('pointerup', () => { dragging = false; });
  stage.addEventListener('pointercancel', () => { dragging = false; });
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    state[selected].size = Math.max(15, Math.min(160, state[selected].size - Math.sign(event.deltaY) * 2));
    render();
  }, { passive: false });

  size.addEventListener('input', () => { state[selected].size = Number(size.value); render(); });
  opacity.addEventListener('input', () => { state[selected].opacity = Number(opacity.value); render(); });
  motion.addEventListener('input', () => { state[selected].motion = Number(motion.value); render(); });
  document.querySelector('[data-reset]').addEventListener('click', () => { state = structuredClone(defaults); render(); });
  document.querySelector('[data-copy]').addEventListener('click', async () => {
    const value = JSON.stringify(state, null, 2);
    await navigator.clipboard.writeText(value);
    status.style.display = 'block';
    status.textContent = 'Настройки скопированы. Можешь прислать их мне.';
  });
  render();
})();
