// Global alert override to replace browser alerts with custom branded ones

// Store original functions (only on client side)
let originalAlert: ((message?: string) => void) | undefined;
let originalConfirm: ((message?: string) => boolean) | undefined;

if (typeof window !== 'undefined') {
  originalAlert = window.alert;
  originalConfirm = window.confirm;
}

// Get app title based on language
function getAppTitle(): string {
  const lang = (typeof window !== 'undefined' && localStorage.getItem('vazana-language')) || 'he';
  return lang === 'he' ? 'וזאנה - אבטחת כבישים' : 'Vazana - Roadside Security';
}

// Custom alert modal component (will be shown as DOM overlay)
function createCustomModal(message: string, type: 'alert' | 'confirm' = 'alert'): Promise<boolean> {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: 'Alef', sans-serif;
      direction: rtl;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      text-align: right;
    `;

    // Title
    const title = document.createElement('h3');
    title.textContent = getAppTitle();
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: bold;
      color: #1a1a1a;
      border-bottom: 2px solid #00dac0;
      padding-bottom: 8px;
    `;

    // Message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 14px;
      line-height: 1.5;
      color: #374151;
    `;

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-start;
    `;

    // OK/Confirm button
    const okButton = document.createElement('button');
    okButton.textContent = type === 'confirm' ? 'אישור' : 'אישור';
    okButton.style.cssText = `
      background: #00dac0;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Alef', sans-serif;
      font-size: 14px;
    `;

    // Cancel button (only for confirm)
    let cancelButton: HTMLButtonElement | null = null;
    if (type === 'confirm') {
      cancelButton = document.createElement('button');
      cancelButton.textContent = 'ביטול';
      cancelButton.style.cssText = `
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Alef', sans-serif;
        font-size: 14px;
      `;
    }

    // Event handlers
    const cleanup = () => {
      document.body.removeChild(overlay);
    };

    okButton.onclick = () => {
      cleanup();
      resolve(true);
    };

    if (cancelButton) {
      cancelButton.onclick = () => {
        cleanup();
        resolve(false);
      };
    }

    // Assemble modal
    modal.appendChild(title);
    modal.appendChild(messageEl);
    buttonsContainer.appendChild(okButton);
    if (cancelButton) {
      buttonsContainer.appendChild(cancelButton);
    }
    modal.appendChild(buttonsContainer);
    overlay.appendChild(modal);

    // Add to DOM
    document.body.appendChild(overlay);
  });
}

// Override global alert
export function enableGlobalAlertOverride() {
  if (typeof window === 'undefined') return;
  
  // Override alert
  window.alert = function(message: string) {
    createCustomModal(message, 'alert');
  };

  // Override confirm
  window.confirm = function(message: string): boolean {
    // Note: This is synchronous but the custom modal is async
    // For now, we'll fall back to a styled native confirm
    const title = getAppTitle();
    return originalConfirm ? originalConfirm(`${title}\n\n${message}`) : confirm(message);
  };
}

// Restore original functions
export function disableGlobalAlertOverride() {
  if (typeof window === 'undefined') return;
  
  if (originalAlert) window.alert = originalAlert;
  if (originalConfirm) window.confirm = originalConfirm;
}

// Custom async versions for better UX
export async function customAlert(message: string): Promise<void> {
  await createCustomModal(message, 'alert');
}

export async function customConfirm(message: string): Promise<boolean> {
  return await createCustomModal(message, 'confirm');
}