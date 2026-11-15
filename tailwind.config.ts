import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        matcha: {
          oscuro: '#123F1B',     // Dark green
          menta: '#BDD3A7',      // Mint green
          crema: '#E8EDD6',      // Cream
          verde: '#90AD2E',      // Matcha green
          'verde-sombra': '#6F881E',
          'menta-sombra': '#9EB687'
        },
        duo: {
          // Verde principal adaptado a Matcha Green
          verde: '#90AD2E',
          'verde-sombra': '#6F881E',
          // Acentos y secundarios basados en la paleta
          menta: '#BDD3A7',
          'menta-sombra': '#9EB687',
          crema: '#E8EDD6',
          bosque: '#123F1B',
          amarillo: '#E6A823',
          'amarillo-sombra': '#C98D16',
          naranja: '#D97706',
          'naranja-sombra': '#B45309',
          azul: '#3B82F6',
          'azul-sombra': '#2563EB',
          rojo: '#E11D48',
          'rojo-sombra': '#BE123C',
          // Tema Oscuro basado en Dark Green (#123F1B)
          oscuro: {
            fondo: '#0E2913',
            tarjeta: '#17401F',
            borde: '#265D32',
            texto: '#E8EDD6',
            muted: '#BDD3A7'
          },
          // Tema Claro basado en Cream (#E8EDD6) y Dark Green
          claro: {
            fondo: '#F5F7EE',
            tarjeta: '#FFFFFF',
            borde: '#D8E2C6',
            texto: '#123F1B',
            muted: '#4F6849'
          }
        }
      },
      fontFamily: {
        sans: ['"Nunito"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'duo-3d': '0 4px 0 0 rgba(0, 0, 0, 0.2)',
        'duo-verde': '0 4px 0 0 #6F881E',
        'duo-menta': '0 4px 0 0 #9EB687',
        'duo-amarillo': '0 4px 0 0 #C98D16',
        'duo-azul': '0 4px 0 0 #2563EB'
      }
    }
  }
}
