// Options page controller
(function() {
  'use strict';
  
  // DOM elements
  const enableCapture = document.getElementById('enableCapture');
  const daysToKeep = document.getElementById('daysToKeep');
  const excludeIncognito = document.getElementById('excludeIncognito');
  const excludedDomainsContainer = document.getElementById('excludedDomains');
  const newDomainInput = document.getElementById('newDomain');
  const addDomainBtn = document.getElementById('addDomain');
  const cleanupBtn = document.getElementById('cleanupNow');
  const exportBtn = document.getElementById('exportData');
  const deleteBtn = document.getElementById('deleteAllData');
  const alertsContainer = document.getElementById('alerts');
  
  // Stats elements
  const totalPagesEl = document.getElementById('totalPages');
  const storageUsedEl = document.getElementById('storageUsed');
  const oldestPageEl = document.getElementById('oldestPage');
  
  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadStats();
    setupEventListeners();
  });
  
  // Load current settings
  async function loadSettings() {
    const settings = await chrome.storage.local.get([
      'enabled',
      'daysToKeep',
      'excludeIncognito',
      'excludeDomains'
    ]);
    
    enableCapture.checked = settings.enabled !== false;
    daysToKeep.value = settings.daysToKeep || 30;
    excludeIncognito.checked = settings.excludeIncognito !== false;
    
    renderExcludedDomains(settings.excludeDomains || []);
  }
  
  // Render excluded domains list
  function renderExcludedDomains(domains) {
    excludedDomainsContainer.innerHTML = '';
    
    if (domains.length === 0) {
      const empty = document.createElement('p');
      empty.style.color = '#6c757d';
      empty.style.fontSize = '13px';
      empty.style.marginTop = '12px';
      empty.textContent = 'No excluded domains yet';
      excludedDomainsContainer.appendChild(empty);
      return;
    }
    
    domains.forEach(domain => {
      const tag = document.createElement('span');
      tag.className = 'domain-tag';
      
      const text = document.createElement('span');
      text.textContent = domain;
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => removeDomain(domain));
      
      tag.appendChild(text);
      tag.appendChild(removeBtn);
      excludedDomainsContainer.appendChild(tag);
    });
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Save settings on change
    enableCapture.addEventListener('change', saveSettings);
    daysToKeep.addEventListener('change', saveSettings);
    excludeIncognito.addEventListener('change', saveSettings);
    
    // Add domain
    addDomainBtn.addEventListener('click', addDomain);
    newDomainInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addDomain();
    });
    
    // Cleanup
    cleanupBtn.addEventListener('click', cleanupOldPages);
    
    // Export
    exportBtn.addEventListener('click', exportData);
    
    // Delete all
    deleteBtn.addEventListener('click', deleteAllData);
  }
  
  // Save settings
  async function saveSettings() {
    const settings = {
      enabled: enableCapture.checked,
      daysToKeep: parseInt(daysToKeep.value),
      excludeIncognito: excludeIncognito.checked
    };
    
    await chrome.storage.local.set(settings);
    showAlert('Settings saved', 'success');
  }
  
  // Add excluded domain
  async function addDomain() {
    const domain = newDomainInput.value.trim().toLowerCase();
    
    if (!domain) {
      showAlert('Please enter a domain', 'warning');
      return;
    }
    
    // Validate domain format
    if (!isValidDomain(domain)) {
      showAlert('Please enter a valid domain (e.g., example.com)', 'warning');
      return;
    }
    
    const settings = await chrome.storage.local.get(['excludeDomains']);
    const excludeDomains = settings.excludeDomains || [];
    
    if (excludeDomains.includes(domain)) {
      showAlert('Domain already excluded', 'warning');
      return;
    }
    
    excludeDomains.push(domain);
    await chrome.storage.local.set({ excludeDomains });
    
    renderExcludedDomains(excludeDomains);
    newDomainInput.value = '';
    showAlert(`${domain} will no longer be captured`, 'success');
  }
  
  // Remove excluded domain
  async function removeDomain(domain) {
    const settings = await chrome.storage.local.get(['excludeDomains']);
    const excludeDomains = (settings.excludeDomains || []).filter(d => d !== domain);
    
    await chrome.storage.local.set({ excludeDomains });
    renderExcludedDomains(excludeDomains);
    showAlert(`${domain} removed from exclusions`, 'success');
  }
  
  // Validate domain
  function isValidDomain(domain) {
    const pattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return pattern.test(domain);
  }
  
  // Load storage stats
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });
      
      if (response.stats) {
        totalPagesEl.textContent = response.stats.totalPages || 0;
        storageUsedEl.textContent = '~' + Math.round((response.stats.totalPages || 0) * 0.1) + 'MB';
        
        // Estimate oldest page (simplified)
        const settings = await chrome.storage.local.get(['daysToKeep']);
        oldestPageEl.textContent = (settings.daysToKeep || 30) + ' days';
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }
  
  // Cleanup old pages
  async function cleanupOldPages() {
    if (!confirm('Remove all pages older than your retention period?')) {
      return;
    }
    
    cleanupBtn.disabled = true;
    cleanupBtn.textContent = 'Cleaning...';
    
    try {
      const settings = await chrome.storage.local.get(['daysToKeep']);
      const response = await chrome.runtime.sendMessage({
        action: 'cleanOldEntries',
        daysToKeep: settings.daysToKeep || 30
      });
      
      showAlert(`Removed ${response.deleted} old pages`, 'success');
      await loadStats();
    } catch (error) {
      showAlert('Cleanup failed. Please try again.', 'danger');
      console.error('Cleanup error:', error);
    } finally {
      cleanupBtn.disabled = false;
      cleanupBtn.textContent = 'Clean Up Old Pages Now';
    }
  }
  
  // Export data
  async function exportData() {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    
    try {
      // Note: Full export functionality would require additional implementation
      showAlert('Export feature coming soon! For now, your data stays securely on your device.', 'warning');
    } catch (error) {
      showAlert('Export failed. Please try again.', 'danger');
      console.error('Export error:', error);
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export';
    }
  }
  
  // Delete all data
  async function deleteAllData() {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete ALL saved pages and screenshots.\n\n' +
      'This cannot be undone.\n\n' +
      'Are you absolutely sure?'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = confirm('Last chance! Delete everything?');
    if (!doubleConfirm) return;
    
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    try {
      await chrome.runtime.sendMessage({
        action: 'deleteAllData'
      });
      
      showAlert('All data deleted successfully', 'success');
      await loadStats();
    } catch (error) {
      showAlert('Deletion failed. Please try again.', 'danger');
      console.error('Delete error:', error);
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete Everything';
    }
  }
  
  // Show alert
  function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertsContainer.innerHTML = '';
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
})();
