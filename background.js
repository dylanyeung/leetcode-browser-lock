const LEETCODE_DOMAIN = "leetcode.com";
const domainWhiteList = ["leetcode.com", "google.com", "chrome://"];

// Function to check if the current domain or URL is in the whitelist
function isInWhitelist(domain, fullUrl) {
  // Check if the full URL or the domain is in the whitelist
  return domainWhiteList.some(whitelistedDomain => domain.includes(whitelistedDomain) || fullUrl.startsWith(whitelistedDomain));
}

// Listen for tab updates (when a tab changes its URL)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Check if the tab has finished loading and the URL exists
  if (changeInfo.status === "complete" && tab.url) {
    const currentUrl = new URL(tab.url);
    const currentDomain = currentUrl.hostname;

    // If the domain is not in the whitelist, redirect to leetcode.com
    if (!isInWhitelist(currentDomain, tab.url)) {
      chrome.tabs.update(tabId, { url: `https://${LEETCODE_DOMAIN}` });
    }
  }
});

// Listen for new active tabs (when a new tab becomes active)
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (tab.url) {
      const currentUrl = new URL(tab.url);
      const currentDomain = currentUrl.hostname;

      // If the domain is not in the whitelist, redirect to leetcode.com
      if (!isInWhitelist(currentDomain, tab.url)) {
        chrome.tabs.update(activeInfo.tabId, { url: `https://${LEETCODE_DOMAIN}` });
      }
    }
  });
});
