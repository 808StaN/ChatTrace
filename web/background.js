const background = document.querySelector('.emote-background');
const card = document.querySelector('.trace-card');
const callout = document.querySelector('.callout-badge');

if (background && card) {
  const slots = [...background.querySelectorAll('.emote-slot')];
  const emoteSources = [
    'emotes/stickers/kappa.png',
    'emotes/stickers/peepo-happy.png',
    'emotes/stickers/pogchamp.png',
    'emotes/stickers/ez.png',
    'emotes/stickers/lul.png',
    'emotes/stickers/feels-okay-man.png',
    'emotes/stickers/4head.png',
    'emotes/stickers/seems-good.png',
    'emotes/stickers/monkas.png',
    'emotes/stickers/kekw.png',
    'emotes/stickers/omegalul.png',
  ];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px)');
  const occupied = new Map();

  let bgSize = { width: 0, height: 0 };
  let perimeterBands = [];
  let protectedAreas = [];

  function overlaps(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function clamp(value, min, max) {
    if (max < min) return (min + max) * 0.5;
    return Math.min(Math.max(value, min), max);
  }

  function placeEmote(slot, preferredBandIndex) {
    occupied.delete(slot);
    const img = slot.querySelector('img');
    if (!img || !perimeterBands.length || getComputedStyle(slot).display === 'none') return;

    const rawSize = mobile.matches ? 38 + Math.random() * 8 : 56 + Math.random() * 16;
    const size = Math.round(rawSize / 2) * 2;
    const half = size * 0.5;
    const spacingPad = mobile.matches ? 10 : 14;
    let chosen = null;

    for (let attempt = 0; attempt < 320; attempt += 1) {
      const bandIndex =
        attempt < 70 && typeof preferredBandIndex === 'number'
          ? preferredBandIndex % perimeterBands.length
          : Math.floor(Math.random() * perimeterBands.length);
      const band = perimeterBands[bandIndex];

      const rawX = band.minX + Math.random() * Math.max(1, band.maxX - band.minX);
      const rawY = band.minY + Math.random() * Math.max(1, band.maxY - band.minY);
      const x = clamp(rawX, half + 4, bgSize.width - half - 4);
      const y = clamp(rawY, half + 4, bgSize.height - half - 4);

      const centerBox = {
        left: x - half * 0.65,
        right: x + half * 0.65,
        top: y - half * 0.65,
        bottom: y + half * 0.65,
      };

      const spacingBox = {
        left: x - half - spacingPad,
        right: x + half + spacingPad,
        top: y - half - spacingPad,
        bottom: y + half + spacingPad,
      };

      const hitsProtected = protectedAreas.some((zone) => overlaps(centerBox, zone));
      const hitsOtherEmote = [...occupied.values()].some((zone) => overlaps(spacingBox, zone));

      if (!hitsProtected && !hitsOtherEmote) {
        chosen = { x, y, spacingBox };
        break;
      }
    }

    slot.style.visibility = chosen ? 'visible' : 'hidden';
    if (!chosen) return;

    const usedSources = new Set(
      [...occupied.keys()].map((el) => el.querySelector('img')?.getAttribute('src')),
    );
    const currentSrc = img.getAttribute('src');
    const availableSources = emoteSources.filter(
      (source) => !usedSources.has(source) && source !== currentSrc,
    );
    if (availableSources.length > 0) {
      img.src = availableSources[Math.floor(Math.random() * availableSources.length)];
    }

    occupied.set(slot, chosen.spacingBox);
    const tiltSign = Math.random() < 0.5 ? -1 : 1;
    const tiltDeg = (mobile.matches ? 5 : 7) + Math.random() * (mobile.matches ? 8 : 11);

    slot.style.setProperty('--x', `${Math.round(chosen.x)}px`);
    slot.style.setProperty('--y', `${Math.round(chosen.y)}px`);
    slot.style.setProperty('--size', `${size}px`);
    slot.style.setProperty('--tilt', `${tiltSign * tiltDeg}deg`);
    slot.style.setProperty(
      '--drift',
      `${Math.round((Math.random() - 0.5) * (mobile.matches ? 10 : 18))}px`,
    );
    slot.style.setProperty('--start-y', mobile.matches ? '7px' : '12px');
    slot.style.setProperty('--end-y', mobile.matches ? '-7px' : '-12px');
  }

  function updateLayout() {
    const bgRect = background.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    if (!bgRect.width || !cardRect.width) return;

    bgSize = { width: bgRect.width, height: bgRect.height };

    const relCard = {
      left: cardRect.left - bgRect.left,
      right: cardRect.right - bgRect.left,
      top: cardRect.top - bgRect.top,
      bottom: cardRect.bottom - bgRect.top,
      width: cardRect.width,
      height: cardRect.height,
    };

    const outX = mobile.matches ? 16 : 34;
    const outY = mobile.matches ? 22 : 32;

    perimeterBands = [
      // Top-left rim (left of the callout badge)
      {
        minX: relCard.left - 8,
        maxX: relCard.left + relCard.width * 0.42,
        minY: relCard.top - outY,
        maxY: relCard.top - 8,
      },
      // Left rim of the chat card
      {
        minX: relCard.left - outX,
        maxX: relCard.left - 6,
        minY: relCard.top + 48,
        maxY: relCard.bottom - 26,
      },
      // Right rim (below the callout badge)
      {
        minX: relCard.right + 4,
        maxX: relCard.right + outX,
        minY: relCard.top + 88,
        maxY: relCard.bottom - 18,
      },
      // Bottom-left rim
      {
        minX: relCard.left - 8,
        maxX: relCard.left + relCard.width * 0.45,
        minY: relCard.bottom + 6,
        maxY: relCard.bottom + outY,
      },
      // Bottom-right rim
      {
        minX: relCard.left + relCard.width * 0.55,
        maxX: relCard.right + 10,
        minY: relCard.bottom + 6,
        maxY: relCard.bottom + outY,
      },
    ];

    protectedAreas = [
      {
        left: relCard.left + 16,
        right: relCard.right - 16,
        top: relCard.top + 14,
        bottom: relCard.bottom - 14,
      },
    ];

    if (callout) {
      const calloutRect = callout.getBoundingClientRect();
      protectedAreas.push({
        left: calloutRect.left - bgRect.left - 14,
        right: calloutRect.right - bgRect.left + 14,
        top: calloutRect.top - bgRect.top - 14,
        bottom: calloutRect.bottom - bgRect.top + 14,
      });
    }

    occupied.clear();
    slots.forEach((slot, index) => placeEmote(slot, index));

    if (reducedMotion.matches) {
      background.removeAttribute('data-ready');
      background.setAttribute('data-static', '');
    } else {
      background.removeAttribute('data-static');
      background.setAttribute('data-ready', '');
    }
  }

  emoteSources.forEach((source) => {
    const image = new Image();
    image.src = source;
  });

  slots.forEach((slot, index) => {
    const duration = 6.5 + Math.random() * 3.5;
    slot.style.setProperty('--duration', `${duration}s`);
    slot.style.setProperty('--delay', `${-Math.random() * duration * 0.85}s`);
    slot.addEventListener('animationiteration', () => placeEmote(slot, index));
  });

  reducedMotion.addEventListener('change', updateLayout);
  new ResizeObserver(updateLayout).observe(background);
  updateLayout();
}
