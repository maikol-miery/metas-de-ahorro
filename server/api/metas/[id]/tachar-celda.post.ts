import { Meta, MiembroMeta, Usuario, CeldaCuadricula, HistorialAbono } from '../../../models'
import { esquemaTacharCelda } from '../../../utils/esquemasZod'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const metaId = Number(getRouterParam(event, 'id'))
  const cuerpo = await readBody(event)
  const validacion = esquemaTacharCelda.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Datos inválidos'
    })
  }

  const { celdaId, nota } = validacion.data

  const meta = await Meta.findByPk(metaId)
  if (!meta) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Meta no encontrada'
    })
  }

  const membresia = await MiembroMeta.findOne({
    where: { metaId, usuarioId: sesion.id }
  })
  if (meta.creadorId !== sesion.id && !membresia) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para modificar esta meta'
    })
  }

  const celda = await CeldaCuadricula.findOne({
    where: { id: celdaId, metaId }
  })
  if (!celda) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Cuadrito no encontrado en esta meta'
    })
  }

  const usuario = await Usuario.findByPk(sesion.id)

  let accion: 'tachado' | 'desmarcado'

  if (!celda.estaTachada) {
    // Marcar celda como tachada / ahorrada
    celda.estaTachada = true
    celda.tachadaPorUsuarioId = sesion.id
    celda.fechaTachado = new Date()
    await celda.save()

    // Registrar en historial
    await HistorialAbono.create({
      metaId,
      usuarioId: sesion.id,
      celdaId: celda.id,
      monto: celda.monto,
      tipo: 'cuadrito_tachado',
      nota: nota || `Cuadrito tachado ($${celda.monto})`,
      fechaAbono: new Date()
    })

    // Incrementar racha de quincenas si aplica
    if (usuario) {
      usuario.rachaQuincenas = (usuario.rachaQuincenas || 0) + 1
      await usuario.save()
    }

    accion = 'tachado'
  } else {
    // Desmarcar celda
    celda.estaTachada = false
    celda.tachadaPorUsuarioId = null
    celda.fechaTachado = null
    await celda.save()

    // Registrar desmarcado en historial
    await HistorialAbono.create({
      metaId,
      usuarioId: sesion.id,
      celdaId: celda.id,
      monto: -celda.monto,
      tipo: 'cuadrito_desmarcado',
      nota: nota || `Cuadrito de $${celda.monto} desmarcado`,
      fechaAbono: new Date()
    })

    accion = 'desmarcado'
  }

  // Recalcular estado de la meta
  const todasCeldas = await CeldaCuadricula.findAll({ where: { metaId } })
  const totalCeldasAhorradas = todasCeldas
    .filter((c) => c.estaTachada)
    .reduce((acum, c) => acum + Number(c.monto), 0)

  const historialAbonosLibres = await HistorialAbono.findAll({
    where: { metaId, tipo: 'abono_libre' }
  })
  const totalLibres = historialAbonosLibres.reduce((acum, h) => acum + Number(h.monto), 0)
  const granTotal = totalCeldasAhorradas + totalLibres

  if (granTotal >= meta.montoObjetivo && meta.estado !== 'completada') {
    meta.estado = 'completada'
    await meta.save()
  } else if (granTotal < meta.montoObjetivo && meta.estado === 'completada') {
    meta.estado = 'activa'
    await meta.save()
  }

  return {
    mensaje: accion === 'tachado' ? '¡Cuadrito tachado con éxito! 🎉' : 'Cuadrito desmarcado.',
    accion,
    celda: {
      id: celda.id,
      monto: celda.monto,
      estaTachada: celda.estaTachada,
      tachadaPorUsuarioId: celda.tachadaPorUsuarioId,
      fechaTachado: celda.fechaTachado,
      tachadaPor: usuario ? { id: usuario.id, nombre: usuario.nombre, colorAvatar: usuario.colorAvatar } : null
    },
    rachaQuincenas: usuario?.rachaQuincenas || 0
  }
})
