import { EventoVaca, RubroVaca, ParticipanteVaca, CasillaVaca, Usuario } from '../../models'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const idParam = getRouterParam(event, 'id')
  const vacaId = Number(idParam)
  if (!vacaId || isNaN(vacaId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de vaca inválido'
    })
  }

  const vaca = await EventoVaca.findByPk(vacaId, {
    include: [
      {
        model: Usuario,
        as: 'creador',
        attributes: ['id', 'nombre', 'correo', 'colorAvatar']
      },
      {
        model: RubroVaca,
        as: 'rubros'
      },
      {
        model: ParticipanteVaca,
        as: 'participantes',
        include: [
          {
            model: CasillaVaca,
            as: 'casillas'
          }
        ]
      },
      {
        model: CasillaVaca,
        as: 'casillas',
        include: [
          {
            model: ParticipanteVaca,
            as: 'participante',
            attributes: ['id', 'nombreParticipante', 'colorAvatar']
          }
        ]
      }
    ]
  })

  if (!vaca) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Evento de Vaca no encontrado'
    })
  }

  const json = vaca.toJSON() as any
  const participantes = json.participantes || []
  const casillas = json.casillas || []
  const rubros = (json.rubros || []).sort((a: any, b: any) => a.orden - b.orden)

  const esCreador = json.creadorId === sesion.id
  const esReceptor = json.receptorPagoUsuarioId === sesion.id ||
    json.receptorPagoNombre.trim().toLowerCase() === sesion.nombre.trim().toLowerCase()

  // 1. Cálculos de dinero
  const casillasVerificadas = casillas.filter((c: any) => c.estaPagada && c.estadoVerificacion === 'verificado')
  const casillasEnRevision = casillas.filter((c: any) => c.estadoVerificacion === 'en_revision')

  const totalRecaudado = Math.round(
    casillasVerificadas.reduce((acc: number, c: any) => acc + Number(c.monto), 0) * 100
  ) / 100

  const totalPagoMovil = Math.round(
    casillasVerificadas
      .filter((c: any) => c.metodoPago === 'comprobante')
      .reduce((acc: number, c: any) => acc + Number(c.monto), 0) * 100
  ) / 100

  const totalEfectivo = Math.round(
    casillasVerificadas
      .filter((c: any) => c.metodoPago === 'efectivo')
      .reduce((acc: number, c: any) => acc + Number(c.monto), 0) * 100
  ) / 100

  const totalEnRevision = Math.round(
    casillasEnRevision.reduce((acc: number, c: any) => acc + Number(c.monto), 0) * 100
  ) / 100

  const montoTotal = Number(json.montoTotal)
  const montoFaltante = Math.max(0, Math.round((montoTotal - totalRecaudado) * 100) / 100)
  const progresoPorcentaje = montoTotal > 0 ? Math.min(100, Math.round((totalRecaudado / montoTotal) * 100)) : 0

  // 2. Medidor de Ritmo del Grupo (Al día, A mitad, Rezagados)
  const participantesAlDia: any[] = []
  const participantesAMitad: any[] = []
  const participantesRezagados: any[] = []

  participantes.forEach((part: any) => {
    const misCasillas = part.casillas || []
    const totalCasillas = misCasillas.length
    const pagadas = misCasillas.filter((c: any) => c.estaPagada && c.estadoVerificacion === 'verificado').length
    const enRevision = misCasillas.filter((c: any) => c.estadoVerificacion === 'en_revision').length

    const montoAbonado = misCasillas
      .filter((c: any) => c.estaPagada && c.estadoVerificacion === 'verificado')
      .reduce((acc: number, c: any) => acc + Number(c.monto), 0)

    const info = {
      id: part.id,
      nombre: part.nombreParticipante,
      colorAvatar: part.colorAvatar,
      montoAsignado: Number(part.montoAsignado),
      montoAbonado,
      pagadas,
      totalCasillas,
      enRevision,
      porcentaje: Number(part.montoAsignado) > 0 ? Math.min(100, Math.round((montoAbonado / Number(part.montoAsignado)) * 100)) : 0
    }

    if (pagadas === totalCasillas && totalCasillas > 0) {
      participantesAlDia.push(info)
    } else if (pagadas > 0 || enRevision > 0) {
      participantesAMitad.push(info)
    } else {
      participantesRezagados.push(info)
    }
  })

  // 3. Cobertura secuencial de Rubros
  let dineroDisponibleParaRubros = totalRecaudado
  const rubrosCalculados = rubros.map((r: any) => {
    const montoRubro = Number(r.monto)
    const cubierto = Math.min(dineroDisponibleParaRubros, montoRubro)
    dineroDisponibleParaRubros = Math.max(0, dineroDisponibleParaRubros - cubierto)
    const porcentajeCubierto = montoRubro > 0 ? Math.min(100, Math.round((cubierto / montoRubro) * 100)) : 0

    return {
      id: r.id,
      concepto: r.concepto,
      monto: montoRubro,
      icono: r.icono,
      orden: r.orden,
      montoCubierto: cubierto,
      porcentajeCubierto,
      estaCubierto: porcentajeCubierto >= 100
    }
  })

  // 4. Captures e historial de pagos para el Panel de Control
  const historialPagos = casillas
    .filter((c: any) => c.estaPagada || c.comprobanteUrl || c.metodoPago)
    .sort((a: any, b: any) => new Date(b.fechaPago || b.updatedAt).getTime() - new Date(a.fechaPago || a.updatedAt).getTime())

  return {
    vaca: {
      id: json.id,
      titulo: json.titulo,
      descripcion: json.descripcion,
      fechaEvento: json.fechaEvento,
      montoTotal,
      pagosPorPersona: json.pagosPorPersona,
      creadorId: json.creadorId,
      creador: json.creador,
      receptorPagoNombre: json.receptorPagoNombre,
      receptorPagoUsuarioId: json.receptorPagoUsuarioId,
      datosPagoMovil: json.datosPagoMovil,
      estado: json.estado,
      totalRecaudado,
      totalPagoMovil,
      totalEfectivo,
      totalEnRevision,
      montoFaltante,
      progresoPorcentaje,
      esCreador,
      esReceptor,
      puedeAuditar: esCreador || esReceptor,
      participantes,
      casillas,
      rubros: rubrosCalculados,
      historialPagos,
      ritmo: {
        alDia: participantesAlDia,
        aMitad: participantesAMitad,
        rezagados: participantesRezagados
      }
    }
  }
})
