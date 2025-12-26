/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (!tabName) return;
      
      // Update active button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide content
      document.getElementById('webclipTab')!.style.display = tabName === 'webclip' ? 'block' : 'none';
      document.getElementById('cornellTab')!.style.display = tabName === 'cornell' ? 'block' : 'none';
      
      // Load Cornell notes if switching to Cornell tab
      if (tabName === 'cornell') {
        loadCornellNotes();
      }
    });
  });
}

/**
 * Toggle Cornell mode in active tab
 */
async function toggleCornellMode() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.id) {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_CORNELL' });
      
      if (response.active) {
        setStatus('✓ Cornell mode activated!', 'success');
        document.getElementById('toggleCornellMode')!.textContent = 'Desativar Modo Cornell';
      } else {
        setStatus('Cornell mode deactivated', 'info');
        document.getElementById('toggleCornellMode')!.textContent = 'Ativar Modo Cornell (Ctrl+Shift+C)';
      }
    }
  } catch (error) {
    console.error('Failed to toggle Cornell mode:', error);
    setStatus('Error toggling Cornell mode', 'error');
  }
}

/**
 * Load Cornell notes for current page
 */
async function loadCornellNotes() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url) return;
    
    // CACHE-FIRST: Load from cache immediately
    const { CornellStorage } = await import('./cornell-storage');
    const cachedNotes = await CornellStorage.getCachedNotes(tab.url);
    
    if (cachedNotes.length > 0) {
      renderCornellNotes(cachedNotes);
      setStatus(`Loaded ${cachedNotes.length} notes from cache`, 'info');
    }
    
    // Then fetch fresh data from server
    const config = await chrome.storage.sync.get(['apiBaseUrl', 'accessToken']);
    if (!config.apiBaseUrl || !config.accessToken) {
      setStatus('Not authenticated', 'error');
      return;
    }
    
    const { APIClient } = await import('./api');
    const api = new APIClient(config.apiBaseUrl, config.accessToken);
    
    const data = await api.getCornellNotes(tab.url);
    
    // Update cache with fresh data
    await CornellStorage.cacheNotes(tab.url, data.notes || []);
    
    // Re-render with fresh data
    renderCornellNotes(data.notes || []);
    
    setStatus(`Loaded ${data.notes?.length || 0} notes`, 'success');
  } catch (error) {
    console.error('Failed to load Cornell notes:', error);
    setStatus(`Failed to load notes: ${error}`, 'error');
  }
}

/**
 * Render Cornell notes list
 */
function renderCornellNotes(notes: any[]) {
  const container = document.getElementById('cornellNotesList');
  const countEl = document.getElementById('notesCount');
  
  if (!container || !countEl) return;
  
  countEl.textContent = `${notes.length} nota${notes.length !== 1 ? 's' : ''} nesta página`;
  
  if (notes.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma nota ainda. Selecione texto e pressione Ctrl+Shift+C</p>';
    return;
  }
  
  container.innerHTML = '';
  
  notes.forEach((note: any) => {
    const noteEl = document.createElement('div');
    noteEl.className = `cornell-note ${note.type}`;
    
    const icon = note.type === 'highlight' ? '🖍️' : 
                 note.type === 'question' ? '❓' : 
                 note.type === 'note' ? '📝' : '⭐';
    
    noteEl.innerHTML = `
      <div class="note-header">
        <span class="note-icon">${icon}</span>
        <span class="note-type">${note.type}</span>
        <span class="note-date">${new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="note-text">${note.text}</div>
    `;
    
    container.appendChild(noteEl);
  });
}
