document.addEventListener('DOMContentLoaded', () => {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

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