// Content script - extracts page data
(function() {
  'use strict';
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageData') {
      const pageData = extractPageData();
      sendResponse(pageData);
    }
    return true;
  });
  
  // Extract relevant page data
  function extractPageData() {
    try {
      return {
        textContent: extractTextContent(),
        hasImages: document.querySelectorAll('img').length > 0,
        hasVideos: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0,
        hasCode: document.querySelectorAll('pre, code, .highlight').length > 0
      };
    } catch (error) {
      console.error('Error extracting page data:', error);
      return {
        textContent: '',
        hasImages: false,
        hasVideos: false,
        hasCode: false
      };
    }
  }
  
  // Extract meaningful text content (skip headers, footers, nav)
  function extractTextContent() {
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.article-content',
      '#content'
    ];
    
    // Try to find main content area
    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }
    
    // Fallback to body if no main content found
    if (!contentElement) {
      contentElement = document.body;
    }
    
    // Extract text, excluding scripts and styles
    const clone = contentElement.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.social-share',
      '[role="navigation"]',
      '[role="complementary"]'
    ];
    
    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Get text content
    const text = clone.textContent || clone.innerText || '';
    
    // Clean up whitespace
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to 5000 characters
  }
})();
