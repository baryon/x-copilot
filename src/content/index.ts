import type { ExtensionMessage, MessageResponse, SummarizeResultMessage } from '@shared/types';
import { startExtraction, stopExtraction } from './extractor/scroll-controller';
import { initSummarizeButtons } from './summarize-button';
import { updateOverlay } from './summary-overlay';

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender: chrome.runtime.MessageSender, sendResponse: (r: MessageResponse) => void) => {
    switch (message.type) {
      case 'BEGIN_EXTRACTION':
        startExtraction(message.source);
        sendResponse({ success: true });
        break;

      case 'STOP_EXTRACTION':
        stopExtraction();
        sendResponse({ success: true });
        break;

      case 'SUMMARIZE_RESULT':
        updateOverlay(message as SummarizeResultMessage);
        sendResponse({ success: true });
        break;
    }
  },
);

// Initialize summarize buttons when page is ready
initSummarizeButtons();
