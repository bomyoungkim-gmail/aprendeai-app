/**
 * Options page script - configures API URL and auth token
 */

// Load saved config on page load
document.addEventListener('DOMContentLoaded', async () => {
  const config = await chrome.storage.sync.get(['apiBaseUrl', 'authToken']);
  
  const urlInput = document.getElementById('apiUrl') as HTMLInputElement;
  const tokenInput = document.getElementById('authToken') as HTMLInputElement;

  if (urlInput && config.apiBaseUrl) {
    urlInput.value = config.apiBaseUrl;
  }

  if (tokenInput && config.authToken) {
    tokenInput.value = config.authToken;
  }
});

// Save config when form is submitted
document.getElementById('saveBtn')?.addEventListener('click', async () => {
  const urlInput = document.getElementById('apiUrl') as HTMLInputElement;
  const tokenInput = document.getElementById('authToken') as HTMLInputElement;

  const apiBaseUrl = urlInput.value.trim();
  const authToken = tokenInput.value.trim();

  if (!apiBaseUrl || !authToken) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ apiBaseUrl, authToken });
    showMessage('Settings saved successfully!', 'success');
  } catch (error) {
    showMessage(`Error saving: ${error}`, 'error');
  }
});

function showMessage(text: string, type: 'success' | 'error') {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}
