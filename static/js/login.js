function togglePassword() {
  const pwd = document.getElementById('password');
  if (pwd) {
    pwd.type = pwd.type === 'password' ? 'text' : 'password';
  }
}