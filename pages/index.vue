<script setup lang="ts">
import { ref, watch } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const tienda = usarTiendaAhorro()

// Selector de vista principal: 'metas' vs 'vacas'
const moduloActivo = ref<'metas' | 'vacas'>('metas')

const mostrarModalCrearMeta = ref(false)
const mostrarModalCrearVaca = ref(false)

watch(
  () => tienda.usuario?.id,
  async (usuarioId) => {
    if (usuarioId) {
      await Promise.all([
        tienda.cargarMetas(),
        tienda.cargarVacas()
      ])
    }
  },
  { immediate: true }
)

function alCrearMeta(id: number) {
  mostrarModalCrearMeta.value = false
  navigateTo(`/metas/${id}`)
}

function alCrearVaca(id: number) {
  mostrarModalCrearVaca.value = false
  navigateTo(`/vacas/${id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Si no está autenticado, Pantalla de Bienvenida Estilo Duolingo -->
    <div v-if="!tienda.usuario" class="tarjeta-duo p-8 text-center max-w-lg mx-auto my-8">
      <div class="mb-4 flex justify-center">
        <LogoMatcha tamano="xl" variante="verde" class="shadow-md animate-bounce" />
      </div>
      <h1 class="text-3xl font-black text-gray-900 dark:text-white">
        Ahorra con disciplina, juega como en Duolingo
      </h1>
      <p class="text-sm font-bold text-gray-500 dark:text-duo-oscuro-muted mt-2">
        Convierte metas personales y eventos con amigos (La Vaca) en tableros de cuadritos auditables.
      </p>

      <div class="mt-8 space-y-3">
        <NuxtLink
          to="/registro"
          class="block w-full py-4 boton-duo-verde text-center text-base uppercase tracking-wider"
        >
          ¡EMPEZAR AHORA!
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="block w-full py-3.5 boton-duo-blanco text-center text-sm uppercase tracking-wider"
        >
          YA TENGO UNA CUENTA
        </NuxtLink>
      </div>
    </div>

    <!-- Dashboard para usuarios autenticados -->
    <div v-else class="space-y-6">
      <!-- SELECTOR SUPERIOR ESTILO DUOLINGO: MIS METAS vs LAS VACAS -->
      <div class="grid grid-cols-2 gap-3 p-1.5 rounded-3xl bg-gray-200/60 dark:bg-duo-oscuro-tarjeta border-2 border-duo-claro-borde dark:border-duo-oscuro-borde">
        <button
          type="button"
          @click="moduloActivo = 'metas'"
          :class="[
            'py-3.5 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all select-none',
            moduloActivo === 'metas'
              ? 'boton-duo-verde'
              : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-white/40 dark:hover:bg-duo-oscuro-fondo/40'
          ]"
        >
          <span class="text-lg">🎯</span>
          <span>Mis Metas</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-white/20 ml-1 hidden sm:inline-block">
            {{ tienda.metas.length }}
          </span>
        </button>

        <button
          type="button"
          @click="moduloActivo = 'vacas'"
          :class="[
            'py-3.5 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all select-none relative',
            moduloActivo === 'vacas'
              ? 'boton-duo-amarillo text-gray-900'
              : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-white/40 dark:hover:bg-duo-oscuro-fondo/40'
          ]"
        >
          <span class="text-lg">🥩</span>
          <span>Las Vacas / Eventos</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-black/10 ml-1 hidden sm:inline-block">
            {{ tienda.vacas.length }}
          </span>
          <span
            v-if="tienda.vacas.some(v => v.casillasPendientesVerificacion > 0)"
            class="w-2.5 h-2.5 rounded-full bg-duo-naranja absolute top-2 right-2 animate-ping"
          ></span>
        </button>
      </div>

      <!-- ========================================== -->
      <!-- VISTA 1: METAS DE AHORRO                   -->
      <!-- ========================================== -->
      <div v-if="moduloActivo === 'metas'" class="space-y-6">
        <!-- Encabezado de Bienvenida y Estadísticas Rápidas -->
        <div class="tarjeta-duo p-6 bg-gradient-to-br from-white to-gray-50 dark:from-duo-oscuro-tarjeta dark:to-duo-oscuro-fondo">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">👋</span>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white">
                  ¡Hola, {{ tienda.usuario.nombre }}!
                </h2>
              </div>
              <p class="text-xs font-bold text-gray-500 dark:text-duo-oscuro-muted mt-0.5">
                ¡Mantén viva tu racha y tacha tus cuadritos de ahorro quincenal!
              </p>
            </div>

            <!-- Botón Duolingo Crear Meta -->
            <button
              type="button"
              @click="mostrarModalCrearMeta = true"
              class="boton-duo-verde px-5 py-3 text-sm flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <span class="text-lg leading-none">+</span>
              <span>NUEVA META</span>
            </button>
          </div>

          <!-- Métricas Rápidas 3D -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-duo-claro-borde dark:border-duo-oscuro-borde">
            <div class="p-3 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde">
              <span class="text-xs font-black uppercase tracking-wider text-gray-400">Total Ahorrado</span>
              <div class="text-xl sm:text-2xl font-black text-duo-verde mt-0.5">
                ${{ tienda.ahorroTotalGlobal }} <span class="text-xs font-bold text-gray-400">USD</span>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-duo-amarillo-sombra">
              <span class="text-xs font-black uppercase tracking-wider text-duo-naranja flex items-center gap-1">
                <span>🔥</span> Racha
              </span>
              <div class="text-xl sm:text-2xl font-black text-duo-naranja mt-0.5">
                {{ tienda.usuario.rachaQuincenas }} <span class="text-xs font-bold text-gray-400">quincenas</span>
              </div>
            </div>

            <div class="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-duo-azul-sombra">
              <span class="text-xs font-black uppercase tracking-wider text-duo-azul flex items-center gap-1">
                <span>🎯</span> Metas
              </span>
              <div class="text-xl sm:text-2xl font-black text-duo-azul mt-0.5">
                {{ tienda.metas.length }} <span class="text-xs font-bold text-gray-400">en juego</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de Metas Activas -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>🏆</span> Mis Metas de Ahorro
            </h3>
            <span class="text-xs font-black text-gray-400">
              {{ tienda.metas.length }} metas en total
            </span>
          </div>

          <!-- Estado vacío -->
          <div
            v-if="tienda.metas.length === 0"
            class="tarjeta-duo p-10 text-center space-y-4"
          >
            <div class="w-20 h-20 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/40 border-2 border-duo-amarillo-sombra border-b-4 flex items-center justify-center text-4xl">
              🏍️
            </div>
            <div>
              <h4 class="text-xl font-black text-gray-900 dark:text-white">
                Aún no tienes ninguna meta de ahorro
              </h4>
              <p class="text-xs font-bold text-gray-400 mt-1 max-w-sm mx-auto">
                Crea tu primera meta personalizada o carga el ejemplo de la Moto ($1,650) con un solo toque.
              </p>
            </div>
            <button
              type="button"
              @click="mostrarModalCrearMeta = true"
              class="boton-duo-verde px-6 py-3 text-sm inline-flex items-center gap-2"
            >
              <span>+</span>
              <span>CREAR MI PRIMERA META</span>
            </button>
          </div>

          <!-- Cuadrícula de Metas -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="meta in tienda.metas"
              :key="meta.id"
              :to="`/metas/${meta.id}`"
              class="tarjeta-duo p-5 hover:border-duo-verde transition-all duration-150 group block"
            >
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span
                      v-if="meta.esCompartida"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-duo-azul-sombra text-duo-azul text-[10px] font-black"
                    >
                      <span>👥</span> Compartida
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-black"
                    >
                      <span>👤</span> Individual
                    </span>

                    <span
                      v-if="meta.estado === 'completada'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-duo-verde text-[10px] font-black"
                    >
                      ¡Completada! 🏆
                    </span>
                  </div>

                  <h4 class="text-lg font-black text-gray-900 dark:text-white group-hover:text-duo-verde transition-colors">
                    {{ meta.titulo }}
                  </h4>
                </div>

                <div v-if="meta.miembros && meta.miembros.length > 0" class="flex -space-x-2 overflow-hidden">
                  <div
                    v-for="m in meta.miembros.slice(0, 3)"
                    :key="m.id"
                    class="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-duo-oscuro-tarjeta text-[10px] font-black flex items-center justify-center text-white border"
                    :style="{ backgroundColor: m.colorAvatar || '#58CC02' }"
                    :title="m.nombre"
                  >
                    {{ m.nombre.charAt(0).toUpperCase() }}
                  </div>
                </div>
              </div>

              <p v-if="meta.descripcion" class="text-xs font-bold text-gray-400 line-clamp-1 mb-3">
                {{ meta.descripcion }}
              </p>

              <!-- Progreso y Montos -->
              <div class="space-y-1.5 mt-4">
                <div class="flex items-baseline justify-between text-xs font-black">
                  <span class="text-duo-verde text-sm">${{ meta.totalAhorrado }}</span>
                  <span class="text-gray-400">Meta: ${{ meta.montoObjetivo }} USD</span>
                </div>

                <div class="barra-jugosa h-3.5">
                  <div
                    class="barra-jugosa-relleno bg-duo-verde"
                    :style="{ width: `${meta.progresoPorcentaje}%` }"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-[11px] font-bold text-gray-400 pt-1">
                  <span>{{ meta.celdasTachadas }} de {{ meta.totalCeldas }} cuadritos</span>
                  <span class="font-black text-gray-700 dark:text-gray-300">{{ meta.progresoPorcentaje }}%</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- VISTA 2: LAS VACAS / EVENTOS               -->
      <!-- ========================================== -->
      <div v-else class="space-y-6">
        <!-- Encabezado de Vacas y Estadísticas -->
        <div class="tarjeta-duo p-6 bg-gradient-to-br from-white to-amber-50/30 dark:from-duo-oscuro-tarjeta dark:to-duo-oscuro-fondo">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🥩</span>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white">
                  Eventos / La Vaca
                </h2>
              </div>
              <p class="text-xs font-bold text-gray-500 dark:text-duo-oscuro-muted mt-0.5">
                Recaudación grupal equitativa con tesorero designado y comprobantes auditables.
              </p>
            </div>

            <!-- Botón Crear Vaca -->
            <button
              type="button"
              @click="mostrarModalCrearVaca = true"
              class="boton-duo-amarillo text-gray-900 px-5 py-3 text-sm flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <span class="text-lg leading-none">+</span>
              <span>ARMAR LA VACA</span>
            </button>
          </div>

          <!-- Métricas Rápidas Vacas -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-duo-claro-borde dark:border-duo-oscuro-borde">
            <div class="p-3 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde">
              <span class="text-xs font-black uppercase tracking-wider text-gray-400">Total en Vacas</span>
              <div class="text-xl sm:text-2xl font-black text-duo-verde mt-0.5">
                ${{ tienda.recaudacionTotalVacas }} <span class="text-xs font-bold text-gray-400">USD</span>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-duo-azul-sombra">
              <span class="text-xs font-black uppercase tracking-wider text-duo-azul flex items-center gap-1">
                <span>🥩</span> Eventos
              </span>
              <div class="text-xl sm:text-2xl font-black text-duo-azul mt-0.5">
                {{ tienda.vacas.length }} <span class="text-xs font-bold text-gray-400">activos</span>
              </div>
            </div>

            <div class="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-duo-amarillo-sombra">
              <span class="text-xs font-black uppercase tracking-wider text-duo-naranja flex items-center gap-1">
                <span>⏳</span> En Revisión
              </span>
              <div class="text-xl sm:text-2xl font-black text-duo-naranja mt-0.5">
                {{ tienda.vacas.reduce((acc, v) => acc + (v.casillasPendientesVerificacion || 0), 0) }} <span class="text-xs font-bold text-gray-400">comprobantes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de Vacas -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Eventos Grupales Activos
            </h3>
            <span class="text-xs font-black text-gray-400">
              {{ tienda.vacas.length }} vacas en total
            </span>
          </div>

          <!-- Estado vacío -->
          <div
            v-if="tienda.vacas.length === 0"
            class="tarjeta-duo p-10 text-center space-y-4"
          >
            <div class="w-20 h-20 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/40 border-2 border-duo-amarillo-sombra border-b-4 flex items-center justify-center text-4xl">
              🥩
            </div>
            <div>
              <h4 class="text-xl font-black text-gray-900 dark:text-white">
                No tienes ninguna Vaca activa
              </h4>
              <p class="text-xs font-bold text-gray-400 mt-1 max-w-sm mx-auto">
                ¿Van a hacer una parrilla o fiesta? Arma una vaca equitativa, designa al tesorero y recolecten los captures en un solo lugar.
              </p>
            </div>
            <button
              type="button"
              @click="mostrarModalCrearVaca = true"
              class="boton-duo-amarillo text-gray-900 px-6 py-3 text-sm inline-flex items-center gap-2"
            >
              <span>+</span>
              <span>ARMAR MI PRIMERA VACA</span>
            </button>
          </div>

          <!-- Cuadrícula de Vacas -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="vaca in tienda.vacas"
              :key="vaca.id"
              :to="`/vacas/${vaca.id}`"
              class="tarjeta-duo p-5 hover:border-duo-azul transition-all duration-150 group block"
            >
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-duo-azul-sombra text-duo-azul text-[10px] font-black">
                      <span>🏦</span> Tesorero: {{ vaca.receptorPagoNombre }}
                    </span>

                    <span
                      v-if="vaca.casillasPendientesVerificacion > 0"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-duo-naranja text-[10px] font-black animate-pulse"
                    >
                      <span>⏳</span> {{ vaca.casillasPendientesVerificacion }} por revisar
                    </span>

                    <span
                      v-if="vaca.estado === 'completada'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-duo-verde text-[10px] font-black"
                    >
                      ¡100% Recaudado! 🏆
                    </span>
                  </div>

                  <h4 class="text-lg font-black text-gray-900 dark:text-white group-hover:text-duo-azul transition-colors">
                    {{ vaca.titulo }}
                  </h4>
                </div>

                <div v-if="vaca.participantes && vaca.participantes.length > 0" class="flex -space-x-2 overflow-hidden">
                  <div
                    v-for="p in vaca.participantes.slice(0, 3)"
                    :key="p.id"
                    class="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-duo-oscuro-tarjeta text-[10px] font-black flex items-center justify-center text-white border"
                    :style="{ backgroundColor: p.colorAvatar || '#58CC02' }"
                    :title="p.nombreParticipante"
                  >
                    {{ p.nombreParticipante.charAt(0).toUpperCase() }}
                  </div>
                </div>
              </div>

              <p v-if="vaca.fechaEvento" class="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1">
                <span>📅</span> Fecha: {{ vaca.fechaEvento }}
              </p>

              <!-- Progreso y Montos -->
              <div class="space-y-1.5 mt-4">
                <div class="flex items-baseline justify-between text-xs font-black">
                  <span class="text-duo-verde text-sm">${{ vaca.totalRecaudado }}</span>
                  <span class="text-gray-400">Total: ${{ vaca.montoTotal }} USD</span>
                </div>

                <div class="barra-jugosa h-3.5">
                  <div
                    class="barra-jugosa-relleno bg-duo-verde"
                    :style="{ width: `${vaca.progresoPorcentaje}%` }"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-[11px] font-bold text-gray-400 pt-1">
                  <span>{{ vaca.casillasPagadas }} de {{ vaca.totalCasillas }} pagos</span>
                  <span class="font-black text-gray-700 dark:text-gray-300">{{ vaca.progresoPorcentaje }}%</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CREAR META -->
    <ModalCrearMeta
      v-if="mostrarModalCrearMeta"
      @cerrar="mostrarModalCrearMeta = false"
      @creada="alCrearMeta"
    />

    <!-- MODAL CREAR VACA -->
    <ModalCrearVaca
      v-if="mostrarModalCrearVaca"
      @cerrar="mostrarModalCrearVaca = false"
      @creada="alCrearVaca"
    />
  </div>
</template>
