import { Meta, MiembroMeta, SubMeta, CeldaCuadricula } from '../../models'
import { esquemaCrearMeta } from '../../utils/esquemasZod'
import { generarMontosCuadricula } from '../../utils/generadorCuadricula'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const cuerpo = await readBody(event)
  const validacion = esquemaCrearMeta.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Datos de la meta inválidos'
    })
  }

  const { titulo, descripcion, montoObjetivo, topeMaximoCelda, esCompartida, submetas } = validacion.data

  // 1. Crear registro de Meta
  const nuevaMeta = await Meta.create({
    titulo: titulo.trim(),
    descripcion: descripcion?.trim() || null,
    montoObjetivo,
    topeMaximoCelda,
    esCompartida,
    creadorId: sesion.id,
    estado: 'activa'
  })

  // 2. Asociar al creador como miembro principal
  await MiembroMeta.create({
    metaId: nuevaMeta.id,
    usuarioId: sesion.id,
    rol: 'creador'
  })

  // 3. Generar celdas de la cuadrícula
  const montosCeldas = generarMontosCuadricula(montoObjetivo, topeMaximoCelda)
  const registrosCeldas = montosCeldas.map((monto) => ({
    metaId: nuevaMeta.id,
    monto,
    estaTachada: false,
    tachadaPorUsuarioId: null,
    fechaTachado: null
  }))

  await CeldaCuadricula.bulkCreate(registrosCeldas)

  // 4. Crear submetas (etapas de ahorro)
  if (submetas && submetas.length > 0) {
    const registrosSubmetas = submetas.map((sm, indice) => ({
      metaId: nuevaMeta.id,
      titulo: sm.titulo.trim(),
      montoObjetivo: sm.montoObjetivo,
      orden: indice + 1,
      icono: sm.icono || '🎯'
    }))
    await SubMeta.bulkCreate(registrosSubmetas)
  } else {
    // Si no se proveyeron, crear al menos una submeta con el objetivo final
    await SubMeta.create({
      metaId: nuevaMeta.id,
      titulo: 'Meta Final: ' + titulo.trim(),
      montoObjetivo,
      orden: 1,
      icono: '🏆'
    })
  }

  return {
    mensaje: '¡Meta creada exitosamente! ¡A por ese objetivo!',
    id: nuevaMeta.id
  }
})
