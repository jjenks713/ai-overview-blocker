(function () {
  const STORAGE_KEY = 'enabled';
  const HIDDEN_ATTR = 'data-ai-overview-hidden';
  let enabled = true;
  let observer = null;

  // Google's label for the box is a short, exact string like "AI Overview" —
  // matching short exact text avoids false positives on results that merely
  // mention the phrase in longer body copy.
  function isLabelText(text) {
    const t = text.replace(/\s+/g, ' ').trim();
    return t.length > 0 && t.length <= 20 && /^ai overview$/i.test(t);
  }

  // Walk up from the label to the nearest block that sits directly under
  // Google's main results container, so we hide the whole card, not just the label.
  function findContainer(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    let candidate = null;
    for (let i = 0; el && i < 15; i++, el = el.parentElement) {
      if (['rso', 'search', 'center_col', 'main'].includes(el.id)) break;
      if (el.parentElement && ['rso', 'search'].includes(el.parentElement.id)) {
        candidate = el;
        break;
      }
      if (el.hasAttribute && el.hasAttribute('data-hveid')) {
        candidate = el;
      }
    }
    return candidate;
  }

  function hideAiOverview(root) {
    if (!enabled || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const matches = [];
    let node;
    while ((node = walker.nextNode())) {
      if (isLabelText(node.nodeValue)) matches.push(node);
    }
    for (const textNode of matches) {
      const container = findContainer(textNode);
      if (container && container.getAttribute(HIDDEN_ATTR) !== 'true') {
        container.style.display = 'none';
        container.setAttribute(HIDDEN_ATTR, 'true');
      }
    }
  }

  function unhideAll() {
    document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`).forEach((el) => {
      el.style.display = '';
      el.removeAttribute(HIDDEN_ATTR);
    });
  }

  function start() {
    hideAiOverview(document.body);
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      if (!enabled) return;
      for (const m of mutations) {
        for (const added of m.addedNodes) {
          if (added.nodeType === Node.ELEMENT_NODE) hideAiOverview(added);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.sync.get({ [STORAGE_KEY]: true }, (res) => {
    enabled = res[STORAGE_KEY];
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'TOGGLE_ENABLED') {
      enabled = msg.enabled;
      if (enabled) {
        hideAiOverview(document.body);
      } else {
        unhideAll();
      }
    }
  });
})();
