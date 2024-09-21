const LEETCODE_DOMAIN = "leetcode.com";
const domainWhiteList = ["leetcode.com", "google.com", "chrome://"];
const API_BASE_URL = "https://leetcode-api-faisalshohag.vercel.app/";
let lastTotalSolved = 0;

async function fetchLeetCodeData(username) {
  try {
    const response = await fetch(`${API_BASE_URL}${username}`);
    if (response.ok) {
      const data = await response.json();
      return data; // Return fetched data
    }
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
  }
}

async function initializeLockStatus(username) {
  const data = await fetchLeetCodeData(username);
  if (data) {
    lastTotalSolved = data.totalSolved;
    await chrome.storage.local.set({
      totalSolved: lastTotalSolved,
      isLocked: true,
    }); // Lock by default
    checkForLeetCodeUpdate(username); // Start checking for updates if locked
  }
}

async function checkForLeetCodeUpdate(username) {
  const { isLocked } = await chrome.storage.local.get("isLocked");

  if (!isLocked) {
    console.log("Browser is unlocked. No need to fetch.");
    return; // Exit early if the browser is unlocked
  }

  const data = await fetchLeetCodeData(username);
  if (data) {
    const currentTotalSolved = data.totalSolved;
    if (currentTotalSolved > lastTotalSolved) {
      lastTotalSolved = currentTotalSolved;
      await chrome.storage.local.set({ isLocked: false }); // Unlock the browser
      console.log("You've solved a new LeetCode problem. CODE: INTERVAL");
    }
  }

  // Check again every 30 seconds if still locked
  if (isLocked) {
    setTimeout(() => checkForLeetCodeUpdate(username), 30000);
    console.log("Background will fetch totalSolved again in 30 seconds...");
  }
}

function isInWhitelist(domain, fullUrl) {
  return domainWhiteList.some(
    (whitelistEntry) =>
      domain.includes(whitelistEntry) || fullUrl.startsWith(whitelistEntry)
  );
}

async function handleRedirection(tabId, tabUrl) {
  const { isLocked } = await chrome.storage.local.get("isLocked");

  if (isLocked) {
    const currentUrl = new URL(tabUrl);
    const currentDomain = currentUrl.hostname;

    if (!isInWhitelist(currentDomain, tabUrl)) {
      chrome.tabs.update(tabId, { url: `https://${LEETCODE_DOMAIN}` });
    }
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    handleRedirection(tabId, tab.url);

    // Only fetch totalSolved if the browser is locked
    const { username, isLocked } = await chrome.storage.local.get([
      "username",
      "isLocked",
    ]);

    if (username && isLocked) {
      console.log("Background fetching totalSolved because of URL change...");
      const data = await fetchLeetCodeData(username); // Fetch totalSolved on URL change
      if (data && data.totalSolved > lastTotalSolved) {
        lastTotalSolved = data.totalSolved;
        await chrome.storage.local.set({ isLocked: false });
        console.log("You've solved a new LeetCode problem! CODE: URL");
      }
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    handleRedirection(activeInfo.tabId, tab.url);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const { username } = await chrome.storage.local.get("username");
  if (username) {
    initializeLockStatus(username); // Initialize lock status based on stored username
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "logMessage") {
    console.log(message.message); // Log messages from popup.js
  }

  if (message.action === "updateTotalSolved") {
    if (message.totalSolved > lastTotalSolved) {
      lastTotalSolved = message.totalSolved;
      chrome.storage.local.set({ isLocked: false }); // Unlock the browser
      console.log("You've solved a new LeetCode problem. CODE: POPUP");
    }
  }

  // Log when the username is set and start checking for updates
  if (message.action === "setUsername") {
    console.log(`Username set: ${message.username}`);
    initializeLockStatus(message.username); // Fetch data after username is set
  }
});

// Listen for lock state toggling
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.isLocked) {
    const newLockState = changes.isLocked.newValue;
    if (newLockState) {
      console.log("The browser is now locked.");
    } else {
      console.log("The browser is now unlocked.");
    }
  }
});
