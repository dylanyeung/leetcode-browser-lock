document.addEventListener("DOMContentLoaded", async function () {
    const lockStatusText = document.getElementById("lock-status");
    const toggleLockButton = document.getElementById("toggle-lock");

    // Initialize lock status from storage
    const { isLocked } = await chrome.storage.local.get("isLocked");
    updateUI(isLocked);

    // Handle the toggle button click
    toggleLockButton.addEventListener("click", async () => {
      const { isLocked } = await chrome.storage.local.get("isLocked");
      const newLockStatus = !isLocked; // Toggle lock status

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
});
