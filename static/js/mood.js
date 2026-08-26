function updateMoodSelection(radio) {
  document.querySelectorAll('.mood-box').forEach(box => {
    box.style.borderColor = 'transparent';
    box.style.background = 'white';
  });
  const box = radio.nextElementSibling;
  box.style.borderColor = '#D63384';
  box.style.background = 'var(--pink-pastel)';
}