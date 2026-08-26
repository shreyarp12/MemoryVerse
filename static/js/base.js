document.addEventListener('DOMContentLoaded', () => {
  const flashes = document.querySelectorAll('.flash-message');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transform = 'translateY(-10px)';
      flash.style.transition = 'all 0.3s ease';
      setTimeout(() => flash.remove(), 300);
    }, 4000);
  });
});