import { Op } from 'sequelize'
import { EventoVaca, RubroVaca, ParticipanteVaca, CasillaVaca } from '../../models'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  // Buscar vacas donde el usuario sea creador, receptor o participante
  const participantes = await ParticipanteVaca.findAll({
    where: { usuarioId: sesion.id },
    attributes: ['vacaId']
  })
  const vacasIdsParticipante = participantes.map((p) => p.vacaId)

  const vacas = await EventoVaca.findAll({
    where: {
      [Op.or]: [
        { creadorId: sesion.id },
        { receptorPagoUsuarioId: sesion.id },
        { id: { [Op.in]: vacasIdsParticipante } }
      ]
    },
    include: [
      {
        model: ParticipanteVaca,
        as: 'participantes',
        attributes: ['id', 'nombreParticipante', 'colorAvatar', 'esReceptorPago', 'montoAsignado']
      },
      {
        model: CasillaVaca,
        as: 'casillas',
        attributes: ['id', 'monto', 'estaPagada', 'estadoVerificacion', 'metodoPago']
      },
      {
        model: RubroVaca,
        as: 'rubros',
        attributes: ['id', 'concepto', 'monto', 'icono']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  const vacasFormateadas = vacas.map((vacaInstancia) => {
    const json = vacaInstancia.toJSON() as any
    const casillas = json.casillas || []
    const participantesLista = json.participantes || []

    const casillasVerificadas = casillas.filter(
      (c: any) => c.estaPagada && c.estadoVerificacion === 'verificado'
    )
    const casillasEnRevision = casillas.filter(
      (c: any) => c.estadoVerificacion === 'en_revision'
    )

    const totalRecaudado = Math.round(
      casillasVerificadas.reduce((acum: number, c: any) => acum + Number(c.monto), 0) * 100
    ) / 100

    const montoTotal = Number(json.montoTotal)
    const progresoPorcentaje = montoTotal > 0 ? Math.min(100, Math.round((totalRecaudado / montoTotal) * 100)) : 0

    return {
      id: json.id,
      titulo: json.titulo,
      descripcion: json.descripcion,
      fechaEvento: json.fechaEvento,
      montoTotal,
      pagosPorPersona: json.pagosPorPersona,
      creadorId: json.creadorId,
      receptorPagoNombre: json.receptorPagoNombre,
      receptorPagoUsuarioId: json.receptorPagoUsuarioId,
      datosPagoMovil: json.datosPagoMovil,
      estado: json.estado,
      totalRecaudado,
      progresoPorcentaje,
      totalCasillas: casillas.length,
      casillasPagadas: casillasVerificadas.length,
      casillasPendientesVerificacion: casillasEnRevision.length,
      participantesCount: participantesLista.length,
      participantes: participantesLista,
      createdAt: json.createdAt
    }
  })

  return {
    vacas: vacasFormateadas
  }
})
