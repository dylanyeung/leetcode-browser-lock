const LEETCODE_DOMAIN = "leetcode.com";
const domainWhiteList = ["leetcode.com", "google.com", "chrome://"];

// Function to check if the current domain or URL is in the whitelist
function isInWhitelist(domain, fullUrl) {
  return domainWhiteList.some(
    (whitelistEntry) =>
      domain.includes(whitelistEntry) || fullUrl.startsWith(whitelistEntry)
  );
}

// Function to handle redirection based on lock status
async function handleRedirection(tabId, tabUrl) {
  const { isLocked } = await chrome.storage.local.get("isLocked");

  if (isLocked) {
    const currentUrl = new URL(tabUrl);
    const currentDomain = currentUrl.hostname;

    // If the domain is not whitelisted and the browser is locked, redirect to LeetCode
    if (!isInWhitelist(currentDomain, tabUrl)) {
      chrome.tabs.update(tabId, { url: `https://${LEETCODE_DOMAIN}` });
    }
  }
}

// Listen for tab updates (when a tab changes its URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    handleRedirection(tabId, tab.url);
  }
});

// Listen for new active tabs (when a new tab becomes active)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      handleRedirection(activeInfo.tabId, tab.url);
    }
  });
});

// Set the default lock status when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  const { isLocked } = await chrome.storage.local.get("isLocked");
  if (isLocked === undefined) {
    await chrome.storage.local.set({ isLocked: true }); // Lock by default
  }
});
