<script setup lang="ts">
import { ref } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const tienda = usarTiendaAhorro()

const nombre = ref('')
const nombreUsuario = ref('')
const correo = ref('')
const clave = ref('')
const colorAvatar = ref('#58CC02')
const error = ref<string | null>(null)
const cargando = ref(false)

const coloresDisponibles = [
  { nombre: 'Verde Duolingo', valor: '#58CC02' },
  { nombre: 'Azul Cielo', valor: '#1CB0F6' },
  { nombre: 'Oro Radiante', valor: '#FFC800' },
  { nombre: 'Naranja Fuego', valor: '#FF9600' },
  { nombre: 'Púrpura Mágico', valor: '#CE82FF' },
  { nombre: 'Rosa Neón', valor: '#FF64AC' }
]

async function registrarse() {
  error.value = null
  if (!nombre.value.trim() || !nombreUsuario.value.trim() || !correo.value.trim() || !clave.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  if (nombreUsuario.value.trim().length < 3) {
    error.value = 'El nombre de usuario debe tener al menos 3 caracteres'
    return
  }

  if (clave.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  cargando.value = true
  try {
    await tienda.registrarse(
      nombre.value.trim(),
      nombreUsuario.value.trim(),
      correo.value.trim(),
      clave.value,
      colorAvatar.value
    )
    tienda.lanzarConfeti(true)
    navigateTo('/')
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || 'Error al crear la cuenta'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto my-6 sm:my-10">
    <div class="tarjeta-duo p-6 sm:p-8">
      <!-- Logo / Avatar Preview -->
      <div class="text-center mb-6">
        <div
          class="inline-flex w-20 h-20 rounded-3xl border-2 border-b-[6px] items-center justify-center text-3xl shadow-md mb-3 transform hover:scale-105 transition-transform text-white font-black font-mono select-none"
          :style="{ backgroundColor: colorAvatar, borderColor: 'rgba(0,0,0,0.2)' }"
        >
          {{ nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : '[m]' }}
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
          ¡Únete al reto!
        </h1>
        <p class="text-sm font-bold text-gray-500 dark:text-duo-oscuro-muted mt-1">
          Comienza tu viaje de ahorro gamificado en dólares
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

      <form @submit.prevent="registrarse" class="space-y-4">
        <!-- Nombre -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Tu Nombre o Apodo
          </label>
          <input
            v-model="nombre"
            type="text"
            required
            placeholder="Ej. Alex, Sofía..."
            class="w-full px-4 py-3 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors"
          />
        </div>

        <!-- Nombre de Usuario Único (@usuario) -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
            <span>Nombre de Usuario único *</span>
            <span class="text-[10px] text-gray-400 lowercase font-bold">Tus amigos te añadirán por aquí</span>
          </label>
          <div class="relative">
            <span class="absolute left-4 top-3.5 font-black text-gray-400">@</span>
            <input
              v-model="nombreUsuario"
              type="text"
              required
              placeholder="carlos_21"
              class="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors lowercase"
            />
          </div>
        </div>

        <!-- Selector de Color de Avatar -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Elige el color de tu personaje
          </label>
          <div class="flex items-center justify-between gap-2">
            <button
              v-for="c in coloresDisponibles"
              :key="c.valor"
              type="button"
              @click="colorAvatar = c.valor"
              :class="[
                'w-10 h-10 rounded-2xl border-2 border-b-4 transition-all transform active:translate-y-1',
                colorAvatar === c.valor ? 'scale-110 ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-duo-oscuro-fondo z-10' : 'opacity-80 hover:opacity-100'
              ]"
              :style="{ backgroundColor: c.valor, borderColor: 'rgba(0,0,0,0.25)' }"
              :title="c.nombre"
            ></button>
          </div>
        </div>

        <!-- Correo -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Correo Electrónico
          </label>
          <input
            v-model="correo"
            type="email"
            required
            placeholder="tu@correo.com"
            class="w-full px-4 py-3 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors"
          />
        </div>

        <!-- Contraseña -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Contraseña (Mínimo 6 caracteres)
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
          <span>{{ cargando ? 'Creando cuenta...' : 'CREAR MI CUENTA' }}</span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-duo-claro-borde dark:border-duo-oscuro-borde text-center">
        <p class="text-sm font-bold text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?
        </p>
        <NuxtLink
          to="/login"
          class="inline-block mt-2 text-sm font-black text-duo-azul hover:underline uppercase tracking-wide"
        >
          Inicia sesión aquí
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
