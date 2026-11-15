import { Meta, MiembroMeta, Usuario, CeldaCuadricula, HistorialAbono } from '../../../models'
import { esquemaAbonoLibre } from '../../../utils/esquemasZod'

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
  const validacion = esquemaAbonoLibre.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Monto de abono inválido'
    })
  }

  const { monto, nota } = validacion.data

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
      statusMessage: 'No tienes permiso para abonar a esta meta'
    })
  }

  // Registrar abono libre
  const nuevoAbono = await HistorialAbono.create({
    metaId,
    usuarioId: sesion.id,
    celdaId: null,
    monto,
    tipo: 'abono_libre',
    nota: nota || 'Abono libre a la meta',
    fechaAbono: new Date()
  })

  // Incrementar racha
  const usuario = await Usuario.findByPk(sesion.id)
  if (usuario) {
    usuario.rachaQuincenas = (usuario.rachaQuincenas || 0) + 1
    await usuario.save()
  }

  // Verificar si la meta se completó
  const celdas = await CeldaCuadricula.findAll({ where: { metaId } })
  const totalCeldas = celdas
    .filter((c) => c.estaTachada)
    .reduce((acum, c) => acum + Number(c.monto), 0)

  const historialAbonosLibres = await HistorialAbono.findAll({
    where: { metaId, tipo: 'abono_libre' }
  })
  const totalLibres = historialAbonosLibres.reduce((acum, h) => acum + Number(h.monto), 0)
  const granTotal = totalCeldas + totalLibres

  if (granTotal >= meta.montoObjetivo && meta.estado !== 'completada') {
    meta.estado = 'completada'
    await meta.save()
  }

  return {
    mensaje: `¡Abono de $${monto} registrado exitosamente! 🚀`,
    abono: {
      id: nuevoAbono.id,
      monto: nuevoAbono.monto,
      tipo: nuevoAbono.tipo,
      nota: nuevoAbono.nota,
      fechaAbono: nuevoAbono.fechaAbono,
      usuario: {
        id: usuario?.id,
        nombre: usuario?.nombre,
        colorAvatar: usuario?.colorAvatar
      }
    },
    rachaQuincenas: usuario?.rachaQuincenas || 0
  }
})
