/**
 * Portal - Connection status, draft detection, sync status
 */

// Connection status
function updateConnectionStatus() {
  const indicator = document.getElementById('connectionStatus');
  const text = document.getElementById('connectionText');

  if (navigator.onLine) {
    indicator.className = 'status-indicator status-indicator--online';
    text.textContent = 'Online';
  } else {
    indicator.className = 'status-indicator status-indicator--offline';
    text.textContent = 'Offline';
  }
}

// Draft detection
function checkDrafts() {
  const draftStatus = document.getElementById('draftStatus');
  const draft = localStorage.getItem('invoice_draft');

  if (draft) {
    const parsed = JSON.parse(draft);
    const saved = new Date(parsed.timestamp);
    const timeAgo = timeSince(saved);
    draftStatus.textContent = `📝 Draft saved ${timeAgo}`;
    draftStatus.style.color = '#8B4513';
    draftStatus.style.cursor = 'pointer';
    draftStatus.title = 'Click to resume draft';
    draftStatus.onclick = () => window.location.href = '/pages/invoice.html';
  } else {
    draftStatus.textContent = 'No saved drafts';
    draftStatus.style.color = '#666';
  }
}

// Sync status
function checkSyncStatus() {
  const syncStatus = document.getElementById('syncStatus');
  const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');

  if (queue.length > 0) {
    syncStatus.textContent = `⚠️ ${queue.length} item(s) pending sync`;
    syncStatus.style.color = '#f59e0b';
  } else {
    syncStatus.textContent = '✅ All synced';
    syncStatus.style.color = '#22c55e';
  }
}

// Time since helper
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Event listeners
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Init
updateConnectionStatus();
checkDrafts();
checkSyncStatus();
