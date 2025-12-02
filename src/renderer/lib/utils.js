// Utilidades para DaisyUI
export const themes = {
    cupcake: 'cupcake',
    night: 'night'
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
}

// Utilidad simple para combinar clases (reemplazo de cn sin dependencias)
export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}