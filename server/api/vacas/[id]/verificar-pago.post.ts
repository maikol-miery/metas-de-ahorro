import { EventoVaca, CasillaVaca } from '../../../models'
import { esquemaVerificarPagoVaca } from '../../../utils/esquemasZod'

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
  const validacion = esquemaVerificarPagoVaca.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Datos de verificación inválidos'
    })
  }

  const { casillasIds, accion, motivoRechazo } = validacion.data

  const vaca = await EventoVaca.findByPk(vacaId)
  if (!vaca) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Evento de Vaca no encontrado'
    })
  }

  const esCreador = vaca.creadorId === sesion.id
  const esReceptor = vaca.receptorPagoUsuarioId === sesion.id ||
    vaca.receptorPagoNombre.trim().toLowerCase() === sesion.nombre.trim().toLowerCase()

  if (!esCreador && !esReceptor) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo el creador o el receptor del dinero pueden verificar o rechazar pagos'
    })
  }

  for (const cId of casillasIds) {
    const casilla = await CasillaVaca.findOne({
      where: { id: cId, vacaId }
    })

    if (!casilla) continue

    if (accion === 'verificar') {
      casilla.estadoVerificacion = 'verificado'
      casilla.estaPagada = true
    } else {
      // Rechazar / Anular pago
      casilla.estadoVerificacion = 'rechazado'
      casilla.estaPagada = false
      if (motivoRechazo && motivoRechazo.trim()) {
        casilla.notaPago = casilla.notaPago
          ? `${casilla.notaPago} [Rechazado: ${motivoRechazo.trim()}]`
          : `Rechazado: ${motivoRechazo.trim()}`
      }
    }

    await casilla.save()
  }

  // Recalcular estado de la vaca
  const todasCasillas = await CasillaVaca.findAll({ where: { vacaId } })
  const todasVerificadas = todasCasillas.every((c) => c.estaPagada && c.estadoVerificacion === 'verificado')

  if (todasVerificadas && vaca.estado !== 'completada') {
    vaca.estado = 'completada'
    await vaca.save()
  } else if (!todasVerificadas && vaca.estado === 'completada') {
    vaca.estado = 'recaudando'
    await vaca.save()
  }

  return {
    mensaje: accion === 'verificar'
      ? '¡Pago(s) verificado(s) y acreditado(s) exitosamente! ✅'
      : 'Pago(s) rechazado(s) y casilla(s) liberada(s) ❌',
    accion
  }
})
