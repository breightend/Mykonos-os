console.log('🔍 Diagnóstico de CSS y DaisyUI')

// Verificar si DaisyUI está cargado
const testElement = document.createElement('div')
testElement.className = 'btn btn-primary'
document.body.appendChild(testElement)

// Obtener estilos computados
const styles = window.getComputedStyle(testElement)

console.log('Estilos del botón DaisyUI:')
console.log('- Background Color:', styles.backgroundColor)
console.log('- Color:', styles.color)
console.log('- Padding:', styles.padding)
console.log('- Border Radius:', styles.borderRadius)

// Verificar tema actual
console.log('Tema actual:', document.documentElement.getAttribute('data-theme'))

// Verificar si las variables CSS están definidas
const rootStyles = window.getComputedStyle(document.documentElement)
console.log('Variables CSS:')
console.log('- --primary:', rootStyles.getPropertyValue('--primary'))
console.log('- --background:', rootStyles.getPropertyValue('--background'))

// Limpiar
document.body.removeChild(testElement)

console.log('✅ Diagnóstico completado')
