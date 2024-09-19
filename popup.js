document.addEventListener("DOMContentLoaded", async function () {
    const setUsernameButton = document.getElementById("set-username");
    const usernameInput = document.getElementById("username-input");
    const lockStatusText = document.getElementById("lock-status");
    const toggleLockButton = document.getElementById("toggle-lock");
    const totalSolvedText = document.getElementById("total-solved");

    // Initialize lock status and username from storage
    const { isLocked, username } = await chrome.storage.local.get(["isLocked", "username"]);
    updateUI(isLocked);

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
            console.log(`Username set: ${username}`);
            lockStatusText.textContent = `Username "${username}" set successfully!`;
            await fetchAndDisplayTotalSolved(username);
        } else {
            lockStatusText.textContent = "Please enter a valid username.";
        }
    });

    // Handle the toggle lock button click
    toggleLockButton.addEventListener("click", async () => {
        const { isLocked } = await chrome.storage.local.get("isLocked");
        const newLockStatus = !isLocked;

        // Store the new lock status in chrome storage
        await chrome.storage.local.set({ isLocked: newLockStatus });

        // Update UI accordingly
        updateUI(newLockStatus);
    });

    // Function to update the UI based on the lock status
    function updateUI(isLocked) {
        if (isLocked) {
            lockStatusText.textContent = "locked";
            toggleLockButton.textContent = "Unlock Browser";
            toggleLockButton.classList.add("locked");
        } else {
            lockStatusText.textContent = "unlocked";
            toggleLockButton.textContent = "Lock Browser";
            toggleLockButton.classList.remove("locked");
        }
    }

    // Function to fetch and display totalSolved from API
    async function fetchAndDisplayTotalSolved(username) {
        if (!username) return;
        try {
            const response = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
            if (response.ok) {
                const data = await response.json();
                totalSolvedText.textContent = data.totalSolved;
            } else {
                totalSolvedText.textContent = "Error fetching data";
            }
        } catch (error) {
            console.error(`Error fetching totalSolved: ${error}`);
            totalSolvedText.textContent = "Error fetching data";
        }
    }

    // Listen for URL changes
    chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
        if (changeInfo.status === "complete" && tab.url) {
            const currentUrl = new URL(tab.url);
            const currentDomain = currentUrl.hostname;

            // Check if the current domain is LeetCode
            if (currentDomain === "leetcode.com") {
                const { username } = await chrome.storage.local.get("username");
                await fetchAndDisplayTotalSolved(username);
            }
        }
    });
});
