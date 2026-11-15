<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HistorialInfo } from '~/stores/usarTiendaAhorro'

const props = defineProps<{
  historial: HistorialInfo[]
}>()

const fechaActual = ref(new Date())
const diaSeleccionado = ref<string | null>(null)

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const anio = computed(() => fechaActual.value.getFullYear())
const mes = computed(() => fechaActual.value.getMonth())
const nombreMes = computed(() => meses[mes.value])

function mesAnterior() {
  fechaActual.value = new Date(anio.value, mes.value - 1, 1)
}

function mesSiguiente() {
  fechaActual.value = new Date(anio.value, mes.value + 1, 1)
}

// Mapeo de historial por fecha 'YYYY-MM-DD'
const abonosPorFecha = computed(() => {
  const mapa = new Map<string, { total: number; transacciones: HistorialInfo[] }>()

  for (const item of props.historial) {
    if (!item.fechaAbono) continue
    const d = new Date(item.fechaAbono)
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    if (!mapa.has(clave)) {
      mapa.set(clave, { total: 0, transacciones: [] })
    }
    const registro = mapa.get(clave)!
    registro.transacciones.push(item)
    if (Number(item.monto) > 0) {
      registro.total += Number(item.monto)
    }
  }

  return mapa
})

interface CeldaCalendario {
  fechaClave: string
  numeroDia: number
  esMesActual: boolean
  tieneAbono: boolean
  totalAbonado: number
}

const celdasCalendario = computed<CeldaCalendario[]>(() => {
  const celdas: CeldaCalendario[] = []

  const primerDiaMes = new Date(anio.value, mes.value, 1)
  const ultimoDiaMes = new Date(anio.value, mes.value + 1, 0)
  const totalDias = ultimoDiaMes.getDate()

  // Día de la semana (0 es Domingo, 1 es Lunes). Ajustar a lunes = 0
  let primerDiaSemana = primerDiaMes.getDay() - 1
  if (primerDiaSemana === -1) primerDiaSemana = 6

  // Días previos de relleno
  const diasMesAnterior = new Date(anio.value, mes.value, 0).getDate()
  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const num = diasMesAnterior - i
    const mesAnt = mes.value === 0 ? 12 : mes.value
    const anioAnt = mes.value === 0 ? anio.value - 1 : anio.value
    const clave = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-${String(num).padStart(2, '0')}`
    celdas.push({
      fechaClave: clave,
      numeroDia: num,
      esMesActual: false,
      tieneAbono: abonosPorFecha.value.has(clave),
      totalAbonado: abonosPorFecha.value.get(clave)?.total || 0
    })
  }

  // Días del mes actual
  for (let dia = 1; dia <= totalDias; dia++) {
    const clave = `${anio.value}-${String(mes.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const datos = abonosPorFecha.value.get(clave)
    celdas.push({
      fechaClave: clave,
      numeroDia: dia,
      esMesActual: true,
      tieneAbono: !!datos && datos.total > 0,
      totalAbonado: datos ? datos.total : 0
    })
  }

  // Rellenar hasta completar semanas (múltiplo de 7)
  const celdasRestantes = (7 - (celdas.length % 7)) % 7
  for (let i = 1; i <= celdasRestantes; i++) {
    const mesSig = mes.value === 11 ? 1 : mes.value + 2
    const anioSig = mes.value === 11 ? anio.value + 1 : anio.value
    const clave = `${anioSig}-${String(mesSig).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    celdas.push({
      fechaClave: clave,
      numeroDia: i,
      esMesActual: false,
      tieneAbono: abonosPorFecha.value.has(clave),
      totalAbonado: abonosPorFecha.value.get(clave)?.total || 0
    })
  }

  return celdas
})

function seleccionarDia(celda: CeldaCalendario) {
  if (diaSeleccionado.value === celda.fechaClave) {
    diaSeleccionado.value = null // Deseleccionar
  } else {
    diaSeleccionado.value = celda.fechaClave
  }
}

const transaccionesMostradas = computed(() => {
  if (!diaSeleccionado.value) {
    return props.historial
  }
  const datos = abonosPorFecha.value.get(diaSeleccionado.value)
  return datos ? datos.transacciones : []
})

function formatearHora(fechaIso: string) {
  const d = new Date(fechaIso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatearFechaLegible(fechaIso: string) {
  const d = new Date(fechaIso)
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado del Calendario 3D -->
    <div class="tarjeta-duo p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>📅</span> {{ nombreMes }} {{ anio }}
          </h3>
          <p class="text-xs font-bold text-gray-400 dark:text-gray-500">
            Los días con ahorro están iluminados en verde esmeralda
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="mesAnterior"
            class="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 active:border-b-2 active:translate-y-1 font-black text-gray-700 dark:text-white flex items-center justify-center transition-all"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <button
            type="button"
            @click="mesSiguiente"
            class="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 active:border-b-2 active:translate-y-1 font-black text-gray-700 dark:text-white flex items-center justify-center transition-all"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>
      </div>

      <!-- Días de la semana -->
      <div class="grid grid-cols-7 gap-1 text-center font-black text-xs text-gray-400 dark:text-gray-500 mb-2">
        <div v-for="d in diasSemana" :key="d" class="py-1">
          {{ d }}
        </div>
      </div>

      <!-- Celdas de los días -->
      <div class="grid grid-cols-7 gap-1 sm:gap-2">
        <button
          v-for="celda in celdasCalendario"
          :key="celda.fechaClave"
          type="button"
          @click="seleccionarDia(celda)"
          :class="[
            'relative h-14 sm:h-16 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-between p-1 transition-all duration-75',
            !celda.esMesActual ? 'opacity-30' : '',
            diaSeleccionado === celda.fechaClave
              ? 'ring-2 ring-duo-azul ring-offset-2 dark:ring-offset-duo-oscuro-fondo border-duo-azul scale-105 z-10'
              : '',
            celda.tieneAbono
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-duo-verde border-b-4 text-duo-verde-sombra dark:text-duo-verde font-black'
              : 'bg-white dark:bg-duo-oscuro-fondo/50 border-gray-100 dark:border-duo-oscuro-borde text-gray-700 dark:text-gray-300'
          ]"
        >
          <span class="text-xs sm:text-sm font-extrabold">{{ celda.numeroDia }}</span>

          <div v-if="celda.tieneAbono" class="flex flex-col items-center leading-none">
            <span class="text-[9px] sm:text-[10px] font-black text-duo-verde">
              +${{ celda.totalAbonado }}
            </span>
            <span class="text-[9px]">🔥</span>
          </div>
          <div v-else class="h-3"></div>
        </button>
      </div>

      <!-- Indicador de filtro activo -->
      <div v-if="diaSeleccionado" class="mt-4 pt-3 border-t border-gray-100 dark:border-duo-oscuro-borde flex items-center justify-between">
        <span class="text-xs font-black text-duo-azul">
          Filtrando por el día: {{ diaSeleccionado }}
        </span>
        <button
          type="button"
          @click="diaSeleccionado = null"
          class="text-xs font-extrabold text-gray-500 hover:text-red-500 underline"
        >
          Mostrar todo el historial
        </button>
      </div>
    </div>

    <!-- Lista de Historial de Movimientos -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
          <span>📜</span> Historial de Ahorros
        </h4>
        <span class="text-xs font-extrabold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-duo-oscuro-tarjeta text-gray-600 dark:text-gray-400">
          {{ transaccionesMostradas.length }} registros
        </span>
      </div>

      <div v-if="transaccionesMostradas.length === 0" class="tarjeta-duo p-8 text-center">
        <div class="text-4xl mb-2">🐷</div>
        <p class="font-black text-gray-700 dark:text-gray-200">Aún no hay movimientos en esta fecha</p>
        <p class="text-xs font-bold text-gray-400 mt-1">¡Tacha tu primer cuadrito para empezar la racha!</p>
      </div>

      <div
        v-for="item in transaccionesMostradas"
        :key="item.id"
        class="tarjeta-duo p-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <!-- Icono / Avatar del usuario -->
          <div
            class="w-11 h-11 rounded-2xl border-2 border-b-4 flex items-center justify-center text-white font-black text-base flex-shrink-0"
            :style="{
              backgroundColor: item.usuario?.colorAvatar || '#58CC02',
              borderColor: 'rgba(0,0,0,0.2)'
            }"
          >
            {{ item.usuario?.nombre ? item.usuario.nombre.charAt(0).toUpperCase() : 'U' }}
          </div>

          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-gray-900 dark:text-white">
                {{ item.usuario?.nombre || 'Usuario' }}
              </span>
              <span
                :class="[
                  'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                  item.tipo === 'cuadrito_tachado'
                    ? 'bg-duo-verde/20 text-duo-verde'
                    : item.tipo === 'abono_libre'
                    ? 'bg-duo-azul/20 text-duo-azul'
                    : 'bg-red-100 dark:bg-red-950/40 text-red-500'
                ]"
              >
                {{ item.tipo === 'cuadrito_tachado' ? 'Cuadrito' : item.tipo === 'abono_libre' ? 'Abono Libre' : 'Desmarcado' }}
              </span>
            </div>

            <p class="text-xs font-bold text-gray-500 dark:text-duo-oscuro-muted mt-0.5">
              {{ item.nota || 'Ahorro registrado' }}
            </p>

            <span class="text-[10px] font-extrabold text-gray-400">
              {{ formatearFechaLegible(item.fechaAbono) }} · {{ formatearHora(item.fechaAbono) }}
            </span>
          </div>
        </div>

        <!-- Monto -->
        <div
          :class="[
            'text-right font-black text-lg sm:text-xl',
            Number(item.monto) >= 0 ? 'text-duo-verde' : 'text-red-500'
          ]"
        >
          {{ Number(item.monto) >= 0 ? '+' : '' }}${{ item.monto }}
        </div>
      </div>
    </div>
  </div>
</template>
