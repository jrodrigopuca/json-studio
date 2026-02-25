/**
 * Popup script — Handles popup interactions and scratch pad.
 */

const pasteBtn = document.getElementById("paste-json");
const toggleScratchpadBtn = document.getElementById("toggle-scratchpad");
const scratchpad = document.getElementById("scratchpad");
const scratchpadInput = document.getElementById(
	"scratchpad-input",
) as HTMLTextAreaElement | null;
const prettifyBtn = document.getElementById("scratchpad-prettify");
const minifyBtn = document.getElementById("scratchpad-minify");
const openBtn = document.getElementById("scratchpad-open");

// Toggle scratch pad visibility
toggleScratchpadBtn?.addEventListener("click", () => {
	if (scratchpad) {
		const isHidden = scratchpad.style.display === "none";
		scratchpad.style.display = isHidden ? "block" : "none";
		if (isHidden) scratchpadInput?.focus();
	}
});

// Paste JSON from clipboard
pasteBtn?.addEventListener("click", async () => {
	try {
		const text = await navigator.clipboard.readText();
		if (!text.trim()) {
			alert("Clipboard is empty.");
			return;
		}
		openJsonInNewTab(text);
	} catch {
		alert("Could not read clipboard. Please allow clipboard access.");
	}
});

// Prettify scratch pad content
prettifyBtn?.addEventListener("click", () => {
	if (!scratchpadInput) return;
	try {
		const parsed = JSON.parse(scratchpadInput.value);
		scratchpadInput.value = JSON.stringify(parsed, null, 2);
	} catch {
		alert("Invalid JSON.");
	}
});

// Minify scratch pad content
minifyBtn?.addEventListener("click", () => {
	if (!scratchpadInput) return;
	try {
		const parsed = JSON.parse(scratchpadInput.value);
		scratchpadInput.value = JSON.stringify(parsed);
	} catch {
		alert("Invalid JSON.");
	}
});

// Open scratch pad content in viewer
openBtn?.addEventListener("click", () => {
	if (!scratchpadInput?.value.trim()) {
		alert("Scratch pad is empty.");
		return;
	}
	openJsonInNewTab(scratchpadInput.value);
});

/**
 * Opens JSON text in the viewer by storing it and opening the viewer page.
 */
async function openJsonInNewTab(text: string): Promise<void> {
	// Store the JSON temporarily using chrome.storage.session (available in MV3)
	const key = `json-spark-temp-${Date.now()}`;

	try {
		await chrome.storage.session.set({ [key]: text });

		// Open the viewer page with the key in the URL
		const viewerUrl = chrome.runtime.getURL(`viewer/index.html?temp=${key}`);
		await chrome.tabs.create({ url: viewerUrl });
	} catch (error) {
		console.error("Failed to store JSON:", error);
		alert("Could not open viewer. Please try again.");
	}
}
