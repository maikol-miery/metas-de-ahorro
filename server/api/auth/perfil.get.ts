import { Usuario } from '../../models'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario

  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado. Por favor inicia sesión.'
    })
  }

  const usuario = await Usuario.findByPk(sesion.id, {
    attributes: ['id', 'nombre', 'nombreUsuario', 'correo', 'colorAvatar', 'rachaQuincenas', 'createdAt']
  })

  if (!usuario) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuario no encontrado'
    })
  }

  return {
    usuario
  }
})
