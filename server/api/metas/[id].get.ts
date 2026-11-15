import { Meta, MiembroMeta, Usuario, CeldaCuadricula, SubMeta, HistorialAbono } from '../../models'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const idParam = getRouterParam(event, 'id')
  const metaId = Number(idParam)
  if (!metaId || isNaN(metaId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de meta inválido'
    })
  }

  const meta = await Meta.findByPk(metaId, {
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
        include: [
          {
            model: Usuario,
            as: 'tachadaPor',
            attributes: ['id', 'nombre', 'colorAvatar']
          }
        ]
      },
      {
        model: SubMeta,
        as: 'submetas'
      },
      {
        model: HistorialAbono,
        as: 'historial',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'colorAvatar']
          }
        ]
      }
    ]
  })

  if (!meta) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Meta no encontrada'
    })
  }

  const json = meta.toJSON() as any
  const miembros = json.miembros || []
  const esMiembro = json.creadorId === sesion.id || miembros.some((m: any) => m.usuarioId === sesion.id)

  if (!esMiembro) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes acceso a esta meta'
    })
  }

  // Ordenar celdas por id
  const celdas = (json.celdas || []).sort((a: any, b: any) => a.id - b.id)

  // Ordenar submetas por orden ascendente
  const submetas = (json.submetas || []).sort((a: any, b: any) => a.orden - b.orden)

  // Ordenar historial cronológicamente descendente
  const historial = (json.historial || []).sort((a: any, b: any) => new Date(b.fechaAbono).getTime() - new Date(a.fechaAbono).getTime())

  // Cálculos de ahorro
  const totalAhorradoCeldas = celdas
    .filter((c: any) => c.estaTachada)
    .reduce((acum: number, c: any) => acum + Number(c.monto), 0)

  const totalAhorradoAbonosLibres = historial
    .filter((h: any) => h.tipo === 'abono_libre')
    .reduce((acum: number, h: any) => acum + Number(h.monto), 0)

  const totalAhorrado = Math.round((totalAhorradoCeldas + totalAhorradoAbonosLibres) * 100) / 100
  const montoObjetivo = Number(json.montoObjetivo)
  const montoFaltante = Math.max(0, Math.round((montoObjetivo - totalAhorrado) * 100) / 100)
  const progresoPorcentaje = montoObjetivo > 0 ? Math.min(100, Math.round((totalAhorrado / montoObjetivo) * 100)) : 0

  return {
    meta: {
      id: json.id,
      titulo: json.titulo,
      descripcion: json.descripcion,
      montoObjetivo,
      topeMaximoCelda: Number(json.topeMaximoCelda),
      esCompartida: json.esCompartida,
      creadorId: json.creadorId,
      estado: json.estado,
      totalAhorrado,
      montoFaltante,
      progresoPorcentaje,
      celdas,
      submetas,
      historial,
      miembros: miembros.map((m: any) => ({
        id: m.usuario?.id || m.id,
        nombre: m.usuario?.nombre || m.nombreInvitado || m.correoInvitado || 'Invitado',
        nombreUsuario: m.usuario?.nombreUsuario || null,
        correo: m.usuario?.correo || m.correoInvitado || null,
        colorAvatar: m.usuario?.colorAvatar || '#1CB0F6',
        rol: m.rol
      }))
    }
  }
})
