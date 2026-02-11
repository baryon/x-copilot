import type { ExtensionMessage, MessageResponse } from './types';

export function sendMessage(message: ExtensionMessage): Promise<MessageResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { success: true });
    });
  });
}

export function sendTabMessage(tabId: number, message: ExtensionMessage): Promise<MessageResponse> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { success: true });
    });
  });
}

export function onMessage(
  handler: (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void,
  ) => boolean | void,
): void {
  chrome.runtime.onMessage.addListener(handler);
}
