chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
    // Logic to check if the user has solved a problem or is on LeetCode
    // If not, redirect to a page that informs the user to solve a problem
  });