/**************************************
    Huella Verde SAS - Motor de Animaciones
    Un solo loop de requestAnimationFrame coordina:

    1. SMOOTH SCROLL global (rueda interpolada, ritmo
       pausado): la página baja lenta y fluida.
    2. FONDO CINEMATOGRÁFICO: 7 frames que se funden
       entre sí según la posición del scroll.
    3. CÁMARA VIAJERA (inicio): sección fijada donde la
       "cámara" viaja en zigzag entre 4 fotos del trabajo
       real, cada una con su texto.
    4. RECORRIDO DE RAZONES (valor agregado): las 11
       razones aparecen una a una con fotos derivando.
    5. Parallax sutil en las portadas de servicios.
    6. Barra de progreso y hojas flotantes.

    Todo con transform/opacity y respetando
    prefers-reduced-motion (sin inercia ni zoom).
**************************************/

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function clamp01(v) {
        return clamp(v, 0, 1);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function maxScroll() {
        return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    /* ===================================
       LOOP MAESTRO
    =================================== */
    var loopRunning = false;

    function masterLoop() {
        var busy = false;
        if (smoothStep()) busy = true;
        if (frameStep()) busy = true;
        if (camStep()) busy = true;
        if (vjStep()) busy = true;
        if (busy) {
            window.requestAnimationFrame(masterLoop);
        } else {
            loopRunning = false;
        }
    }

    function wake() {
        if (!loopRunning) {
            loopRunning = true;
            window.requestAnimationFrame(masterLoop);
        }
    }

    /* ===================================
       1. SMOOTH SCROLL (rueda del mouse)
       Ritmo pausado: cada giro de rueda avanza
       poco y la inercia lo asienta suavemente.
    =================================== */
    var sm = {
        cur: window.scrollY || 0,
        tgt: window.scrollY || 0,
        active: false,
        EASE: 0.08,
        WHEEL_FACTOR: 0.55
    };

    // En la página de clientes el scroll va al 50%: cada logo
    // y estadística se aprecia con calma
    if (document.querySelector('.hv-marquee-wrap')) {
        sm.WHEEL_FACTOR = 0.28;
    }

    function smoothStep() {
        if (!sm.active) return false;
        sm.tgt = clamp(sm.tgt, 0, maxScroll());
        var diff = sm.tgt - sm.cur;
        if (Math.abs(diff) < 0.5) {
            sm.cur = sm.tgt;
            sm.active = false;
            window.scrollTo({ top: sm.cur, left: 0, behavior: 'instant' });
            return false;
        }
        sm.cur += diff * sm.EASE;
        window.scrollTo({ top: sm.cur, left: 0, behavior: 'instant' });
        return true;
    }

    function smoothScrollTo(y) {
        if (reducedMotion) {
            window.scrollTo(0, y);
            return;
        }
        if (!sm.active) sm.cur = window.scrollY;
        sm.tgt = clamp(y, 0, maxScroll());
        sm.active = true;
        wake();
    }

    if (!reducedMotion) {
        window.addEventListener('wheel', function (e) {
            // Zoom con ctrl, formularios y menú móvil abierto: comportamiento nativo
            if (e.ctrlKey) return;
            var t = e.target;
            if (t && t.closest && t.closest('textarea, select, input')) return;
            if (document.body.style.overflow === 'hidden') return;

            e.preventDefault();

            var delta = e.deltaY;
            if (e.deltaMode === 1) delta *= 16;          // líneas -> px (Firefox)
            else if (e.deltaMode === 2) delta *= window.innerHeight;

            if (!sm.active) {
                sm.cur = window.scrollY;
                sm.tgt = window.scrollY;
            }
            sm.tgt = clamp(sm.tgt + delta * sm.WHEEL_FACTOR, 0, maxScroll());
            sm.active = true;
            wake();
        }, { passive: false });

        // En táctil el momentum nativo manda: liberar el motor
        window.addEventListener('touchstart', function () {
            sm.active = false;
        }, { passive: true });
    }

    /* ===================================
       2. FONDO CINEMATOGRÁFICO (SCRUB DE FRAMES)
    =================================== */
    var frames = Array.prototype.slice.call(document.querySelectorAll('.hv-frame'));
    var fr = { pos: 0, tgt: 0, EASE: 0.07 };

    // Precargar todos los frames para que el scrub nunca parpadee
    frames.forEach(function (f) {
        var bg = getComputedStyle(f).backgroundImage;
        var match = /url\(["']?([^"')]+)["']?\)/.exec(bg);
        if (match) {
            var img = new Image();
            img.src = match[1];
        }
    });

    function renderFrames() {
        var base = Math.floor(fr.pos);
        var frac = fr.pos - base;

        for (var i = 0; i < frames.length; i++) {
            var op = 0;
            if (i === base) op = 1;
            else if (i === base + 1) op = frac;

            frames[i].style.opacity = op.toFixed(3);
            if (reducedMotion) {
                frames[i].style.transform = 'none';
            } else {
                var scale = i === base ? 1 : (1.05 - 0.05 * op);
                frames[i].style.transform = scale === 1 ? 'none' : 'scale(' + scale.toFixed(4) + ')';
            }
        }
    }

    function frameStep() {
        if (frames.length < 2) return false;
        var diff = fr.tgt - fr.pos;
        if (Math.abs(diff) < 0.0015) {
            if (fr.pos !== fr.tgt) {
                fr.pos = fr.tgt;
                renderFrames();
            }
            return false;
        }
        fr.pos += diff * fr.EASE;
        renderFrames();
        return true;
    }

    /* ===================================
       3. CÁMARA VIAJERA (inicio)
       El lienzo (.hv-cam) se desplaza entre los
       puntos del zigzag; cada parada enfoca una
       foto con su texto.
    =================================== */
    var showcase = document.querySelector('.hv-scroll-showcase');
    var showcaseSticky = showcase ? showcase.querySelector('.hv-showcase-sticky') : null;
    var showcaseHeader = showcase ? showcase.querySelector('.hv-scroll-header') : null;
    var showcaseMedia = showcase ? showcase.querySelector('.hv-showcase-media') : null;
    var camEl = showcase ? showcase.querySelector('.hv-cam') : null;
    var camStops = camEl ? camEl.querySelectorAll('.hv-cam-stop') : [];
    var camImgs = [];
    var cam = { pos: 0, tgt: 0, gate: 0, EASE: 0.075, dots: [] };

    // Debe coincidir con .hv-cam-stop--N del CSS (unidades vw/vh)
    var CAM_PTS = [
        { x: 0, y: 0 },
        { x: 58, y: 66 },
        { x: -54, y: 132 },
        { x: 52, y: 198 }
    ];
    var CAM_START = 0.10;  // la cámara arranca cuando el título ya se fue
    var CAM_SPAN = 0.86;   // tramo del recorrido dedicado al viaje

    camStops.forEach(function (s) {
        camImgs.push(s.querySelector('.hv-cam-photo img'));
    });

    function renderCam() {
        if (!camEl || camStops.length < 2) return;

        var i = Math.min(CAM_PTS.length - 2, Math.floor(cam.pos));
        var t = cam.pos - i;
        var x = lerp(CAM_PTS[i].x, CAM_PTS[i + 1].x, t);
        var y = lerp(CAM_PTS[i].y, CAM_PTS[i + 1].y, t);
        camEl.style.transform = 'translate3d(' + (-x).toFixed(3) + 'vw, ' + (-y).toFixed(3) + 'vh, 0)';

        showcaseMedia.style.opacity = cam.gate.toFixed(3);

        for (var k = 0; k < camStops.length; k++) {
            var weight = 1 - Math.min(1, Math.abs(cam.pos - k));
            camStops[k].style.opacity = (0.2 + 0.8 * weight).toFixed(3);

            // Contra-deriva sutil de la foto: profundidad de cámara real
            if (camImgs[k] && !reducedMotion) {
                if (weight > 0) {
                    var drift = (cam.pos - k) * -22;
                    camImgs[k].style.transform = 'translate3d(0, ' + drift.toFixed(1) + 'px, 0) scale(1.12)';
                } else {
                    camImgs[k].style.transform = 'scale(1.12)';
                }
            }

            if (cam.dots.length) {
                cam.dots[k].classList.toggle('active', k === Math.round(cam.pos));
            }
        }
    }

    function camStep() {
        if (!camEl || camStops.length < 2) return false;
        var diff = cam.tgt - cam.pos;
        if (Math.abs(diff) < 0.0012) {
            if (cam.pos !== cam.tgt) {
                cam.pos = cam.tgt;
                renderCam();
            }
            return false;
        }
        cam.pos += diff * cam.EASE;
        renderCam();
        return true;
    }

    // Puntos indicadores verticales (clic = viajar a esa foto)
    if (showcaseSticky && camStops.length > 1) {
        var dotsWrap = document.createElement('div');
        dotsWrap.className = 'hv-scroll-dots';
        dotsWrap.setAttribute('aria-label', 'Progreso del recorrido');

        camStops.forEach(function (stop, idx) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'hv-scroll-dot' + (idx === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Ir a la foto ' + (idx + 1) + ' de ' + camStops.length);
            dot.addEventListener('click', function () {
                var rect = showcase.getBoundingClientRect();
                var room = showcase.offsetHeight - window.innerHeight;
                var sectionTop = (window.scrollY || 0) + rect.top;
                var frac = idx / (camStops.length - 1);
                smoothScrollTo(sectionTop + (CAM_START + frac * CAM_SPAN) * room);
            });
            dotsWrap.appendChild(dot);
            cam.dots.push(dot);
        });
        showcaseSticky.appendChild(dotsWrap);
    }

    /* ===================================
       4. RECORRIDO DE RAZONES (valor agregado)
    =================================== */
    var vjSection = document.querySelector('.hv-valor-journey');
    var vjHeader = vjSection ? vjSection.querySelector('.hv-scroll-header') : null;
    var vjMedia = vjSection ? vjSection.querySelector('.hv-vj-media') : null;
    var vjCam = vjSection ? vjSection.querySelector('.hv-vj-cam') : null;
    var vjStops = vjCam ? vjCam.querySelectorAll('.hv-vj-stop') : [];
    var vjBigNum = vjSection ? vjSection.querySelector('.hv-vj-bignum') : null;
    var vjNum = vjSection ? vjSection.querySelector('.hv-vj-num') : null;
    var vjLine = vjSection ? vjSection.querySelector('.hv-vj-line-fill') : null;
    var vj = { pos: 0, tgt: 0, gate: 0, p: 0, EASE: 0.075, pts: [] };

    var VJ_START = 0.09;
    var VJ_SPAN = 0.88;

    // Zigzag del lienzo: cada razón sale por una esquina mientras
    // la siguiente llega por la opuesta (mismo lenguaje que inicio)
    if (vjStops.length) {
        for (var s = 0; s < vjStops.length; s++) {
            var zx = s === 0 ? 0 : (s % 2 === 1 ? 56 : -54) + (s % 3) * 2;
            var zy = s * 58;
            vj.pts.push({ x: zx, y: zy });
            vjStops[s].style.left = zx + 'vw';
            vjStops[s].style.top = zy + 'vh';
        }
    }

    function renderVj() {
        if (!vjCam || vjStops.length < 2) return;

        var i = Math.min(vj.pts.length - 2, Math.floor(vj.pos));
        var t = vj.pos - i;
        var x = lerp(vj.pts[i].x, vj.pts[i + 1].x, t);
        var y = lerp(vj.pts[i].y, vj.pts[i + 1].y, t);
        vjCam.style.transform = 'translate3d(' + (-x).toFixed(3) + 'vw, ' + (-y).toFixed(3) + 'vh, 0)';

        vjMedia.style.opacity = vj.gate.toFixed(3);

        for (var k = 0; k < vjStops.length; k++) {
            var weight = 1 - Math.min(1, Math.abs(vj.pos - k));
            vjStops[k].style.opacity = (0.15 + 0.85 * weight).toFixed(3);
        }

        var current = Math.round(vj.pos) + 1;
        var label = (current < 10 ? '0' : '') + current;

        // Número gigante de fondo (estilo specs)
        if (vjBigNum) {
            if (vjBigNum.textContent !== label) vjBigNum.textContent = label;
            vjBigNum.style.opacity = (0.85 * vj.gate).toFixed(3);
        }

        if (vjNum) {
            vjNum.textContent = label;
        }
        if (vjLine) {
            vjLine.style.transform = 'scaleX(' + (vj.pos / Math.max(1, vjStops.length - 1)).toFixed(4) + ')';
        }
    }

    function vjStep() {
        if (!vjCam || vjStops.length < 2) return false;
        var diff = vj.tgt - vj.pos;
        if (Math.abs(diff) < 0.0012) {
            if (vj.pos !== vj.tgt) {
                vj.pos = vj.tgt;
                renderVj();
            }
            return false;
        }
        vj.pos += diff * vj.EASE;
        renderVj();
        return true;
    }

    /* ===================================
       4b. CONTADORES ANIMADOS (clientes)
       Cuentan de 0 al valor al entrar en pantalla.
    =================================== */
    var counters = Array.prototype.slice.call(document.querySelectorAll('[data-hv-count]'));

    function startCounter(el) {
        var target = parseInt(el.getAttribute('data-hv-count'), 10) || 0;
        if (reducedMotion) {
            el.textContent = target;
            return;
        }
        var t0 = null;
        var DURATION = 1500;
        function tick(ts) {
            if (!t0) t0 = ts;
            var k = Math.min(1, (ts - t0) / DURATION);
            k = 1 - Math.pow(1 - k, 3); // ease-out cúbico
            el.textContent = Math.round(target * k);
            if (k < 1) window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);
    }

    function maybeStartCounters() {
        if (!counters.length) return;
        var vh = window.innerHeight;
        for (var i = counters.length - 1; i >= 0; i--) {
            var r = counters[i].getBoundingClientRect();
            if (r.top < vh * 0.88 && r.bottom > 0) {
                startCounter(counters[i]);
                counters.splice(i, 1);
            }
        }
    }

    /* ===================================
       4c. MARQUESINA: con reduced-motion queda
       estática, sin los logos duplicados del bucle.
    =================================== */
    if (reducedMotion) {
        document.querySelectorAll('.hv-marquee-track').forEach(function (track) {
            var half = track.children.length / 2;
            while (track.children.length > half) {
                track.removeChild(track.lastElementChild);
            }
        });
    }

    /* ===================================
       5. PARALLAX EN PORTADAS DE SERVICIOS
    =================================== */
    var parallaxImgs = Array.prototype.slice.call(
        document.querySelectorAll('.hv-servicio-img img')
    );

    // Filas de la marquesina: el scroll también las empuja
    // en direcciones opuestas (sensación de velocidad)
    var marqueeRows = Array.prototype.slice.call(
        document.querySelectorAll('.hv-marquee')
    );

    function renderParallaxImgs() {
        if (reducedMotion) return;
        var vh = window.innerHeight;
        for (var i = 0; i < parallaxImgs.length; i++) {
            var box = parallaxImgs[i].parentNode.getBoundingClientRect();
            if (box.bottom < -80 || box.top > vh + 80) continue;
            var rel = (box.top + box.height / 2 - vh / 2) / vh;
            parallaxImgs[i].style.transform =
                'translate3d(0, ' + (rel * -22).toFixed(1) + 'px, 0) scale(1.14)';
        }
    }

    /* ===================================
       BARRA DE PROGRESO
    =================================== */
    var progressBar = document.createElement('div');
    progressBar.className = 'hv-scroll-progress';
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progressBar);

    /* ===================================
       LECTURA DEL SCROLL
    =================================== */
    var ticking = false;

    function update() {
        ticking = false;

        var scrollY = window.scrollY || window.pageYOffset;
        var docH = maxScroll();
        var progress = docH > 0 ? scrollY / docH : 0;

        progressBar.style.transform = 'scaleX(' + progress + ')';

        // Re-sincronizar si el usuario movió el scroll por fuera del motor
        if (sm.active && Math.abs(scrollY - sm.cur) > 60) {
            sm.cur = scrollY;
            sm.tgt = scrollY;
            sm.active = false;
        }
        if (!sm.active) {
            sm.cur = scrollY;
            sm.tgt = scrollY;
        }

        // Objetivo del scrub de frames
        if (frames.length > 1) {
            fr.tgt = clamp01(progress) * (frames.length - 1);
            if (reducedMotion) {
                fr.pos = fr.tgt;
                renderFrames();
            } else {
                wake();
            }
        }

        // Cámara viajera (inicio)
        if (showcase && camEl) {
            var rect = showcase.getBoundingClientRect();
            var room = showcase.offsetHeight - window.innerHeight;
            var p = room > 0 ? clamp01(-rect.top / room) : 0;

            var hFade = clamp01(p / 0.1);
            if (showcaseHeader) {
                showcaseHeader.style.opacity = (1 - hFade).toFixed(3);
                showcaseHeader.style.pointerEvents = hFade > 0.9 ? 'none' : '';
                if (!reducedMotion) {
                    showcaseHeader.style.transform = 'translateY(' + (-70 * hFade).toFixed(1) + 'px)';
                }
            }

            cam.gate = clamp01((p - 0.06) / 0.09);
            cam.tgt = clamp01((p - CAM_START) / CAM_SPAN) * (camStops.length - 1);

            if (reducedMotion) {
                cam.pos = cam.tgt;
                renderCam();
            } else {
                wake();
            }
        }

        // Recorrido de razones (valor agregado)
        if (vjSection) {
            var vRect = vjSection.getBoundingClientRect();
            var vRoom = vjSection.offsetHeight - window.innerHeight;
            var vp = vRoom > 0 ? clamp01(-vRect.top / vRoom) : 0;
            vj.p = vp;

            var vFade = clamp01(vp / 0.09);
            if (vjHeader) {
                vjHeader.style.opacity = (1 - vFade).toFixed(3);
                vjHeader.style.pointerEvents = vFade > 0.9 ? 'none' : '';
                if (!reducedMotion) {
                    vjHeader.style.transform = 'translateY(' + (-70 * vFade).toFixed(1) + 'px)';
                }
            }

            vj.gate = clamp01((vp - 0.06) / 0.08);
            vj.tgt = clamp01((vp - VJ_START) / VJ_SPAN) * (vjStops.length - 1);

            if (reducedMotion) {
                vj.pos = vj.tgt;
                renderVj();
            } else {
                wake();
            }
        }

        // Parallax de portadas de servicios
        if (parallaxImgs.length) {
            renderParallaxImgs();
        }

        // La marquesina responde al scroll (filas en direcciones opuestas)
        if (marqueeRows.length === 2 && !reducedMotion) {
            var mShift = (scrollY * 0.08).toFixed(1);
            marqueeRows[0].style.transform = 'translate3d(-' + mShift + 'px, 0, 0)';
            marqueeRows[1].style.transform = 'translate3d(' + mShift + 'px, 0, 0)';
        }

        // Contadores de estadísticas
        maybeStartCounters();
    }

    function requestTick() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    update();
    renderFrames();
    renderCam();
    renderVj();

    /* ===================================
       6. HOJAS FLOTANTES EN EL FONDO
    =================================== */
    var leavesContainer = document.querySelector('.hv-bg-leaves');

    if (leavesContainer && !reducedMotion && window.innerWidth > 576) {
        var LEAF_COUNT = 9;
        for (var l = 0; l < LEAF_COUNT; l++) {
            var leaf = document.createElement('span');
            leaf.className = 'hv-leaf';

            var size = 13 + Math.random() * 13;          // 13px - 26px
            var duration = 18 + Math.random() * 16;      // 18s - 34s
            var delay = -Math.random() * duration;       // negativo: ya distribuidas al cargar
            var drift = (Math.random() * 22 - 11);       // -11vw a 11vw
            var rotation = 160 + Math.random() * 360;    // giro total
            var opacity = 0.2 + Math.random() * 0.25;    // 0.2 - 0.45

            leaf.style.left = (Math.random() * 100) + '%';
            leaf.style.width = size + 'px';
            leaf.style.height = size + 'px';
            leaf.style.setProperty('--dur', duration.toFixed(1) + 's');
            leaf.style.setProperty('--delay', delay.toFixed(1) + 's');
            leaf.style.setProperty('--driftX', drift.toFixed(1) + 'vw');
            leaf.style.setProperty('--rot', rotation.toFixed(0) + 'deg');
            leaf.style.setProperty('--op', opacity.toFixed(2));

            leavesContainer.appendChild(leaf);
        }
    }

})();
