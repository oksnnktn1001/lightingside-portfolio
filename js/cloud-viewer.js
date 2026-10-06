(() => {
  const host = document.querySelector('[data-cloud-viewer]');
  if (!host) return;

  const canvas = host.querySelector('canvas');
  const status = host.querySelector('[data-cloud-status]');
  const hint = host.querySelector('[data-cloud-hint]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) { status.textContent = 'WebGL недоступен'; return; }

  const vertex = `attribute vec3 p;uniform vec4 v;varying float d;void main(){float cy=cos(v.x),sy=sin(v.x),cx=cos(v.y),sx=sin(v.y);vec3 a=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);vec3 q=vec3(a.x,cx*a.y-sx*a.z,sx*a.y+cx*a.z);q.z+=v.z;float depth=max(.25,-q.z);gl_Position=vec4(q.x*1.9/v.w,q.y*1.9,-q.z-.2,depth);gl_PointSize=4.;d=clamp(1.-depth*.08,.32,1.);}`;
  const fragment = `precision mediump float;uniform vec4 c;varying float d;void main(){gl_FragColor=vec4(c.rgb*d,c.a);}`;
  const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  gl.useProgram(program);

  const position = gl.getAttribLocation(program, 'p');
  const view = gl.getUniformLocation(program, 'v');
  const color = gl.getUniformLocation(program, 'c');
  const make = (values, dynamic = false) => { const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); return { buffer, count: values.length / 3 }; };
  const update = (part, values) => { gl.bindBuffer(gl.ARRAY_BUFFER, part.buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.DYNAMIC_DRAW); part.count = values.length / 3; };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let yaw = -.5, pitch = .12, zoom = -2.62;
  let dragging = false, lastX = 0, lastY = 0, autoRotate = !reduceMotion, resumeTimer = 0;
  let laserX = 0, laserY = 0, laserTargetX = 0, laserTargetY = 0;
  let model, baseRayPath = [];

  const rayPathFromSegments = (segments) => {
    const points = [];
    for (let index = 0; index < segments.length; index += 6) {
      if (index === 0) points.push(segments.slice(index, index + 3));
      points.push(segments.slice(index + 3, index + 6));
    }
    return points;
  };
  const segmentsFromPath = (points) => {
    const segments = [];
    for (let index = 0; index < points.length - 1; index += 1) segments.push(...points[index], ...points[index + 1]);
    return segments;
  };
  const movingPaths = (angleX, angleY) => {
    const last = Math.max(1, baseRayPath.length - 1);
    const points = baseRayPath.map((point, index) => {
      const progress = index / last;
      const inside = Math.sin(Math.PI * progress);
      const alternating = index % 2 ? 1 : -1;
      const moved = [point[0] + angleX * (.035 + inside * .055), point[1] - angleY * (.12 - progress * .04) + alternating * angleX * inside * .018, point[2] + angleX * (.14 - progress * .05) + alternating * angleY * inside * .028];
      if (index > 0 && index < last) return [clamp(moved[0], -.92, .93), clamp(moved[1], -.46, .68), clamp(moved[2], -.46, .41)];
      return moved;
    });
    const hit = points[1];
    const originalSource = points[0];
    const dx = hit[0] - originalSource[0], dy = hit[1] - originalSource[1], dz = hit[2] - originalSource[2];
    const length = Math.hypot(dx, dy, dz) || 1;
    const shortSource = [hit[0] - dx / length * .5, hit[1] - dy / length * .5, hit[2] - dz / length * .5];
    return { input: [...shortSource, ...hit], internal: segmentsFromPath(points.slice(1, -1)) };
  };
  const projectorFan = (angleX, angleY) => {
    const paths = movingPaths(angleX, angleY);
    const s = paths.input.slice(0, 3), h = paths.input.slice(3, 6);
    const spread = .055;
    return [...s, h[0], h[1] + spread, h[2] - spread, ...s, h[0], h[1] - spread, h[2] + spread, ...s, h[0], h[1] + spread, h[2] - spread];
  };

  const resize = () => {
    const scale = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(host.clientWidth * scale), height = Math.round(host.clientHeight * scale);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); }
  };
  const drawPart = (part, mode, rgba, width = 1) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, part.buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(color, rgba);
    gl.lineWidth(width);
    gl.drawArrays(mode, 0, part.count);
  };

  const render = () => {
    resize();
    if (autoRotate && !dragging) yaw += .00125;
    laserX += (laserTargetX - laserX) * .075;
    laserY += (laserTargetY - laserY) * .075;
    const paths = movingPaths(laserX, laserY);
    update(model.inputRay, paths.input);
    update(model.rays, paths.internal);
    update(model.projector, projectorFan(laserX, laserY));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.uniform4f(view, yaw, pitch, zoom, canvas.width / canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    drawPart(model.projector, gl.TRIANGLES, [.36, .72, 1, .16]);
    drawPart(model.glass, gl.TRIANGLES, [.12, .45, .72, .22]);
    gl.depthMask(true);
    drawPart(model.mirror, gl.TRIANGLES, [.7, .82, .9, .82]);
    drawPart(model.wire, gl.LINES, [.4, .72, .92, .55]);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    drawPart(model.inputRay, gl.LINES, [.18, .62, 1, .5], 2);
    drawPart(model.rays, gl.LINES, [.02, .3, 1, .22], 6);
    drawPart(model.rays, gl.LINES, [.12, .76, 1, 1], 2);
    drawPart(model.rays, gl.POINTS, [.72, .94, 1, .9], 1);
    requestAnimationFrame(render);
  };

  host.addEventListener('pointerdown', (event) => { dragging = true; autoRotate = false; window.clearTimeout(resumeTimer); lastX = event.clientX; lastY = event.clientY; host.classList.add('is-dragging'); host.setPointerCapture(event.pointerId); });
  host.addEventListener('pointermove', (event) => { if (!dragging) return; yaw += (event.clientX - lastX) * .008; pitch = clamp(pitch + (event.clientY - lastY) * .008, -1.15, 1.15); lastX = event.clientX; lastY = event.clientY; });
  const stopDragging = () => { dragging = false; autoRotate = !reduceMotion; host.classList.remove('is-dragging'); };
  host.addEventListener('pointerup', stopDragging);
  host.addEventListener('pointercancel', stopDragging);
  host.addEventListener('wheel', (event) => { event.preventDefault(); autoRotate = false; window.clearTimeout(resumeTimer); zoom = clamp(zoom + event.deltaY * .002, -4.4, -1.95); resumeTimer = window.setTimeout(() => { autoRotate = !reduceMotion; }, 900); }, { passive: false });
  host.querySelector('[data-cloud-reset]').addEventListener('click', () => { yaw = -.5; pitch = .12; zoom = -2.62; laserTargetX = 0; laserTargetY = 0; autoRotate = !reduceMotion; if (hint) hint.textContent = 'Зажмите и вращайте модель'; });

  fetch(host.dataset.model || 'models/cloud-optics.json')
    .then((response) => { if (!response.ok) throw Error('model'); return response.json(); })
    .then((data) => {
      baseRayPath = rayPathFromSegments(data.rays);
      const paths = movingPaths(0, 0);
      model = { glass: make(data.glass), mirror: make(data.mirror), wire: make(data.wire), inputRay: make(paths.input, true), rays: make(paths.internal, true), projector: make(projectorFan(0, 0), true) };
      status.textContent = `${data.meta.mirrorTriangles} зеркальных граней · меняющийся маршрут лазера`;
      setTimeout(() => status.classList.add('is-hidden'), 1500);
      requestAnimationFrame(render);
    })
    .catch(() => { status.textContent = 'Не удалось загрузить модель'; });
})();
