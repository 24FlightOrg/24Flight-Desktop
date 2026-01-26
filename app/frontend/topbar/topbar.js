document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('top-bar');
  const fileUrl = '/topbar/topbar.html';

  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const htmlText = await response.text();

    container.innerHTML = htmlText;

  } catch (error) {
    console.error('Could not load the HTML file:', error);
    container.innerHTML = 'Error loading content.';
  }

  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');
  const title = document.getElementById('top-bar-title');

  if (title && topBarSettings.title) {
    title.textContent = topBarSettings.title;
  }

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.windowControl.minimize();
      } catch (err) {
        console.error('Minimize error:', err);
      }
    });
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.windowControl.maximize();
      } catch (err) {
        console.error('Maximize error:', err);
      }
    });
  }

  const navBack = document.getElementById('nav-back');
  const navHome = document.getElementById('nav-home');

  // Define paths that are considered "secondary windows" where nav should be hidden
  const secondaryPaths = ['/areas/aircraft.html'];
  const isSecondaryWindow = secondaryPaths.some(path => window.location.pathname.includes(path));

  if (!isSecondaryWindow) {
    if (navHome) {
      // Show home button if not on index.html
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/index.html') {
        navHome.style.display = 'flex';
        navHome.addEventListener('click', () => {
          window.location.href = '/index.html';
        });
      }
    }

    if (navBack) {
      // Show back button if history allows (simple check)
      // Note: Since this is a specialized app, we might always show it on subpages
      // or rely on history length.
      if (window.history.length > 1) {
        navBack.style.display = 'flex';
        navBack.addEventListener('click', () => {
          window.history.back();
        });
      }
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.windowControl.close();
      } catch (err) {
        console.error('Close error:', err);
      }
    });
  }
});