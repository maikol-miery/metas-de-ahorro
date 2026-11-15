<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usarTiendaAhorro, type CeldaInfo } from '~/stores/usarTiendaAhorro'

const route = useRoute()
const tienda = usarTiendaAhorro()

const metaId = Number(route.params.id)
const tabActiva = ref<'tablero' | 'camino' | 'calendario'>('tablero')

// Estados de modales
const celdaSeleccionada = ref<CeldaInfo | null>(null)
const notaAbonoCuadrito = ref('')
const procesandoCelda = ref(false)

const modalAbonoLibre = ref(false)
const montoAbonoLibre = ref<number | null>(null)
const notaAbonoLibre = ref('')
const procesandoAbonoLibre = ref(false)

const modalInvitar = ref(false)
const correoColaborador = ref('')
const sugerenciasColaborador = ref<Array<{ id: number; nombre: string; nombreUsuario: string | null; correo: string; colorAvatar: string }>>([])
const errorInvitar = ref<string | null>(null)
const mensajeExitoInvitar = ref<string | null>(null)
const procesandoInvitar = ref(false)

let timerBusquedaColab: any = null
function alEscribirColaborador() {
  clearTimeout(timerBusquedaColab)
  const query = correoColaborador.value.trim()
  if (!query) {
    sugerenciasColaborador.value = []
    return
  }
  timerBusquedaColab = setTimeout(async () => {
    sugerenciasColaborador.value = await tienda.buscarUsuarios(query)
  }, 250)
}

function elegirColaboradorSugerido(u: { nombre: string; nombreUsuario: string | null; correo: string }) {
  correoColaborador.value = u.nombreUsuario ? `@${u.nombreUsuario}` : u.correo
  sugerenciasColaborador.value = []
}

onMounted(async () => {
  await tienda.cargarMeta(metaId)
})

function abrirModalCelda(celda: CeldaInfo) {
  celdaSeleccionada.value = celda
  notaAbonoCuadrito.value = ''
}

async function confirmarTacharODesmarcar() {
  if (!celdaSeleccionada.value) return
  procesandoCelda.value = true
  try {
    await tienda.tacharCelda(metaId, celdaSeleccionada.value.id, notaAbonoCuadrito.value)
    celdaSeleccionada.value = null
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Error al actualizar el cuadrito')
  } finally {
    procesandoCelda.value = false
  }
}

async function registrarAbonoLibre() {
  if (!montoAbonoLibre.value || montoAbonoLibre.value <= 0) return
  procesandoAbonoLibre.value = true
  try {
    await tienda.registrarAbonoLibre(metaId, montoAbonoLibre.value, notaAbonoLibre.value)
    modalAbonoLibre.value = false
    montoAbonoLibre.value = null
    notaAbonoLibre.value = ''
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Error al registrar abono libre')
  } finally {
    procesandoAbonoLibre.value = false
  }
}

async function enviarInvitacion() {
  errorInvitar.value = null
  mensajeExitoInvitar.value = null
  if (!correoColaborador.value.trim()) return

  procesandoInvitar.value = true
  try {
    const res = await tienda.invitarColaborador(metaId, correoColaborador.value.trim())
    mensajeExitoInvitar.value = res.mensaje
    correoColaborador.value = ''
    await tienda.cargarMeta(metaId)
  } catch (err: any) {
    errorInvitar.value = err.data?.statusMessage || err.message || 'Error al invitar colaborador'
  } finally {
    procesandoInvitar.value = false
  }
}
</script>

<template>
  <div v-if="tienda.metaActual" class="space-y-6">
    <!-- Botón Volver y Cabecera de la Meta -->
    <div>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-duo-verde uppercase tracking-wider mb-3 transition-colors"
      >
        <span>←</span> Volver a mis metas
      </NuxtLink>

      <div class="tarjeta-duo p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-if="tienda.metaActual.esCompartida"
                class="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-duo-azul-sombra text-duo-azul text-xs font-black flex items-center gap-1"
              >
                <span>👥</span> Compartida
              </span>
              <span
                v-if="tienda.metaActual.estado === 'completada'"
                class="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-duo-verde text-xs font-black flex items-center gap-1"
              >
                <span>🏆</span> ¡Meta Lograda!
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {{ tienda.metaActual.titulo }}
            </h1>
            <p v-if="tienda.metaActual.descripcion" class="text-xs sm:text-sm font-bold text-gray-400 mt-1">
              {{ tienda.metaActual.descripcion }}
            </p>
          </div>

          <!-- Botones de Acción Superior -->
          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              @click="modalAbonoLibre = true"
              class="boton-duo-blanco px-3.5 py-2 text-xs flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Abono Libre</span>
            </button>
            <button
              type="button"
              @click="modalInvitar = true"
              class="boton-duo-azul px-3.5 py-2 text-xs flex items-center gap-1.5"
            >
              <span>👥</span>
              <span>Invitar</span>
            </button>
          </div>
        </div>

        <!-- Barra de Progreso y Estadísticas -->
        <div class="mt-6 pt-5 border-t border-duo-claro-borde dark:border-duo-oscuro-borde">
          <div class="flex items-baseline justify-between mb-2">
            <div>
              <span class="text-xs font-black uppercase tracking-wider text-gray-400">Ahorrado</span>
              <div class="text-2xl sm:text-3xl font-black text-duo-verde">
                ${{ tienda.metaActual.totalAhorrado }}
                <span class="text-xs font-bold text-gray-400">/ ${{ tienda.metaActual.montoObjetivo }} USD</span>
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs font-black uppercase tracking-wider text-gray-400">Faltan</span>
              <div class="text-xl sm:text-2xl font-black text-duo-naranja">
                ${{ tienda.metaActual.montoFaltante }}
              </div>
            </div>
          </div>

          <!-- Barra de Progreso Jugosa de Duolingo -->
          <div class="barra-jugosa h-6">
            <div
              class="barra-jugosa-relleno bg-duo-verde"
              :style="{ width: `${tienda.metaActual.progresoPorcentaje}%` }"
            ></div>
          </div>

          <div class="flex items-center justify-between mt-2 text-xs font-black text-gray-500">
            <span>{{ tienda.metaActual.progresoPorcentaje }}% completado</span>
            <span>Tope por cuadro: ${{ tienda.metaActual.topeMaximoCelda }} USD</span>
          </div>

          <!-- Miembros colaboradores -->
          <div v-if="tienda.metaActual.miembros && tienda.metaActual.miembros.length > 0" class="mt-4 pt-3 border-t border-gray-100 dark:border-duo-oscuro-borde flex items-center gap-2">
            <span class="text-xs font-bold text-gray-400">Equipo de ahorro:</span>
            <div class="flex items-center gap-2">
              <div
                v-for="m in tienda.metaActual.miembros"
                :key="m.id"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-duo-oscuro-fondo border border-duo-claro-borde dark:border-duo-oscuro-borde text-xs font-black"
              >
                <span
                  class="w-3.5 h-3.5 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                  :style="{ backgroundColor: m.colorAvatar || '#58CC02' }"
                >
                  {{ m.nombre.charAt(0).toUpperCase() }}
                </span>
                <span>{{ m.nombre }}</span>
                <span v-if="m.rol === 'creador'" class="text-[9px] text-amber-500">★</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navegación entre las 3 Vistas Gamificadas (Tabs 3D) -->
    <div class="grid grid-cols-3 gap-2">
      <button
        type="button"
        @click="tabActiva = 'tablero'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none',
          tabActiva === 'tablero'
            ? 'boton-duo-verde'
            : 'boton-duo-blanco'
        ]"
      >
        <span>🟩</span>
        <span>El Tablero</span>
      </button>

      <button
        type="button"
        @click="tabActiva = 'camino'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none',
          tabActiva === 'camino'
            ? 'boton-duo-amarillo'
            : 'boton-duo-blanco'
        ]"
      >
        <span>🗺️</span>
        <span>El Camino</span>
      </button>

      <button
        type="button"
        @click="tabActiva = 'calendario'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none',
          tabActiva === 'calendario'
            ? 'boton-duo-azul'
            : 'boton-duo-blanco'
        ]"
      >
        <span>📅</span>
        <span>Calendario</span>
      </button>
    </div>

    <!-- TAB 1: EL TABLERO (CUADRÍCULA DE CUADRITOS 3D) -->
    <div v-if="tabActiva === 'tablero'" class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <p class="text-xs font-black text-gray-500 dark:text-gray-400">
          Toca un cuadrito cuando cobres tu quincena para guardarlo
        </p>
        <span class="text-xs font-black text-duo-verde">
          {{ tienda.metaActual.celdas.filter(c => c.estaTachada).length }} / {{ tienda.metaActual.celdas.length }} listos
        </span>
      </div>

      <!-- Cuadrícula Responsiva: 4 columnas en móvil, 6 en desktop -->
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2.5 sm:gap-3">
        <CuadritoAhorro
          v-for="celda in tienda.metaActual.celdas"
          :key="celda.id"
          :celda="celda"
          @clickCelda="abrirModalCelda"
        />
      </div>
    </div>

    <!-- TAB 2: EL CAMINO DE HITOS -->
    <div v-else-if="tabActiva === 'camino'">
      <CaminoSubMetas
        :submetas="tienda.metaActual.submetas"
        :totalAhorrado="tienda.metaActual.totalAhorrado"
      />
    </div>

    <!-- TAB 3: CALENDARIO E HISTORIAL -->
    <div v-else-if="tabActiva === 'calendario'">
      <CalendarioHistorial
        :historial="tienda.metaActual.historial"
      />
    </div>

    <!-- MODAL 1: TACHAR / DESMARCAR CUADRITO ESTILO DUOLINGO -->
    <div
      v-if="celdaSeleccionada"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-sm tarjeta-duo p-6 animate-scale-up">
        <button
          type="button"
          @click="celdaSeleccionada = null"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white font-black"
        >
          ✕
        </button>

        <div v-if="!celdaSeleccionada.estaTachada" class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-duo-verde border-2 border-duo-verde-sombra border-b-[6px] flex items-center justify-center text-3xl text-white shadow-md">
            💰
          </div>

          <div>
            <span class="text-xs font-black uppercase tracking-wider text-duo-verde">¡Excelente decisión!</span>
            <h3 class="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              Vas a guardar ${{ celdaSeleccionada.monto }}
            </h3>
            <p class="text-xs font-bold text-gray-400 mt-1">
              Este monto se sumará inmediatamente a tu progreso y a tu racha quincenal.
            </p>
          </div>

          <div>
            <label class="block text-left text-xs font-black uppercase text-gray-500 mb-1">
              Nota o motivo (Opcional)
            </label>
            <input
              v-model="notaAbonoCuadrito"
              type="text"
              placeholder="Ej. Quincena cobrada en efectivo..."
              class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
            />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="celdaSeleccionada = null"
              class="boton-duo-blanco flex-1 py-3 text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="confirmarTacharODesmarcar"
              :disabled="procesandoCelda"
              class="boton-duo-verde flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
            >
              <span v-if="procesandoCelda" class="animate-spin">⏳</span>
              <span>¡TACHAR CUADRO!</span>
            </button>
          </div>
        </div>

        <!-- Si ya está tachada: Desmarcar -->
        <div v-else class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-red-100 dark:bg-red-950/40 border-2 border-red-400 border-b-[6px] flex items-center justify-center text-3xl shadow-md">
            ↩️
          </div>

          <div>
            <h3 class="text-xl font-black text-gray-900 dark:text-white">
              ¿Desmarcar cuadrito de ${{ celdaSeleccionada.monto }}?
            </h3>
            <p class="text-xs font-bold text-gray-400 mt-1">
              Usa esta opción si marcaste este cuadro por error. Se restará del total ahorrado.
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="celdaSeleccionada = null"
              class="boton-duo-blanco flex-1 py-3 text-xs"
            >
              Mantener
            </button>
            <button
              type="button"
              @click="confirmarTacharODesmarcar"
              :disabled="procesandoCelda"
              class="p-3 rounded-2xl bg-red-500 hover:bg-red-600 border-2 border-red-700 border-b-4 active:border-b-2 active:translate-y-1 text-white font-black flex-1 text-xs transition-all"
            >
              <span v-if="procesandoCelda" class="animate-spin">⏳</span>
              <span>Sí, desmarcar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: ABONO LIBRE -->
    <div
      v-if="modalAbonoLibre"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-sm tarjeta-duo p-6">
        <button
          type="button"
          @click="modalAbonoLibre = false"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white font-black"
        >
          ✕
        </button>

        <div class="text-center mb-4">
          <span class="text-3xl">⚡</span>
          <h3 class="text-xl font-black text-gray-900 dark:text-white mt-1">
            Registrar Abono Libre
          </h3>
          <p class="text-xs font-bold text-gray-400">
            ¿Recibiste un bono o dinero extra que no coincide con un cuadrito exacto?
          </p>
        </div>

        <form @submit.prevent="registrarAbonoLibre" class="space-y-3">
          <div>
            <label class="block text-xs font-black uppercase text-gray-500 mb-1">
              Monto a Abonar ($ USD) *
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 font-black text-gray-400">$</span>
              <input
                v-model.number="montoAbonoLibre"
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="75"
                class="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-black text-gray-900 dark:text-white focus:outline-none focus:border-duo-azul"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-black uppercase text-gray-500 mb-1">
              Nota (Opcional)
            </label>
            <input
              v-model="notaAbonoLibre"
              type="text"
              placeholder="Ej. Venta de objeto usado, bono laboral..."
              class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-duo-azul"
            />
          </div>

          <div class="flex items-center gap-2 pt-3">
            <button
              type="button"
              @click="modalAbonoLibre = false"
              class="boton-duo-blanco flex-1 py-3 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="procesandoAbonoLibre"
              class="boton-duo-azul flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
            >
              <span v-if="procesandoAbonoLibre" class="animate-spin">⏳</span>
              <span>¡ABONAR!</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: INVITAR COLABORADOR -->
    <div
      v-if="modalInvitar"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-sm tarjeta-duo p-6">
        <button
          type="button"
          @click="modalInvitar = false"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white font-black"
        >
          ✕
        </button>

        <div class="text-center mb-4">
          <span class="text-3xl">👥</span>
          <h3 class="text-xl font-black text-gray-900 dark:text-white mt-1">
            Invitar Colaborador
          </h3>
          <p class="text-xs font-bold text-gray-400">
            Ahorren juntos en esta meta compartida. Ambos podrán tachar cuadritos.
          </p>
        </div>

        <div v-if="errorInvitar" class="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-500 text-xs font-bold">
          ⚠️ {{ errorInvitar }}
        </div>

        <div v-if="mensajeExitoInvitar" class="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-duo-verde text-xs font-bold">
          ✓ {{ mensajeExitoInvitar }}
        </div>

        <form @submit.prevent="enviarInvitacion" class="space-y-3">
          <div class="relative">
            <label class="block text-xs font-black uppercase text-gray-500 mb-1 flex items-center justify-between">
              <span>Correo o @Usuario del amigo</span>
              <span class="text-[10px] text-duo-azul">Búsqueda rápida</span>
            </label>
            <input
              v-model="correoColaborador"
              type="text"
              required
              @input="alEscribirColaborador"
              placeholder="ej. sofia@gmail.com o @carlos"
              class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-duo-azul"
            />

            <!-- Sugerencias -->
            <div
              v-if="sugerenciasColaborador.length > 0"
              class="absolute left-0 right-0 top-16 z-20 bg-white dark:bg-duo-oscuro-tarjeta border-2 border-duo-azul rounded-2xl shadow-xl overflow-hidden p-1 space-y-1"
            >
              <button
                v-for="u in sugerenciasColaborador"
                :key="u.id"
                type="button"
                @click="elegirColaboradorSugerido(u)"
                class="w-full p-2 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-duo-oscuro-fondo text-left transition-colors"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center"
                    :style="{ backgroundColor: u.colorAvatar || '#58CC02' }"
                  >
                    {{ u.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="text-xs font-black text-gray-900 dark:text-white block">{{ u.nombre }}</span>
                    <span class="text-[10px] font-mono text-duo-azul block">
                      {{ u.nombreUsuario ? `@${u.nombreUsuario}` : u.correo }}
                    </span>
                  </div>
                </div>
                <span class="text-xs font-black text-duo-azul">+ Elegir</span>
              </button>
            </div>

            <p class="text-[10px] font-bold text-gray-400 mt-1">
              Si tu amigo aún no tiene cuenta, se le enviará la invitación y se vinculará cuando se registre.
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="modalInvitar = false"
              class="boton-duo-blanco flex-1 py-3 text-xs"
            >
              Cerrar
            </button>
            <button
              type="submit"
              :disabled="procesandoInvitar"
              class="boton-duo-azul flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
            >
              <span v-if="procesandoInvitar" class="animate-spin">⏳</span>
              <span>Invitar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div v-else class="tarjeta-duo p-12 text-center">
    <div class="text-4xl animate-spin mb-3">⏳</div>
    <p class="font-black text-gray-600 dark:text-gray-300">Cargando meta de ahorro...</p>
  </div>
</template>
