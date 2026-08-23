// ============================================================
// Mobile nav toggle
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Highlight the active nav link based on current page
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === current) a.classList.add('active');
  });

  initSkillBars();
  initSkillTabs();
});

// ============================================================
// Animated network-graph background
// Nodes drift slowly and connect to nearby nodes with lines;
// occasional "packets" travel along an edge — a nod to
// networking / data transmission.
// ============================================================
(function netbg() {
  const canvas = document.getElementById('netbg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, nodes = [], packets = [];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const LINK_DIST = 150;
  const NODE_COUNT_BASE = 70; // per 1,000,000 px^2

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round((w * h / 1000000) * NODE_COUNT_BASE);
    nodes = Array.from({ length: Math.min(count, 90) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 0.8
    }));
  }

  function maybeSpawnPacket() {
    if (Math.random() > 0.985 && nodes.length > 1) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      let b = nodes[Math.floor(Math.random() * nodes.length)];
      let tries = 0;
      while (b === a && tries < 5) { b = nodes[Math.floor(Math.random() * nodes.length)]; tries++; }
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < LINK_DIST * 1.4) {
        packets.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.006 });
      }
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    // update nodes
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }

    // draw links
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(139,107,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // draw nodes
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,205,220,0.45)';
      ctx.fill();
    }

    // packets
    if (!reduceMotion) maybeSpawnPacket();
    packets = packets.filter(p => p.t <= 1);
    for (const p of packets) {
      p.t += p.speed;
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#35e0c4';
      ctx.shadowColor = '#35e0c4';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (!reduceMotion) requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  resize();
  if (reduceMotion) {
    step(); // draw a single static frame
  } else {
    requestAnimationFrame(step);
  }
})();

// ============================================================
// Skill bars — animate width in from data-level when scrolled
// into view. Edit the data-level="NN" attribute in the HTML
// to update how far along a skill is.
// ============================================================
function initSkillBars() {
  const rows = document.querySelectorAll('.skill-row');
  if (!rows.length) return;

  const setFill = (row) => {
    const level = row.dataset.level || '0';
    const fill = row.querySelector('.skill-bar-fill');
    const pct = row.querySelector('.skill-pct');
    if (fill) fill.style.width = level + '%';
    if (pct) pct.textContent = level + '%';
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setFill(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    rows.forEach(row => io.observe(row));
  } else {
    rows.forEach(setFill);
  }
}

// ============================================================
// Skills category tabs
// ============================================================
function initSkillTabs() {
  const tabs = document.querySelectorAll('.skills-tabs button');
  const groups = document.querySelectorAll('.skill-group');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      groups.forEach(g => {
        g.style.display = (target === 'all' || g.dataset.category === target) ? '' : 'none';
      });
      // Re-trigger bar fill for newly visible rows
      document.querySelectorAll('.skill-group:not([style*="display: none"]) .skill-row').forEach(row => {
        const level = row.dataset.level || '0';
        const fill = row.querySelector('.skill-bar-fill');
        if (fill) fill.style.width = level + '%';
      });
    });
  });
}
