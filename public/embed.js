(function() {
  'use strict';

  // Configuration
  const API_URL = 'https://meehan-law-firm-dui-checkpoints.vercel.app/api/dui-checkpoints';
  const CONTAINER_ID = 'dui-checkpoints-widget';

  // Styles
  const styles = `
    .dui-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .dui-widget * {
      box-sizing: border-box;
    }
    .dui-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .dui-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a202c;
      margin: 0;
    }
    .dui-count {
      font-size: 14px;
      color: #4a5568;
    }
    .dui-filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .dui-search {
      flex: 1;
      min-width: 200px;
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .dui-search:focus {
      border-color: #E86C2C;
    }
    .dui-select {
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      min-width: 150px;
    }
    .dui-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .dui-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .dui-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .dui-card-bar {
      height: 4px;
      background: #E86C2C;
    }
    .dui-card-bar.past {
      background: #cbd5e0;
    }
    .dui-card-content {
      padding: 20px;
    }
    .dui-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .dui-card-city {
      font-size: 18px;
      font-weight: 600;
      color: #1a202c;
      margin: 0 0 4px 0;
    }
    .dui-card-county {
      font-size: 14px;
      color: #E86C2C;
      font-weight: 500;
    }
    .dui-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      background: #c6f6d5;
      color: #22543d;
    }
    .dui-card-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .dui-info-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .dui-info-icon {
      width: 18px;
      height: 18px;
      color: #E86C2C;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .dui-info-label {
      font-size: 11px;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .dui-info-value {
      font-size: 14px;
      color: #1a202c;
    }
    .dui-card-footer {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .dui-view-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #E86C2C;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      transition: opacity 0.2s;
    }
    .dui-view-btn:hover {
      opacity: 0.8;
    }
    .dui-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }
    .dui-modal {
      background: white;
      width: 100%;
      max-width: 500px;
      max-height: 85vh;
      border-radius: 16px 16px 0 0;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }
    @media (min-width: 768px) {
      .dui-modal {
        border-radius: 16px;
        margin: 20px;
        align-self: center;
      }
    }
    .dui-modal-handle {
      width: 40px;
      height: 4px;
      background: #cbd5e0;
      border-radius: 2px;
      margin: 12px auto;
    }
    .dui-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0 20px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .dui-modal-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .dui-modal-close:hover {
      background: #f7fafc;
    }
    .dui-modal-body {
      padding: 20px;
      overflow-y: auto;
      max-height: 50vh;
    }
    .dui-modal-desc {
      font-size: 14px;
      color: #4a5568;
      line-height: 1.6;
      white-space: pre-line;
    }
    .dui-modal-source {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #E86C2C;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      margin-top: 16px;
    }
    .dui-modal-source:hover {
      text-decoration: underline;
    }
    .dui-modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #e2e8f0;
    }
    .dui-close-btn {
      width: 100%;
      padding: 12px;
      background: #2C3E50;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .dui-close-btn:hover {
      background: #1a252f;
    }
    .dui-loading {
      text-align: center;
      padding: 40px;
      color: #4a5568;
    }
    .dui-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #E86C2C;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    .dui-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
    }
    .dui-page-btn {
      padding: 8px 16px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dui-page-btn:hover:not(:disabled) {
      border-color: #E86C2C;
      color: #E86C2C;
    }
    .dui-page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .dui-page-info {
      font-size: 14px;
      color: #4a5568;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Icons as SVG strings
  const icons = {
    location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  // State
  let checkpoints = [];
  let filteredCheckpoints = [];
  let currentPage = 1;
  let searchQuery = '';
  let cityFilter = 'all';
  let countyFilter = 'all';
  let selectedCheckpoint = null;
  const itemsPerPage = 9;

  // Helper functions
  function formatDate(dateString) {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  function isUpcoming(dateString) {
    if (!dateString) return false;
    const checkpointDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkpointDate >= today;
  }

  function getUniqueCities() {
    const cities = new Set();
    checkpoints.forEach(cp => cp.City && cities.add(cp.City.trim()));
    return Array.from(cities).sort();
  }

  function getUniqueCounties() {
    const counties = new Set();
    checkpoints.forEach(cp => cp.County && counties.add(cp.County.trim()));
    return Array.from(counties).sort();
  }

  function filterCheckpoints() {
    filteredCheckpoints = checkpoints.filter(cp => {
      if (cityFilter !== 'all' && cp.City?.trim() !== cityFilter) return false;
      if (countyFilter !== 'all' && cp.County?.trim() !== countyFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          cp.City?.toLowerCase().includes(query) ||
          cp.County?.toLowerCase().includes(query) ||
          cp.Location?.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
    currentPage = 1;
    render();
  }

  function getPaginatedCheckpoints() {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCheckpoints.slice(start, start + itemsPerPage);
  }

  function getTotalPages() {
    return Math.ceil(filteredCheckpoints.length / itemsPerPage);
  }

  // Render functions
  function renderCard(checkpoint) {
    const upcoming = isUpcoming(checkpoint.Date);
    return `
      <div class="dui-card">
        <div class="dui-card-bar ${upcoming ? '' : 'past'}"></div>
        <div class="dui-card-content">
          <div class="dui-card-header">
            <div>
              <h3 class="dui-card-city">${checkpoint.City || 'Unknown City'}</h3>
              <div class="dui-card-county">${checkpoint.County || 'Unknown County'}</div>
            </div>
            ${upcoming ? '<span class="dui-badge">Upcoming</span>' : ''}
          </div>
          <div class="dui-card-info">
            <div class="dui-info-row">
              <span class="dui-info-icon">${icons.location}</span>
              <div>
                <div class="dui-info-label">Location</div>
                <div class="dui-info-value">${checkpoint.Location || 'Location not specified'}</div>
              </div>
            </div>
            <div class="dui-info-row">
              <span class="dui-info-icon">${icons.calendar}</span>
              <div>
                <div class="dui-info-label">Date</div>
                <div class="dui-info-value">${formatDate(checkpoint.Date)}</div>
              </div>
            </div>
            <div class="dui-info-row">
              <span class="dui-info-icon">${icons.clock}</span>
              <div>
                <div class="dui-info-label">Time</div>
                <div class="dui-info-value">${checkpoint.Time || 'Time not specified'}</div>
              </div>
            </div>
          </div>
          <div class="dui-card-footer">
            <button class="dui-view-btn" data-id="${checkpoint.id}">
              <span class="dui-info-icon">${icons.eye}</span>
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderModal() {
    if (!selectedCheckpoint) return '';
    const cp = selectedCheckpoint;
    return `
      <div class="dui-modal-overlay" id="dui-modal">
        <div class="dui-modal">
          <div class="dui-modal-handle"></div>
          <div class="dui-modal-header">
            <div>
              <h3 class="dui-card-city">${cp.City || 'Unknown City'}</h3>
              <div class="dui-card-county">${cp.County || 'Unknown County'}</div>
            </div>
            <button class="dui-modal-close" id="dui-close-modal">
              ${icons.close}
            </button>
          </div>
          <div class="dui-modal-body">
            <div class="dui-card-info">
              <div class="dui-info-row">
                <span class="dui-info-icon">${icons.location}</span>
                <div>
                  <div class="dui-info-label">Location</div>
                  <div class="dui-info-value">${cp.Location || 'Location not specified'}</div>
                </div>
              </div>
              <div class="dui-info-row">
                <span class="dui-info-icon">${icons.calendar}</span>
                <div>
                  <div class="dui-info-label">Date</div>
                  <div class="dui-info-value">${formatDate(cp.Date)}</div>
                </div>
              </div>
              <div class="dui-info-row">
                <span class="dui-info-icon">${icons.clock}</span>
                <div>
                  <div class="dui-info-label">Time</div>
                  <div class="dui-info-value">${cp.Time || 'Time not specified'}</div>
                </div>
              </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <div class="dui-info-label">Description</div>
              <p class="dui-modal-desc">${cp.Description || 'No description available.'}</p>
              ${cp.Source ? `<a href="${cp.Source}" target="_blank" rel="noopener" class="dui-modal-source">View Original Source →</a>` : ''}
            </div>
          </div>
          <div class="dui-modal-footer">
            <button class="dui-close-btn" id="dui-close-btn">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const cities = getUniqueCities();
    const counties = getUniqueCounties();
    const paginatedCheckpoints = getPaginatedCheckpoints();
    const totalPages = getTotalPages();

    container.innerHTML = `
      <div class="dui-widget">
        <div class="dui-header">
          <div>
            <h2 class="dui-title">DUI Checkpoints</h2>
            <p class="dui-count">Showing ${filteredCheckpoints.length} of ${checkpoints.length} checkpoints</p>
          </div>
        </div>
        
        <div class="dui-filters">
          <input 
            type="text" 
            class="dui-search" 
            placeholder="Search by city, county, or location..." 
            id="dui-search"
            value="${searchQuery}"
          >
          <select class="dui-select" id="dui-city-filter">
            <option value="all">All Cities</option>
            ${cities.map(city => `<option value="${city}" ${cityFilter === city ? 'selected' : ''}>${city}</option>`).join('')}
          </select>
          <select class="dui-select" id="dui-county-filter">
            <option value="all">All Counties</option>
            ${counties.map(county => `<option value="${county}" ${countyFilter === county ? 'selected' : ''}>${county}</option>`).join('')}
          </select>
        </div>

        <div class="dui-grid">
          ${paginatedCheckpoints.map(cp => renderCard(cp)).join('')}
        </div>

        ${totalPages > 1 ? `
          <div class="dui-pagination">
            <button class="dui-page-btn" id="dui-prev" ${currentPage === 1 ? 'disabled' : ''}>← Previous</button>
            <span class="dui-page-info">Page ${currentPage} of ${totalPages}</span>
            <button class="dui-page-btn" id="dui-next" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
          </div>
        ` : ''}

        ${renderModal()}
      </div>
    `;

    attachEventListeners();
  }

  function attachEventListeners() {
    // Search
    const searchInput = document.getElementById('dui-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterCheckpoints();
      });
    }

    // City filter
    const citySelect = document.getElementById('dui-city-filter');
    if (citySelect) {
      citySelect.addEventListener('change', (e) => {
        cityFilter = e.target.value;
        filterCheckpoints();
      });
    }

    // County filter
    const countySelect = document.getElementById('dui-county-filter');
    if (countySelect) {
      countySelect.addEventListener('change', (e) => {
        countyFilter = e.target.value;
        filterCheckpoints();
      });
    }

    // View details buttons
    document.querySelectorAll('.dui-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        selectedCheckpoint = checkpoints.find(cp => cp.id === id);
        render();
      });
    });

    // Modal close
    const modalOverlay = document.getElementById('dui-modal');
    const closeModal = document.getElementById('dui-close-modal');
    const closeBtn = document.getElementById('dui-close-btn');

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          selectedCheckpoint = null;
          render();
        }
      });
    }

    if (closeModal) {
      closeModal.addEventListener('click', () => {
        selectedCheckpoint = null;
        render();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        selectedCheckpoint = null;
        render();
      });
    }

    // Pagination
    const prevBtn = document.getElementById('dui-prev');
    const nextBtn = document.getElementById('dui-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
          currentPage++;
          render();
        }
      });
    }
  }

  function showLoading() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    container.innerHTML = `
      <div class="dui-widget">
        <div class="dui-loading">
          <div class="dui-spinner"></div>
          <p>Loading checkpoints...</p>
        </div>
      </div>
    `;
  }

  function showError(message) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    container.innerHTML = `
      <div class="dui-widget">
        <div class="dui-loading">
          <p style="color: #e53e3e;">${message}</p>
        </div>
      </div>
    `;
  }

  // Initialize
  async function init() {
    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Show loading
    showLoading();

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.success && data.checkpoints) {
        // Sort by date (latest first)
        checkpoints = data.checkpoints.sort((a, b) => {
          if (!a.Date && !b.Date) return 0;
          if (!a.Date) return 1;
          if (!b.Date) return -1;
          return new Date(b.Date).getTime() - new Date(a.Date).getTime();
        });
        filteredCheckpoints = [...checkpoints];
        render();
      } else {
        showError('Failed to load checkpoints.');
      }
    } catch (error) {
      console.error('Error loading checkpoints:', error);
      showError('Failed to load checkpoints. Please try again later.');
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

