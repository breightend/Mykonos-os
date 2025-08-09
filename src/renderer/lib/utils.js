import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilidad para componentes de Shadcn/UI (solo gráficos)
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Utilidades para DaisyUI (resto de componentes)
export const themes = {
    cupcake: 'cupcake',
    night: 'night'
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
}