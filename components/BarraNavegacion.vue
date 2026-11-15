<script setup lang="ts">
import { computed } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const tienda = usarTiendaAhorro()
const modoColor = useColorMode()

const esModoOscuro = computed({
  get: () => modoColor.value === 'dark',
  set: (val: boolean) => {
    modoColor.preference = val ? 'dark' : 'light'
  }
})

function alternarTema() {
  esModoOscuro.value = !esModoOscuro.value
}

async function cerrarSesion() {
  await tienda.cerrarSesion()
  navigateTo('/login')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-white/90 dark:bg-duo-oscuro-fondo/90 backdrop-blur-md border-b-2 border-duo-claro-borde dark:border-duo-oscuro-borde transition-colors">
    <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
      <!-- Logo y Título -->
      <NuxtLink to="/" class="flex items-center gap-3 group">
        <LogoMatcha tamano="md" variante="verde" class="shadow-sm group-hover:scale-105" />
        <div>
          <span class="text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
            Metas<span class="text-matcha-verde">Ahorro</span>
          </span>
          <span class="block text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-duo-oscuro-muted -mt-1">
            Gamificado en USD ($)
          </span>
        </div>
      </NuxtLink>

      <!-- Controles de la barra derecha -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Racha de Quincenas -->
        <div 
          v-if="tienda.usuario"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-duo-amarillo-sombra border-b-4 text-duo-naranja font-black text-sm select-none"
          title="Racha de quincenas ahorrando activamente"
        >
          <span class="text-lg animate-pulse">🔥</span>
          <span>{{ tienda.usuario.rachaQuincenas }}</span>
        </div>

        <!-- Botón Modo Claro / Oscuro 3D -->
        <button
          type="button"
          @click="alternarTema"
          class="p-2 w-10 h-10 rounded-2xl bg-gray-100 dark:bg-duo-oscuro-tarjeta border-2 border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 active:border-b-2 active:translate-y-1 flex items-center justify-center text-gray-700 dark:text-yellow-400 font-bold transition-all"
          :title="esModoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          aria-label="Cambiar tema de color"
        >
          <span v-if="esModoOscuro">☀️</span>
          <span v-else>🌙</span>
        </button>

        <!-- Perfil y Salir -->
        <div v-if="tienda.usuario" class="flex items-center gap-2">
          <div
            class="w-10 h-10 rounded-2xl border-2 border-b-4 flex items-center justify-center text-white font-black text-base shadow-sm"
            :style="{ backgroundColor: tienda.usuario.colorAvatar, borderColor: 'rgba(0,0,0,0.2)' }"
            :title="tienda.usuario.nombre + (tienda.usuario.nombreUsuario ? ' (@' + tienda.usuario.nombreUsuario + ')' : '')"
          >
            {{ tienda.usuario.nombre.charAt(0).toUpperCase() }}
          </div>

          <button
            type="button"
            @click="cerrarSesion"
            class="p-2 w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 border-b-4 active:border-b-2 active:translate-y-1 flex items-center justify-center text-red-500 font-black text-sm transition-all"
            title="Cerrar sesión"
          >
            🚪
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
