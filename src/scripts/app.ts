import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import barba from '@barba/core';
import { getColorSync, getPaletteSync } from 'colorthief';

// ─── Setup ───────────────────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Lenis Smooth Scroll ────────────────────────────────────────────
let lenis: Lenis | null = null;

function initLenis() {
  if (prefersReducedMotion) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time: number) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function destroyLenis() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

// ─── Color Thief for Cards ──────────────────────────────────────────
function initCardColorThief(container: Element) {
  const cards = container.querySelectorAll('.song-card');

  cards.forEach((card) => {
    const img = card.querySelector('.song-card__cover img') as HTMLImageElement;
    if (!img) return;

    card.addEventListener('mouseenter', () => {
      try {
        if (img.complete) {
          const color = getColorSync(img);
          if (color) {
            const [r, g, b] = color.array();
            (card as HTMLElement).style.setProperty('--card-glow', `rgba(${r}, ${g}, ${b}, 0.25)`);
          }
        }
      } catch (e) {
        /* cross-origin or image not loaded */
      }
    });

    card.addEventListener('mouseleave', () => {
      (card as HTMLElement).style.setProperty('--card-glow', 'rgba(255, 255, 255, 0.03)');
    });
  });
}

// ─── Filters ────────────────────────────────────────────────────────
function initFilters(container: Element) {
  const searchInput = container.querySelector('#filter-search') as HTMLInputElement;
  const filterPills = container.querySelectorAll('.filter-pill');
  const songCards = container.querySelectorAll('.song-card[data-song]');
  const activeFiltersContainer = container.querySelector('#active-filters');
  const clearAllBtn = container.querySelector('#clear-all-filters');
  const resultsCount = container.querySelector('#results-count');
  const noResults = container.querySelector('#no-results');

  if (!songCards.length) return;

  // State
  const state: Record<string, Set<string>> = {
    type: new Set(),
    mood: new Set(),
    album: new Set(),
    year: new Set(),
  };
  let searchTerm = '';

  // Filter pill click
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const group = (pill as HTMLElement).dataset.filterGroup!;
      const value = (pill as HTMLElement).dataset.filterValue!;

      if (state[group].has(value)) {
        state[group].delete(value);
        pill.classList.remove('active');
      } else {
        state[group].add(value);
        pill.classList.add('active');
      }
      applyFilters();
    });
  });

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Clear all
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      Object.values(state).forEach((s) => s.clear());
      searchTerm = '';
      if (searchInput) searchInput.value = '';
      filterPills.forEach((p) => p.classList.remove('active'));
      applyFilters();
    });
  }

  function applyFilters() {
    let visibleCount = 0;

    songCards.forEach((card) => {
      const el = card as HTMLElement;
      const cardType = el.dataset.type || '';
      const cardMoods = (el.dataset.moods || '').split(',').filter(Boolean);
      const cardAlbum = el.dataset.album || '';
      const cardYear = el.dataset.year || '';
      const cardTitle = (el.dataset.title || '').toLowerCase();

      let visible = true;

      // Type filter
      if (state.type.size > 0 && !state.type.has(cardType)) visible = false;
      // Mood filter (any match)
      if (state.mood.size > 0 && !cardMoods.some((m) => state.mood.has(m))) visible = false;
      // Album filter
      if (state.album.size > 0 && !state.album.has(cardAlbum)) visible = false;
      // Year filter
      if (state.year.size > 0 && !state.year.has(cardYear)) visible = false;
      // Search
      if (searchTerm && !cardTitle.includes(searchTerm)) visible = false;

      el.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    // Update count
    if (resultsCount) {
      const countSpan = resultsCount.querySelector('span');
      if (countSpan) countSpan.textContent = String(visibleCount);
    }

    // No results
    if (noResults) {
      (noResults as HTMLElement).style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Active filter pills
    renderActiveFilters();
  }

  function renderActiveFilters() {
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';

    const hasFilters = Object.values(state).some((s) => s.size > 0) || searchTerm;
    if (clearAllBtn) {
      (clearAllBtn as HTMLElement).style.display = hasFilters ? '' : 'none';
    }

    for (const [group, values] of Object.entries(state)) {
      values.forEach((value) => {
        const pill = document.createElement('button');
        pill.className = 'active-filter-pill';
        pill.innerHTML = `${formatFilterLabel(group, value)} <span class="close">×</span>`;
        pill.addEventListener('click', () => {
          state[group].delete(value);
          // Remove active class from corresponding pill
          const matchingPill = container.querySelector(
            `.filter-pill[data-filter-group="${group}"][data-filter-value="${value}"]`
          );
          if (matchingPill) matchingPill.classList.remove('active');
          applyFilters();
        });
        activeFiltersContainer.appendChild(pill);
      });
    }

    if (searchTerm) {
      const pill = document.createElement('button');
      pill.className = 'active-filter-pill';
      pill.innerHTML = `Search: "${searchTerm}" <span class="close">×</span>`;
      pill.addEventListener('click', () => {
        searchTerm = '';
        if (searchInput) searchInput.value = '';
        applyFilters();
      });
      activeFiltersContainer.appendChild(pill);
    }
  }

  function formatFilterLabel(group: string, value: string): string {
    const labels: Record<string, string> = {
      album_track: 'Album Track',
      mixtape_track: 'Mixtape Track',
      single: 'Single',
      feature: 'Feature',
    };
    if (group === 'type') return labels[value] || value;
    return value;
  }
}

// ─── Home Page Init ─────────────────────────────────────────────────
function initHomePage(container: Element) {
  // Hero animation
  const heroTitle = container.querySelector('.hero__title');
  const heroSubtitle = container.querySelector('.hero__subtitle');
  const heroScroll = container.querySelector('.hero__scroll-indicator');

  if (heroTitle && !prefersReducedMotion) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(heroTitle, { y: 60, opacity: 0, duration: 1.2 })
      .from(heroSubtitle, { y: 30, opacity: 0, duration: 0.8 }, '-=0.6')
      .from(heroScroll, { opacity: 0, duration: 0.6 }, '-=0.3');
  }

  // Card scroll reveals
  const cards = container.querySelectorAll('.song-card');
  if (cards.length && !prefersReducedMotion) {
    cards.forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        delay: (i % 3) * 0.1,
      });
    });
  }

  // Initialize filters
  initFilters(container);
  // Initialize Color Thief on cards
  initCardColorThief(container);
}

// ─── Song Detail Page Init ──────────────────────────────────────────
function initSongPage(container: Element) {
  // Parallax hero image
  const heroImg = container.querySelector('.song-detail__hero-img');
  if (heroImg && !prefersReducedMotion) {
    gsap.to(heroImg, {
      scrollTrigger: {
        trigger: container.querySelector('.song-detail__hero'),
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
      y: '20%',
      ease: 'none',
    });
  }

  // Color Thief for page background
  const heroImgEl = container.querySelector('.song-detail__hero-img') as HTMLImageElement;
  if (heroImgEl) {
    const applyPalette = () => {
      try {
        const palette = getPaletteSync(heroImgEl, { colorCount: 3 });
        if (palette && palette.length > 0) {
          const [r1, g1, b1] = palette[0].array();
          const [r2, g2, b2] = palette[1] ? palette[1].array() : palette[0].array();
          document.documentElement.style.setProperty('--page-accent', `rgb(${r1}, ${g1}, ${b1})`);
          document.documentElement.style.setProperty('--page-accent-2', `rgb(${r2}, ${g2}, ${b2})`);
          // Apply subtle gradient to content area
          const content = container.querySelector('.song-detail__content') as HTMLElement;
          if (content) {
            content.style.background = `linear-gradient(180deg, rgba(${r1}, ${g1}, ${b1}, 0.05) 0%, transparent 40%)`;
          }
        }
      } catch (e) {
        /* ignore */
      }
    };

    if (heroImgEl.complete) applyPalette();
    else heroImgEl.addEventListener('load', applyPalette);
  }

  // Breakdown section scroll reveals
  const sections = container.querySelectorAll('.breakdown__section');
  if (sections.length && !prefersReducedMotion) {
    sections.forEach((section, i) => {
      gsap.to(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: i * 0.1,
        ease: 'power2.out',
      });
    });
  } else {
    // Reduced motion — just show them
    sections.forEach((s) => s.classList.add('is-visible'));
  }
}

// ─── Barba.js Page Transitions ──────────────────────────────────────
function initBarba() {
  const overlay = document.getElementById('transition-overlay');

  barba.hooks.afterEnter(() => {
    window.scrollTo(0, 0);
  });

  barba.hooks.after(() => {
    // Reinitialize Lenis and GSAP ScrollTrigger after each transition
    ScrollTrigger.refresh();
  });

  if (document.querySelector('[data-barba="wrapper"]')) {
    barba.init({
      preventRunning: true,
      transitions: [
        {
          name: 'fade-slide',
          leave(data) {
            const done = (this as any).async();
            if (prefersReducedMotion) {
              if (overlay) overlay.style.opacity = '1';
              done();
              return;
            }
            const tl = gsap.timeline({ onComplete: done });
            if (overlay) {
              tl.to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.inOut' });
            }
            tl.to(data.current.container, {
              opacity: 0,
              y: -20,
              duration: 0.3,
              ease: 'power2.inOut',
            }, '<');
          },
          afterLeave() {
            ScrollTrigger.getAll().forEach((t) => t.kill());
            destroyLenis();
            // Reset CSS vars
            document.documentElement.style.removeProperty('--page-accent');
            document.documentElement.style.removeProperty('--page-accent-2');
          },
          beforeEnter(data) {
            window.scrollTo(0, 0);
            // Ensure new container starts hidden
            gsap.set(data.next.container, { opacity: 0, y: 20 });
          },
          enter(data) {
            const done = (this as any).async();
            const overlay = document.getElementById('transition-overlay');
            if (prefersReducedMotion) {
              gsap.set(data.next.container, { opacity: 1, y: 0 });
              if (overlay) overlay.style.opacity = '0';
              done();
              return;
            }
            const tl = gsap.timeline({ onComplete: done });
            if (overlay) {
              tl.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.inOut' });
            }
            tl.to(data.next.container, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power3.out',
            }, '<');
          },
          afterEnter(data) {
            initLenis();
            const namespace = data.next.namespace;
            if (namespace === 'home') initHomePage(data.next.container);
            else if (namespace === 'song') initSongPage(data.next.container);
            ScrollTrigger.refresh();
          },
        },
      ],
    });
  }
}

// ─── DOMContentLoaded ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initBarba();

  // First page init
  const container = document.querySelector('[data-barba="container"]');
  if (!container) return;
  const namespace = container.getAttribute('data-barba-namespace');
  if (namespace === 'home') initHomePage(container);
  else if (namespace === 'song') initSongPage(container);
});
