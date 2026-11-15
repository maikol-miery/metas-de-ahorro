<script setup lang="ts">
import { ref } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const tienda = usarTiendaAhorro()

const correo = ref('')
const clave = ref('')
const error = ref<string | null>(null)
const cargando = ref(false)

async function iniciarSesion() {
  error.value = null
  if (!correo.value || !clave.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  cargando.value = true
  try {
    await tienda.iniciarSesion(correo.value, clave.value)
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || 'Error al iniciar sesión'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto my-6 sm:my-12">
    <div class="tarjeta-duo p-6 sm:p-8">
      <!-- Logo de Marca -->
      <div class="text-center mb-6">
        <LogoMatcha tamano="xl" variante="verde" class="shadow-md mb-3 transform hover:scale-105" />
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          ¡Hola de nuevo!
        </h1>
        <p class="text-sm font-bold text-gray-500 dark:text-duo-oscuro-muted mt-1">
          Inicia sesión para continuar tu racha de ahorro
        </p>
      </div>

      <!-- Alerta de Error -->
      <div
        v-if="error"
        class="mb-5 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-black flex items-center gap-2"
      >
        <span>⚠️</span>
        <span>{{ error }}</span>
      </div>

      <form @submit.prevent="iniciarSesion" class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Correo o Nombre de Usuario
          </label>
          <input
            v-model="correo"
            type="text"
            required
            placeholder="tu@correo.com o @usuario"
            class="w-full px-4 py-3 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Contraseña
          </label>
          <input
            v-model="clave"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors"
          />
        </div>

        <button
          type="submit"
          :disabled="cargando"
          class="w-full py-3.5 mt-2 boton-duo-verde text-base flex items-center justify-center gap-2"
        >
          <span v-if="cargando" class="animate-spin">⏳</span>
          <span>{{ cargando ? 'Iniciando...' : 'INGRESAR' }}</span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-duo-claro-borde dark:border-duo-oscuro-borde text-center">
        <p class="text-sm font-bold text-gray-500 dark:text-gray-400">
          ¿No tienes una cuenta aún?
        </p>
        <NuxtLink
          to="/registro"
          class="inline-block mt-2 text-sm font-black text-duo-azul hover:underline uppercase tracking-wide"
        >
          ¡Crea tu cuenta gratis aquí!
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
