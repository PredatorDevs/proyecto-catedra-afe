(() => {
  const THEMES = ['corporate', 'dark']

  function getSavedTheme() {
    const saved = localStorage.getItem('theme')
    return THEMES.includes(saved) ? saved : null
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const current = THEMES.includes(currentTheme) ? currentTheme : 'corporate'
    const next = current === 'corporate' ? 'dark' : 'corporate'
    applyTheme(next)
  }

  // 1) aplica tema guardado al cargar
  const saved = getSavedTheme()
  if (saved) applyTheme(saved)

  // 2) botón
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle')
    if (btn) btn.addEventListener('click', toggleTheme)
  })
})()