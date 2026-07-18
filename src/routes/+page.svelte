<script>
  import { onMount } from 'svelte';
  let gsap;
  let ScrollTrigger;

  let inputText = $state('');
  let cards = $state([]);
  let loading = $state(false);
  let generating = $state(false);
  let analyzing = $state(false);
  let error = $state('');
  let output = $state('');
  let outputFormat = $state('');
  let editingIndex = $state(-1);
  let toneData = $state(null);
  let selectedMetric = $state('style');
  let analyzeTimer = null;

  async function decompose() {
    if (!inputText.trim()) return;
    loading = true; error = ''; output = ''; cards = []; toneData = null;
    try {
      const res = await fetch('/api/decompose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: inputText }) });
      cards = await res.json();
      await new Promise(r => setTimeout(r, 60));
      gsap.fromTo('.card-item', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.09, ease: 'power3.out' });
    } catch (e) { error = 'Something went wrong.'; }
    loading = false;
  }

  async function generateOutput(format) {
    if (!cards.length) return;
    generating = true; outputFormat = format; output = ''; toneData = null;
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cards, format }) });
      const data = await res.json();
      output = data.text;
      analyzeOutput(output);
      await new Promise(r => setTimeout(r, 60));
      gsap.fromTo('.output-block', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    } catch (e) { error = 'Generation failed.'; }
    generating = false;
  }

  async function analyzeOutput(text) {
    if (!text.trim()) return;
    analyzing = true;
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      toneData = await res.json();
      await new Promise(r => setTimeout(r, 80));
      gsap.fromTo('.bar-fill-anim', { width: '0%' }, { width: (i, el) => el.dataset.val + '%', duration: 1.2, stagger: 0.05, ease: 'power3.out' });
    } catch (e) {}
    analyzing = false;
  }

  function onOutputInput(e) {
    output = e.target.value;
    clearTimeout(analyzeTimer);
    analyzeTimer = setTimeout(() => analyzeOutput(output), 1200);
  }

  $effect(() => {
    if (toneData) setTimeout(() => {
      gsap.fromTo('.bar-fill-anim', { width: '0%' }, { width: (i, el) => el.dataset.val + '%', duration: 1.2, stagger: 0.05, ease: 'power3.out' });
    }, 80);
  });

  const typeConfig = {
    priority: { label: 'Priority', color: '#E8281E' },
    summary: { label: 'Summary', color: '#111' },
    reflection: { label: 'Reflection', color: '#888' }
  };
  const formatLabels = { report: 'Professional Report', journal: 'Reflective Journal', update: 'Concise Update' };
  const metrics = [{ id: 'style', label: 'Writing Style' }, { id: 'mood', label: 'Author Mood' }, { id: 'distribution', label: 'Card Distribution' }];
  const styleLabels = { academic: 'Academic', formal: 'Formal', casual: 'Casual', humorous: 'Humorous', poetic: 'Poetic', persuasive: 'Persuasive', narrative: 'Narrative' };
  const moodLabels = { happy: 'Happy', anxious: 'Anxious', sad: 'Sad', angry: 'Angry', excited: 'Excited', bored: 'Bored', calm: 'Calm', nostalgic: 'Nostalgic' };

  function getDistribution() {
    if (!cards.length) return [];
    const counts = {};
    for (const c of cards) counts[c.type] = (counts[c.type] || 0) + 1;
    const total = cards.length;
    return Object.entries(counts).map(([type, count]) => ({ type, count, pct: Math.round((count / total) * 100), cfg: typeConfig[type] ?? { label: type, color: '#888' } }));
  }

  onMount(async () => {
    const gsapModule = await import('gsap');
    gsap = gsapModule.default;
    const stModule = await import('gsap/ScrollTrigger');
    ScrollTrigger = stModule.ScrollTrigger ?? stModule.default?.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Custom cursor
    const cursor = document.querySelector('.cursor');
    const cursorInner = document.querySelector('.cursor-inner');
    let mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      gsap.to(cursorInner, { x: mx - 3, y: my - 3, duration: 0.08 });
    });

    function tickCursor() {
      cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1;
      gsap.set(cursor, { x: cx - 18, y: cy - 18 });
      requestAnimationFrame(tickCursor);
    }
    tickCursor();

    document.querySelectorAll('button, a, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 2, borderColor: '#E8281E', duration: 0.25 }));
      el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, borderColor: '#111', duration: 0.25 }));
    });

    // Hero parallax
    const hero = document.querySelector('.hero');
    hero?.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      gsap.to('.hero-img-placeholder', { x: dx * 24, y: dy * 16, duration: 0.6, ease: 'power2.out' });
      gsap.to('.hero-coords', { x: dx * -12, y: dy * -8, duration: 0.6, ease: 'power2.out' });
    });

    window.addEventListener('mousemove', e => {
      const coordEl = document.getElementById('coords');
      if (coordEl) coordEl.textContent = `${String(e.clientX).padStart(4,'0')} X ${String(e.clientY).padStart(4,'0')} Y`;
    });

    // Entrance
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo('.nav', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' })
      .fromTo('.hero-eyebrow', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      .fromTo('.hero-title', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3')
      .fromTo('.hero-img-placeholder', { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.6')
      .fromTo('.hero-desc-cell', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4')
      .fromTo('.hero-bottom', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.2');

    // Scroll reveals
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.fromTo(el, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 84%', toggleActions: 'play none none none' }
      });
    });

    gsap.utils.toArray('.reveal-line').forEach(el => {
      gsap.fromTo(el, { scaleX: 0 }, {
        scaleX: 1, duration: 1.2, ease: 'power3.out', transformOrigin: 'left',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    // Magnetic buttons
    document.querySelectorAll('.mag').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
      });
    });

    // Card tilt
    function initTilt() {
      document.querySelectorAll('.card-item').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: dx * 10, rotateX: -dy * 10, duration: 0.3, ease: 'power2.out', transformPerspective: 800 });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
        });
      });
    }
    const obs = new MutationObserver(initTilt);
    const grid = document.querySelector('.cards-grid');
    if (grid) obs.observe(grid, { childList: true, subtree: true });

    // Scan line
    gsap.to('.scan-line', {
      y: '100vh', duration: 5, ease: 'none', repeat: -1,
      modifiers: { y: gsap.utils.wrap(-2, window.innerHeight + 2) }
    });

    // Counter
    gsap.utils.toArray('.count-num').forEach(el => {
      const target = parseInt(el.dataset.target);
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => gsap.fromTo({ v: 0 }, { v: target }, {
          duration: 1.8, ease: 'power2.out',
          onUpdate: function() { el.textContent = Math.round(this.targets()[0].v); },
          onComplete: () => {
            // After counter finishes, wrap chars for repulsion
            el.innerHTML = el.textContent.split('').map(ch =>
              `<span class="repel-char" style="display:inline-block;will-change:transform;">${ch}</span>`
            ).join('');
          }
        })
      });
    });

    // Text repulsion
    function initTextRepulsion() {
      function wrapEl(el) {
        Array.from(el.childNodes).forEach(node => {
          if (node.nodeType === 3) {
            const text = node.textContent;
            if (!text.trim()) return;
            const span = document.createElement('span');
            span.className = 'repel-word-wrap';
            span.innerHTML = text.split('').map(ch =>
              ch === ' ' ? '&nbsp;' : `<span class="repel-char" style="display:inline-block;will-change:transform;">${ch}</span>`
            ).join('');
            node.parentNode.replaceChild(span, node);
          } else if (node.nodeType === 1) {
            const tag = node.tagName?.toLowerCase();
            if (tag === 'br' || tag === 'span' && node.classList.contains('no-repel')) return;
            if (node.classList?.contains('no-repel')) return;
            if (node.classList?.contains('count-num')) return;
            wrapEl(node);
          }
        });
      }

      document.querySelectorAll('.repel-text').forEach(el => wrapEl(el));

      window.addEventListener('mousemove', e => {
        document.querySelectorAll('.repel-char').forEach(char => {
          const r = char.getBoundingClientRect();
          const charCx = r.left + r.width / 2;
          const charCy = r.top + r.height / 2;
          const dx = e.clientX - charCx;
          const dy = e.clientY - charCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 80;
          if (dist < radius) {
            const force = (radius - dist) / radius;
            const angle = Math.atan2(dy, dx);
            gsap.to(char, { x: -Math.cos(angle) * force * 22, y: -Math.sin(angle) * force * 22, duration: 0.2, ease: 'power2.out', overwrite: true });
          } else {
            gsap.to(char, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)', overwrite: true });
          }
        });
      });
    }
    initTextRepulsion();

    // Geometric breathing
    function initGeo() {
      const geos = document.querySelectorAll('.geo');
      geos.forEach(el => {
        gsap.to(el, { x: () => (Math.random() - 0.5) * 70, y: () => (Math.random() - 0.5) * 70, rotation: () => (Math.random() - 0.5) * 140, duration: () => 7 + Math.random() * 9, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: Math.random() * 5 });
        gsap.to(el, { opacity: () => 0.02 + Math.random() * 0.09, duration: () => 3 + Math.random() * 5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: Math.random() * 3 });
        gsap.to(el, { scale: () => 0.8 + Math.random() * 0.4, duration: () => 5 + Math.random() * 6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: Math.random() * 4 });
      });
      window.addEventListener('mousemove', e => {
        geos.forEach(el => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            const angle = Math.atan2(dy, dx);
            gsap.to(el, { x: '+=' + (-Math.cos(angle) * force * 50), y: '+=' + (-Math.sin(angle) * force * 50), duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
          }
        });
      });
    }
    initGeo();

    // Pulsing circles
    function initPulse() {
      const pulseContainer = document.querySelector('.pulse-svg');
      if (!pulseContainer) return;

      const positions = [
        { cx: 180, cy: 420 },
        { cx: 1220, cy: 200 },
        { cx: 680, cy: 760 },
      ];

      positions.forEach((pos, gi) => {
        [0, 1, 2, 3].forEach(i => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          const baseR = 16 + i * 26;
          circle.setAttribute('cx', pos.cx);
          circle.setAttribute('cy', pos.cy);
          circle.setAttribute('r', baseR);
          circle.setAttribute('fill', 'none');
          circle.setAttribute('stroke', '#E8281E');
          circle.setAttribute('stroke-width', i === 0 ? '2' : '1');
          circle.setAttribute('opacity', (0.55 - i * 0.1).toString());
          pulseContainer.appendChild(circle);

          gsap.to(circle, {
            attr: { r: baseR + 80, opacity: 0 },
            duration: 2.2 + i * 0.5,
            ease: 'power1.out',
            repeat: -1,
            delay: gi * 1.1 + i * 0.45,
            repeatDelay: 0.3
          });
        });
      });
    }
    initPulse();
  });
</script>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { background: #F5F4F0; color: #111; font-family: 'SF Pro Text', system-ui, -apple-system, sans-serif; overflow-x: hidden; cursor: none; }
  :global(::selection) { background: #E8281E; color: #fff; }
  :global(.repel-word-wrap) { display: inline; }
  :global(.geo) { will-change: transform, opacity; transform-box: fill-box; transform-origin: center; }
  :global(.no-repel) { display: inline; }

  .cursor { position: fixed; width: 36px; height: 36px; border: 1.5px solid #111; border-radius: 50%; pointer-events: none; z-index: 9999; will-change: transform; mix-blend-mode: multiply; }
  .cursor-inner { position: fixed; width: 6px; height: 6px; background: #E8281E; border-radius: 50%; pointer-events: none; z-index: 9999; will-change: transform; }
  .scan-line { position: fixed; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(232,40,30,0.1), transparent); pointer-events: none; z-index: 5; top: -1px; }

  /* NAV */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border-bottom: 1px solid #DDD; background: rgba(245,244,240,0.92); backdrop-filter: blur(16px); }
  .nav-cell { padding: 16px 24px; border-right: 1px solid #DDD; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #111; display: flex; align-items: center; }
  .nav-cell:last-child { border-right: none; justify-content: flex-end; }
  .nav-logo { font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .nav-red-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8281E; animation: blink 2s ease-in-out infinite; flex-shrink: 0; }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  .nav-tag { color: #888; font-size: 11px; }

  /* HERO */
  .hero { min-height: 100vh; padding-top: 57px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; grid-template-rows: auto 1fr auto; border-bottom: 1px solid #DDD; overflow: hidden; position: relative; }

  .geo-layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; overflow: visible; }
  .pulse-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; overflow: hidden; }

  .hero-eyebrow { grid-column: 1 / 3; padding: 32px 24px 24px; border-right: 1px solid #DDD; border-bottom: 1px solid #DDD; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #888; display: flex; align-items: flex-start; gap: 10px; position: relative; z-index: 2; }
  .eyebrow-dot { color: #E8281E; font-size: 16px; line-height: 1; margin-top: -2px; flex-shrink: 0; }

  .hero-desc-cell { grid-column: 3 / 5; padding: 32px 24px 24px; border-bottom: 1px solid #DDD; font-size: 14px; color: #555; line-height: 1.7; font-family: 'SF Mono', monospace; position: relative; z-index: 2; }

  .hero-main { grid-column: 1 / 5; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border-bottom: 1px solid #DDD; position: relative; z-index: 2; }

  .hero-title-cell { grid-column: 1 / 3; padding: 48px 24px; border-right: 1px solid #DDD; display: flex; flex-direction: column; justify-content: space-between; }
  .hero-title { font-size: clamp(52px, 7vw, 96px); font-weight: 700; letter-spacing: -0.04em; line-height: 0.92; will-change: transform; }
  :global(.hero-title em) { font-style: normal; color: #E8281E; }

  .hero-img-cell { grid-column: 3 / 5; border-left: 1px solid #DDD; position: relative; overflow: hidden; min-height: 400px; }
  .hero-img-placeholder { position: absolute; inset: 0; background: transparent; display: flex; align-items: center; justify-content: center; will-change: transform; z-index: 0; }
  .placeholder-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(0,0,0,0.25); writing-mode: vertical-rl; }

  .hero-bottom { grid-column: 1 / 5; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; position: relative; z-index: 2; }
  .hero-stat { padding: 20px 24px; border-right: 1px solid #DDD; }
  .hero-stat:last-child { border-right: none; }
  .stat-num { font-size: 36px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px; }
  .stat-label { font-size: 10px; color: #888; letter-spacing: 0.12em; text-transform: uppercase; }
  .hero-coords { position: absolute; bottom: 20px; right: 24px; font-size: 10px; color: #888; letter-spacing: 0.1em; font-family: monospace; will-change: transform; z-index: 3; }

  /* MAIN */
  .main { position: relative; z-index: 10; }
  .section { border-bottom: 1px solid #DDD; position: relative; overflow: hidden; }
  .section-geo { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: visible; }
  .section-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; position: relative; z-index: 2; }
  .section-left { border-right: 1px solid #DDD; padding: 56px 24px; position: relative; }
  .section-num { font-size: 72px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin-bottom: 24px; -webkit-text-stroke: 1px #DDD; color: transparent; }
  .section-tag { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #E8281E; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
  .tag-dash { width: 16px; height: 1px; background: #E8281E; display: inline-block; flex-shrink: 0; transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }
  .section-tag:hover .tag-dash { width: 32px; }
  .section-title { font-size: clamp(24px, 3vw, 40px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
  .section-right { grid-column: 2 / 5; padding: 56px 32px; }
  .reveal-line { height: 1px; background: #DDD; margin-bottom: 40px; transform-origin: left; }

  /* INPUT */
  .input-area { width: 100%; min-height: 180px; background: #fff; border: 1px solid #DDD; padding: 24px; font-size: 15px; font-family: 'SF Mono', monospace; color: #111; line-height: 1.75; resize: none; outline: none; transition: border-color 0.25s, box-shadow 0.25s; margin-bottom: 16px; caret-color: #E8281E; }
  .input-area:focus { border-color: #E8281E; box-shadow: 0 0 0 3px rgba(232,40,30,0.06); }
  .input-area::placeholder { color: #CCC; }
  .input-row { display: flex; align-items: center; justify-content: space-between; }
  .char-count { font-size: 11px; color: #BBB; font-family: monospace; }

  .btn-primary { position: relative; overflow: hidden; background: #111; color: #F5F4F0; border: none; padding: 14px 36px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; cursor: none; transition: color 0.3s; }
  .btn-primary::after { content: ''; position: absolute; inset: 0; background: #E8281E; transform: translateX(-101%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
  .btn-primary:hover::after { transform: translateX(0); }
  .btn-primary span { position: relative; z-index: 1; }
  .btn-primary:disabled { opacity: 0.3; pointer-events: none; }

  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1px; background: #DDD; border: 1px solid #DDD; margin-bottom: 28px; }
  .card-item { background: #F5F4F0; padding: 28px; transition: background 0.2s; transform-style: preserve-3d; will-change: transform; }
  .card-item:hover { background: #fff; }
  .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .card-type { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; color: #888; }
  .card-dot { width: 5px; height: 5px; border-radius: 50%; }
  .card-remove { background: none; border: none; color: #CCC; cursor: none; font-size: 18px; padding: 0; transition: color 0.15s; }
  .card-remove:hover { color: #E8281E; }
  .card-content { font-size: 14px; line-height: 1.7; color: #444; cursor: text; }
  .card-hint { font-size: 10px; color: #CCC; margin-top: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
  .card-textarea { width: 100%; font-size: 14px; line-height: 1.7; color: #444; background: transparent; border: none; outline: none; resize: none; font-family: inherit; caret-color: #E8281E; }

  .add-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .add-label { font-size: 10px; color: #AAA; letter-spacing: 0.14em; text-transform: uppercase; }
  .btn-ghost { background: none; border: 1px solid #DDD; color: #888; padding: 7px 16px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; cursor: none; transition: all 0.2s; }
  .btn-ghost:hover { border-color: #E8281E; color: #E8281E; }

  .format-tabs { display: flex; gap: 1px; background: #DDD; border: 1px solid #DDD; margin-bottom: 32px; }
  .btn-tab { flex: 1; background: #F5F4F0; border: none; padding: 16px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; cursor: none; transition: all 0.2s; position: relative; overflow: hidden; }
  .btn-tab::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #E8281E; transform: scaleX(0); transition: transform 0.3s; }
  .btn-tab:hover { background: #fff; color: #111; }
  .btn-tab:hover::after { transform: scaleX(1); }
  .btn-tab.active { background: #fff; color: #E8281E; }
  .btn-tab.active::after { transform: scaleX(1); }
  .btn-tab:disabled { opacity: 0.3; pointer-events: none; }

  .output-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #888; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .output-label::before { content: ''; width: 14px; height: 1px; background: #E8281E; }
  .output-textarea { width: 100%; font-family: 'SF Mono', monospace; font-size: 14px; line-height: 1.85; color: #333; background: #fff; border: 1px solid #DDD; padding: 28px; resize: none; outline: none; transition: border-color 0.25s; min-height: 260px; caret-color: #E8281E; }
  .output-textarea:focus { border-color: #E8281E; }

  .patterns-wrap { display: grid; grid-template-columns: 1fr 140px; gap: 60px; align-items: start; }
  .bar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .bar-name { font-size: 11px; color: #888; width: 88px; flex-shrink: 0; letter-spacing: 0.06em; text-transform: uppercase; }
  .bar-track { flex: 1; height: 1px; background: #E8E6E0; position: relative; overflow: hidden; }
  .bar-fill-anim { position: absolute; top: 0; left: 0; height: 1px; width: 0%; background: #E8281E; }
  .bar-val { font-size: 10px; color: #AAA; width: 24px; text-align: right; font-family: monospace; }
  .metric-nav { display: flex; flex-direction: column; }
  .btn-metric { background: none; border: none; text-align: left; padding: 12px 0; font-size: 10px; letter-spacing: 0.16em; color: #BBB; cursor: none; border-bottom: 1px solid #EEE; transition: color 0.2s; text-transform: uppercase; }
  .btn-metric:last-child { border-bottom: none; }
  .btn-metric:hover { color: #111; }
  .btn-metric.active { color: #E8281E; }

  .empty { padding: 40px 0; color: #CCC; font-size: 13px; font-family: monospace; }
  .spinner { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #EEE; border-top-color: #E8281E; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 8px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-row { display: flex; align-items: center; color: #AAA; font-size: 12px; padding: 28px 0; letter-spacing: 0.08em; font-family: monospace; }
  .error { color: #E8281E; font-size: 12px; margin-top: 10px; font-family: monospace; }

  .wide-img-placeholder { background: #F0C4C0; width: 100%; height: 260px; display: flex; align-items: center; justify-content: center; margin-bottom: 36px; }
  .wide-img-placeholder span { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(0,0,0,0.25); }

  .footer { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border-top: 1px solid #DDD; }
  .footer-cell { padding: 20px 24px; border-right: 1px solid #DDD; font-size: 11px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }
  .footer-cell:last-child { border-right: none; }
  .footer-red { color: #E8281E; }
</style>

<div class="cursor"></div>
<div class="cursor-inner"></div>
<div class="scan-line"></div>

<!-- NAV -->
<nav class="nav">
  <div class="nav-cell nav-logo">
    <div class="nav-red-dot"></div>
    <span class="repel-text">CoDraft</span>
  </div>
  <div class="nav-cell nav-tag repel-text">Adaptive Writing Workflows</div>
  <div class="nav-cell nav-tag repel-text">AI Writing System</div>
  <div class="nav-cell repel-text">writing-decomposer.vercel.app</div>
</nav>

<!-- HERO -->
<div class="hero">
  <svg class="geo-layer" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <circle class="geo" cx="120" cy="200" r="60" fill="none" stroke="#E8281E" stroke-width="1" opacity="0.06"/>
    <circle class="geo" cx="1280" cy="150" r="100" fill="none" stroke="#111" stroke-width="0.5" opacity="0.05"/>
    <circle class="geo" cx="700" cy="80" r="30" fill="#E8281E" opacity="0.04"/>
    <circle class="geo" cx="900" cy="600" r="150" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.03"/>
    <circle class="geo" cx="200" cy="700" r="20" fill="#111" opacity="0.05"/>
    <rect class="geo" x="50" y="580" width="80" height="80" fill="none" stroke="#111" stroke-width="1" opacity="0.05" transform="rotate(20,90,620)"/>
    <rect class="geo" x="1200" y="480" width="120" height="120" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.05" transform="rotate(-15,1260,540)"/>
    <rect class="geo" x="580" y="700" width="40" height="40" fill="#111" opacity="0.04" transform="rotate(45,600,720)"/>
    <rect class="geo" x="350" y="150" width="60" height="60" fill="none" stroke="#E8281E" stroke-width="1" opacity="0.04" transform="rotate(30,380,180)"/>
    <line class="geo" x1="200" y1="100" x2="400" y2="300" stroke="#111" stroke-width="1" opacity="0.05"/>
    <line class="geo" x1="1000" y1="50" x2="1300" y2="250" stroke="#E8281E" stroke-width="0.5" opacity="0.06"/>
    <line class="geo" x1="0" y1="500" x2="150" y2="700" stroke="#111" stroke-width="1" opacity="0.04"/>
    <line class="geo" x1="600" y1="400" x2="800" y2="600" stroke="#E8281E" stroke-width="0.5" opacity="0.04"/>
    <polygon class="geo" points="800,100 850,180 750,180" fill="none" stroke="#E8281E" stroke-width="1" opacity="0.06"/>
    <polygon class="geo" points="100,380 140,450 60,450" fill="none" stroke="#111" stroke-width="0.5" opacity="0.05"/>
    <polygon class="geo" points="1300,340 1340,410 1260,410" fill="#E8281E" opacity="0.03"/>
    <ellipse class="geo" cx="400" cy="730" rx="80" ry="40" fill="none" stroke="#111" stroke-width="0.5" opacity="0.05"/>
    <ellipse class="geo" cx="1100" cy="680" rx="50" ry="100" fill="none" stroke="#E8281E" stroke-width="1" opacity="0.05"/>
    <path class="geo" d="M 300 400 Q 500 300 700 400 T 1100 400" fill="none" stroke="#111" stroke-width="0.5" opacity="0.04"/>
    <path class="geo" d="M 0 600 Q 200 500 400 600 T 800 600" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.05"/>
  </svg>

  <svg class="pulse-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice">
  </svg>

  <div class="hero-eyebrow">
    <span class="eyebrow-dot">●</span>
    <span class="repel-text">Adaptive AI Writing Workflows — CoDraft 2026</span>
  </div>
  <div class="hero-desc-cell repel-text">
    Turn raw thoughts into structured writing.<br>
    AI decomposes, you decide, patterns emerge.
  </div>

  <div class="hero-main">
    <div class="hero-title-cell">
      <h1 class="hero-title repel-text">
        Turn raw<br>
        thoughts<br>
        into <em class="no-repel">structured</em><br>
        writing.
      </h1>
    </div>
    <div class="hero-img-cell">
      <div class="hero-img-placeholder">
        <img src="/square.png" alt="CoDraft" style="width:100%;height:100%;object-fit:contain;background:transparent;" />
      </div>
      <div class="hero-coords repel-text" id="coords">0000 X 0000 Y</div>
    </div>
  </div>

  <div class="hero-bottom">
    <div class="hero-stat">
      <div class="stat-num repel-text"><span class="count-num" data-target="3">0</span></div>
      <div class="stat-label repel-text">API Endpoints</div>
    </div>
    <div class="hero-stat">
      <div class="stat-num repel-text"><span class="count-num" data-target="3">0</span></div>
      <div class="stat-label repel-text">Output Formats</div>
    </div>
    <div class="hero-stat">
      <div class="stat-num repel-text"><span class="count-num" data-target="15">0</span></div>
      <div class="stat-label repel-text">Pattern Metrics</div>
    </div>
    <div class="hero-stat">
      <div class="stat-num repel-text"><span class="count-num" data-target="100">0</span>%</div>
      <div class="stat-label repel-text">User-Controlled</div>
    </div>
  </div>
</div>

<!-- MAIN -->
<div class="main">

  <!-- 01 -->
  <div class="section reveal">
    <svg class="section-geo" viewBox="0 0 1400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <circle class="geo" cx="80" cy="300" r="40" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.05"/>
      <rect class="geo" x="1300" y="100" width="60" height="60" fill="none" stroke="#111" stroke-width="0.5" opacity="0.04" transform="rotate(25,1330,130)"/>
      <line class="geo" x1="1200" y1="400" x2="1400" y2="200" stroke="#E8281E" stroke-width="0.5" opacity="0.05"/>
      <polygon class="geo" points="700,50 730,100 670,100" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.04"/>
    </svg>
    <div class="section-grid">
      <div class="section-left">
        <div class="section-num repel-text">01</div>
        <div class="section-tag"><span class="tag-dash"></span><span class="repel-text">Input</span></div>
        <div class="section-title repel-text">Your raw<br>notes,<br>unfiltered.</div>
      </div>
      <div class="section-right">
        <div class="reveal-line"></div>
        <img src="/horrizontal.png" alt="Writing concept" style="width:100%;height:260px;object-fit:cover;margin-bottom:36px;display:block;" />
        <textarea class="input-area" bind:value={inputText} placeholder="Paste your thoughts here..." rows="7"></textarea>
        <div class="input-row">
          <span class="char-count">{inputText.length} chars</span>
          <button class="btn-primary mag" onclick={decompose} disabled={loading}>
            {#if loading}<span class="spinner"></span>{/if}
            <span>{loading ? 'Analyzing...' : 'Decompose →'}</span>
          </button>
        </div>
        {#if error}<div class="error">{error}</div>{/if}
      </div>
    </div>
  </div>

  <!-- 02 -->
  <div class="section reveal">
    <svg class="section-geo" viewBox="0 0 1400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <ellipse class="geo" cx="1350" cy="300" rx="60" ry="120" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.05"/>
      <rect class="geo" x="50" y="400" width="50" height="50" fill="none" stroke="#111" stroke-width="0.5" opacity="0.04" transform="rotate(-20,75,425)"/>
      <circle class="geo" cx="700" cy="550" r="25" fill="#E8281E" opacity="0.03"/>
      <line class="geo" x1="0" y1="100" x2="200" y2="300" stroke="#111" stroke-width="0.5" opacity="0.04"/>
    </svg>
    <div class="section-grid">
      <div class="section-left">
        <div class="section-num repel-text">02</div>
        <div class="section-tag"><span class="tag-dash"></span><span class="repel-text">Structure</span></div>
        <div class="section-title repel-text">Edit,<br>remove,<br>reshape.</div>
      </div>
      <div class="section-right">
        <div class="reveal-line"></div>
        {#if cards.length === 0 && !loading}
          <div class="empty">Cards will appear after decomposition.</div>
        {:else if loading}
          <div class="loading-row"><span class="spinner"></span>Breaking down your notes...</div>
        {:else}
          <div class="cards-grid">
            {#each cards as card, i}
              {@const cfg = typeConfig[card.type] ?? { label: card.type, color: '#888' }}
              <div class="card-item">
                <div class="card-head">
                  <div class="card-type">
                    <span class="card-dot" style="background:{cfg.color}"></span>
                    {cfg.label}
                  </div>
                  {#if cards.length > 1}
                    <button class="card-remove" onclick={() => cards = cards.filter((_, idx) => idx !== i)}>×</button>
                  {/if}
                </div>
                {#if editingIndex === i}
                  <textarea class="card-textarea" bind:value={card.content} rows="4" onblur={() => editingIndex = -1}></textarea>
                {:else}
                  <div class="card-content" onclick={() => editingIndex = i}>{card.content}</div>
                  <div class="card-hint">Click to edit</div>
                {/if}
              </div>
            {/each}
          </div>
          <div class="add-row">
            <span class="add-label">Add</span>
            {#each [['priority','Priority'],['summary','Summary'],['reflection','Reflection']] as [type, label]}
              <button class="btn-ghost" onclick={() => cards = [...cards, { type, content: 'New card — click to edit.' }]}>+ {label}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- 03 -->
  <div class="section reveal">
    <svg class="section-geo" viewBox="0 0 1400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <polygon class="geo" points="100,200 140,270 60,270" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.05"/>
      <circle class="geo" cx="1300" cy="450" r="70" fill="none" stroke="#111" stroke-width="0.5" opacity="0.04"/>
      <path class="geo" d="M 400 500 Q 700 400 1000 500" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.04"/>
    </svg>
    <div class="section-grid">
      <div class="section-left">
        <div class="section-num repel-text">03</div>
        <div class="section-tag"><span class="tag-dash"></span><span class="repel-text">Generate</span></div>
        <div class="section-title repel-text">One input,<br>three<br>voices.</div>
      </div>
      <div class="section-right">
        <div class="reveal-line"></div>
        {#if cards.length === 0}
          <div class="empty">Complete step 02 to unlock generation.</div>
        {:else}
          <div class="format-tabs">
            {#each [['report','Professional Report'],['journal','Reflective Journal'],['update','Concise Update']] as [fmt, label]}
              <button class="btn-tab {outputFormat === fmt ? 'active' : ''}" onclick={() => generateOutput(fmt)} disabled={generating}>{label}</button>
            {/each}
          </div>
          {#if generating}
            <div class="loading-row"><span class="spinner"></span>Generating {formatLabels[outputFormat] ?? 'output'}...</div>
          {:else if output}
            <div class="output-block">
              <div class="output-label">{formatLabels[outputFormat] ?? ''}</div>
              <textarea class="output-textarea" value={output} oninput={onOutputInput} rows="12"></textarea>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <!-- 04 -->
  {#if output}
    <div class="section reveal">
      <svg class="section-geo" viewBox="0 0 1400 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <ellipse class="geo" cx="100" cy="200" rx="40" ry="80" fill="none" stroke="#111" stroke-width="0.5" opacity="0.04"/>
        <polygon class="geo" points="1300,100 1350,180 1250,180" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.05"/>
        <circle class="geo" cx="700" cy="500" r="50" fill="none" stroke="#E8281E" stroke-width="0.5" opacity="0.04"/>
      </svg>
      <div class="section-grid">
        <div class="section-left">
          <div class="section-num repel-text">04</div>
          <div class="section-tag">
            <span class="tag-dash"></span><span class="repel-text">Analysis</span>
            {#if analyzing}<span class="spinner" style="margin-left:6px"></span>{/if}
          </div>
          <div class="section-title repel-text">Your<br>patterns,<br>visible.</div>
        </div>
        <div class="section-right">
          <div class="reveal-line"></div>
          {#if toneData}
            <div class="patterns-wrap">
              <div>
                {#if selectedMetric === 'style' && toneData.style}
                  {#each Object.entries(toneData.style) as [key, val]}
                    <div class="bar-row">
                      <span class="bar-name repel-text">{styleLabels[key] ?? key}</span>
                      <div class="bar-track"><div class="bar-fill-anim" data-val="{val}"></div></div>
                      <span class="bar-val repel-text">{val}</span>
                    </div>
                  {/each}
                {:else if selectedMetric === 'mood' && toneData.mood}
                  {#each Object.entries(toneData.mood) as [key, val]}
                    <div class="bar-row">
                      <span class="bar-name repel-text">{moodLabels[key] ?? key}</span>
                      <div class="bar-track"><div class="bar-fill-anim" data-val="{val}"></div></div>
                      <span class="bar-val repel-text">{val}</span>
                    </div>
                  {/each}
                {:else if selectedMetric === 'distribution'}
                  {#each getDistribution() as d}
                    <div class="bar-row">
                      <span class="bar-name repel-text">{d.cfg.label}</span>
                      <div class="bar-track"><div class="bar-fill-anim" data-val="{d.pct}" style="background:{d.cfg.color}"></div></div>
                      <span class="bar-val repel-text">{d.pct}%</span>
                    </div>
                  {/each}
                {/if}
              </div>
              <div class="metric-nav">
                {#each metrics as m}
                  <button class="btn-metric {selectedMetric === m.id ? 'active' : ''}"
                    onclick={() => { selectedMetric = m.id; setTimeout(() => gsap.fromTo('.bar-fill-anim', { width: '0%' }, { width: (i, el) => el.dataset.val + '%', duration: 1.2, stagger: 0.05, ease: 'power3.out' }), 50); }}>
                    {m.label}
                  </button>
                {/each}
              </div>
            </div>
          {:else if !analyzing}
            <div class="empty">Patterns will appear after output is generated.</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

</div>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-cell repel-text"><span class="footer-red">●</span> CoDraft</div>
  <div class="footer-cell repel-text">AI Writing System</div>
  <div class="footer-cell repel-text">writing-decomposer.vercel.app</div>
  <div class="footer-cell repel-text">© 2026</div>
</div>