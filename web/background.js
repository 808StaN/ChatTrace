const background = document.querySelector('.emote-background');
const emotes = [...background.querySelectorAll('img')];
const emoteSources = [
  'emotes/kappa.png',
  'emotes/peepo-happy.webp',
  'emotes/pogchamp.png',
  'emotes/ez.webp',
  'emotes/lul.png',
  'emotes/feels-okay-man.webp',
  'emotes/4head.png',
  'emotes/seems-good.png',
  'emotes/monkas.png',
  'emotes/kekw.png',
  'emotes/omegalul.png',
];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 760px)');
const occupied = new Map();
let bounds;
let protectedAreas = [];

function placeEmote(emote) {
  occupied.delete(emote);
  if (getComputedStyle(emote).display === 'none') return;

  const size = mobile.matches ? 28 + Math.random() * 8 : 32 + Math.random() * 24;
  const halfWidth = size * 0.65 + (mobile.matches ? 6 : 14);
  const blocked = [...protectedAreas, ...occupied.values()];
  let position;

  // Reserve the whole drift path, not just the image's starting position.
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const x = halfWidth + Math.random() * (bounds.width - halfWidth * 2);
    const y = 30 + Math.random() * (bounds.height - size - 60);
    const area = {
      left: x - halfWidth,
      right: x + halfWidth,
      top: y - (mobile.matches ? 12 : 30),
      bottom: y + size + (mobile.matches ? 12 : 24),
    };

    if (
      blocked.every(
        (other) =>
          area.right < other.left ||
          area.left > other.right ||
          area.bottom < other.top ||
          area.top > other.bottom,
      )
    ) {
      position = { x, y, area };
      break;
    }
  }

  // If space is tight, skip this cycle rather than cover the page's content.
  emote.style.visibility = position ? 'visible' : 'hidden';
  if (!position) return;

  const usedSources = new Set([...occupied.keys()].map((image) => image.getAttribute('src')));
  const availableSources = emoteSources.filter(
    (source) => !usedSources.has(source) && source !== emote.getAttribute('src'),
  );
  emote.src = availableSources[Math.floor(Math.random() * availableSources.length)];
  occupied.set(emote, position.area);
  emote.style.setProperty('--x', `${position.x}px`);
  emote.style.setProperty('--y', `${position.y}px`);
  emote.style.setProperty('--size', `${size}px`);
  emote.style.setProperty('--tilt', `${(Math.random() - 0.5) * (mobile.matches ? 16 : 24)}deg`);
  emote.style.setProperty('--drift', `${(Math.random() - 0.5) * (mobile.matches ? 12 : 24)}px`);
  emote.style.setProperty('--start-y', mobile.matches ? '6px' : '12px');
  emote.style.setProperty('--end-y', mobile.matches ? '-6px' : '-20px');
}

function updateLayout() {
  if (reducedMotion.matches) return;

  bounds = background.getBoundingClientRect();
  protectedAreas = [
    ...document.querySelectorAll(
      '.site-header, .hero-copy, .trace-card, .how-it-works .eyebrow, .how-it-works h2, .how-it-works ol, .site-footer',
    ),
  ].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - bounds.left - 8,
      right: rect.right - bounds.left + 8,
      top: rect.top - bounds.top - 8,
      bottom: rect.bottom - bounds.top + 8,
    };
  });

  occupied.clear();
  emotes.forEach(placeEmote);
  background.setAttribute('data-ready', '');
}

emoteSources.forEach((source) => {
  const image = new Image();
  image.src = source;
});

emotes.forEach((emote) => {
  const duration = 7 + Math.random() * 4;
  emote.style.setProperty('--duration', `${duration}s`);
  emote.style.setProperty('--delay', `${-Math.random() * duration * 0.8}s`);
  emote.addEventListener('animationiteration', () => placeEmote(emote));
});

reducedMotion.addEventListener('change', updateLayout);
new ResizeObserver(updateLayout).observe(document.querySelector('.page-shell'));
updateLayout();
