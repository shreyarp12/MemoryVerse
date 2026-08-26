document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('journalContent');
  const counter = document.getElementById('wordCount');
  if (textarea && counter) {
    textarea.addEventListener('input', () => {
      const words = textarea.value.trim().split(/\s+/).filter(w => w.length > 0).length;
      counter.innerText = `${words} words ✨`;
    });
  }
});