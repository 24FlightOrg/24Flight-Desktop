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