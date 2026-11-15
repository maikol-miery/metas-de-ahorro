import { EventoVaca, CasillaVaca, ParticipanteVaca } from '../../../models'
import { esquemaPagarCasillasVaca } from '../../../utils/esquemasZod'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const vacaId = Number(getRouterParam(event, 'id'))
  const cuerpo = await readBody(event)
  const validacion = esquemaPagarCasillasVaca.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Datos del pago inválidos'
    })
  }

  const { casillasIds, metodoPago, comprobanteUrl, referenciaPago, notaPago } = validacion.data

  const vaca = await EventoVaca.findByPk(vacaId, {
    include: [{ model: ParticipanteVaca, as: 'participantes' }]
  })
  if (!vaca) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Evento de Vaca no encontrado'
    })
  }

  const participantes = (vaca.toJSON() as any).participantes || []
  const esCreador = vaca.creadorId === sesion.id
  const esReceptor = vaca.receptorPagoUsuarioId === sesion.id ||
    vaca.receptorPagoNombre.trim().toLowerCase() === sesion.nombre.trim().toLowerCase()
  const esParticipante = participantes.some((p: any) =>
    p.usuarioId === sesion.id ||
    (p.correo && sesion.correo && p.correo.toLowerCase() === sesion.correo.toLowerCase()) ||
    (p.nombreUsuario && sesion.nombreUsuario && p.nombreUsuario.toLowerCase() === sesion.nombreUsuario.toLowerCase())
  )

  if (!esCreador && !esReceptor && !esParticipante) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para registrar pagos en esta Vaca'
    })
  }

  // Si lo registra el propio receptor o creador de la vaca, pasa directo a verificado.
  // Si lo sube otro participante, queda en 'en_revision' para auditoría.
  const nuevoEstadoVerificacion = esCreador || esReceptor ? 'verificado' : 'en_revision'

  const casillasActualizadas = []

  for (const cId of casillasIds) {
    const casilla = await CasillaVaca.findOne({
      where: { id: cId, vacaId }
    })

    if (!casilla) continue

    casilla.estaPagada = true
    casilla.estadoVerificacion = nuevoEstadoVerificacion
    casilla.metodoPago = metodoPago
    casilla.comprobanteUrl = metodoPago === 'comprobante' ? comprobanteUrl || null : null
    casilla.referenciaPago = metodoPago === 'comprobante' ? referenciaPago || null : null
    casilla.notaPago = notaPago || null
    casilla.fechaPago = new Date()

    await casilla.save()
    casillasActualizadas.push(casilla)
  }

  // Verificar si todas las casillas de la vaca están pagadas y verificadas
  const todasCasillas = await CasillaVaca.findAll({ where: { vacaId } })
  const todasVerificadas = todasCasillas.every((c) => c.estaPagada && c.estadoVerificacion === 'verificado')

  if (todasVerificadas && vaca.estado !== 'completada') {
    vaca.estado = 'completada'
    await vaca.save()
  }

  return {
    mensaje: nuevoEstadoVerificacion === 'verificado'
      ? '¡Pago registrado y verificado exitosamente! 🎉'
      : '¡Comprobante enviado a revisión! El tesorero lo auditará pronto ⏳',
    estadoVerificacion: nuevoEstadoVerificacion,
    casillasActualizadas: casillasActualizadas.length
  }
})
