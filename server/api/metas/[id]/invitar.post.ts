import { Op } from 'sequelize'
import { Meta, MiembroMeta, Usuario } from '../../../models'
import { esquemaInvitarColaborador } from '../../../utils/esquemasZod'

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
  const validacion = esquemaInvitarColaborador.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Dato de invitación inválido'
    })
  }

  const entrada = (validacion.data.identificador || validacion.data.correo || '').trim()
  const entradaLimpia = entrada.toLowerCase().replace(/^@/, '')

  const meta = await Meta.findByPk(metaId)
  if (!meta) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Meta no encontrada'
    })
  }

  if (meta.creadorId !== sesion.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo el creador de la meta puede invitar colaboradores'
    })
  }

  // Buscar si el usuario ya existe por correo o por nombreUsuario
  const usuarioExistente = await Usuario.findOne({
    where: {
      [Op.or]: [
        { correo: entradaLimpia },
        { nombreUsuario: entradaLimpia }
      ]
    }
  })

  if (usuarioExistente && usuarioExistente.id === sesion.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No puedes invitarte a ti mismo como colaborador.'
    })
  }

  if (usuarioExistente) {
    // Verificar si ya es miembro
    const membresiaExistente = await MiembroMeta.findOne({
      where: { metaId, usuarioId: usuarioExistente.id }
    })

    if (membresiaExistente) {
      throw createError({
        statusCode: 409,
        statusMessage: `${usuarioExistente.nombre} ya es colaborador en esta meta.`
      })
    }

    await MiembroMeta.create({
      metaId,
      usuarioId: usuarioExistente.id,
      rol: 'colaborador'
    })

    meta.esCompartida = true
    await meta.save()

    return {
      mensaje: `¡Genial! Se ha añadido a ${usuarioExistente.nombre} (@${usuarioExistente.nombreUsuario || usuarioExistente.correo}) como colaborador.`,
      colaborador: {
        id: usuarioExistente.id,
        nombre: usuarioExistente.nombre,
        nombreUsuario: usuarioExistente.nombreUsuario,
        correo: usuarioExistente.correo,
        colorAvatar: usuarioExistente.colorAvatar,
        rol: 'colaborador'
      }
    }
  } else {
    // Si NO tiene cuenta aún, se añade por correo o nombre para que cuando cree su cuenta se vincule
    const esFormatoCorreo = entradaLimpia.includes('@') && entradaLimpia.includes('.')

    const membresiaPendiente = await MiembroMeta.findOne({
      where: {
        metaId,
        correoInvitado: entradaLimpia
      }
    })

    if (membresiaPendiente) {
      throw createError({
        statusCode: 409,
        statusMessage: `Ya existe una invitación pendiente para ${entrada}.`
      })
    }

    const nuevoMiembro = await MiembroMeta.create({
      metaId,
      usuarioId: null,
      correoInvitado: esFormatoCorreo ? entradaLimpia : null,
      nombreInvitado: entrada,
      rol: 'colaborador'
    })

    meta.esCompartida = true
    await meta.save()

    return {
      mensaje: `¡Invitación enviada para ${entrada}! Podrá ver la meta en cuanto inicie sesión o cree su cuenta.`,
      colaborador: {
        id: nuevoMiembro.id,
        nombre: entrada,
        nombreUsuario: null,
        correo: esFormatoCorreo ? entradaLimpia : null,
        colorAvatar: '#1CB0F6',
        rol: 'colaborador'
      }
    }
  }
})
