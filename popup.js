document.addEventListener("DOMContentLoaded", async function () {
  const setUsernameButton = document.getElementById("set-username");
  const usernameInput = document.getElementById("username-input");
  const usernameStatusText = document.getElementById("username-status");
  const lockStatusText = document.getElementById("lock-status");
  const toggleLockButton = document.getElementById("toggle-lock");
  const totalSolvedText = document.getElementById("total-solved");
  const dailyLockText = document.getElementById("daily-lock");
  const STORAGE_KEY = "alarm-scheduled-time";
  const UNLOCK_EXPIRATION_KEY = "unlockExpirationTime";
  const UNLOCK_USED_TODAY_KEY = "unlockUsedToday";
  const unlockTimer = 30; // Number of minutes the button unlocks the browser for

  // Initialize lock status, unlock status, and username from storage
  const { isLocked, username, unlockUsedToday } =
    await chrome.storage.local.get([
      "isLocked",
      "username",
      UNLOCK_USED_TODAY_KEY,
    ]);
  updateUI(isLocked);

  // Attempt to retrieve the next alarm time in local time
  const { [STORAGE_KEY]: scheduledTime } = await chrome.storage.local.get(
    STORAGE_KEY
  );
  if (scheduledTime) {
    const scheduledDate = new Date(scheduledTime);
    const currentTime = new Date();

    // Calculate the time difference
    const timeDiffMs = scheduledDate - currentTime;
    const hoursUntilAlarm = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutesUntilAlarm = Math.floor(
      (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    // Format the scheduled time in local time format
    const formattedScheduledTime = scheduledDate.toLocaleString("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // Create a better formatted alarm text
    const hourLabel = hoursUntilAlarm === 1 ? "hour" : "hours";
    const minuteLabel = minutesUntilAlarm === 1 ? "minute" : "minutes";
    dailyLockText.innerHTML = `The next lock will occur in <span class="time-remaining">
    ${hoursUntilAlarm} ${hourLabel} and
    ${minutesUntilAlarm} ${minuteLabel}</span>.\n<span class="scheduled-time">
    ${formattedScheduledTime}</span>`;
  } else {
    console.log("no alarm exists");
    dailyLockText.textContent = "No alarm scheduled.";
  }

  // Set initial username input value if it exists
  if (username) {
    usernameInput.value = username;
    await fetchAndDisplayTotalSolved(username); // Fetch initial totalSolved
  }

  // Handle the set username button click
  setUsernameButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    if (username) {
      await chrome.storage.local.set({ username });
      usernameStatusText.textContent = `Username "${username}" set successfully!`;
      // Send the username setting action to background.js
      chrome.runtime.sendMessage({ action: "setUsername", username });
      await fetchAndDisplayTotalSolved(username);
    } else {
      usernameStatusText.textContent = "Please enter a valid username.";
    }
  });

  // Handle the toggle lock button click
  toggleLockButton.addEventListener("click", async () => {
    const { isLocked, unlockUsedToday, unlockExpirationTime } =
      await chrome.storage.local.get([
        "isLocked",
        UNLOCK_USED_TODAY_KEY,
        UNLOCK_EXPIRATION_KEY,
      ]);

    const currentTime = Date.now();

    // Check if the browser is currently locked or unlocked
    if (isLocked) {
      // If locked, check if the unlock button has been used today
      if (unlockUsedToday) {
        toggleLockButton.disabled = true;
        lockStatusText.textContent =
          "locked. Today's free unlock has already been used and will reset after the daily lock";
        return;
      }

      // Unlock and set unlock expiration 30 minutes from now
      const unlockExpirationTime = currentTime + unlockTimer * 60 * 1000;
      await chrome.storage.local.set({
        isLocked: false,
        unlockUsedToday: true,
        unlockExpirationTime,
      });
      updateUI(false);

      // Send a message to background.js to set a lock alarm
      chrome.runtime.sendMessage({
        action: "setUnlockAlarm",
        unlockExpirationTime,
      });
    } else {
      // Send a message to background.js to delete lock alarm
      chrome.runtime.sendMessage({
        action: "deleteUnlockAlarm",
      });
      // If already unlocked, allow relocking without restrictions
      await chrome.storage.local.set({ isLocked: true });
      updateUI(true);
    }

    // Send the toggle lock action to background.js
    chrome.runtime.sendMessage({
      action: "toggleLock",
      isLocked: !isLocked,
    });
  });

  // Function to update the UI based on the lock status
  async function updateUI(isLocked) {
    const { unlockUsedToday } = await chrome.storage.local.get(
      "unlockUsedToday"
    );
    if (isLocked) {
      if (unlockUsedToday) {
        lockStatusText.textContent =
          "locked. Today's free unlock has already been used and will reset after the daily lock";
      } else {
        lockStatusText.textContent =
          "locked. The browser can be manually unlocked for 30 minutes once daily";
      }
      toggleLockButton.textContent = "Unlock Browser";
      toggleLockButton.classList.add("locked");
      toggleLockButton.disabled = false;
    } else {
      if (unlockUsedToday) {
        lockStatusText.textContent = `unlocked until ${formatLocalTime(
          Date.now() + unlockTimer * 60 * 1000
        )}`;
      } else {
        lockStatusText.textContent = "unlocked";
      }
      toggleLockButton.textContent = "Lock Browser";
      toggleLockButton.classList.remove("locked");
    }
  }

  // Function to fetch and display totalSolved from API
  async function fetchAndDisplayTotalSolved(username) {
    if (!username) return;
    try {
      console.log("Popup is fetching totalSolved...");
      // Send log message to background.js
      chrome.runtime.sendMessage({
        action: "logMessage",
        message: "Popup is fetching totalSolved...",
      });

      const response = await fetch(
        `https://leetcode-api-faisalshohag.vercel.app/${username}`
      );
      if (response.ok) {
        const data = await response.json();
        totalSolvedText.textContent = data.totalSolved;

        // Send the totalSolved value to background.js
        chrome.runtime.sendMessage({
          action: "updateTotalSolved",
          totalSolved: data.totalSolved,
        });
      } else {
        totalSolvedText.textContent = "Error fetching data";
      }
    } catch (error) {
      totalSolvedText.textContent = "Error fetching data";
      // Send error log message to background.js
      chrome.runtime.sendMessage({
        action: "logMessage",
        message: `Error fetching totalSolved: ${error}`,
      });
    }
  }

  function formatLocalTime(time) {
    const date = new Date(time);

    let hours = date.getHours();
    const minutes = date.getMinutes();

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12; // Convert to 12-hour format
    hours = hours ? hours : 12; // Adjust for 0 hour to display as 12

    // Format minutes to always have two digits
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${hours}:${formattedMinutes} ${ampm}`;
  }
});
