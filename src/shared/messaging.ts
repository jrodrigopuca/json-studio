/**
 * Type-safe Chrome extension messaging utilities.
 */

import type { ExtensionMessage } from "./types.js";

/**
 * Sends a message to the background service worker.
 */
export function sendMessage(message: ExtensionMessage): Promise<unknown> {
	return chrome.runtime.sendMessage(message);
}

/**
 * Sends a message to a specific tab's content script.
 */
export function sendMessageToTab(
	tabId: number,
	message: ExtensionMessage,
): Promise<unknown> {
	return chrome.tabs.sendMessage(tabId, message);
}

/**
 * Listens for messages from other extension components.
 */
export function onMessage(
	handler: (
		message: ExtensionMessage,
		sender: chrome.runtime.MessageSender,
		sendResponse: (response?: unknown) => void,
	) => boolean | void,
): void {
	chrome.runtime.onMessage.addListener(handler);
}
