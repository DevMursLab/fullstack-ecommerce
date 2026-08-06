// App bootstrap.

window.addEventListener('DOMContentLoaded', async () => {
  restoreState();
  await preloadData();
  if (STATE.token) {
    await fetchMe();
  }
  renderShell();
  router();
});
