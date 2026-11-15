import { defineStore } from 'pinia'
import confetti from 'canvas-confetti'

export interface UsuarioInfo {
  id: number
  nombre: string
  nombreUsuario?: string | null
  correo: string
  colorAvatar: string
  rachaQuincenas: number
}

export interface MiembroInfo {
  id: number
  nombre: string
  correo?: string
  colorAvatar: string
  rol: 'creador' | 'colaborador'
}

export interface SubMetaInfo {
  id: number
  metaId: number
  titulo: string
  montoObjetivo: number
  orden: number
  icono: string
}

export interface CeldaInfo {
  id: number
  metaId: number
  monto: number
  estaTachada: boolean
  tachadaPorUsuarioId: number | null
  fechaTachado: string | null
  tachadaPor?: {
    id: number
    nombre: string
    colorAvatar: string
  } | null
}

export interface HistorialInfo {
  id: number
  metaId: number
  usuarioId: number
  celdaId: number | null
  monto: number
  tipo: 'cuadrito_tachado' | 'cuadrito_desmarcado' | 'abono_libre'
  nota: string | null
  fechaAbono: string
  usuario?: {
    id: number
    nombre: string
    colorAvatar: string
  }
}

export interface MetaResumen {
  id: number
  titulo: string
  descripcion: string | null
  montoObjetivo: number
  topeMaximoCelda: number
  esCompartida: boolean
  creadorId: number
  estado: 'activa' | 'completada'
  totalAhorrado: number
  progresoPorcentaje: number
  totalCeldas: number
  celdasTachadas: number
  miembros: MiembroInfo[]
  createdAt: string
}

export interface MetaDetalle extends MetaResumen {
  montoFaltante: number
  celdas: CeldaInfo[]
  submetas: SubMetaInfo[]
  historial: HistorialInfo[]
}

// ==========================================
// INTERFACES MÓDULO EVENTOS / LA VACA
// ==========================================

export interface RubroInfo {
  id: number
  concepto: string
  monto: number
  icono: string
  orden: number
  montoCubierto?: number
  porcentajeCubierto?: number
  estaCubierto?: boolean
}

export interface CasillaVacaInfo {
  id: number
  vacaId: number
  participanteId: number
  numeroCuota: number
  monto: number
  estaPagada: boolean
  estadoVerificacion: 'pendiente' | 'en_revision' | 'verificado' | 'rechazado'
  metodoPago: 'comprobante' | 'efectivo' | null
  comprobanteUrl: string | null
  referenciaPago: string | null
  notaPago: string | null
  fechaPago: string | null
  updatedAt?: string
  participante?: {
    id: number
    nombreParticipante: string
    colorAvatar: string
  }
}

export interface ParticipanteInfo {
  id: number
  vacaId: number
  usuarioId: number | null
  nombreParticipante: string
  nombreUsuario?: string | null
  correo?: string | null
  colorAvatar: string
  montoAsignado: number
  esReceptorPago: boolean
  casillas?: CasillaVacaInfo[]
}

export interface RitmoParticipante {
  id: number
  nombre: string
  colorAvatar: string
  montoAsignado: number
  montoAbonado: number
  pagadas: number
  totalCasillas: number
  enRevision: number
  porcentaje: number
}

export interface RitmoGrupo {
  alDia: RitmoParticipante[]
  aMitad: RitmoParticipante[]
  rezagados: RitmoParticipante[]
}

export interface VacaResumen {
  id: number
  titulo: string
  descripcion: string | null
  fechaEvento: string | null
  montoTotal: number
  pagosPorPersona: number
  creadorId: number
  receptorPagoNombre: string
  receptorPagoUsuarioId: number | null
  datosPagoMovil: string | null
  estado: 'recaudando' | 'completada'
  totalRecaudado: number
  progresoPorcentaje: number
  totalCasillas: number
  casillasPagadas: number
  casillasPendientesVerificacion: number
  participantesCount: number
  participantes?: ParticipanteInfo[]
  createdAt: string
}

export interface VacaDetalle extends VacaResumen {
  creador?: {
    id: number
    nombre: string
    correo: string
    colorAvatar: string
  }
  esCreador: boolean
  esReceptor: boolean
  puedeAuditar: boolean
  totalPagoMovil: number
  totalEfectivo: number
  totalEnRevision: number
  montoFaltante: number
  rubros: RubroInfo[]
  casillas: CasillaVacaInfo[]
  historialPagos: CasillaVacaInfo[]
  ritmo: RitmoGrupo
}

export const usarTiendaAhorro = defineStore('ahorro', {
  state: () => ({
    usuario: null as UsuarioInfo | null,
    metas: [] as MetaResumen[],
    metaActual: null as MetaDetalle | null,
    vacas: [] as VacaResumen[],
    vacaActual: null as VacaDetalle | null,
    estaCargando: false,
    mensajeError: null as string | null
  }),

  getters: {
    estaAutenticado: (state) => !!state.usuario,
    ahorroTotalGlobal: (state) => {
      return state.metas.reduce((acum, meta) => acum + (meta.totalAhorrado || 0), 0)
    },
    recaudacionTotalVacas: (state) => {
      return state.vacas.reduce((acum, vaca) => acum + (vaca.totalRecaudado || 0), 0)
    }
  },

  actions: {
    lanzarConfeti(esVictoriaMayor = false) {
      if (typeof window === 'undefined') return
      try {
        if (esVictoriaMayor) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#58CC02', '#FFC800', '#1CB0F6', '#FF9600']
          })
        } else {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#58CC02', '#FFC800', '#FFFFFF']
          })
        }
      } catch {
        // En caso de que no haya canvas disponible
      }
    },

    async cargarPerfil() {
      try {
        const respuesta = await $fetch<{ usuario: UsuarioInfo }>('/api/auth/perfil')
        this.usuario = respuesta.usuario
        return this.usuario
      } catch {
        this.usuario = null
        return null
      }
    },

    async iniciarSesion(identificadorOCorreo: string, clave: string) {
      this.estaCargando = true
      this.mensajeError = null
      try {
        const respuesta = await $fetch<{ mensaje: string; usuario: UsuarioInfo }>('/api/auth/login', {
          method: 'POST',
          body: { identificador: identificadorOCorreo, clave }
        })
        this.usuario = respuesta.usuario
        await Promise.all([this.cargarMetas(), this.cargarVacas()])
        return respuesta
      } catch (err: any) {
        this.mensajeError = err.data?.statusMessage || err.message || 'Error al iniciar sesión'
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async registrarse(nombre: string, nombreUsuario: string, correo: string, clave: string, colorAvatar: string) {
      this.estaCargando = true
      this.mensajeError = null
      try {
        const respuesta = await $fetch<{ mensaje: string; usuario: UsuarioInfo }>('/api/auth/registro', {
          method: 'POST',
          body: { nombre, nombreUsuario, correo, clave, colorAvatar }
        })
        this.usuario = respuesta.usuario
        return respuesta
      } catch (err: any) {
        this.mensajeError = err.data?.statusMessage || err.message || 'Error al registrarse'
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async buscarUsuarios(termino: string) {
      if (!termino || termino.trim().length === 0) return []
      try {
        const res = await $fetch<{ usuarios: Array<{ id: number; nombre: string; nombreUsuario: string | null; correo: string; colorAvatar: string }> }>(
          `/api/usuarios/buscar?q=${encodeURIComponent(termino.trim())}`
        )
        return res.usuarios
      } catch {
        return []
      }
    },

    async cerrarSesion() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } finally {
        this.usuario = null
        this.metas = []
        this.metaActual = null
        this.vacas = []
        this.vacaActual = null
      }
    },

    async cargarMetas() {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{ metas: MetaResumen[] }>('/api/metas')
        this.metas = respuesta.metas
      } catch (err: any) {
        console.error('Error al cargar metas:', err)
      } finally {
        this.estaCargando = false
      }
    },

    async cargarMeta(id: number) {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{ meta: MetaDetalle }>(`/api/metas/${id}`)
        this.metaActual = respuesta.meta
        return respuesta.meta
      } catch (err: any) {
        console.error('Error al cargar meta:', err)
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async crearMeta(datos: {
      titulo: string
      descripcion?: string
      montoObjetivo: number
      topeMaximoCelda: number
      esCompartida?: boolean
      submetas?: Array<{ titulo: string; montoObjetivo: number; icono: string }>
    }) {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{ mensaje: string; id: number }>('/api/metas', {
          method: 'POST',
          body: datos
        })
        await this.cargarMetas()
        this.lanzarConfeti(true)
        return respuesta
      } catch (err: any) {
        this.mensajeError = err.data?.statusMessage || err.message || 'Error al crear la meta'
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async tacharCelda(metaId: number, celdaId: number, nota: string = '') {
      if (!this.metaActual || this.metaActual.id !== metaId) return

      const celdaIndex = this.metaActual.celdas.findIndex((c) => c.id === celdaId)
      if (celdaIndex === -1) return

      const celdaOriginal = { ...this.metaActual.celdas[celdaIndex] }
      const estadoAnterior = celdaOriginal.estaTachada
      const monto = celdaOriginal.monto

      // Actualización optimista inmediata
      this.metaActual.celdas[celdaIndex].estaTachada = !estadoAnterior
      if (!estadoAnterior) {
        this.metaActual.celdas[celdaIndex].tachadaPorUsuarioId = this.usuario?.id || null
        this.metaActual.celdas[celdaIndex].tachadaPor = this.usuario
          ? { id: this.usuario.id, nombre: this.usuario.nombre, colorAvatar: this.usuario.colorAvatar }
          : null
        this.metaActual.totalAhorrado += monto
        this.metaActual.montoFaltante = Math.max(0, this.metaActual.montoFaltante - monto)
        this.lanzarConfeti(false)
      } else {
        this.metaActual.celdas[celdaIndex].estaTachada = false
        this.metaActual.celdas[celdaIndex].tachadaPorUsuarioId = null
        this.metaActual.celdas[celdaIndex].tachadaPor = null
        this.metaActual.totalAhorrado = Math.max(0, this.metaActual.totalAhorrado - monto)
        this.metaActual.montoFaltante += monto
      }

      this.metaActual.progresoPorcentaje = Math.min(
        100,
        Math.round((this.metaActual.totalAhorrado / this.metaActual.montoObjetivo) * 100)
      )

      try {
        const respuesta = await $fetch<{
          mensaje: string
          accion: 'tachado' | 'desmarcado'
          celda: CeldaInfo
          rachaQuincenas: number
        }>(`/api/metas/${metaId}/tachar-celda`, {
          method: 'POST',
          body: { celdaId, nota }
        })

        // Sincronizar datos reales devueltos por el servidor
        this.metaActual.celdas[celdaIndex] = {
          ...this.metaActual.celdas[celdaIndex],
          ...respuesta.celda
        }

        if (this.usuario) {
          this.usuario.rachaQuincenas = respuesta.rachaQuincenas
        }

        // Recargar meta completa en segundo plano para sincronizar submetas e historial
        await this.cargarMeta(metaId)
        return respuesta
      } catch (err: any) {
        // Revertir optimismo si falló
        this.metaActual.celdas[celdaIndex] = celdaOriginal
        this.metaActual.totalAhorrado += estadoAnterior ? monto : -monto
        throw err
      }
    },

    async registrarAbonoLibre(metaId: number, monto: number, nota: string = '') {
      try {
        const respuesta = await $fetch<{
          mensaje: string
          abono: HistorialInfo
          rachaQuincenas: number
        }>(`/api/metas/${metaId}/abono-libre`, {
          method: 'POST',
          body: { monto, nota }
        })

        if (this.usuario) {
          this.usuario.rachaQuincenas = respuesta.rachaQuincenas
        }

        this.lanzarConfeti(true)
        await this.cargarMeta(metaId)
        return respuesta
      } catch (err: any) {
        throw err
      }
    },

    async invitarColaborador(metaId: number, correo: string) {
      try {
        const respuesta = await $fetch<{
          mensaje: string
          colaborador: MiembroInfo
        }>(`/api/metas/${metaId}/invitar`, {
          method: 'POST',
          body: { correo }
        })

        if (this.metaActual && this.metaActual.id === metaId) {
          this.metaActual.esCompartida = true
          this.metaActual.miembros.push(respuesta.colaborador)
        }
        return respuesta
      } catch (err: any) {
        throw err
      }
    },

    // ==========================================
    // ACCIONES MÓDULO EVENTOS / LA VACA
    // ==========================================

    async cargarVacas() {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{ vacas: VacaResumen[] }>('/api/vacas')
        this.vacas = respuesta.vacas
        return respuesta.vacas
      } catch (err: any) {
        console.error('Error al cargar vacas:', err)
      } finally {
        this.estaCargando = false
      }
    },

    async cargarVaca(id: number) {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{ vaca: VacaDetalle }>(`/api/vacas/${id}`)
        this.vacaActual = respuesta.vaca
        return respuesta.vaca
      } catch (err: any) {
        console.error('Error al cargar detalle de la vaca:', err)
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async crearVaca(datos: {
      titulo: string
      descripcion?: string
      fechaEvento?: string | null
      pagosPorPersona: number
      receptorPagoNombre: string
      receptorPagoUsuarioId?: number | null
      datosPagoMovil?: string
      rubros: Array<{ concepto: string; monto: number; icono: string }>
      participantes: Array<{
        nombreParticipante: string
        nombreUsuario?: string | null
        correo?: string | null
        colorAvatar?: string
        usuarioId?: number
        esReceptorPago?: boolean
      }>
    }) {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{ mensaje: string; id: number }>('/api/vacas', {
          method: 'POST',
          body: datos
        })
        await this.cargarVacas()
        this.lanzarConfeti(true)
        return respuesta
      } catch (err: any) {
        this.mensajeError = err.data?.statusMessage || err.message || 'Error al crear La Vaca'
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async registrarPagoVaca(vacaId: number, datos: {
      casillasIds: number[]
      metodoPago: 'comprobante' | 'efectivo'
      comprobanteUrl?: string | null
      referenciaPago?: string | null
      notaPago?: string | null
    }) {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{
          mensaje: string
          estadoVerificacion: string
          casillasActualizadas: number
        }>(`/api/vacas/${vacaId}/registrar-pago`, {
          method: 'POST',
          body: datos
        })
        this.lanzarConfeti(respuesta.estadoVerificacion === 'verificado')
        await this.cargarVaca(vacaId)
        return respuesta
      } catch (err: any) {
        throw err
      } finally {
        this.estaCargando = false
      }
    },

    async verificarPagoVaca(vacaId: number, casillasIds: number[], accion: 'verificar' | 'rechazar', motivoRechazo?: string) {
      this.estaCargando = true
      try {
        const respuesta = await $fetch<{
          mensaje: string
          accion: 'verificar' | 'rechazar'
        }>(`/api/vacas/${vacaId}/verificar-pago`, {
          method: 'POST',
          body: { casillasIds, accion, motivoRechazo }
        })
        if (accion === 'verificar') {
          this.lanzarConfeti(false)
        }
        await this.cargarVaca(vacaId)
        return respuesta
      } catch (err: any) {
        throw err
      } finally {
        this.estaCargando = false
      }
    }
  }
})
