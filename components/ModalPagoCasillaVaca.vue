<script setup lang="ts">
import { ref, computed } from 'vue'
import { usarTiendaAhorro, type CasillaVacaInfo } from '~/stores/usarTiendaAhorro'
import { comprimirImagen } from '~/utils/comprimirImagen'

const props = defineProps<{
  vacaId: number
  casillaInicial: CasillaVacaInfo
  todasCasillasParticipante: CasillaVacaInfo[]
  nombreParticipante: string
  receptorPagoNombre: string
  datosPagoMovil: string | null
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'pagado'): void
}>()

const tienda = usarTiendaAhorro()

// Casillas seleccionadas para pagar (por defecto la tocada)
const casillasSeleccionadas = ref<number[]>([props.casillaInicial.id])

// Método de pago: 'comprobante' o 'efectivo'
const metodoPago = ref<'comprobante' | 'efectivo'>('comprobante')

// Campos para comprobante
const archivoCapture = ref<File | null>(null)
const vistaPreviaCapture = ref<string | null>(null)
const referenciaPago = ref('')

// Campos para efectivo
const notaPago = ref(`Entregado en efectivo en mano a ${props.receptorPagoNombre}`)

// Estados
const procesando = ref(false)
const mensajeError = ref<string | null>(null)
const copiadoExitoso = ref(false)

// Monto total a pagar en esta operación
const montoTotalAPagar = computed(() => {
  return props.todasCasillasParticipante
    .filter((c) => casillasSeleccionadas.value.includes(c.id))
    .reduce((acc, c) => acc + Number(c.monto), 0)
})

function alternarCasilla(id: number) {
  const index = casillasSeleccionadas.value.indexOf(id)
  if (index > -1) {
    if (casillasSeleccionadas.value.length > 1) {
      casillasSeleccionadas.value.splice(index, 1)
    }
  } else {
    casillasSeleccionadas.value.push(id)
  }
}

async function alSeleccionarArchivo(evento: Event) {
  mensajeError.value = null
  const input = evento.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const archivo = input.files[0]
  try {
    const base64Comprimido = await comprimirImagen(archivo, 0.75, 800)
    vistaPreviaCapture.value = base64Comprimido
    archivoCapture.value = archivo
  } catch (err: any) {
    mensajeError.value = err.message || 'Error al procesar la imagen'
    vistaPreviaCapture.value = null
    archivoCapture.value = null
  }
}

function eliminarCapture() {
  archivoCapture.value = null
  vistaPreviaCapture.value = null
}

async function copiarDatosPagoMovil() {
  if (!props.datosPagoMovil) return
  try {
    await navigator.clipboard.writeText(props.datosPagoMovil)
    copiadoExitoso.value = true
    setTimeout(() => {
      copiadoExitoso.value = false
    }, 2500)
  } catch {
    // Fallback manual
    const el = document.createElement('textarea')
    el.value = props.datosPagoMovil
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copiadoExitoso.value = true
    setTimeout(() => {
      copiadoExitoso.value = false
    }, 2500)
  }
}

async function confirmarPago() {
  mensajeError.value = null

  if (casillasSeleccionadas.value.length === 0) {
    mensajeError.value = 'Selecciona al menos una casilla para pagar'
    return
  }

  if (metodoPago.value === 'comprobante') {
    if (!vistaPreviaCapture.value) {
      mensajeError.value = 'Es 100% obligatorio adjuntar la foto del capture de Pago Móvil'
      return
    }
    if (!referenciaPago.value.trim()) {
      mensajeError.value = 'Debes ingresar los últimos 4 o 6 dígitos de la referencia de Pago Móvil'
      return
    }
  } else if (metodoPago.value === 'efectivo') {
    if (!notaPago.value.trim()) {
      mensajeError.value = 'Debes escribir una nota confirmando la entrega del efectivo'
      return
    }
  }

  procesando.value = true
  try {
    await tienda.registrarPagoVaca(props.vacaId, {
      casillasIds: casillasSeleccionadas.value,
      metodoPago: metodoPago.value,
      comprobanteUrl: metodoPago.value === 'comprobante' ? vistaPreviaCapture.value : undefined,
      referenciaPago: metodoPago.value === 'comprobante' ? referenciaPago.value.trim() : undefined,
      notaPago: metodoPago.value === 'efectivo' ? notaPago.value.trim() : `Pago Móvil Ref: ${referenciaPago.value.trim()}`
    })

    emit('pagado')
  } catch (err: any) {
    mensajeError.value = err.data?.statusMessage || err.message || 'Error al registrar el pago'
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
    <div class="relative w-full max-w-md tarjeta-duo p-6 max-h-[92vh] overflow-y-auto my-6">
      <!-- Botón Cerrar -->
      <button
        type="button"
        @click="emit('cerrar')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white font-black"
      >
        ✕
      </button>

      <!-- TARJETA DESTACADA: DATOS DEL RECEPTOR / TESORERO -->
      <div class="mb-5 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-duo-azul-sombra border-b-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider text-duo-azul">
              Tesorero / Receptor de Fondos
            </span>
            <h3 class="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span>🏦</span> Pagar a: {{ receptorPagoNombre }}
            </h3>
          </div>

          <!-- Botón Copiar Pago Móvil en un toque -->
          <button
            v-if="datosPagoMovil"
            type="button"
            @click="copiarDatosPagoMovil"
            :class="[
              'px-3 py-1.5 rounded-xl border-2 font-black text-xs transition-all flex items-center gap-1',
              copiadoExitoso
                ? 'bg-duo-verde text-white border-duo-verde-sombra'
                : 'boton-duo-azul'
            ]"
          >
            <span>{{ copiadoExitoso ? '✓' : '📋' }}</span>
            <span>{{ copiadoExitoso ? '¡Copiado!' : 'Copiar Pago Móvil' }}</span>
          </button>
        </div>

        <div v-if="datosPagoMovil" class="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-duo-oscuro-tarjeta border border-blue-200 dark:border-blue-900 font-mono text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {{ datosPagoMovil }}
        </div>
      </div>

      <!-- Participante y selección de casillas -->
      <div class="mb-4">
        <div class="flex items-center justify-between text-xs font-black mb-1.5">
          <span class="text-gray-500">Participante: <strong class="text-gray-900 dark:text-white">{{ nombreParticipante }}</strong></span>
          <span class="text-duo-verde text-sm">Total a pagar: ${{ montoTotalAPagar }} USD</span>
        </div>

        <!-- Si tiene más de una casilla pendiente, permitir pagar varias juntas -->
        <div v-if="todasCasillasParticipante.filter(c => !c.estaPagada).length > 1" class="space-y-1">
          <label class="block text-[11px] font-bold text-gray-400">
            Puedes pagar una o varias cuotas a la vez:
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="c in todasCasillasParticipante.filter(c => !c.estaPagada)"
              :key="c.id"
              type="button"
              @click="alternarCasilla(c.id)"
              :class="[
                'px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all',
                casillasSeleccionadas.includes(c.id)
                  ? 'bg-duo-verde text-white border-duo-verde-sombra border-b-4'
                  : 'bg-gray-100 dark:bg-duo-oscuro-fondo text-gray-500 border-gray-200 dark:border-gray-700'
              ]"
            >
              Cuota {{ c.numeroCuota }} (${{ c.monto }})
            </button>
          </div>
        </div>
      </div>

      <!-- Selector de Método: Comprobante vs Efectivo -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          @click="metodoPago = 'comprobante'"
          :class="[
            'py-2.5 px-2 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all',
            metodoPago === 'comprobante'
              ? 'boton-duo-verde'
              : 'boton-duo-blanco text-gray-600'
          ]"
        >
          <span>📲</span>
          <span>Pago Móvil (Capture)</span>
        </button>

        <button
          type="button"
          @click="metodoPago = 'efectivo'"
          :class="[
            'py-2.5 px-2 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all',
            metodoPago === 'efectivo'
              ? 'boton-duo-amarillo text-gray-900'
              : 'boton-duo-blanco text-gray-600'
          ]"
        >
          <span>💵</span>
          <span>Pago en Efectivo</span>
        </button>
      </div>

      <!-- Alerta de Error -->
      <div v-if="mensajeError" class="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-black">
        ⚠️ {{ mensajeError }}
      </div>

      <!-- FORMULARIO 1: SUBIR CAPTURE (100% OBLIGATORIO) -->
      <div v-if="metodoPago === 'comprobante'" class="space-y-3">
        <!-- Subir Foto / Capture -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
            Captura del Comprobante (Obligatorio) *
          </label>

          <!-- Si ya hay vista previa -->
          <div v-if="vistaPreviaCapture" class="relative rounded-2xl overflow-hidden border-2 border-duo-verde bg-black/5 p-2 text-center">
            <img
              :src="vistaPreviaCapture"
              alt="Comprobante de pago"
              class="max-h-48 mx-auto rounded-xl object-contain shadow-sm"
            />
            <button
              type="button"
              @click="eliminarCapture"
              class="mt-2 text-xs font-black text-red-500 hover:underline"
            >
              Cambiar foto de comprobante
            </button>
          </div>

          <!-- Input para subir foto -->
          <div v-else class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-duo-verde transition-colors">
            <input
              type="file"
              id="archivo-capture"
              accept="image/*"
              @change="alSeleccionarArchivo"
              class="hidden"
            />
            <label for="archivo-capture" class="cursor-pointer block">
              <span class="text-3xl block mb-1">📸</span>
              <span class="text-xs font-black text-duo-azul block">Toca para adjuntar la foto del capture</span>
              <span class="text-[10px] font-bold text-gray-400 block mt-0.5">Se comprime automáticamente para no gastar tus datos</span>
            </label>
          </div>
        </div>

        <!-- Referencia de Pago Móvil -->
        <div>
          <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
            Referencia de Pago Móvil (Últimos 4-6 dígitos) *
          </label>
          <input
            v-model="referenciaPago"
            type="text"
            maxlength="20"
            required
            placeholder="Ej. 4589 ó 012845"
            class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-mono text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
          />
        </div>
      </div>

      <!-- FORMULARIO 2: PAGO EN EFECTIVO -->
      <div v-else class="space-y-3">
        <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-duo-amarillo-sombra text-xs text-amber-900 dark:text-amber-300">
          <p class="font-black mb-1">💵 Pago en Efectivo:</p>
          <p class="text-[11px] font-bold">
            Declara a quién y en qué momento se le entregaron los billetes para que el receptor pueda cotejarlo y aprobarlo.
          </p>
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
            Nota de Entrega en Efectivo *
          </label>
          <textarea
            v-model="notaPago"
            rows="3"
            required
            placeholder="Ej. Le entregué $20 en billete nuevo a Carlos en la entrada..."
            class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-duo-amarillo"
          ></textarea>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex items-center gap-2 pt-4">
        <button
          type="button"
          @click="emit('cerrar')"
          class="boton-duo-blanco flex-1 py-3 text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="confirmarPago"
          :disabled="procesando"
          class="boton-duo-verde flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
        >
          <span v-if="procesando" class="animate-spin">⏳</span>
          <span>{{ procesando ? 'Enviando...' : 'CONFIRMAR PAGO' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
