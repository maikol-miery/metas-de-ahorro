<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usarTiendaAhorro } from '~/stores/usarTiendaAhorro'

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'creada', id: number): void
}>()

const tienda = usarTiendaAhorro()

const pasoActual = ref<1 | 2 | 3>(1)
const errorFormulario = ref<string | null>(null)
const guardando = ref(false)

// Campos del evento
const titulo = ref('')
const descripcion = ref('')
const fechaEvento = ref('')
const pagosPorPersona = ref(2) // 2 cuotas por defecto

interface RubroItemForm {
  concepto: string
  monto: number | null
  icono: string
}

const rubros = ref<RubroItemForm[]>([
  { concepto: 'Carne y chorizos', monto: 50, icono: '🥩' },
  { concepto: 'Carbón, hielo y salsas', monto: 20, icono: '🧊' },
  { concepto: 'Refrescos y bebidas', monto: 30, icono: '🥤' }
])

interface ParticipanteItemForm {
  nombreParticipante: string
  nombreUsuario?: string | null
  correo?: string | null
  usuarioId?: number | null
  colorAvatar: string
  esReceptorPago: boolean
  esCreador?: boolean
}

// Por defecto el primer participante es el Creador (usuario actual)
const creadorNombre = tienda.usuario?.nombre || 'Yo (Organizador)'
const creadorUsuario = tienda.usuario?.nombreUsuario || null
const creadorCorreo = tienda.usuario?.correo || null
const creadorColor = tienda.usuario?.colorAvatar || '#58CC02'

const participantes = ref<ParticipanteItemForm[]>([
  {
    nombreParticipante: creadorNombre,
    nombreUsuario: creadorUsuario,
    correo: creadorCorreo,
    usuarioId: tienda.usuario?.id || null,
    colorAvatar: creadorColor,
    esReceptorPago: true,
    esCreador: true
  }
])

// Por defecto el Tesorero es el creador de la vaca
const receptorPagoNombre = ref(creadorNombre)
const datosPagoMovil = ref('Banesco (0134)\n0414-1234567\nV-20123456\nPago Móvil a nombre de ' + creadorNombre)

// Búsqueda y agregado de amigos por Correo o @Usuario
const textoBusquedaAmigo = ref('')
const sugerenciasUsuarios = ref<Array<{ id: number; nombre: string; nombreUsuario: string | null; correo: string; colorAvatar: string }>>([])
const buscandoUsuarios = ref(false)

const coloresPredefinidos = ['#58CC02', '#1CB0F6', '#FFC800', '#FF9600', '#CE82FF', '#FF64AC', '#20B2AA']

// Monitorear búsqueda de amigos con debounce simple
let temporizadorBusqueda: any = null
watch(textoBusquedaAmigo, (nuevoTexto) => {
  clearTimeout(temporizadorBusqueda)
  if (!nuevoTexto || nuevoTexto.trim().length < 1) {
    sugerenciasUsuarios.value = []
    return
  }
  temporizadorBusqueda = setTimeout(async () => {
    buscandoUsuarios.value = true
    try {
      const res = await tienda.buscarUsuarios(nuevoTexto)
      // Filtrar los que ya están en la lista
      sugerenciasUsuarios.value = res.filter(
        (u) => !participantes.value.some((p) => p.usuarioId === u.id || (p.correo && p.correo === u.correo))
      )
    } finally {
      buscandoUsuarios.value = false
    }
  }, 250)
})

function agregarAmigoDesdeSugerencia(u: { id: number; nombre: string; nombreUsuario: string | null; correo: string; colorAvatar: string }) {
  participantes.value.push({
    nombreParticipante: u.nombre,
    nombreUsuario: u.nombreUsuario,
    correo: u.correo,
    usuarioId: u.id,
    colorAvatar: u.colorAvatar || coloresPredefinidos[participantes.value.length % coloresPredefinidos.length],
    esReceptorPago: false
  })
  textoBusquedaAmigo.value = ''
  sugerenciasUsuarios.value = []
}

function agregarAmigoManual() {
  const texto = textoBusquedaAmigo.value.trim()
  if (!texto) return

  const esCorreo = texto.includes('@') && texto.includes('.')
  const esUsuario = texto.startsWith('@') || (!texto.includes(' ') && !esCorreo)
  const nombreLimpio = esUsuario ? texto.replace(/^@/, '') : texto

  participantes.value.push({
    nombreParticipante: nombreLimpio,
    nombreUsuario: esUsuario ? nombreLimpio.toLowerCase() : null,
    correo: esCorreo ? texto.toLowerCase() : null,
    usuarioId: null,
    colorAvatar: coloresPredefinidos[participantes.value.length % coloresPredefinidos.length],
    esReceptorPago: false
  })

  textoBusquedaAmigo.value = ''
  sugerenciasUsuarios.value = []
}

// Cálculos dinámicos
const montoTotalCalculado = computed(() => {
  return Math.round(
    rubros.value.reduce((acc, r) => acc + (Number(r.monto) || 0), 0) * 100
  ) / 100
})

const montoPorPersonaCalculado = computed(() => {
  const cantidad = participantes.value.length
  if (cantidad === 0) return 0
  return Math.round((montoTotalCalculado.value / cantidad) * 100) / 100
})

const montoPorCasillaCalculado = computed(() => {
  const cuotas = pagosPorPersona.value || 1
  return Math.round((montoPorPersonaCalculado.value / cuotas) * 100) / 100
})

function agregarRubro() {
  rubros.value.push({ concepto: '', monto: null, icono: '🛒' })
}

function eliminarRubro(index: number) {
  if (rubros.value.length > 1) {
    rubros.value.splice(index, 1)
  }
}

function eliminarParticipante(index: number) {
  const p = participantes.value[index]
  if (p.esCreador) return // No eliminar al creador

  participantes.value.splice(index, 1)

  // Si eliminó al tesorero, regresar al creador por defecto
  if (p.nombreParticipante === receptorPagoNombre.value) {
    seleccionarReceptor(creadorNombre)
  }
}

function seleccionarReceptor(nombre: string) {
  receptorPagoNombre.value = nombre
  participantes.value.forEach((p) => {
    p.esReceptorPago = p.nombreParticipante === nombre
  })
}

/**
 * Plantilla rápida para cargar el ejemplo de la Parrilla ($100 entre amigos)
 */
function cargarEjemploParrilla() {
  titulo.value = 'Parrilla del Sábado 🥩'
  descripcion.value = 'Vaca para comprar carne, chorizos, carbón y bebidas.'

  const hoy = new Date()
  const sabado = new Date(hoy)
  sabado.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7))
  fechaEvento.value = sabado.toISOString().split('T')[0]

  rubros.value = [
    { concepto: 'Carne de primera y chorizos', monto: 55, icono: '🥩' },
    { concepto: 'Carbón, hielo y yuca', monto: 15, icono: '🧊' },
    { concepto: 'Bebidas, refrescos y vasos', monto: 30, icono: '🥤' }
  ]

  participantes.value = [
    {
      nombreParticipante: creadorNombre,
      nombreUsuario: creadorUsuario,
      correo: creadorCorreo,
      usuarioId: tienda.usuario?.id || null,
      colorAvatar: creadorColor,
      esReceptorPago: true,
      esCreador: true
    },
    { nombreParticipante: 'Carlos M.', nombreUsuario: 'carlos_m', correo: 'carlos@amigos.com', colorAvatar: '#1CB0F6', esReceptorPago: false },
    { nombreParticipante: 'Sofía R.', nombreUsuario: 'sofia_r', correo: 'sofia@amigos.com', colorAvatar: '#FFC800', esReceptorPago: false },
    { nombreParticipante: 'Miguel D.', nombreUsuario: 'miguel_d', correo: 'miguel@amigos.com', colorAvatar: '#FF9600', esReceptorPago: false },
    { nombreParticipante: 'Elena P.', nombreUsuario: 'elena_p', correo: 'elena@amigos.com', colorAvatar: '#CE82FF', esReceptorPago: false }
  ]

  seleccionarReceptor(creadorNombre)
  datosPagoMovil.value = 'Banesco (0134)\n0414-9876543\nV-24567890\nTitular: ' + creadorNombre
  pagosPorPersona.value = 2
}

async function guardarVaca() {
  errorFormulario.value = null

  if (!titulo.value.trim()) {
    errorFormulario.value = 'Ingresa el nombre del evento'
    pasoActual.value = 1
    return
  }

  if (montoTotalCalculado.value <= 0) {
    errorFormulario.value = 'El presupuesto total debe ser mayor a $0'
    pasoActual.value = 1
    return
  }

  if (participantes.value.length < 1) {
    errorFormulario.value = 'Debe haber al menos un participante'
    pasoActual.value = 2
    return
  }

  guardando.value = true
  try {
    const res = await tienda.crearVaca({
      titulo: titulo.value.trim(),
      descripcion: descripcion.value.trim() || undefined,
      fechaEvento: fechaEvento.value || null,
      pagosPorPersona: Number(pagosPorPersona.value),
      receptorPagoNombre: receptorPagoNombre.value.trim(),
      datosPagoMovil: datosPagoMovil.value.trim() || undefined,
      rubros: rubros.value.map((r, i) => ({
        concepto: r.concepto.trim() || `Rubro ${i + 1}`,
        monto: Number(r.monto),
        icono: r.icono || '🥩'
      })),
      participantes: participantes.value.map((p) => ({
        nombreParticipante: p.nombreParticipante.trim(),
        nombreUsuario: p.nombreUsuario || undefined,
        correo: p.correo || undefined,
        colorAvatar: p.colorAvatar,
        usuarioId: p.usuarioId || undefined,
        esReceptorPago: p.nombreParticipante.trim() === receptorPagoNombre.value.trim()
      }))
    })

    emit('creada', res.id)
  } catch (err: any) {
    errorFormulario.value = err.data?.statusMessage || err.message || 'Error al crear La Vaca'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
    <div class="relative w-full max-w-xl tarjeta-duo p-6 max-h-[92vh] overflow-y-auto my-6">
      <!-- Botón Cerrar -->
      <button
        type="button"
        @click="emit('cerrar')"
        class="absolute top-4 right-4 w-9 h-9 rounded-xl bg-gray-100 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde border-b-4 active:border-b-2 active:translate-y-1 font-black text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center"
      >
        ✕
      </button>

      <!-- Cabecera -->
      <div class="mb-4">
        <div class="flex items-center gap-2">
          <span class="text-3xl">🥩</span>
          <div>
            <h2 class="text-2xl font-black text-gray-900 dark:text-white">
              Armar La Vaca / Evento
            </h2>
            <p class="text-xs font-bold text-gray-400">
              Recaudación grupal equitativa con tesorero y división en cuotas
            </p>
          </div>
        </div>
      </div>

      <!-- BOTÓN PLANTILLA RÁPIDA: EJEMPLO PARRILLA -->
      <div class="mb-5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-duo-amarillo-sombra border-b-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚡</span>
            <div>
              <p class="text-xs font-black text-amber-900 dark:text-amber-300">
                ¿Vas a hacer una parrilla?
              </p>
              <p class="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Pre-llena: Parrilla ($100 entre amigos, 2 cuotas)
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="cargarEjemploParrilla"
            class="boton-duo-amarillo px-3 py-1.5 text-xs text-amber-950 whitespace-nowrap"
          >
            Cargar Parrilla
          </button>
        </div>
      </div>

      <!-- Pasos (Indicador Duolingo) -->
      <div class="grid grid-cols-3 gap-2 mb-5">
        <button
          type="button"
          @click="pasoActual = 1"
          :class="[
            'py-2 px-1 text-center rounded-xl border-2 font-black text-xs transition-all',
            pasoActual === 1 ? 'bg-duo-verde text-white border-duo-verde-sombra border-b-4' : 'bg-gray-100 dark:bg-duo-oscuro-fondo text-gray-400 border-transparent'
          ]"
        >
          1. Presupuesto
        </button>
        <button
          type="button"
          @click="pasoActual = 2"
          :class="[
            'py-2 px-1 text-center rounded-xl border-2 font-black text-xs transition-all',
            pasoActual === 2 ? 'bg-duo-verde text-white border-duo-verde-sombra border-b-4' : 'bg-gray-100 dark:bg-duo-oscuro-fondo text-gray-400 border-transparent'
          ]"
        >
          2. Tesorero & Amigos
        </button>
        <button
          type="button"
          @click="pasoActual = 3"
          :class="[
            'py-2 px-1 text-center rounded-xl border-2 font-black text-xs transition-all',
            pasoActual === 3 ? 'bg-duo-verde text-white border-duo-verde-sombra border-b-4' : 'bg-gray-100 dark:bg-duo-oscuro-fondo text-gray-400 border-transparent'
          ]"
        >
          3. Cuotas & Resumen
        </button>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorFormulario" class="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-black">
        ⚠️ {{ errorFormulario }}
      </div>

      <form @submit.prevent="guardarVaca" class="space-y-4">
        <!-- PASO 1: DETALLES & RUBROS -->
        <div v-if="pasoActual === 1" class="space-y-4">
          <div>
            <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
              Nombre del Evento *
            </label>
            <input
              v-model="titulo"
              type="text"
              required
              placeholder="Ej. Parrilla del Sábado 🥩, Cumpleaños de Sofía 🎉"
              class="w-full px-4 py-2.5 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
                Fecha del Evento (Opcional)
              </label>
              <input
                v-model="fechaEvento"
                type="date"
                class="w-full px-4 py-2.5 rounded-2xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
              />
            </div>
            <div>
              <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
                Presupuesto Total Estimado
              </label>
              <div class="px-4 py-2.5 rounded-2xl border-2 border-duo-verde/40 bg-emerald-50 dark:bg-emerald-950/20 font-black text-xl text-duo-verde flex items-center justify-between">
                <span>Total:</span>
                <span>${{ montoTotalCalculado }} USD</span>
              </div>
            </div>
          </div>

          <!-- Lista de Rubros / Compras -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-black uppercase text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <span>🛒</span> Rubros y Gastos Presupuestados *
              </label>
              <button
                type="button"
                @click="agregarRubro"
                class="text-xs font-black text-duo-verde hover:underline"
              >
                + Añadir Rubro
              </button>
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div
                v-for="(r, i) in rubros"
                :key="i"
                class="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-duo-oscuro-fondo border border-duo-claro-borde dark:border-duo-oscuro-borde"
              >
                <input
                  v-model="r.icono"
                  type="text"
                  class="w-9 h-9 text-center text-lg rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-duo-oscuro-tarjeta"
                  title="Emoji del gasto"
                />
                <input
                  v-model="r.concepto"
                  type="text"
                  required
                  placeholder="Ej. Carne de res y chorizos"
                  class="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-duo-oscuro-tarjeta text-xs font-bold text-gray-900 dark:text-white"
                />
                <div class="relative w-24">
                  <span class="absolute left-2 top-1.5 text-xs font-bold text-gray-400">$</span>
                  <input
                    v-model.number="r.monto"
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="50"
                    class="w-full pl-5 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-duo-oscuro-tarjeta text-xs font-black text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  v-if="rubros.length > 1"
                  type="button"
                  @click="eliminarRubro(i)"
                  class="text-red-500 font-bold px-1.5"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div class="pt-2">
            <button
              type="button"
              @click="pasoActual = 2"
              class="w-full py-3 boton-duo-verde text-sm font-black flex items-center justify-center gap-2"
            >
              <span>Siguiente: Tesorero y Amigos</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- PASO 2: TESORERO & AMIGOS -->
        <div v-else-if="pasoActual === 2" class="space-y-4">
          <!-- SELECCIÓN DEL TESORERO (POR DEFECTO EL CREADOR) -->
          <div class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-2 border-duo-azul-sombra border-b-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">👑</span>
                <div>
                  <p class="text-xs font-black text-duo-azul uppercase tracking-wider">
                    Tesorero de la Vaca (Receptor del Dinero)
                  </p>
                  <p class="text-[11px] font-bold text-gray-500">
                    <strong class="text-gray-900 dark:text-white">Por defecto eres tú</strong> (puedes cambiarlo si alguien más recibirá los fondos)
                  </p>
                </div>
              </div>
            </div>

            <select
              v-model="receptorPagoNombre"
              @change="seleccionarReceptor(receptorPagoNombre)"
              class="w-full px-3.5 py-2.5 rounded-xl border-2 border-duo-azul bg-white dark:bg-duo-oscuro-tarjeta font-black text-sm text-gray-900 dark:text-white focus:outline-none"
            >
              <option
                v-for="p in participantes"
                :key="p.nombreParticipante"
                :value="p.nombreParticipante"
              >
                {{ p.nombreParticipante }} {{ p.esCreador ? '(Tú - Creador)' : '' }} {{ p.nombreParticipante === receptorPagoNombre ? '★ Tesorero' : '' }}
              </option>
            </select>

            <!-- Datos de Pago Móvil del Tesorero -->
            <div class="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900">
              <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-between">
                <span>Datos de Pago Móvil para los Amigos (Banco, CI, Teléfono)</span>
                <span class="text-[10px] text-gray-400">Podrán copiarlos en 1 toque</span>
              </label>
              <textarea
                v-model="datosPagoMovil"
                rows="2"
                placeholder="Banesco (0134) - 0414-1234567 - V-20123456"
                class="w-full px-3 py-2 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-white dark:bg-duo-oscuro-fondo font-mono text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-azul"
              ></textarea>
            </div>
          </div>

          <!-- AÑADIR AMIGOS POR CORREO O @USUARIO -->
          <div>
            <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-between">
              <span>Añadir Amigos a la Vaca</span>
              <span class="text-[10px] text-duo-azul font-bold">Por correo o @usuario</span>
            </label>

            <!-- Input con buscador y botón -->
            <div class="relative">
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute left-3.5 top-2.5 text-gray-400 font-black">🔍</span>
                  <input
                    v-model="textoBusquedaAmigo"
                    type="text"
                    placeholder="Escribe correo (ej. sofia@gmail.com) o @usuario..."
                    @keydown.enter.prevent="agregarAmigoManual"
                    class="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-duo-claro-borde dark:border-duo-oscuro-borde bg-gray-50 dark:bg-duo-oscuro-fondo text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-duo-verde"
                  />
                </div>
                <button
                  type="button"
                  @click="agregarAmigoManual"
                  class="boton-duo-verde px-3.5 py-2 text-xs whitespace-nowrap"
                >
                  + Añadir
                </button>
              </div>

              <!-- Menú flotante de sugerencias de amigos registrados -->
              <div
                v-if="sugerenciasUsuarios.length > 0"
                class="absolute left-0 right-0 top-12 z-20 bg-white dark:bg-duo-oscuro-tarjeta border-2 border-duo-verde rounded-2xl shadow-xl overflow-hidden p-1 space-y-1"
              >
                <div class="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Usuarios Registrados Encontrados
                </div>
                <button
                  v-for="u in sugerenciasUsuarios"
                  :key="u.id"
                  type="button"
                  @click="agregarAmigoDesdeSugerencia(u)"
                  class="w-full p-2 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-duo-oscuro-fondo text-left transition-colors"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center text-white font-black text-xs"
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
                  <span class="text-xs font-black text-duo-verde">+ Elegir</span>
                </button>
              </div>
            </div>

            <p class="text-[11px] font-bold text-gray-400 mt-1">
              Si tu amigo aún no tiene cuenta, ¡no hay problema! Agrégalo por correo o nombre y se vinculará cuando cree su cuenta.
            </p>
          </div>

          <!-- LISTA DE PARTICIPANTES ACTUALES -->
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            <div
              v-for="(p, i) in participantes"
              :key="i"
              class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-9 h-9 rounded-full border border-black/20 flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                  :style="{ backgroundColor: p.colorAvatar }"
                >
                  {{ p.nombreParticipante.charAt(0).toUpperCase() || '?' }}
                </div>
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-black text-gray-900 dark:text-white">
                      {{ p.nombreParticipante }}
                    </span>
                    <span
                      v-if="p.esCreador"
                      class="px-1.5 py-0.2 rounded-full bg-duo-verde/20 text-duo-verde text-[9px] font-black"
                    >
                      Tú (Creador)
                    </span>
                    <span
                      v-if="p.nombreParticipante === receptorPagoNombre"
                      class="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-duo-azul text-[9px] font-black"
                    >
                      ★ Tesorero
                    </span>
                  </div>
                  <span v-if="p.nombreUsuario || p.correo" class="text-[10px] font-mono text-gray-400 block">
                    {{ p.nombreUsuario ? `@${p.nombreUsuario}` : p.correo }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  v-if="p.nombreParticipante !== receptorPagoNombre"
                  type="button"
                  @click="seleccionarReceptor(p.nombreParticipante)"
                  class="px-2 py-1 rounded-lg text-[10px] font-black border border-duo-azul text-duo-azul hover:bg-duo-azul hover:text-white transition-all"
                  title="Designar como tesorero de la vaca"
                >
                  Hacer Tesorero
                </button>
                <button
                  v-if="!p.esCreador"
                  type="button"
                  @click="eliminarParticipante(i)"
                  class="text-red-500 font-bold px-1.5 hover:bg-red-50 rounded"
                  title="Eliminar de la vaca"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="pasoActual = 1"
              class="boton-duo-blanco py-3 px-4 text-xs font-black"
            >
              ← Volver
            </button>
            <button
              type="button"
              @click="pasoActual = 3"
              class="boton-duo-verde flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5"
            >
              <span>Siguiente: Configurar Cuotas</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- PASO 3: CUOTAS & RESUMEN EQUITATIVO -->
        <div v-else class="space-y-4">
          <div>
            <label class="block text-xs font-black uppercase text-gray-600 dark:text-gray-400 mb-1">
              ¿En cuántas cuotas/pagos dividimos a cada persona?
            </label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cuota in [1, 2, 3, 4]"
                :key="cuota"
                type="button"
                @click="pagosPorPersona = cuota"
                :class="[
                  'py-2.5 rounded-xl border-2 font-black text-xs transition-all',
                  pagosPorPersona === cuota
                    ? 'boton-duo-verde'
                    : 'boton-duo-blanco text-gray-600 dark:text-gray-300'
                ]"
              >
                {{ cuota }} {{ cuota === 1 ? 'Pago' : 'Cuotas' }}
              </button>
            </div>
          </div>

          <!-- RESUMEN FINAL 3D DE LA VACA -->
          <div class="p-4 rounded-2xl bg-gray-50 dark:bg-duo-oscuro-fondo border-2 border-duo-claro-borde dark:border-duo-oscuro-borde space-y-2.5">
            <div class="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>Presupuesto Total del Evento:</span>
              <span class="font-black text-sm text-gray-900 dark:text-white">${{ montoTotalCalculado }} USD</span>
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>Participantes:</span>
              <span class="font-black text-sm text-gray-900 dark:text-white">{{ participantes.length }} personas</span>
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>Le toca a cada uno:</span>
              <span class="font-black text-sm text-duo-verde">${{ montoPorPersonaCalculado }} USD</span>
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
              <span>Cada cuadrito / cuota es de:</span>
              <span class="font-black text-base text-duo-naranja">${{ montoPorCasillaCalculado }} USD</span>
            </div>
            <div class="flex items-center justify-between text-[11px] font-bold text-gray-400">
              <span>Tesorero Receptor:</span>
              <span class="font-black text-duo-azul">{{ receptorPagoNombre }} {{ receptorPagoNombre === creadorNombre ? '(Tú)' : '' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="pasoActual = 2"
              class="boton-duo-blanco py-3 px-4 text-xs font-black"
            >
              ← Volver
            </button>
            <button
              type="submit"
              :disabled="guardando"
              class="boton-duo-verde flex-1 py-3 text-sm font-black flex items-center justify-center gap-2"
            >
              <span v-if="guardando" class="animate-spin">⏳</span>
              <span>{{ guardando ? 'Creando La Vaca...' : '¡LANZAR LA VACA! 🥩' }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
