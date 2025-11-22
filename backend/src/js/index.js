window.userData.username().then(username => {
  document.getElementById('welcome-username').innerText = `Welcome ${username || 'Unknown'}`;
});