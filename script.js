const cursor = document.querySelector('.cursor');
const stage = document.querySelector('.hero-stage');

document.querySelectorAll('[data-split]').forEach((element) => {
  const text = element.textContent.trim();
  element.textContent = '';
  [...text].forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.style.setProperty('--i', index);
    span.textContent = char === ' ' ? '\u00A0' : char;
    element.appendChild(span);
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.18 });

document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

window.addEventListener('pointermove', (event) => {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;

  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
  const y = (event.clientY - rect.top - rect.height / 2) / rect.height;

  stage.querySelectorAll('[data-depth]').forEach((card) => {
    const depth = Number(card.dataset.depth);
    card.style.transform = `translate3d(${x * depth}px, ${y * depth}px, ${Math.abs(depth)}px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`;
  });
});

document.querySelectorAll('a, button, .system-card, .glass-card').forEach((target) => {
  target.addEventListener('pointerenter', () => cursor.classList.add('is-active'));
  target.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
});
