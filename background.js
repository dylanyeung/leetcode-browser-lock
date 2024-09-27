const LEETCODE_DOMAIN = "leetcode.com";
const domainWhiteList = ["leetcode.com", "google.com", "chrome://"];
const API_BASE_URL = "https://leetcode-api-faisalshohag.vercel.app/";
let lastTotalSolved = 0; // Assume this will be loaded from storage

// Parameters for the daily lock alarm
const ALARM_NAME = "lockAlarm";
const STORAGE_KEY = "alarm-scheduled-time";
// Alarm times used for debugging
const UTC_HOUR = 0; // Midnight UTC (hour)
const UTC_MINUTE = 0; // Midnight UTC (minute)

// Function to fetch data from LeetCode API
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

// Function to load last totalSolved from storage
async function loadLastTotalSolved() {
  const { totalSolved } = await chrome.storage.local.get("totalSolved");
  lastTotalSolved = totalSolved !== undefined ? totalSolved : 0; // Default to 0 if not set
}

// Function to check for LeetCode updates
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
      await chrome.storage.local.set({
        isLocked: false,
        totalSolved: lastTotalSolved, // Store the updated totalSolved value
      });
      console.log("You've solved a new LeetCode problem. CODE: INTERVAL");
    }
  }

  // Check again every 30 seconds if still locked
  if (isLocked) {
    setTimeout(() => checkForLeetCodeUpdate(username), 30000);
    console.log("Background will fetch totalSolved again in 30 seconds...");
  }
}

// Function to check if a domain is in the whitelist
function isInWhitelist(domain, fullUrl) {
  return domainWhiteList.some(
    (whitelistEntry) =>
      domain.includes(whitelistEntry) || fullUrl.startsWith(whitelistEntry)
  );
}

// Function to handle redirection if the browser is locked
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

// Update the onUpdated event to handle page redirection and check for LeetCode updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    handleRedirection(tabId, tab.url);

    // Load lastTotalSolved from storage on each URL update
    await loadLastTotalSolved();

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
        await chrome.storage.local.set({
          isLocked: false,
          totalSolved: lastTotalSolved, // Store the updated totalSolved value
        });
        console.log("You've solved a new LeetCode problem! CODE: URL");
      }
    }
  }
});

// Event listener for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    handleRedirection(activeInfo.tabId, tab.url);
  }
});

// Schedule daily alarm at midnight UTC to lock the browser
async function scheduleDailyAlarm() {
  const now = new Date();
  const nextMidnightUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      UTC_HOUR,
      UTC_MINUTE,
      0
    )
  );

  // If the next alarm time is in the past, set it for the next day
  if (nextMidnightUTC.getTime() < now.getTime()) {
    nextMidnightUTC.setUTCDate(nextMidnightUTC.getUTCDate() + 1);
  }

  // Schedule the new alarm
  await chrome.alarms.create(ALARM_NAME, {
    when: nextMidnightUTC.getTime(),
    periodInMinutes: 1440, // 24 hours
  });

  console.log(
    `Alarm scheduled for next midnight UTC: ${nextMidnightUTC.toUTCString()}.`
  );

  // Store the scheduled alarm time
  await chrome.storage.local.set({ [STORAGE_KEY]: nextMidnightUTC.getTime() });
}

// Lock the browser when the alarm fires
function lockBrowser() {
  chrome.storage.local.set({ isLocked: true });
  console.log("Browser locked due to daily alarm.");
}

// Alarm listener for the lock alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const { [STORAGE_KEY]: scheduledTime } = await chrome.storage.local.get(STORAGE_KEY);
    console.log(`Lock alarm triggered, locking the browser at scheduled UTC time: ${new Date(scheduledTime).toUTCString()}.`);
    lockBrowser();
    await scheduleDailyAlarm(); // Reschedule the alarm for the next day
  }
});

// Check alarm state on startup
async function checkAlarmState() {
  const { [STORAGE_KEY]: scheduledTime } = await chrome.storage.local.get(STORAGE_KEY);
  const alarm = await chrome.alarms.get(ALARM_NAME);
  
  if (alarm && scheduledTime) {
    const currentTime = Date.now();

    // Check if the alarm should have fired
    if (currentTime >= scheduledTime) {
      // Backup alarm firing in case scheduled alarm does not fire on startup
      console.log("The alarm should have fired while the browser was closed.");
      lockBrowser(); // Lock the browser
      await scheduleDailyAlarm(); // Reschedule the alarm for the next day
    } else {
      console.log("The alarm is scheduled for a future time.");
    }
  } else {
    console.log("No scheduled alarm found.");
    await scheduleDailyAlarm(); // Schedule if no alarm exists
  }
}

// Extension installed or started, schedule the daily lock alarm
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed. Scheduling daily alarm...");
  await scheduleDailyAlarm();

  const { username } = await chrome.storage.local.get("username");
  if (username) {
    await loadLastTotalSolved(); // Load lastTotalSolved on installation
    await chrome.storage.local.set({ isLocked: true }); // Lock by default
    checkForLeetCodeUpdate(username); // Start checking for updates
  }
});

// Check the alarm state when the browser starts up
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension started. Checking alarm state...");
  await checkAlarmState();
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "logMessage") {
    console.log(message.message); // Log messages from popup.js
  }

  if (message.action === "updateTotalSolved") {
    if (message.totalSolved > lastTotalSolved) {
      lastTotalSolved = message.totalSolved;
      chrome.storage.local.set({
        isLocked: false,
        totalSolved: lastTotalSolved, // Store the updated totalSolved value
      }); // Unlock the browser
      console.log("You've solved a new LeetCode problem. CODE: POPUP");
    }
  }

  // Log when the username is set and start checking for updates
  if (message.action === "setUsername") {
    console.log(`Username set: ${message.username}`);
    loadLastTotalSolved().then(() => checkForLeetCodeUpdate(message.username)); // Fetch data after username is set
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

// Store totalSolved before the extension or browser closes
chrome.runtime.onSuspend.addListener(async () => {
  console.log("Extension is being suspended. Saving totalSolved...");
  await chrome.storage.local.set({ totalSolved: lastTotalSolved });
});

// Alternatively, store totalSolved when all browser windows are closed
chrome.windows.onRemoved.addListener(async () => {
  console.log("All browser windows are closed. Saving totalSolved...");
  await chrome.storage.local.set({ totalSolved: lastTotalSolved });
});
