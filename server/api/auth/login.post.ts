import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import { Usuario } from '../../models'
import { esquemaLogin } from '../../utils/esquemasZod'
import { generarToken, establecerCookieToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const cuerpo = await readBody(event)
  const validacion = esquemaLogin.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Datos de inicio de sesión inválidos'
    })
  }

  const { identificador, correo, clave } = validacion.data
  const textoLimpio = (identificador || correo || '').toLowerCase().trim().replace(/^@/, '')

  const usuario = await Usuario.findOne({
    where: {
      [Op.or]: [
        { correo: textoLimpio },
        { nombreUsuario: textoLimpio }
      ]
    }
  })

  if (!usuario) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales incorrectas. Verifica tu usuario/correo y contraseña.'
    })
  }

  const claveValida = await bcrypt.compare(clave, usuario.claveHash)
  if (!claveValida) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales incorrectas. Verifica tu usuario/correo y contraseña.'
    })
  }

  const token = generarToken({
    id: usuario.id,
    correo: usuario.correo,
    nombre: usuario.nombre,
    nombreUsuario: usuario.nombreUsuario
  })

  establecerCookieToken(event, token)

  return {
    mensaje: '¡Bienvenido de nuevo!',
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
      colorAvatar: usuario.colorAvatar,
      rachaQuincenas: usuario.rachaQuincenas
    }
  }
})
