const LEETCODE_DOMAIN = "leetcode.com";

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Check if the tab has finished loading
  if (changeInfo.status === "complete" && tab.url) {
    const currentDomain = new URL(tab.url).hostname;

    // If the domain is not leetcode.com, redirect to leetcode.com
    if (!currentDomain.includes(LEETCODE_DOMAIN)) {
      chrome.tabs.update(tabId, { url: `https://${LEETCODE_DOMAIN}` });
    }
  }
});

// Listen for new active tabs
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (tab.url) {
      const currentDomain = new URL(tab.url).hostname;

      // If the domain is not leetcode.com, redirect to leetcode.com
      if (!currentDomain.includes(LEETCODE_DOMAIN)) {
        chrome.tabs.update(activeInfo.tabId, {
          url: `https://${LEETCODE_DOMAIN}`,
        });
      }
    }
  });
});
