<script setup lang="ts">
import { onMounted } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const tienda = usarTiendaAhorro()

onMounted(async () => {
  await tienda.cargarPerfil()
})

useHead({
  title: 'Metas de Ahorro Gamificadas',
  meta: [
    { name: 'description', content: 'Ahorra en dólares con cuadrículas interactivas y gamificación estilo Duolingo' },
    { name: 'theme-color', content: '#90AD2E' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-duo-claro-fondo dark:bg-duo-oscuro-fondo text-gray-900 dark:text-gray-100 transition-colors flex flex-col font-sans">
    <NuxtPwaManifest />
    <BarraNavegacion />
    <main class="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <NuxtPage />
    </main>
    <footer class="py-6 text-center text-xs font-bold text-gray-400 dark:text-gray-600 border-t border-duo-claro-borde dark:border-duo-oscuro-borde">
      Metas de Ahorro Gamificadas ($ USD) · Inspirado en la psicología y diseño de Duolingo
    </footer>
  </div>
</template>
