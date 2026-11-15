<script setup lang="ts">
import { ref } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'creada', id: number): void
}>()

const tienda = usarTiendaAhorro()

const titulo = ref('')
const descripcion = ref('')
const montoObjetivo = ref<number | null>(null)
const topeMaximoCelda = ref<number | null>(50)
const esCompartida = ref(false)

interface ItemSubmetaForm {
  titulo: string
  montoObjetivo: number
  icono: string
}

const submetas = ref<ItemSubmetaForm[]>([
  { titulo: 'Objetivo Principal', montoObjetivo: 0, icono: '🎯' }
])

const errorFormulario = ref<string | null>(null)
const guardando = ref(false)

function agregarSubmeta() {
  submetas.value.push({
    titulo: '',
    montoObjetivo: 0,
    icono: '⭐'
  })
}

function eliminarSubmeta(indice: number) {
  if (submetas.value.length > 1) {
    submetas.value.splice(indice, 1)
  }
}

/**
 * Plantilla rápida para cargar la meta de la Moto ($1,650) con un solo clic
 */
function cargarEjemploMoto() {
  titulo.value = 'Moto Nueva 🏍️'
  descripcion.value = 'Ahorro quincenal para comprar la moto y equipamiento de seguridad.'
  montoObjetivo.value = 1650
  topeMaximoCelda.value = 50
  esCompartida.value = false
  submetas.value = [
    { titulo: 'Licencia de Conducir', montoObjetivo: 100, icono: '🪪' },
    { titulo: 'Cascos Certificados', montoObjetivo: 150, icono: '🪖' },
    { titulo: 'Moto Nueva', montoObjetivo: 1400, icono: '🏍️' }
  ]
}

async function guardarMeta() {
  errorFormulario.value = null

  if (!titulo.value.trim()) {
    errorFormulario.value = 'Ingresa un título para tu meta'
    return
  }

  if (!montoObjetivo.value || montoObjetivo.value <= 0) {
    errorFormulario.value = 'El monto objetivo debe ser mayor a $0'
    return
  }

  if (!topeMaximoCelda.value || topeMaximoCelda.value <= 0) {
    errorFormulario.value = 'El tope máximo por celda debe ser mayor a $0'
    return
  }

  if (topeMaximoCelda.value > montoObjetivo.value) {
    topeMaximoCelda.value = montoObjetivo.value
  }

  // Si la primera submeta tiene monto 0 o vacío, ajustarla al objetivo
  const submetasValidadas = submetas.value
    .filter((s) => s.titulo.trim().length > 0 && s.montoObjetivo > 0)
    .map((s) => ({
      titulo: s.titulo.trim(),
      montoObjetivo: Number(s.montoObjetivo),
      icono: s.icono || '🎯'
    }))

  guardando.value = true
  try {
    const res = await tienda.crearMeta({
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim() || undefined,
      montoObjetivo: Number(montoObjetivo.value),
      topeMaximoCelda: Number(topeMaximoCelda.value),
      esCompartida: esCompartida.value,
      submetas: submetasValidadas.length > 0 ? submetasValidadas : undefined
    })

    emit('creada', res.id)
  } catch (err: any) {
    errorFormulario.value = err.data?.statusMessage || err.message || 'Error al crear la meta'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
    <div class="relative w-full max-w-lg tarjeta-duo p-6 max-h-[90vh] overflow-y-auto my-8">
      <!-- Botón cerrar -->
      <button
        type="button"
        @click="emit('cerrar')"
        class="absolute top-4 right-4 w-9 h-9 rounded-xl bg-gray-100 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 active:border-b-2 active:translate-y-1 font-black text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center"
      >
        ✕
      </button>

      <div class="mb-5">
        <span class="text-3xl">🎯</span>
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mt-1">
          Crear Nueva Meta
        </h2>
        <p class="text-xs font-bold text-gray-400 dark:text-gray-500">
          Define tu objetivo y generaremos tu tablero de cuadritos gamificado
        </p>
      </div>

      <!-- BOTÓN PLANTILLA RÁPIDA: EJEMPLO MOTO -->
      <div class="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-duo-amarillo-sombra border-b-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚡</span>
            <div>
              <p class="text-xs font-black text-amber-900 dark:text-amber-300">
                ¿Quieres probar rápidamente?
              </p>
              <p class="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Pre-llena la meta de ejemplo de la Moto ($1,650)
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="cargarEjemploMoto"
            class="boton-duo-amarillo px-3 py-1.5 text-xs text-amber-950"
          >
            Cargar Moto
          </button>
        </div>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorFormulario" class="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-black">
        ⚠️ {{ errorFormulario }}
      </div>

      <form @submit.prevent="guardarMeta" class="space-y-4">
        <!-- Título -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
            Título de la Meta *
          </label>
          <input
            v-model="titulo"
            type="text"
            required
            placeholder="Ej. Moto Nueva, Vacaciones, Fondo de Emergencia"
            class="w-full px-4 py-2.5 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors"
          />
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
            Descripción (Opcional)
          </label>
          <textarea
            v-model="descripcion"
            rows="2"
            placeholder="¿Por qué es importante para ti esta meta?"
            class="w-full px-4 py-2 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde transition-colors text-sm"
          ></textarea>
        </div>

        <!-- Montos -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
              Monto Total ($ USD) *
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 font-black text-gray-400">$</span>
              <input
                v-model.number="montoObjetivo"
                type="number"
                step="any"
                min="1"
                required
                placeholder="1650"
                class="w-full pl-8 pr-3 py-2.5 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-black text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
              Tope por Cuadrito ($) *
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 font-black text-gray-400">$</span>
              <input
                v-model.number="topeMaximoCelda"
                type="number"
                step="any"
                min="1"
                required
                placeholder="50"
                class="w-full pl-8 pr-3 py-2.5 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-black text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
              />
            </div>
          </div>
        </div>

        <!-- Switch Compartida -->
        <div class="p-3 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">👥</span>
            <div>
              <p class="text-xs font-black text-gray-900 dark:text-white">¿Meta Compartida / En Pareja?</p>
              <p class="text-[11px] font-bold text-gray-400">Podrás invitar a un colaborador por correo</p>
            </div>
          </div>
          <input
            v-model="esCompartida"
            type="checkbox"
            class="w-5 h-5 accent-duo-verde rounded cursor-pointer"
          />
        </div>

        <!-- Submetas / Camino de Hitos -->
        <div class="pt-2">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <span>🗺️</span> Desglose de Sub-metas (Etapas)
            </label>
            <button
              type="button"
              @click="agregarSubmeta"
              class="text-xs font-extrabold text-duo-verde hover:underline"
            >
              + Añadir Etapa
            </button>
          </div>

          <div class="space-y-2 max-h-44 overflow-y-auto pr-1">
            <div
              v-for="(sm, i) in submetas"
              :key="i"
              class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-duo-oscuro-fondo border border-duo-claro-borde dark:border-duo-oscuro-borde"
            >
              <input
                v-model="sm.icono"
                type="text"
                class="w-9 h-9 text-center text-lg rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-duo-oscuro-tarjeta"
                title="Icono emoji"
              />
              <input
                v-model="sm.titulo"
                type="text"
                placeholder="Nombre etapa (ej. Cascos)"
                class="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-duo-oscuro-tarjeta text-xs font-bold text-gray-900 dark:text-white"
              />
              <div class="relative w-24">
                <span class="absolute left-2 top-1.5 text-xs font-bold text-gray-400">$</span>
                <input
                  v-model.number="sm.montoObjetivo"
                  type="number"
                  placeholder="150"
                  class="w-full pl-5 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-duo-oscuro-tarjeta text-xs font-black text-gray-900 dark:text-white"
                />
              </div>
              <button
                v-if="submetas.length > 1"
                type="button"
                @click="eliminarSubmeta(i)"
                class="text-red-500 font-bold px-1.5 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-4 flex items-center gap-3">
          <button
            type="button"
            @click="emit('cerrar')"
            class="boton-duo-blanco flex-1 py-3 text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando"
            class="boton-duo-verde flex-1 py-3 text-sm flex items-center justify-center gap-2"
          >
            <span v-if="guardando" class="animate-spin">⏳</span>
            <span>{{ guardando ? 'Generando...' : '¡Crear Tablero!' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
