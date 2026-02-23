/**
 * Popup script — Handles popup interactions.
 */

const pasteBtn = document.getElementById("paste-json");

pasteBtn?.addEventListener("click", async () => {
	try {
		const text = await navigator.clipboard.readText();
		if (!text.trim()) {
			alert("Clipboard is empty.");
			return;
		}

		// Open a new tab with the JSON content
		// This will trigger the content script to detect and render it
		const blob = new Blob([text], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		chrome.tabs.create({ url });
	} catch {
		alert("Could not read clipboard. Please allow clipboard access.");
	}
});
