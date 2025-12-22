import { APIClient } from './api';
import type { Classroom, CreateWebClipPayload } from './types';

/**
 * Sidepanel script - main UI for capturing WebClips
 */

let classrooms: Classroom[] = [];
let isTeacherMode = false;
let isAuthenticated = false;
let pollingInterval: NodeJS.Timeout | null = null;

// Initialize sidepanel
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupEventListeners();
});

function setupEventListeners() {
  // Login
  document.getElementById('loginBtn')?.addEventListener('click', startLogin);
  document.getElementById('openVerifyBtn')?.addEventListener('click', openVerificationPage);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  
  // Mode toggle
  document.getElementById('studentMode')?.addEventListener('click', () => setMode(false));
  document.getElementById('teacherMode')?.addEventListener('click', () => setMode(true));

  // Capture buttons
  document.getElementById('captureSelection')?.addEventListener('click', () => captureWebClip('SELECTION'));
  document.getElementById('capturePage')?.addEventListener('click', () => captureWebClip('READABILITY'));

  // Teacher mode button
  document.getElementById('assignToClass')?.addEventListener('click', assignToClassroom);
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  const storage = await chrome.storage.sync.get(['accessToken', 'expiresAt', 'apiBaseUrl']);
  
  if (storage.accessToken && storage.expiresAt && storage.expiresAt > Date.now()) {
    isAuthenticated = true;
    showAuthenticatedUI();
    await loadClassrooms();
  } else {
    isAuthenticated = false;
    showLoginUI();
  }
}

/**
 * Start device code flow
 */
async function startLogin() {
  const config = await chrome.storage.sync.get(['apiBaseUrl']);
  
  if (!config.apiBaseUrl) {
    setStatus('Please configure API URL in options first', 'error');
    return;
  }

  setStatus('Starting login...', 'info');

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/auth/extension/device/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'browser-extension',
        scopes: ['extension:webclip:create', 'extension:session:start'],
      }),
    });

    const data = await response.json();
    
    showVerificationUI(data.userCode, data.verificationUrl);
    startPolling(data.deviceCode, data.pollIntervalSec, config.apiBaseUrl);
  } catch (error) {
    setStatus(`Login failed: ${error}`, 'error');
  }
}

/**
 * Start polling for authorization
 */
function startPolling(deviceCode: string, interval: number, apiBaseUrl: string) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/extension/device/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'browser-extension', deviceCode }),
      });

      const data = await response.json();

      if (data.status === 'APPROVED') {
        if (pollingInterval) clearInterval(pollingInterval);
        
        // Save tokens
        await chrome.storage.sync.set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: Date.now() + data.expiresInSec * 1000,
        });

        setStatus('✅ Login successful!', 'success');
        await checkAuth(); // Reload UI
      } else if (data.status === 'DENIED' || data.status === 'EXPIRED') {
        if (pollingInterval) clearInterval(pollingInterval);
        setStatus('❌ Authorization denied or expired', 'error');
        showLoginUI();
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, interval * 1000);
}

/**
 * Logout
 */
async function logout() {
  if (pollingInterval) clearInterval(pollingInterval);
  
  await chrome.storage.sync.remove(['accessToken', 'refreshToken', 'expiresAt']);
  isAuthenticated = false;
  showLoginUI();
  setStatus('Logged out', 'info');
}

/**
 * Open verification page in new tab
 */
function openVerificationPage() {
  const url = document.getElementById('verificationUrl')?.getAttribute('data-url');
  if (url) {
    chrome.tabs.create({ url });
  }
}

/**
 * UI State Management
 */
function showLoginUI() {
  document.getElementById('loginSection')!.style.display = 'block';
  document.getElementById('verificationSection')!.style.display = 'none';
  document.getElementById('authenticatedSection')!.style.display = 'none';
}

function showVerificationUI(userCode: string, verificationUrl: string) {
  document.getElementById('loginSection')!.style.display = 'none';
  document.getElementById('verificationSection')!.style.display = 'block';
  document.getElementById('authenticatedSection')!.style.display = 'none';
  
  document.getElementById('userCode')!.textContent = userCode;
  document.getElementById('verificationUrl')!.setAttribute('data-url', verificationUrl);
  setStatus('Waiting for authorization...', 'info');
}

function showAuthenticatedUI() {
  document.getElementById('loginSection')!.style.display = 'none';
  document.getElementById('verificationSection')!.style.display = 'none';
  document.getElementById('authenticatedSection')!.style.display = 'block';
}

// Rest of existing functions (setMode, loadClassrooms, captureWebClip, etc.)

function setMode(teacher: boolean) {
  isTeacherMode = teacher;
  
  const studentBtn = document.getElementById('studentMode');
  const teacherBtn = document.getElementById('teacherMode');
  const teacherSection = document.getElementById('teacherSection');
  const assignBtn = document.getElementById('assignToClass');

  if (studentBtn && teacherBtn && teacherSection && assignBtn) {
    if (teacher) {
      studentBtn.classList.remove('active');
      teacherBtn.classList.add('active');
      teacherSection.style.display = 'block';
      assignBtn.style.display = 'block';
    } else {
      studentBtn.classList.add('active');
      teacherBtn.classList.remove('active');
      teacherSection.style.display = 'none';
      assignBtn.style.display = 'none';
    }
  }
}

async function loadClassrooms() {
  try {
    const config = await chrome.storage.sync.get(['apiBaseUrl', 'accessToken']);
    if (!config.apiBaseUrl || !config.accessToken) return;

    const response = await fetch(`${config.apiBaseUrl}/api/v1/classrooms/mine`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    });

    const data = await response.json();
    classrooms = data.classrooms;

    const select = document.getElementById('classroomSelect') as HTMLSelectElement;
    if (select) {
      select.innerHTML = '<option value="">Selecione uma turma...</option>';
      classrooms.forEach(c => {
        const option = document.createElement('option');
        option.value = c.classroomId;
        option.textContent = `${c.name} (${c.enrollmentCount} alunos)`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load classrooms:', error);
  }
}

async function captureWebClip(mode: 'SELECTION' | 'READABILITY') {
  const timeboxMin = parseInt((document.getElementById('timebox') as HTMLSelectElement).value);
  const readingIntent = (document.getElementById('intent') as HTMLSelectElement).value as 'inspectional' | 'analytical';
  const goal = (document.getElementById('goal') as HTMLInputElement).value;

  const payload: CreateWebClipPayload = {
    goal,
    timeboxMin,
    readingIntent,
    sendInitialPrompt: true,
  };

  setStatus('Creating WebClip...', 'info');

  try {
    const response = await chrome.runtime.sendMessage({
      type: mode === 'SELECTION' ? 'CREATE_WEBCLIP_SELECTION' : 'CREATE_WEBCLIP_READABILITY',
      payload,
    });

    if (response.success) {
      setStatus('✓ WebClip created! Opening reader...', 'success');
    } else {
      setStatus(`Error: ${response.error}`, 'error');
      
      // If 401, try to refresh token or logout
      if (response.error?.includes('401')) {
        await checkAuth();
      }
    }
  } catch (error) {
    setStatus(`Error: ${error}`, 'error');
  }
}

async function assignToClassroom() {
  const classroomId = (document.getElementById('classroomSelect') as HTMLSelectElement).value;
  
  if (!classroomId) {
    setStatus('Please select a classroom', 'error');
    return;
  }

  setStatus('Assigning to classroom...', 'info');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_WEBCLIP_TEACHER',
      payload: { classroomId },
    });

    if (response.success) {
      setStatus('✓ Article assigned to classroom plan!', 'success');
    } else {
      setStatus(`Error: ${response.error}`, 'error');
    }
  } catch (error) {
    setStatus(`Error: ${error}`, 'error');
  }
}

function setStatus(message: string, type: 'info' | 'success' | 'error') {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
  }
}
