(() => {
  const THEMES = ['corporate', 'dark']

  const ICON_SUN =
    '<svg viewBox="0 0 20 20" fill="none" class="h-4 w-4"><circle cx="10" cy="10" r="3.2" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.2 1.2M5.9 14.1l-1.2 1.2M15.3 15.3l-1.2-1.2M5.9 5.9L4.7 4.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  const ICON_MOON =
    '<svg viewBox="0 0 20 20" fill="none" class="h-4 w-4"><path d="M13.9 2.9a7.2 7.2 0 106.2 10.8 7.4 7.4 0 01-6.2 1.2 7.2 7.2 0 01-5.1-8.7 7.4 7.4 0 015.1-3.3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

  function getSavedTheme() {
    const saved = localStorage.getItem('theme')
    return THEMES.includes(saved) ? saved : null
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    updateThemeToggleButton(theme)
  }

  function updateThemeToggleButton(currentTheme) {
    const btn = document.getElementById('themeToggle')
    if (!btn) return

    const iconContainer = btn.querySelector('.theme-toggle-icon')
    const labelContainer = btn.querySelector('.theme-toggle-label')
    if (!iconContainer || !labelContainer) return

    const current = THEMES.includes(currentTheme) ? currentTheme : 'corporate'
    const next = current === 'corporate' ? 'dark' : 'corporate'
    const nextIsLight = next === 'corporate'

    iconContainer.innerHTML = nextIsLight ? ICON_SUN : ICON_MOON
    labelContainer.textContent = nextIsLight ? 'Claro' : 'Oscuro'
    btn.setAttribute('aria-label', `Cambiar a tema ${nextIsLight ? 'claro' : 'oscuro'}`)
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
  else updateThemeToggleButton(document.documentElement.getAttribute('data-theme') || 'corporate')

  // 2) botón
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle')
    if (btn) {
      updateThemeToggleButton(document.documentElement.getAttribute('data-theme') || 'corporate')
      btn.addEventListener('click', toggleTheme)
    }
  })
})()