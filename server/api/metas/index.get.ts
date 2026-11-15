import { Op } from 'sequelize'
import { Meta, MiembroMeta, Usuario, CeldaCuadricula, HistorialAbono } from '../../models'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  // Buscar IDs de metas donde el usuario es miembro
  const membresias = await MiembroMeta.findAll({
    where: { usuarioId: sesion.id },
    attributes: ['metaId']
  })
  const idsMetas = membresias.map((m) => m.metaId)

  // Obtener metas creadas o donde es miembro
  const metas = await Meta.findAll({
    where: {
      [Op.or]: [
        { creadorId: sesion.id },
        { id: { [Op.in]: idsMetas } }
      ]
    },
    include: [
      {
        model: MiembroMeta,
        as: 'miembros',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'correo', 'colorAvatar']
          }
        ]
      },
      {
        model: CeldaCuadricula,
        as: 'celdas',
        attributes: ['id', 'monto', 'estaTachada']
      },
      {
        model: HistorialAbono,
        as: 'historial',
        attributes: ['id', 'monto', 'tipo']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  // Formatear cada meta con métricas calculadas
  const metasFormateadas = metas.map((metaInstancia) => {
    const json = metaInstancia.toJSON() as any
    const celdas = json.celdas || []
    const historial = json.historial || []

    // Dinero de cuadritos tachados
    const ahorradoCuadritos = celdas
      .filter((c: any) => c.estaTachada)
      .reduce((acum: number, c: any) => acum + Number(c.monto), 0)

    // Abonos libres extras
    const abonosLibres = historial
      .filter((h: any) => h.tipo === 'abono_libre')
      .reduce((acum: number, h: any) => acum + Number(h.monto), 0)

    const totalAhorrado = Math.round((ahorradoCuadritos + abonosLibres) * 100) / 100
    const montoObjetivo = Number(json.montoObjetivo)
    const progresoPorcentaje = montoObjetivo > 0 ? Math.min(100, Math.round((totalAhorrado / montoObjetivo) * 100)) : 0
    const totalCeldas = celdas.length
    const celdasTachadas = celdas.filter((c: any) => c.estaTachada).length

    return {
      id: json.id,
      titulo: json.titulo,
      descripcion: json.descripcion,
      montoObjetivo,
      topeMaximoCelda: Number(json.topeMaximoCelda),
      esCompartida: json.esCompartida,
      creadorId: json.creadorId,
      estado: json.estado,
      totalAhorrado,
      progresoPorcentaje,
      totalCeldas,
      celdasTachadas,
      miembros: json.miembros?.map((m: any) => ({
        id: m.usuario?.id || m.id,
        nombre: m.usuario?.nombre || m.nombreInvitado || m.correoInvitado || 'Invitado',
        colorAvatar: m.usuario?.colorAvatar || '#1CB0F6',
        rol: m.rol
      })) || [],
      createdAt: json.createdAt
    }
  })

  return {
    metas: metasFormateadas
  }
})
