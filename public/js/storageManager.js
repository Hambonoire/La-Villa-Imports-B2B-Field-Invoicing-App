/**
 * StorageManager - Auto-save, draft recovery, and offline queue
 */
class StorageManager {
  constructor() {
    this.DRAFT_KEY = 'invoice_draft';
    this.SYNC_QUEUE_KEY = 'sync_queue';
    this.AUTOSAVE_INTERVAL = 30000; // 30 seconds
    this.autosaveTimer = null;
  }

  // ─── Draft Management ───────────────────────────────────────

  saveDraft(invoiceData) {
    try {
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify({
        data: invoiceData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
      this.updateDraftStatus('saved');
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }

  loadDraft() {
    try {
      const draft = localStorage.getItem(this.DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }

  clearDraft() {
    localStorage.removeItem(this.DRAFT_KEY);
    this.updateDraftStatus('cleared');
  }

  hasDraft() {
    return localStorage.getItem(this.DRAFT_KEY) !== null;
  }

  // ─── Auto-save ───────────────────────────────────────────────

  startAutosave(getDataFn) {
    this.stopAutosave();
    this.autosaveTimer = setInterval(() => {
      const data = getDataFn();
      if (data && Object.keys(data).length > 0) {
        this.saveDraft(data);
        console.log('📝 Auto-saved draft at', new Date().toLocaleTimeString());
      }
    }, this.AUTOSAVE_INTERVAL);
  }

  stopAutosave() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  // ─── Sync Queue (Offline Actions) ───────────────────────────

  addToSyncQueue(action) {
    const queue = this.getSyncQueue();
    queue.push({
      ...action,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  getSyncQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  removeFromSyncQueue(id) {
    const queue = this.getSyncQueue().filter(item => item.id !== id);
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  clearSyncQueue() {
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
  }

  // ─── UI Status Updates ───────────────────────────────────────

  updateDraftStatus(state) {
    const el = document.getElementById('draftStatus');
    if (!el) return;

    if (state === 'saved') {
      el.textContent = '📝 Draft auto-saved';
      el.style.color = '#8B4513';
    } else if (state === 'cleared') {
      el.textContent = '';
    }
  }

  // ─── Draft Recovery Prompt ───────────────────────────────────

  promptDraftRecovery() {
    const draft = this.loadDraft();
    if (!draft) return null;

    const saved = new Date(draft.timestamp);
    const timeAgo = this.timeSince(saved);

    const recover = confirm(
      `📝 You have an unsaved invoice draft from ${timeAgo}.\n\nWould you like to restore it?`
    );

    if (recover) {
      return draft.data;
    } else {
      this.clearDraft();
      return null;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minute(s) ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour(s) ago`;
    return `${Math.floor(seconds / 86400)} day(s) ago`;
  }
}

const storageManager = new StorageManager();
