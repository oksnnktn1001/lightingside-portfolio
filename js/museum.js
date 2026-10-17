(() => {
  const data = document.querySelector('[data-museum-zones]');
  const image = document.querySelector('[data-museum-main]');
  if (!data || !image) return;
  const zones = JSON.parse(data.textContent);
  const controls = [...document.querySelectorAll('[data-museum-zone]')];
  const count = document.querySelector('[data-museum-count]');
  const title = document.querySelector('[data-museum-title]');
  const caption = document.querySelector('[data-museum-caption]');
  image.dataset.zone = '0';
  const select = (index) => {
    const zone = zones[index];
    if (!zone || image.dataset.zone === String(index)) return;
    image.src = zone.image;
    image.alt = zone.alt;
    image.dataset.zone = String(index);
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(zones.length).padStart(2, '0')}`;
    title.textContent = zone.title;
    caption.textContent = zone.description;
    controls.forEach(control => {
      const active = Number(control.dataset.museumZone) === index;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    });
  };
  controls.forEach(control => {
    const activate = () => select(Number(control.dataset.museumZone));
    control.addEventListener('mouseenter', activate);
    control.addEventListener('focus', activate);
    control.addEventListener('click', activate);
  });
})();
