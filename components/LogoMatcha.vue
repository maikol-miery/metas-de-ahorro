<script setup lang="ts">
defineProps<{
  tamano?: 'sm' | 'md' | 'lg' | 'xl'
  variante?: 'verde' | 'oscuro' | 'crema'
}>()
</script>

<template>
  <div
    class="inline-flex items-center justify-center font-black select-none transition-transform"
    :class="[
      // Tamaños
      tamano === 'sm' ? 'w-8 h-8 rounded-xl text-sm border-2 border-b-[3px]' :
      tamano === 'lg' ? 'w-16 h-16 rounded-3xl text-3xl border-2 border-b-[6px]' :
      tamano === 'xl' ? 'w-20 h-20 rounded-3xl text-4xl border-2 border-b-[6px]' :
      'w-10 h-10 rounded-2xl text-xl border-2 border-b-4', // md por defecto

      // Variantes de color
      variante === 'oscuro'
        ? 'bg-matcha-oscuro text-matcha-menta border-matcha-verde-sombra'
        : variante === 'crema'
        ? 'bg-matcha-crema text-matcha-oscuro border-matcha-menta-sombra'
        : 'bg-matcha-verde text-matcha-oscuro border-matcha-verde-sombra'
    ]"
    style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;"
  >
    <span class="tracking-tighter transform -translate-y-[1px] font-black">[m]</span>
  </div>
</template>
