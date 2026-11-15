import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { Usuario, MiembroMeta, ParticipanteVaca } from '../../models'
import { esquemaRegistro } from '../../utils/esquemasZod'
import { generarToken, establecerCookieToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const cuerpo = await readBody(event)
  const resultadoValidacion = esquemaRegistro.safeParse(cuerpo)

  if (!resultadoValidacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: resultadoValidacion.error.errors[0]?.message || 'Datos de registro inválidos'
    })
  }

  const { nombre, nombreUsuario, correo, clave, colorAvatar } = resultadoValidacion.data
  const correoLimpio = correo.toLowerCase().trim()
  const usuarioLimpio = nombreUsuario.toLowerCase().trim()

  const usuarioPorCorreo = await Usuario.findOne({ where: { correo: correoLimpio } })
  if (usuarioPorCorreo) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe una cuenta registrada con este correo electrónico.'
    })
  }

  const usuarioPorNombreUsuario = await Usuario.findOne({ where: { nombreUsuario: usuarioLimpio } })
  if (usuarioPorNombreUsuario) {
    throw createError({
      statusCode: 409,
      statusMessage: `El nombre de usuario @${usuarioLimpio} ya está en uso. Por favor elige otro.`
    })
  }

  const salt = await bcrypt.genSalt(10)
  const claveHash = await bcrypt.hash(clave, salt)

  const nuevoUsuario = await Usuario.create({
    nombre: nombre.trim(),
    nombreUsuario: usuarioLimpio,
    correo: correoLimpio,
    claveHash,
    colorAvatar,
    rachaQuincenas: 1
  })

  // Vincular automáticamente metas o vacas donde ya había sido invitado antes de tener cuenta
  try {
    await MiembroMeta.update(
      { usuarioId: nuevoUsuario.id },
      { where: { correoInvitado: correoLimpio, usuarioId: null } }
    )

    await ParticipanteVaca.update(
      { usuarioId: nuevoUsuario.id },
      {
        where: {
          usuarioId: null,
          [Op.or]: [
            { correo: correoLimpio },
            { nombreUsuario: usuarioLimpio }
          ]
        }
      }
    )
  } catch (err) {
    console.warn('Aviso: error no crítico vinculando participaciones previas:', err)
  }

  const token = generarToken({
    id: nuevoUsuario.id,
    correo: nuevoUsuario.correo,
    nombre: nuevoUsuario.nombre,
    nombreUsuario: nuevoUsuario.nombreUsuario
  })

  establecerCookieToken(event, token)

  return {
    mensaje: '¡Registro exitoso! Bienvenido al juego del ahorro.',
    usuario: {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      nombreUsuario: nuevoUsuario.nombreUsuario,
      correo: nuevoUsuario.correo,
      colorAvatar: nuevoUsuario.colorAvatar,
      rachaQuincenas: nuevoUsuario.rachaQuincenas
    }
  }
})
