const LEETCODE_DOMAIN = "leetcode.com";
const domainWhiteList = ["leetcode.com", "google.com", "chrome://"];
const API_BASE_URL = "https://leetcode-api-faisalshohag.vercel.app/";

async function fetchLeetCodeData(username) {
    try {
        const response = await fetch(`${API_BASE_URL}${username}`);
        if (response.ok) {
            return response.json();
        }
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
    }
}

async function initializeLockStatus(username) {
    const data = await fetchLeetCodeData(username);
    if (data) {
        const { totalSolved } = data;
        await chrome.storage.local.set({ totalSolved, isLocked: true }); // Lock by default
        checkForLeetCodeUpdate(username, totalSolved); // Start checking for updates
    }
}

async function checkForLeetCodeUpdate(username, previousSolvedCount) {
    const data = await fetchLeetCodeData(username);
    if (data) {
        const { totalSolved } = data;
        if (totalSolved > previousSolvedCount) {
            await chrome.storage.local.set({ isLocked: false }); // Unlock the browser
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icon.png",
                title: "LeetCode Challenge Completed!",
                message: "Congratulations! You've solved a new LeetCode problem. The browser is now unlocked.",
                priority: 2
            });
            return; // Stop checking if unlocked
        }
    }

    // Check again after a certain interval
    setTimeout(() => checkForLeetCodeUpdate(username, previousSolvedCount), 60000); // Check every 60 seconds
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
