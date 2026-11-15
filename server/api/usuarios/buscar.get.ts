import { Op } from 'sequelize'
import { Usuario } from '../../models'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const query = getQuery(event)
  const termino = String(query.q || '').trim().toLowerCase().replace(/^@/, '')

  if (!termino || termino.length < 1) {
    return { usuarios: [] }
  }

  const usuarios = await Usuario.findAll({
    where: {
      id: { [Op.ne]: sesion.id },
      [Op.or]: [
        { nombreUsuario: { [Op.like]: `%${termino}%` } },
        { correo: { [Op.like]: `%${termino}%` } },
        { nombre: { [Op.like]: `%${termino}%` } }
      ]
    },
    attributes: ['id', 'nombre', 'nombreUsuario', 'correo', 'colorAvatar'],
    limit: 6
  })

  return {
    usuarios: usuarios.map((u) => u.toJSON())
  }
})
