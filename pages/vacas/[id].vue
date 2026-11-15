<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usarTiendaAhorro, type CasillaVacaInfo, type ParticipanteInfo } from '~/stores/usarTiendaAhorro'

const route = useRoute()
const tienda = usarTiendaAhorro()

const vacaId = Number(route.params.id)
const tabActiva = ref<'participantes' | 'auditoria' | 'rubros' | 'calendario'>('participantes')

// Estados de modales
const casillaParaPagar = ref<CasillaVacaInfo | null>(null)
const participanteActualParaPago = ref<ParticipanteInfo | null>(null)
const captureEnPantallaCompleta = ref<string | null>(null)

// Modal de rechazo
const casillaParaRechazar = ref<CasillaVacaInfo | null>(null)
const motivoRechazo = ref('')
const procesandoRechazo = ref(false)

// Toast de copiado
const copiadoExitoso = ref(false)

onMounted(async () => {
  await tienda.cargarVaca(vacaId)
})

function abrirModalPago(casilla: CasillaVacaInfo, participante: ParticipanteInfo) {
  if (casilla.estaPagada && casilla.estadoVerificacion === 'verificado') return
  casillaParaPagar.value = casilla
  participanteActualParaPago.value = participante
}

function alCompletarPago() {
  casillaParaPagar.value = null
  participanteActualParaPago.value = null
  tienda.cargarVaca(vacaId)
}

async function copiarDatosPagoMovil() {
  if (!tienda.vacaActual?.datosPagoMovil) return
  try {
    await navigator.clipboard.writeText(tienda.vacaActual.datosPagoMovil)
    copiadoExitoso.value = true
    setTimeout(() => {
      copiadoExitoso.value = false
    }, 2500)
  } catch {
    // Fallback manual
    const el = document.createElement('textarea')
    el.value = tienda.vacaActual.datosPagoMovil
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

async function verificarCasillaDirecta(casillaId: number) {
  try {
    await tienda.verificarPagoVaca(vacaId, [casillaId], 'verificar')
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Error al verificar pago')
  }
}

function abrirModalRechazar(casilla: CasillaVacaInfo) {
  casillaParaRechazar.value = casilla
  motivoRechazo.value = ''
}

async function confirmarRechazo() {
  if (!casillaParaRechazar.value) return
  procesandoRechazo.value = true
  try {
    await tienda.verificarPagoVaca(vacaId, [casillaParaRechazar.value.id], 'rechazar', motivoRechazo.value)
    casillaParaRechazar.value = null
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Error al rechazar pago')
  } finally {
    procesandoRechazo.value = false
  }
}

function formatearFechaHora(fechaIso: string | null) {
  if (!fechaIso) return ''
  const d = new Date(fechaIso)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div v-if="tienda.vacaActual" class="space-y-6">
    <!-- Botón Volver -->
    <div>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-duo-verde uppercase tracking-wider mb-3 transition-colors"
      >
        <span>←</span> Volver a Las Vacas y Metas
      </NuxtLink>

      <!-- CABECERA PRINCIPAL DE LA VACA -->
      <div class="tarjeta-duo p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-duo-amarillo-sombra text-amber-900 dark:text-amber-300 text-xs font-black flex items-center gap-1">
                <span>🥩</span> Evento / La Vaca
              </span>
              <span
                v-if="tienda.vacaActual.estado === 'completada'"
                class="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-duo-verde text-xs font-black flex items-center gap-1"
              >
                <span>🏆</span> ¡100% Recaudado!
              </span>
              <span
                v-if="tienda.vacaActual.totalEnRevision > 0"
                class="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-duo-azul text-xs font-black flex items-center gap-1 animate-pulse"
              >
                <span>⏳</span> ${{ tienda.vacaActual.totalEnRevision }} en revisión
              </span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {{ tienda.vacaActual.titulo }}
            </h1>
            <p v-if="tienda.vacaActual.descripcion" class="text-xs sm:text-sm font-bold text-gray-400 mt-0.5">
              {{ tienda.vacaActual.descripcion }}
            </p>
          </div>

          <!-- Insignia de fecha del evento -->
          <div v-if="tienda.vacaActual.fechaEvento" class="px-3.5 py-2 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde text-center">
            <span class="text-[10px] font-black uppercase text-gray-400 block">Día del Evento</span>
            <span class="text-sm font-black text-gray-900 dark:text-white">📅 {{ tienda.vacaActual.fechaEvento }}</span>
          </div>
        </div>

        <!-- BANNER DEL TESORERO / RECEPTOR DEL DINERO -->
        <div class="mt-4 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-2 border-duo-azul-sombra border-b-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-duo-azul border-2 border-duo-azul-sombra flex items-center justify-center text-white text-xl">
              🏦
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-wider text-duo-azul">
                Tesorero Oficial de la Vaca
              </p>
              <h4 class="text-sm font-black text-gray-900 dark:text-white">
                {{ tienda.vacaActual.receptorPagoNombre }}
              </h4>
            </div>
          </div>

          <!-- Botón de Copiar Pago Móvil rápido -->
          <button
            v-if="tienda.vacaActual.datosPagoMovil"
            type="button"
            @click="copiarDatosPagoMovil"
            :class="[
              'px-3.5 py-2 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center gap-1.5',
              copiadoExitoso ? 'bg-duo-verde text-white border-duo-verde-sombra' : 'boton-duo-azul'
            ]"
          >
            <span>{{ copiadoExitoso ? '✓' : '📋' }}</span>
            <span>{{ copiadoExitoso ? '¡Datos Copiados!' : 'Copiar Datos de Pago Móvil' }}</span>
          </button>
        </div>

        <!-- Barra de Progreso y Estadísticas -->
        <div class="mt-6 pt-5 border-t border-duo-claro-borde dark:border-duo-oscuro-borde">
          <div class="flex items-baseline justify-between mb-2">
            <div>
              <span class="text-xs font-black uppercase tracking-wider text-gray-400">Total Recaudado</span>
              <div class="text-2xl sm:text-3xl font-black text-duo-verde">
                ${{ tienda.vacaActual.totalRecaudado }}
                <span class="text-xs font-bold text-gray-400">/ ${{ tienda.vacaActual.montoTotal }} USD</span>
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs font-black uppercase tracking-wider text-gray-400">Falta por Cobrar</span>
              <div class="text-xl sm:text-2xl font-black text-duo-naranja">
                ${{ tienda.vacaActual.montoFaltante }}
              </div>
            </div>
          </div>

          <!-- Barra de Progreso Jugosa -->
          <div class="barra-jugosa h-6">
            <div
              class="barra-jugosa-relleno bg-duo-verde"
              :style="{ width: `${tienda.vacaActual.progresoPorcentaje}%` }"
            ></div>
          </div>

          <div class="flex items-center justify-between mt-2 text-xs font-black text-gray-500">
            <span>{{ tienda.vacaActual.progresoPorcentaje }}% del presupuesto cubierto</span>
            <span>{{ tienda.vacaActual.participantes.length }} participantes · {{ tienda.vacaActual.pagosPorPersona }} pagos c/u</span>
          </div>
        </div>
      </div>
    </div>

    <!-- NAVEGACIÓN EN 4 PESTAÑAS GAMIFICADAS (TABS 3D) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        type="button"
        @click="tabActiva = 'participantes'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none',
          tabActiva === 'participantes' ? 'boton-duo-verde' : 'boton-duo-blanco'
        ]"
      >
        <span>👥</span>
        <span>Pizarra Amigos</span>
      </button>

      <button
        type="button"
        @click="tabActiva = 'auditoria'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none relative',
          tabActiva === 'auditoria' ? 'boton-duo-azul' : 'boton-duo-blanco'
        ]"
      >
        <span>📊</span>
        <span>Panel & Captures</span>
        <span
          v-if="tienda.vacaActual.totalEnRevision > 0"
          class="w-2.5 h-2.5 rounded-full bg-duo-naranja absolute top-1.5 right-1.5 animate-ping"
        ></span>
      </button>

      <button
        type="button"
        @click="tabActiva = 'rubros'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none',
          tabActiva === 'rubros' ? 'boton-duo-amarillo' : 'boton-duo-blanco'
        ]"
      >
        <span>🛒</span>
        <span>Presupuesto</span>
      </button>

      <button
        type="button"
        @click="tabActiva = 'calendario'"
        :class="[
          'py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all select-none',
          tabActiva === 'calendario' ? 'boton-duo-verde' : 'boton-duo-blanco'
        ]"
      >
        <span>📅</span>
        <span>Calendario</span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- TAB 1: PIZARRA DE PARTICIPANTES            -->
    <!-- ========================================== -->
    <div v-if="tabActiva === 'participantes'" class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <p class="text-xs font-black text-gray-500 dark:text-gray-400">
          Toca cualquier casilla para subir el capture de Pago Móvil o registrar efectivo
        </p>
      </div>

      <!-- Tarjetas 3D por cada Participante -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="participante in tienda.vacaActual.participantes"
          :key="participante.id"
          class="tarjeta-duo p-4 flex flex-col justify-between"
        >
          <!-- Cabecera del amigo -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2.5">
              <div
                class="w-10 h-10 rounded-2xl border-2 border-b-4 flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                :style="{ backgroundColor: participante.colorAvatar, borderColor: 'rgba(0,0,0,0.2)' }"
              >
                {{ participante.nombreParticipante.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h4 class="text-base font-black text-gray-900 dark:text-white">
                    {{ participante.nombreParticipante }}
                  </h4>
                  <span
                    v-if="participante.esReceptorPago"
                    class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-duo-azul text-[10px] font-black"
                  >
                    ★ Tesorero
                  </span>
                </div>
                <span class="text-xs font-extrabold text-gray-400">
                  Cuota total: ${{ participante.montoAsignado }} USD
                </span>
              </div>
            </div>

            <!-- Porcentaje pagado por el participante -->
            <div class="text-right">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-black',
                  (participante.casillas || []).every(c => c.estaPagada && c.estadoVerificacion === 'verificado')
                    ? 'bg-duo-verde text-white'
                    : (participante.casillas || []).some(c => c.estaPagada)
                    ? 'bg-amber-100 text-duo-naranja dark:bg-amber-950/40'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                ]"
              >
                {{
                  (participante.casillas || []).every(c => c.estaPagada && c.estadoVerificacion === 'verificado')
                    ? '✓ Al día'
                    : (participante.casillas || []).some(c => c.estaPagada)
                    ? 'Abonando'
                    : 'Sin pagar'
                }}
              </span>
            </div>
          </div>

          <!-- Casillas / Cuadritos de pago del participante -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            <button
              v-for="casilla in participante.casillas"
              :key="casilla.id"
              type="button"
              @click="abrirModalPago(casilla, participante)"
              :class="[
                'p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all select-none',
                casilla.estaPagada && casilla.estadoVerificacion === 'verificado'
                  ? 'bg-duo-verde border-duo-verde-sombra border-b-4 text-white'
                  : casilla.estaPagada && casilla.estadoVerificacion === 'en_revision'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-duo-amarillo-sombra border-b-4 text-amber-900 dark:text-amber-300 animate-pulse'
                  : casilla.estadoVerificacion === 'rechazado'
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-400 border-b-4 text-red-600'
                  : 'bg-white dark:bg-duo-oscuro-fondo border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 hover:border-duo-verde active:border-b-2 active:translate-y-1 text-gray-800 dark:text-gray-200'
              ]"
            >
              <div class="flex items-center gap-1">
                <span v-if="casilla.metodoPago === 'comprobante'" class="text-xs">🧾</span>
                <span v-else-if="casilla.metodoPago === 'efectivo'" class="text-xs">💵</span>
                <span class="font-black text-sm">${{ casilla.monto }}</span>
              </div>

              <span class="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                <template v-if="casilla.estaPagada && casilla.estadoVerificacion === 'verificado'">
                  ✓ Verificado
                </template>
                <template v-else-if="casilla.estadoVerificacion === 'en_revision'">
                  ⏳ En revisión
                </template>
                <template v-else-if="casilla.estadoVerificacion === 'rechazado'">
                  ❌ Rechazado
                </template>
                <template v-else>
                  Cuota {{ casilla.numeroCuota }}
                </template>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 2: PANEL DE CONTROL Y AUDITORÍA        -->
    <!-- ========================================== -->
    <div v-else-if="tabActiva === 'auditoria'" class="space-y-6">
      <!-- 1. MEDIDOR DE RITMO DEL GRUPO -->
      <div>
        <h3 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <span>🚦</span> Ritmo de Pago del Grupo
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Al día -->
          <div class="tarjeta-duo p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-duo-verde/40">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-duo-verde">✓ Al Día (100%)</span>
              <span class="text-xl font-black text-duo-verde">{{ tienda.vacaActual.ritmo.alDia.length }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="p in tienda.vacaActual.ritmo.alDia"
                :key="p.id"
                class="px-2 py-0.5 rounded-lg bg-duo-verde text-white text-[10px] font-black"
              >
                {{ p.nombre }}
              </span>
              <span v-if="tienda.vacaActual.ritmo.alDia.length === 0" class="text-xs font-bold text-gray-400">
                Ninguno todavía
              </span>
            </div>
          </div>

          <!-- A mitad de camino -->
          <div class="tarjeta-duo p-4 bg-amber-50/50 dark:bg-amber-950/20 border-duo-amarillo-sombra">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-duo-naranja">⚡ Abonando</span>
              <span class="text-xl font-black text-duo-naranja">{{ tienda.vacaActual.ritmo.aMitad.length }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="p in tienda.vacaActual.ritmo.aMitad"
                :key="p.id"
                class="px-2 py-0.5 rounded-lg bg-duo-amarillo text-gray-900 text-[10px] font-black"
              >
                {{ p.nombre }} ({{ p.pagadas }}/{{ p.totalCasillas }})
              </span>
              <span v-if="tienda.vacaActual.ritmo.aMitad.length === 0" class="text-xs font-bold text-gray-400">
                Ninguno
              </span>
            </div>
          </div>

          <!-- Rezagados -->
          <div class="tarjeta-duo p-4 bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-red-500">⏳ Rezagados ($0)</span>
              <span class="text-xl font-black text-red-500">{{ tienda.vacaActual.ritmo.rezagados.length }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="p in tienda.vacaActual.ritmo.rezagados"
                :key="p.id"
                class="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-500 text-[10px] font-black"
              >
                {{ p.nombre }}
              </span>
              <span v-if="tienda.vacaActual.ritmo.rezagados.length === 0" class="text-xs font-bold text-gray-400">
                ¡Nadie rezagado!
              </span>
            </div>
          </div>
        </div>

        <!-- Desglose por método de pago -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde">
            <span class="text-[10px] font-black uppercase text-gray-400 block">📲 Pago Móvil Verificado</span>
            <span class="text-base font-black text-duo-azul">${{ tienda.vacaActual.totalPagoMovil }} USD</span>
          </div>
          <div class="p-3 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde">
            <span class="text-[10px] font-black uppercase text-gray-400 block">💵 Efectivo en Mano</span>
            <span class="text-base font-black text-duo-verde">${{ tienda.vacaActual.totalEfectivo }} USD</span>
          </div>
          <div class="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border-2 border-duo-amarillo-sombra">
            <span class="text-[10px] font-black uppercase text-duo-naranja block">⏳ Pendiente Auditoría</span>
            <span class="text-base font-black text-duo-naranja">${{ tienda.vacaActual.totalEnRevision }} USD</span>
          </div>
        </div>
      </div>

      <!-- 2. BANDEJA Y GALERÍA DE CAPTURES (AUDITORÍA) -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>🧾</span> Galería de Comprobantes y Pagos
          </h3>
          <span class="text-xs font-bold text-gray-400">
            {{ tienda.vacaActual.historialPagos.length }} comprobantes
          </span>
        </div>

        <div v-if="tienda.vacaActual.historialPagos.length === 0" class="tarjeta-duo p-8 text-center">
          <div class="text-4xl mb-2">📸</div>
          <p class="font-black text-gray-700 dark:text-gray-200">Aún no se han registrado comprobantes de pago</p>
          <p class="text-xs font-bold text-gray-400 mt-1">Cuando los amigos paguen por Pago Móvil o Efectivo, aparecerán aquí para verificarlos.</p>
        </div>

        <!-- Lista de Comprobantes con Miniatura -->
        <div v-else class="space-y-3">
          <div
            v-for="pago in tienda.vacaActual.historialPagos"
            :key="pago.id"
            class="tarjeta-duo p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div class="flex items-start gap-3">
              <!-- Miniatura del capture si existe -->
              <div v-if="pago.comprobanteUrl" class="relative group cursor-pointer flex-shrink-0" @click="captureEnPantallaCompleta = pago.comprobanteUrl">
                <img
                  :src="pago.comprobanteUrl"
                  alt="Miniatura comprobante"
                  class="w-16 h-16 rounded-xl object-cover border-2 border-duo-claro-borde dark:border-duo-oscuro-borde group-hover:scale-105 transition-transform"
                />
                <div class="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="text-white text-xs">🔍</span>
                </div>
              </div>
              <div v-else class="w-16 h-16 rounded-xl bg-amber-100 dark:bg-amber-950/40 border-2 border-duo-amarillo-sombra flex items-center justify-center text-2xl flex-shrink-0">
                💵
              </div>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-black text-gray-900 dark:text-white">
                    {{ pago.participante?.nombreParticipante || 'Amigo' }}
                  </span>
                  <span
                    :class="[
                      'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                      pago.estadoVerificacion === 'verificado'
                        ? 'bg-duo-verde/20 text-duo-verde'
                        : pago.estadoVerificacion === 'en_revision'
                        ? 'bg-duo-amarillo/20 text-duo-naranja animate-pulse'
                        : 'bg-red-100 text-red-500'
                    ]"
                  >
                    {{ pago.estadoVerificacion === 'verificado' ? '✓ Verificado' : pago.estadoVerificacion === 'en_revision' ? '⏳ En Revisión' : '❌ Rechazado' }}
                  </span>
                </div>

                <p v-if="pago.referenciaPago" class="text-xs font-mono font-bold text-duo-azul mt-0.5">
                  Ref: {{ pago.referenciaPago }}
                </p>
                <p v-if="pago.notaPago" class="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ pago.notaPago }}
                </p>
                <span class="text-[10px] font-bold text-gray-400 block mt-0.5">
                  {{ formatearFechaHora(pago.fechaPago) }}
                </span>
              </div>
            </div>

            <!-- Monto y Botones de Auditoría -->
            <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
              <span class="text-lg font-black text-duo-verde">
                ${{ pago.monto }} USD
              </span>

              <!-- Botones solo para el Creador o Tesorero -->
              <div v-if="tienda.vacaActual.puedeAuditar" class="flex items-center gap-1.5">
                <button
                  v-if="pago.estadoVerificacion !== 'verificado'"
                  type="button"
                  @click="verificarCasillaDirecta(pago.id)"
                  class="px-2.5 py-1.5 rounded-xl bg-duo-verde text-white border-2 border-duo-verde-sombra border-b-2 text-xs font-black hover:brightness-105 active:translate-y-0.5"
                  title="Aprobar comprobante"
                >
                  ✓ Aprobar
                </button>
                <button
                  v-if="pago.estadoVerificacion !== 'rechazado'"
                  type="button"
                  @click="abrirModalRechazar(pago)"
                  class="px-2.5 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-500 border border-red-300 dark:border-red-800 text-xs font-black hover:bg-red-200"
                  title="Rechazar comprobante"
                >
                  ✕ Anular
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 3: RUBROS DE LA PARRILLA               -->
    <!-- ========================================== -->
    <div v-else-if="tabActiva === 'rubros'" class="space-y-4">
      <div class="text-center mb-4">
        <h3 class="text-xl font-black text-gray-900 dark:text-white">
          Presupuesto y Compras del Evento 🛒
        </h3>
        <p class="text-xs font-bold text-gray-400 mt-1">
          A medida que entran los pagos de la vaca, se van cubriendo los rubros en orden de prioridad.
        </p>
      </div>

      <div class="space-y-3">
        <div
          v-for="rubro in tienda.vacaActual.rubros"
          :key="rubro.id"
          :class="[
            'tarjeta-duo p-4 transition-all',
            rubro.estaCubierto ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-duo-verde/40' : ''
          ]"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ rubro.icono }}</span>
              <div>
                <h4 class="text-base font-black text-gray-900 dark:text-white">
                  {{ rubro.concepto }}
                </h4>
                <span class="text-xs font-bold text-gray-400">
                  Cubierto: ${{ rubro.montoCubierto }} / ${{ rubro.monto }} USD
                </span>
              </div>
            </div>

            <span
              :class="[
                'text-xs font-black px-2.5 py-1 rounded-full',
                rubro.estaCubierto ? 'bg-duo-verde text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              ]"
            >
              {{ rubro.estaCubierto ? '¡Dinero Listo! ✓' : `${rubro.porcentajeCubierto}% cubierto` }}
            </span>
          </div>

          <!-- Barra de progreso individual del rubro -->
          <div class="barra-jugosa h-3 mt-3">
            <div
              class="barra-jugosa-relleno bg-duo-verde"
              :style="{ width: `${rubro.porcentajeCubierto}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 4: CALENDARIO DE PAGOS DE LA VACA      -->
    <!-- ========================================== -->
    <div v-else-if="tabActiva === 'calendario'">
      <CalendarioHistorial
        :historial="tienda.vacaActual.historialPagos.map(p => ({
          id: p.id,
          metaId: p.vacaId,
          usuarioId: 0,
          celdaId: p.id,
          monto: Number(p.monto),
          tipo: p.metodoPago === 'comprobante' ? 'cuadrito_tachado' : 'abono_libre',
          nota: p.notaPago || `Pago de ${p.participante?.nombreParticipante || 'Participante'}`,
          fechaAbono: p.fechaPago || p.updatedAt || new Date().toISOString(),
          usuario: {
            id: 0,
            nombre: p.participante?.nombreParticipante || 'Amigo',
            colorAvatar: p.participante?.colorAvatar || '#58CC02'
          }
        }))"
      />
    </div>

    <!-- MODAL REGISTRAR PAGO -->
    <ModalPagoCasillaVaca
      v-if="casillaParaPagar && participanteActualParaPago"
      :vacaId="vacaId"
      :casillaInicial="casillaParaPagar"
      :todasCasillasParticipante="participanteActualParaPago.casillas || []"
      :nombreParticipante="participanteActualParaPago.nombreParticipante"
      :receptorPagoNombre="tienda.vacaActual.receptorPagoNombre"
      :datosPagoMovil="tienda.vacaActual.datosPagoMovil"
      @cerrar="casillaParaPagar = null; participanteActualParaPago = null"
      @pagado="alCompletarPago"
    />

    <!-- MODAL LIGHTBOX PARA VER CAPTURE EN PANTALLA COMPLETA -->
    <div
      v-if="captureEnPantallaCompleta"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      @click="captureEnPantallaCompleta = null"
    >
      <div class="relative max-w-lg max-h-[90vh]">
        <button
          type="button"
          @click="captureEnPantallaCompleta = null"
          class="absolute -top-10 right-0 text-white font-black text-xl hover:text-red-400"
        >
          ✕ Cerrar
        </button>
        <img
          :src="captureEnPantallaCompleta"
          alt="Comprobante en pantalla completa"
          class="rounded-2xl max-h-[85vh] w-auto mx-auto shadow-2xl object-contain border-2 border-white/20"
        />
      </div>
    </div>

    <!-- MODAL PARA RECHAZAR / ANULAR PAGO -->
    <div
      v-if="casillaParaRechazar"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-sm tarjeta-duo p-6">
        <button
          type="button"
          @click="casillaParaRechazar = null"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white font-black"
        >
          ✕
        </button>

        <div class="text-center mb-4">
          <span class="text-3xl">⚠️</span>
          <h3 class="text-lg font-black text-gray-900 dark:text-white mt-1">
            Rechazar / Anular Comprobante
          </h3>
          <p class="text-xs font-bold text-gray-400">
            La casilla volverá a estar pendiente de pago.
          </p>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
              Motivo del Rechazo (Opcional)
            </label>
            <input
              v-model="motivoRechazo"
              type="text"
              placeholder="Ej. Monto incompleto, no cayó en cuenta..."
              class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:border-red-400"
            />
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="casillaParaRechazar = null"
              class="boton-duo-blanco flex-1 py-3 text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="confirmarRechazo"
              :disabled="procesandoRechazo"
              class="p-3 rounded-2xl bg-red-500 hover:bg-red-600 border-2 border-red-700 border-b-4 active:border-b-2 active:translate-y-1 text-white font-black flex-1 text-xs transition-all"
            >
              <span v-if="procesandoRechazo" class="animate-spin">⏳</span>
              <span>Confirmar Rechazo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="tarjeta-duo p-12 text-center">
    <div class="text-4xl animate-spin mb-3">⏳</div>
    <p class="font-black text-gray-600 dark:text-gray-300">Cargando La Vaca...</p>
  </div>
</template>
