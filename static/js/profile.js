function selectAvatar(el, filename) {
  document.querySelectorAll('.avatar-opt').forEach(opt => opt.classList.remove('selected'));
  el.classList.add('selected');
  const input = document.getElementById('avatarInput');
  if (input) input.value = filename;
}