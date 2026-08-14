const STORAGE_KEY = 'enabled';
const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

chrome.storage.sync.get({ [STORAGE_KEY]: true }, (res) => {
  toggle.checked = res[STORAGE_KEY];
});

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  await chrome.storage.sync.set({ [STORAGE_KEY]: enabled });

  const tabs = await chrome.tabs.query({ url: ['https://www.google.com/search*', 'https://www.google.co.uk/search*'] });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_ENABLED', enabled }, () => {
      // Swallow errors from tabs without the content script (e.g. not yet loaded).
      void chrome.runtime.lastError;
    });
  }
  status.textContent = enabled ? 'AI Overview will be hidden.' : 'AI Overview will be shown.';
});
