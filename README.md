# Leet Lock Chrome Extension

Leet Lock is a productivity-focused Chrome extension designed to encourage consistent LeetCode problem-solving. The extension locks browsing access, allowing users to manually unlock the browser for a limited time once daily or automatically unlock it upon solving a new LeetCode problem. It provides an engaging way to stay motivated and track daily progress, integrating seamlessly with Chrome's API ecosystem. Future plans for the project include integration of Stripe payments to allow for additional browser unlocking.

## Table of Contents
- [Technology Stack](#technology-stack)
- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [File Structure](#file-structure)
- [Credits](#credits)
- [Contact Information](#contact-information)

## Technology Stack

- **JavaScript**: The primary programming language used for developing the extension, including the logic for the popup interface, background scripts, and Chrome API integration.
- **HTML/CSS**: Provides the structure and styling for the popup interface, ensuring a clean and user-friendly design.
- **Chrome Storage API**: Enables persistent data storage, such as the lock status, unlock expiration time, and user settings. Data retrieval and updates are efficiently managed using asynchronous operations with promises.
- **Chrome Alarms API**: Schedules background tasks for daily locks and temporary unlocks. Implements event-driven programming by listening for alarm events to update the lock status and reset daily metrics.
- **Chrome Runtime API**: Handles messaging between the background script and popup interface to synchronize lock status changes and user actions.
- **LeetCode API**: Uses the [unofficial LeetCode API](https://github.com/faisal-shohag/leetcode_api) by Faisal Shohag to fetch the number of solved problems, with secure asynchronous requests made through `fetch()`.

## Features

### Browsing Lock and Unlock Functionality
- **Daily Lock**: Automatically locks the browser once every 24 hours. The extension ensures users follow a structured daily routine by limiting access.
- **Manual Unlock**: Allows users to manually unlock the browser for 30 minutes once per day, with a countdown displayed in the extension's popup.
- **Automatic Unlock**: If a new LeetCode problem is solved, the browser automatically unlocks.

![Default UI](https://raw.githubusercontent.com/dylanyeung/leetcode-browser-lock/main/assets/ui1.png)
![Username Set UI](https://raw.githubusercontent.com/dylanyeung/leetcode-browser-lock/main/assets/ui2.png)
![Free Unlock UI](https://raw.githubusercontent.com/dylanyeung/leetcode-browser-lock/main/assets/ui3.png)


### LeetCode Integration
- **Problem-Solving Tracking**: Retrieves the user's total number of solved LeetCode problems through LeetCode API and updates the lock status based on their activity.
- **Daily Reset**: The "solved today" status resets daily, forcing users to solve new problems each day in order to gain access to their browser.

### User-Friendly Interface
- **Popup Interface**: The popup displays the current lock status, time remaining until the next scheduled lock, and the total number of problems solved.
- **Seamless Configuration**: Users can easily configure their LeetCode username via the popup for accurate tracking.

## How It Works

1. **User Registration and Configuration**: The user sets their LeetCode username in the popup interface. The extension fetches the user's problem-solving data via the LeetCode API. The username and other settings are stored using the Chrome Storage API for persistent data management.
2. **Daily Lock Scheduling**: Using the Chrome Alarms API, the extension schedules a daily lock at midnight UTC. This schedule ensures that the lock status resets every 24 hours, and the time remaining until the next lock is displayed in the popup.
3. **Manual Unlock**: When the user manually unlocks the browser, the extension sets an unlock alarm for 30 minutes. If the user relocks the browser manually within this time, the unlock alarm is cleared to prevent automatic relocking.
4. **Automatic Unlock Based on LeetCode Problem Solving**: The background script continuously checks the user's LeetCode progress using the API. If a new problem has been solved, the browser automatically unlocks. The "solved today" status is then updated in the storage, preventing unnecessary additional checks.
5. **Communication Between Popup and Background Scripts**: The extension employs the Chrome Runtime API to enable real-time communication between the popup interface and background script. For instance, when a user unlocks the browser manually, a message is sent to the background script to set or clear relevant alarms.

## Installation

1. Clone the repository:
    ```bash
    git clone <your-repository-url>
    ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top-right corner.
4. Click "Load unpacked" and select the extension's directory.

## File Structure
- `manifest.json`: Configuration file defining the extension's permissions, settings, and required background scripts.
- `background.js`: Implements background tasks for scheduling alarms, checking LeetCode updates, managing lock/unlock state, and handling communication between the popup and background.
- `popup.js`: Handles events and logic for the popup interface, such as user interactions, fetching LeetCode data, and controlling lock states.
- `popup.html`: Defines the HTML structure for the popup interface, including elements for lock status, unlock buttons, and user input.
- `style.css`: Provides custom styles for the popup interface to ensure a polished and user-friendly appearance.

## Credits
This project utilizes the [LeetCode API](https://github.com/faisal-shohag/leetcode_api) created by Faisal Shohag to fetch the number of solved problems. Special thanks to Faisal Shohag for providing this API to the community.

## Contact Information
For inquiries or feedback, please reach out through:
- **Email:** [dylanyeung.dev@gmail.com](mailto:dylanyeung.dev@gmail.com)
- **LinkedIn:** [LinkedIn Profile](https://www.linkedin.com/in/dylayeung/)
- **GitHub:** [GitHub Profile](https://github.com/dylanyeung)
