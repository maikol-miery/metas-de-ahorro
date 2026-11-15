<script setup lang="ts">
import { computed } from 'vue'
import type { SubMetaInfo } from '~/stores/usarTiendaAhorro'

const props = defineProps<{
  submetas: SubMetaInfo[]
  totalAhorrado: number
}>()

interface EstadoSubMeta {
  submeta: SubMetaInfo
  montoAsignado: number
  porcentaje: number
  estado: 'completada' | 'en_progreso' | 'bloqueada'
}

const submetasCalculadas = computed<EstadoSubMeta[]>(() => {
  let acumuladorRestante = props.totalAhorrado
  const resultado: EstadoSubMeta[] = []

  const listaOrdenada = [...props.submetas].sort((a, b) => a.orden - b.orden)

  for (let i = 0; i < listaOrdenada.length; i++) {
    const sm = listaOrdenada[i]
    const montoMeta = sm.montoObjetivo
    const montoAsignado = Math.min(acumuladorRestante, montoMeta)
    acumuladorRestante = Math.max(0, acumuladorRestante - montoAsignado)

    const porcentaje = montoMeta > 0 ? Math.min(100, Math.round((montoAsignado / montoMeta) * 100)) : 0

    let estado: 'completada' | 'en_progreso' | 'bloqueada'

    if (porcentaje >= 100) {
      estado = 'completada'
    } else if (montoAsignado > 0 || i === 0 || (resultado[i - 1] && resultado[i - 1].estado === 'completada')) {
      estado = 'en_progreso'
    } else {
      estado = 'bloqueada'
    }

    resultado.push({
      submeta: sm,
      montoAsignado,
      porcentaje,
      estado
    })
  }

  return resultado
})
</script>

<template>
  <div class="py-6 px-4">
    <div class="text-center mb-8">
      <h3 class="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
        El Camino de Hitos 🗺️
      </h3>
      <p class="text-sm font-bold text-gray-500 dark:text-duo-oscuro-muted mt-1">
        Cada dólar que ahorras desbloquea tus metas paso a paso como en Duolingo.
      </p>
    </div>

    <!-- Contenedor del camino vertical -->
    <div class="relative max-w-md mx-auto">
      <!-- Línea conectora de fondo -->
      <div class="absolute left-8 sm:left-10 top-8 bottom-8 w-1.5 bg-gray-200 dark:bg-duo-oscuro-borde rounded-full"></div>

      <div class="space-y-8 relative">
        <div
          v-for="(item, indice) in submetasCalculadas"
          :key="item.submeta.id"
          class="flex items-start gap-4 sm:gap-6 group"
        >
          <!-- Nodo circular del camino con efecto 3D -->
          <div class="relative z-10 flex-shrink-0">
            <!-- Halo animado si está en progreso -->
            <div
              v-if="item.estado === 'en_progreso'"
              class="absolute -inset-2 rounded-full bg-duo-amarillo/30 dark:bg-duo-amarillo/20 animate-ping opacity-75"
            ></div>

            <div
              :class="[
                'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 flex flex-col items-center justify-center text-2xl sm:text-3xl shadow-md transition-all duration-300 select-none',
                item.estado === 'completada'
                  ? 'bg-duo-verde border-duo-verde-sombra border-b-[6px] text-white'
                  : item.estado === 'en_progreso'
                  ? 'bg-duo-amarillo border-duo-amarillo-sombra border-b-[6px] text-gray-900 scale-105'
                  : 'bg-gray-100 dark:bg-duo-oscuro-tarjeta border-gray-300 dark:border-duo-oscuro-borde border-b-[6px] text-gray-400 dark:text-gray-600 grayscale'
              ]"
            >
              <span>{{ item.submeta.icono || '🎯' }}</span>
              <span
                v-if="item.estado === 'completada'"
                class="text-[10px] font-black uppercase tracking-wider text-white"
              >
                ¡Listo!
              </span>
              <span
                v-else-if="item.estado === 'en_progreso'"
                class="text-[10px] font-black uppercase tracking-wider text-amber-950"
              >
                {{ item.porcentaje }}%
              </span>
              <span
                v-else
                class="text-xs"
              >
                🔒
              </span>
            </div>
          </div>

          <!-- Tarjeta de información de la etapa 3D -->
          <div
            :class="[
              'flex-1 p-4 rounded-2xl border-2 transition-all',
              item.estado === 'completada'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-duo-verde/40 border-b-4'
                : item.estado === 'en_progreso'
                ? 'bg-amber-50 dark:bg-amber-950/20 border-duo-amarillo-sombra border-b-4 shadow-sm'
                : 'bg-white dark:bg-duo-oscuro-tarjeta border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 opacity-70'
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Hito {{ indice + 1 }}
              </span>
              <span
                :class="[
                  'text-xs font-black px-2.5 py-0.5 rounded-full',
                  item.estado === 'completada'
                    ? 'bg-duo-verde text-white'
                    : item.estado === 'en_progreso'
                    ? 'bg-duo-amarillo text-gray-900'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                ]"
              >
                {{ item.estado === 'completada' ? '¡Desbloqueado!' : item.estado === 'en_progreso' ? 'En Progreso' : 'Bloqueado' }}
              </span>
            </div>

            <h4 class="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              {{ item.submeta.titulo }}
            </h4>

            <div class="flex items-baseline justify-between mt-1 text-sm font-extrabold text-gray-700 dark:text-gray-300">
              <span>Ahorrado: ${{ item.montoAsignado }}</span>
              <span class="text-gray-400 dark:text-gray-500 font-bold">Meta: ${{ item.submeta.montoObjetivo }}</span>
            </div>

            <!-- Barra jugosa de progreso -->
            <div class="barra-jugosa h-4 mt-2">
              <div
                class="barra-jugosa-relleno"
                :class="item.estado === 'completada' ? 'bg-duo-verde' : 'bg-duo-amarillo'"
                :style="{ width: `${item.porcentaje}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
