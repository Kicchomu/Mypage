const coverPage = document.getElementById("cover-page");
const coverLetter = document.getElementById("cover-letter");
const mainContent = document.getElementById("main-content");
const body = document.body;
const readingProgressFill = document.getElementById("reading-progress-fill");
const backToTopButton = document.getElementById("back-to-top");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");
const trackedSections = [...document.querySelectorAll("main section[id]")];
const revealNodes = document.querySelectorAll(".reveal");
const header = document.querySelector(".site-header");
const heroTyping = document.querySelector(".hero-typing");
const detailModal = document.getElementById("detail-modal");
const detailModalKicker = document.getElementById("detail-modal-kicker");
const detailModalTitle = document.getElementById("detail-modal-title");
const detailModalBody = document.getElementById("detail-modal-body");
const modalTriggers = document.querySelectorAll("[data-modal-source]");
const modalCloseElements = document.querySelectorAll("[data-modal-close]");
const countupNodes = document.querySelectorAll(".acn-stat-number[data-count-to]");
const accentureSection = document.getElementById("accenture");
const timelineSection = document.getElementById("timeline");
const timelineFill = document.getElementById("timeline-progress-fill");
const timelineItems = document.querySelectorAll(".timeline-item");
const vennZones = document.querySelectorAll(".venn-zone");
const strengthCards = document.querySelectorAll(".strength-card[data-strength]");
const roadmapJourney = document.querySelector(".roadmap-journey");
const roadmapFlow = document.getElementById("roadmap-flow");
const roadmapStages = roadmapFlow ? [...roadmapFlow.querySelectorAll(".roadmap-stage")] : [];
const lifeplanDeck = document.getElementById("lifeplan-deck");
const lifeplanCards = lifeplanDeck
  ? [...lifeplanDeck.querySelectorAll(".life-card")].sort(
      (left, right) => Number(left.dataset.lifeStep) - Number(right.dataset.lifeStep),
    )
  : [];
const lifeplanSlots = document.querySelectorAll(".lifeplan-slot");
const lifeplanCompleteMessage = document.getElementById("lifeplan-complete-message");
const finalCard = document.querySelector(".final-card");

const parseDurationMs = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.endsWith("ms")) {
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (trimmed.endsWith("s")) {
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed * 1000 : fallback;
  }
  return fallback;
};

const COVER_HIDE_PROGRESS = 0.72;
const COVER_SWIPE_THRESHOLD = 120;
const durationCache = new Map();
let coverSwipeState = null;
let typingStarted = false;
let statsAnimated = false;
let activeModalTrigger = null;
let activeLifeStep = 1;
let lifeDragState = null;

const getCssDurationMs = (variableName, fallback) => {
  if (durationCache.has(variableName)) {
    return durationCache.get(variableName);
  }

  const duration = parseDurationMs(
    getComputedStyle(document.documentElement).getPropertyValue(variableName),
    fallback,
  );
  durationCache.set(variableName, duration);
  return duration;
};

const getCoverHideDelay = () => {
  const exitDuration = getCssDurationMs("--cover-content-exit-duration", 820);
  return Math.max(0, Math.floor(exitDuration * COVER_HIDE_PROGRESS));
};

const getMainEntryDuration = () => getCssDurationMs("--main-content-entry-duration", 920);

const toPercentWithinViewport = (value, viewportSize) =>
  Math.max(0, Math.min((value / viewportSize) * 100, 100));

const setCoverBurstOrigin = (clientX, clientY) => {
  if (!coverPage || typeof clientX !== "number" || typeof clientY !== "number") {
    return;
  }

  const x = toPercentWithinViewport(clientX, window.innerWidth);
  const y = toPercentWithinViewport(clientY, window.innerHeight);
  coverPage.style.setProperty("--cover-burst-x", `${x}%`);
  coverPage.style.setProperty("--cover-burst-y", `${y}%`);
};

const setCoverSwipeProgress = (progress) => {
  if (!coverPage) {
    return;
  }

  const normalized = Math.max(0, Math.min(progress, 1));
  coverPage.style.setProperty("--cover-swipe-progress", normalized.toFixed(3));
  coverLetter?.classList.toggle("is-dragging", normalized > 0);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px",
  },
);

revealNodes.forEach((node, index) => {
  const delay = Math.min((index % 10) * 80, 600);
  node.style.transitionDelay = `${delay}ms`;
});

const startTypingAnimation = () => {
  if (typingStarted || !heroTyping) {
    return;
  }

  const textTarget = heroTyping.querySelector(".hero-typing-text");
  const fullText = heroTyping.dataset.typingText || "";

  if (!textTarget || !fullText) {
    return;
  }

  typingStarted = true;
  textTarget.textContent = "";

  let index = 0;
  const step = () => {
    if (index > fullText.length) {
      return;
    }

    textTarget.textContent = fullText.slice(0, index);
    index += 1;
    const delay = index % 8 === 0 ? 68 : 34;
    window.setTimeout(step, delay);
  };

  window.setTimeout(step, 220);
};

const unlockLetter = (observeDelay = 400, useTransition = true) => {
  if (coverPage && (coverPage.classList.contains("is-opening") || coverPage.classList.contains("is-hidden"))) {
    return;
  }

  if (coverPage) {
    if (useTransition) {
      coverPage.classList.add("is-opening");
      window.setTimeout(() => {
        coverPage.classList.remove("is-opening");
        coverPage.classList.add("is-hidden");
      }, getCoverHideDelay());
    } else {
      coverPage.classList.add("is-hidden");
    }
  }

  body.classList.remove("is-locked");

  if (mainContent) {
    mainContent.classList.remove("main-content-hidden");
    mainContent.classList.add("main-content-visible");
    if (useTransition) {
      mainContent.classList.add("is-opening");
      window.setTimeout(() => {
        mainContent.classList.remove("is-opening");
      }, getMainEntryDuration());
    }
  }

  setCoverSwipeProgress(1);
  window.setTimeout(() => {
    revealNodes.forEach((node) => {
      observer.observe(node);
    });
  }, observeDelay);
  window.setTimeout(startTypingAnimation, useTransition ? 520 : 0);
  updateScrollUI();
};

const finishCoverSwipe = (event) => {
  if (!coverSwipeState || coverSwipeState.unlocked) {
    return;
  }

  const endX = event?.clientX ?? coverSwipeState.lastX ?? window.innerWidth / 2;
  const endY = event?.clientY ?? coverSwipeState.lastY ?? window.innerHeight / 2;
  const delta = coverSwipeState.startY - endY;

  if (delta >= COVER_SWIPE_THRESHOLD) {
    coverSwipeState.unlocked = true;
    setCoverBurstOrigin(endX, endY);
    unlockLetter();
  } else {
    setCoverSwipeProgress(0);
  }

  coverLetter?.classList.remove("is-dragging");
  coverSwipeState = null;
};

if (coverLetter) {
  coverLetter.addEventListener("pointerdown", (event) => {
    if (!coverPage || coverPage.classList.contains("is-opening") || coverPage.classList.contains("is-hidden")) {
      return;
    }

    coverSwipeState = {
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      unlocked: false,
    };
    setCoverSwipeProgress(0);
    if (typeof coverLetter.setPointerCapture === "function") {
      coverLetter.setPointerCapture(event.pointerId);
    }
  });

  coverLetter.addEventListener("pointermove", (event) => {
    if (!coverSwipeState || coverSwipeState.unlocked) {
      return;
    }

    coverSwipeState.lastX = event.clientX;
    coverSwipeState.lastY = event.clientY;
    const delta = Math.max(coverSwipeState.startY - event.clientY, 0);
    const progress = Math.min(delta / COVER_SWIPE_THRESHOLD, 1);
    setCoverSwipeProgress(progress);

    if (progress >= 1) {
      coverSwipeState.unlocked = true;
      setCoverBurstOrigin(event.clientX, event.clientY);
      unlockLetter();
      coverSwipeState = null;
    }
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
    coverLetter.addEventListener(eventName, finishCoverSwipe);
  });

  coverLetter.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    setCoverBurstOrigin(window.innerWidth / 2, window.innerHeight / 2);
    unlockLetter();
  });
}

if (window.location.hash && window.location.hash !== "#top") {
  unlockLetter(0, false);
}

const updateTimelineProgress = () => {
  if (!timelineSection || !timelineFill) {
    return;
  }

  const rect = timelineSection.getBoundingClientRect();
  const total = rect.height + window.innerHeight * 0.45;
  const progressed = window.innerHeight - rect.top;
  const progress = Math.max(0, Math.min(progressed / total, 1));
  timelineFill.style.strokeDashoffset = `${100 - progress * 100}`;

  timelineItems.forEach((item) => {
    const itemRect = item.getBoundingClientRect();
    const isActive = itemRect.top < window.innerHeight * 0.62;
    item.classList.toggle("is-active", isActive);
  });
};

const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;

  if (readingProgressFill) {
    readingProgressFill.style.width = `${progress}%`;
  }

  if (header) {
    header.style.background =
      scrollTop > 24 ? "rgba(7, 17, 31, 0.85)" : "rgba(7, 17, 31, 0.4)";
  }

  if (backToTopButton) {
    backToTopButton.classList.toggle("is-visible", scrollTop > 600);
  }

  if (trackedSections.length && navLinks.length) {
    const offset = 160;
    let currentSectionId = trackedSections[0].id;

    trackedSections.forEach((section) => {
      if (scrollTop >= section.offsetTop - offset) {
        currentSectionId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentSectionId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  updateTimelineProgress();
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI, { passive: true });
updateScrollUI();

if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const interactiveCards = document.querySelectorAll(
  ".spotlight-card, .mini-note-card, .overview-panel, .decision-statement, .feature-card, .timeline-content, .strength-card, .roadmap-card, .life-card, .final-card, .industry-card, .industry-facts, .section-glance-item, .acn-history-band, .acn-outlook-band, .acn-outlook-item",
);

interactiveCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    if (card.classList.contains("is-dragging")) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;

    card.style.setProperty("--rx", `${-py * 6}deg`);
    card.style.setProperty("--ry", `${px * 8}deg`);
    card.style.setProperty("--mx", `${px * 24}px`);
    card.style.setProperty("--my", `${py * 24}px`);
  });

  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--mx", "0px");
    card.style.setProperty("--my", "0px");
  });
});

const magneticButtons = document.querySelectorAll(".button");

magneticButtons.forEach((button) => {
  button.addEventListener("mousemove", (event) => {
    const rect = button.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 12;

    button.style.transform = `translate(${offsetX}px, ${offsetY - 2}px) scale(1.02)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "";
  });
});

(() => {
  try {
    const heroEyebrow = document.querySelector(".hero-copy .eyebrow");
    if (!heroEyebrow) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const suffixMatch = heroEyebrow.textContent.match(/\/.+$/);
    const suffix = suffixMatch ? suffixMatch[0].trim() : " / M2 / Career Letter";

    heroEyebrow.textContent = `${year}.${month} ${suffix}`;
  } catch (error) {
    console.error("Failed to set dynamic hero eyebrow date:", error);
  }
})();

const openModal = (trigger) => {
  if (!detailModal || !detailModalTitle || !detailModalBody || !detailModalKicker) {
    return;
  }

  const sourceId = trigger.dataset.modalSource;
  const source = sourceId ? document.getElementById(sourceId) : null;
  if (!source) {
    return;
  }

  activeModalTrigger = trigger;
  detailModalKicker.textContent = trigger.dataset.modalKicker || "Detail";
  detailModalTitle.textContent = trigger.dataset.modalTitle || "詳細";
  detailModalBody.innerHTML = source.innerHTML;
  detailModal.hidden = false;
  detailModal.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
  detailModal.querySelector(".detail-modal-close")?.focus();
};

const closeModal = () => {
  if (!detailModal) {
    return;
  }

  detailModal.hidden = true;
  detailModal.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
  detailModalBody.innerHTML = "";
  activeModalTrigger?.focus();
  activeModalTrigger = null;
};

modalTriggers.forEach((trigger) => {
  const activate = () => openModal(trigger);
  trigger.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      return;
    }
    activate();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

modalCloseElements.forEach((element) => {
  element.addEventListener("click", closeModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && detailModal && !detailModal.hidden) {
    closeModal();
  }
});

const formatCount = (value, node) => {
  const decimals = Number(node.dataset.decimals || 0);
  const prefix = node.dataset.prefix || "";
  const suffix = node.dataset.suffix || "";
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
};

const animateCountup = (node) => {
  const endValue = Number(node.dataset.countTo || 0);
  const duration = 1400;
  const start = performance.now();

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    node.textContent = formatCount(endValue * eased, node);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      node.textContent = formatCount(endValue, node);
    }
  };

  requestAnimationFrame(tick);
};

if (accentureSection && countupNodes.length) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || statsAnimated) {
          return;
        }

        statsAnimated = true;
        countupNodes.forEach((node) => animateCountup(node));
        statsObserver.disconnect();
      });
    },
    { threshold: 0.35 },
  );

  statsObserver.observe(accentureSection);
}

const activateStrength = (strengthKey) => {
  vennZones.forEach((zone) => {
    zone.classList.toggle("is-active", zone.dataset.strength === strengthKey);
  });

  strengthCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.strength === strengthKey);
  });
};

vennZones.forEach((zone) => {
  const activate = () => activateStrength(zone.dataset.strength || "");
  zone.addEventListener("click", activate);
  zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

if (vennZones.length) {
  activateStrength("tech");
}

const updateRoadmapProgress = () => {
  if (!roadmapJourney || !roadmapFlow || !roadmapStages.length) {
    return;
  }

  const maxScroll = roadmapFlow.scrollWidth - roadmapFlow.clientWidth;
  const progress = maxScroll > 0 ? roadmapFlow.scrollLeft / maxScroll : 0;
  roadmapJourney.style.setProperty("--roadmap-progress", progress.toFixed(3));

  const flowRect = roadmapFlow.getBoundingClientRect();
  const flowCenter = flowRect.left + flowRect.width / 2;
  let activeIndex = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;

  roadmapStages.forEach((stage, index) => {
    const rect = stage.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(center - flowCenter);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      activeIndex = index;
    }
  });

  roadmapStages.forEach((stage, index) => {
    stage.classList.toggle("is-active", index === activeIndex);
  });
};

roadmapFlow?.addEventListener("scroll", updateRoadmapProgress, { passive: true });
window.addEventListener("resize", updateRoadmapProgress, { passive: true });
updateRoadmapProgress();

const syncLifeplanDeck = () => {
  lifeplanCards.forEach((card) => {
    const step = Number(card.dataset.lifeStep);
    const isPlaced = card.classList.contains("is-placed");
    const isCurrent = step === activeLifeStep && !isPlaced;
    card.classList.toggle("is-current", isCurrent);
  });
};

const clearLifeplanTargets = () => {
  lifeplanSlots.forEach((slot) => slot.classList.remove("is-target"));
};

const isValidLifeDropTarget = (candidate, card) =>
  Boolean(
    candidate &&
      card &&
      Number(candidate.dataset.slot) === Number(card.dataset.lifeStep) &&
      !candidate.querySelector(".life-card"),
  );

const updateLifeDragPosition = (clientX, clientY) => {
  if (!lifeDragState) {
    return;
  }

  const { card, offsetX, offsetY } = lifeDragState;
  card.style.left = `${clientX - offsetX}px`;
  card.style.top = `${clientY - offsetY}px`;
  card.style.width = `${lifeDragState.width}px`;

  clearLifeplanTargets();
  const candidate = document.elementFromPoint(clientX, clientY)?.closest(".lifeplan-slot");
  if (isValidLifeDropTarget(candidate, card)) {
    candidate.classList.add("is-target");
  }
};

const resetDraggedCard = (card) => {
  card.classList.remove("is-dragging");
  card.style.left = "";
  card.style.top = "";
  card.style.width = "";
  card.style.transform = "";
  lifeplanDeck?.append(card);
  clearLifeplanTargets();
};

const completeLifeplan = () => {
  if (lifeplanCompleteMessage) {
    lifeplanCompleteMessage.hidden = false;
  }

  window.setTimeout(() => {
    finalCard?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 900);
};

const handleLifePointerMove = (event) => {
  if (!lifeDragState) {
    return;
  }

  updateLifeDragPosition(event.clientX, event.clientY);
};

const handleLifePointerUp = (event) => {
  if (!lifeDragState) {
    return;
  }

  const { card } = lifeDragState;
  const candidate = document.elementFromPoint(event.clientX, event.clientY)?.closest(".lifeplan-slot");
  const isCorrectSlot = isValidLifeDropTarget(candidate, card);

  if (isCorrectSlot) {
    clearLifeplanTargets();
    candidate.classList.add("is-filled");
    card.classList.remove("is-dragging", "is-current");
    card.classList.add("is-placed");
    card.style.left = "";
    card.style.top = "";
    card.style.width = "";
    card.style.transform = "";
    candidate.append(card);
    activeLifeStep += 1;
    syncLifeplanDeck();

    if (activeLifeStep > lifeplanCards.length) {
      completeLifeplan();
    }
  } else {
    resetDraggedCard(card);
  }

  lifeDragState = null;
  window.removeEventListener("pointermove", handleLifePointerMove);
  window.removeEventListener("pointerup", handleLifePointerUp);
  window.removeEventListener("pointercancel", handleLifePointerUp);
};

lifeplanCards.forEach((card) => {
  card.addEventListener("pointerdown", (event) => {
    if (!card.classList.contains("is-current") || card.classList.contains("is-placed")) {
      return;
    }

    event.preventDefault();
    const rect = card.getBoundingClientRect();
    lifeDragState = {
      card,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
    };

    card.classList.add("is-dragging");
    body.append(card);
    updateLifeDragPosition(event.clientX, event.clientY);
    window.addEventListener("pointermove", handleLifePointerMove);
    window.addEventListener("pointerup", handleLifePointerUp);
    window.addEventListener("pointercancel", handleLifePointerUp);
  });
});

syncLifeplanDeck();
