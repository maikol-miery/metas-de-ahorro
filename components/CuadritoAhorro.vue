<script setup lang="ts">
import type { CeldaInfo } from '~/stores/usarTiendaAhorro'

const props = defineProps<{
  celda: CeldaInfo
  deshabilitado?: boolean
}>()

const emit = defineEmits<{
  (e: 'clickCelda', celda: CeldaInfo): void
}>()

function alHacerClick() {
  if (props.deshabilitado) return
  emit('clickCelda', props.celda)
}
</script>

<template>
  <button
    type="button"
    @click="alHacerClick"
    :disabled="deshabilitado"
    :class="[
      'relative flex flex-col items-center justify-center p-3 h-20 rounded-2xl border-2 transition-all duration-75 select-none w-full',
      celda.estaTachada
        ? 'bg-duo-verde border-duo-verde-sombra border-b-[5px] text-white active:border-b-2 active:translate-y-1 shadow-sm'
        : 'bg-white dark:bg-duo-oscuro-tarjeta border-duo-claro-borde dark:border-duo-oscuro-borde border-b-[5px] text-gray-800 dark:text-gray-100 hover:border-duo-verde hover:dark:border-duo-verde active:border-b-2 active:translate-y-1 shadow-sm'
    ]"
  >
    <!-- Badge superior si está tachada con checkmark -->
    <div
      v-if="celda.estaTachada"
      class="absolute -top-2.5 -right-2 bg-white text-duo-verde w-6 h-6 rounded-full border-2 border-duo-verde-sombra flex items-center justify-center font-black text-xs shadow-md"
    >
      ✓
    </div>

    <!-- Monto en Dólares -->
    <span
      :class="[
        'text-lg sm:text-xl font-black tracking-tight',
        celda.estaTachada ? 'line-through decoration-white/70 decoration-2' : ''
      ]"
    >
      ${{ celda.monto }}
    </span>

    <!-- Indicador de quién lo tachó -->
    <div v-if="celda.estaTachada && celda.tachadaPor" class="flex items-center gap-1 mt-0.5">
      <span
        class="w-3.5 h-3.5 rounded-full border border-white text-[9px] font-black flex items-center justify-center text-white"
        :style="{ backgroundColor: celda.tachadaPor.colorAvatar }"
      >
        {{ celda.tachadaPor.nombre.charAt(0).toUpperCase() }}
      </span>
      <span class="text-[10px] font-extrabold text-white/90 truncate max-w-[55px]">
        {{ celda.tachadaPor.nombre }}
      </span>
    </div>
    <div v-else class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">
      Guardar
    </div>
  </button>
</template>
