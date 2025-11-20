// Popup UI controller
(function() {
  'use strict';
  
  let currentFilters = {
    text: '',
    color: null,
    hasImages: false,
    hasVideos: false,
    hasCode: false,
    startDate: null,
    endDate: null
  };
  
  let allResults = [];
  
  // DOM elements
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('results');
  const colorInput = document.getElementById('colorInput');
  const statsElement = document.getElementById('stats');
  const settingsBtn = document.getElementById('settingsBtn');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    await performSearch();
    setupEventListeners();
  });
  
  // Setup event listeners
  function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.text = e.target.value;
        performSearch();
      }, 300);
    });
    
    // Filter buttons
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        
        // Handle date filters
        if (filter === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          currentFilters.startDate = today.getTime();
          currentFilters.endDate = Date.now();
          toggleButton(btn);
        } else if (filter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);
          currentFilters.startDate = weekAgo.getTime();
          currentFilters.endDate = Date.now();
          toggleButton(btn);
        } else {
          // Toggle boolean filters
          currentFilters[filter] = !currentFilters[filter];
          toggleButton(btn);
        }
        
        performSearch();
      });
    });
    
    // Color picker
    colorInput.addEventListener('change', (e) => {
      const color = hexToRgb(e.target.value);
      currentFilters.color = color;
      document.getElementById('colorPicker').style.background = e.target.value;
      performSearch();
    });
    
    // Settings button
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
  
  // Toggle button active state
  function toggleButton(btn) {
    btn.classList.toggle('active');
    
    // Deactivate other date buttons if this is a date button
    if (btn.dataset.filter === 'today' || btn.dataset.filter === 'week') {
      filterButtons.forEach(otherBtn => {
        if (otherBtn !== btn && 
            (otherBtn.dataset.filter === 'today' || otherBtn.dataset.filter === 'week')) {
          otherBtn.classList.remove('active');
        }
      });
    }
  }
  
  // Perform search
  async function performSearch() {
    showLoading();
    
    try {
      // Prepare query
      const query = {
        text: currentFilters.text,
        color: currentFilters.color,
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        limit: 50
      };
      
      // Send search request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'search',
        query
      });
      
      allResults = response.results || [];
      
      // Apply client-side filters (for boolean properties)
      let filteredResults = allResults;
      
      if (currentFilters.hasImages) {
        filteredResults = filteredResults.filter(r => r.hasImages);
      }
      if (currentFilters.hasVideos) {
        filteredResults = filteredResults.filter(r => r.hasVideos);
      }
      if (currentFilters.hasCode) {
        filteredResults = filteredResults.filter(r => r.hasCode);
      }
      
      displayResults(filteredResults);
      
    } catch (error) {
      console.error('Search failed:', error);
      showError('Failed to search. Please try again.');
    }
  }
  
  // Display results
  function displayResults(results) {
    if (results.length === 0) {
      showEmptyState();
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'results-grid';
    
    results.forEach(result => {
      const card = createResultCard(result);
      grid.appendChild(card);
    });
    
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(grid);
  }
  
  // Create result card
  function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // Load screenshot asynchronously
    const img = document.createElement('img');
    img.className = 'result-thumbnail';
    img.alt = result.title;
    
    // Set placeholder color
    if (result.dominantColor) {
      img.style.background = `rgb(${result.dominantColor.r}, ${result.dominantColor.g}, ${result.dominantColor.b})`;
    }
    
    // Load actual screenshot
    loadScreenshot(result.id).then(screenshot => {
      if (screenshot) {
        img.src = screenshot;
      }
    });
    
    card.appendChild(img);
    
    // Info section
    const info = document.createElement('div');
    info.className = 'result-info';
    
    const title = document.createElement('div');
    title.className = 'result-title';
    title.textContent = result.title;
    title.title = result.title;
    
    const domain = document.createElement('div');
    domain.className = 'result-domain';
    domain.textContent = result.domain;
    
    const time = document.createElement('div');
    time.className = 'result-time';
    time.textContent = formatTime(result.timestamp);
    
    info.appendChild(title);
    info.appendChild(domain);
    info.appendChild(time);
    card.appendChild(info);
    
    // Click handler
    card.addEventListener('click', () => {
      chrome.tabs.create({ url: result.url });
    });
    
    return card;
  }
  
  // Load screenshot from background
  async function loadScreenshot(pageId) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getScreenshot',
        pageId
      });
      return response.screenshot;
    } catch (error) {
      console.error('Failed to load screenshot:', error);
      return null;
    }
  }
  
  // Show loading state
  function showLoading() {
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Searching...</p>
      </div>
    `;
  }
  
  // Show empty state
  function showEmptyState() {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No results found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    `;
  }
  
  // Show error
  function showError(message) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Oops!</h3>
        <p>${message}</p>
      </div>
    `;
  }
  
  // Load stats
  async function loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });
      
      if (response.stats) {
        statsElement.textContent = `${response.stats.totalPages} pages saved`;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      statsElement.textContent = 'Stats unavailable';
    }
  }
  
  // Format timestamp
  function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Convert hex color to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
})();
