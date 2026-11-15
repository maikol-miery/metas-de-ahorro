import { Op } from 'sequelize'
import { EventoVaca, RubroVaca, ParticipanteVaca, CasillaVaca, Usuario } from '../../models'
import { esquemaCrearVaca } from '../../utils/esquemasZod'

export default defineEventHandler(async (event) => {
  const sesion = event.context.usuario
  if (!sesion) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const cuerpo = await readBody(event)
  const validacion = esquemaCrearVaca.safeParse(cuerpo)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.errors[0]?.message || 'Datos de La Vaca inválidos'
    })
  }

  const {
    titulo,
    descripcion,
    fechaEvento,
    pagosPorPersona,
    receptorPagoNombre,
    receptorPagoUsuarioId,
    datosPagoMovil,
    rubros,
    participantes
  } = validacion.data

  // 1. Calcular monto total del evento a partir de los rubros
  const montoTotal = Math.round(
    rubros.reduce((acc, rubro) => acc + Number(rubro.monto), 0) * 100
  ) / 100

  if (montoTotal <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El monto total presupuestado debe ser mayor a 0'
    })
  }

  // 2. Determinar receptor/tesorero (por defecto el creador si coincide)
  let receptorId = receptorPagoUsuarioId || null
  const esCreadorReceptor =
    receptorPagoNombre.trim().toLowerCase() === sesion.nombre.trim().toLowerCase() ||
    receptorPagoNombre.trim().toLowerCase() === (sesion.nombreUsuario || '').toLowerCase()

  if (esCreadorReceptor) {
    receptorId = sesion.id
  }

  // 3. Crear EventoVaca
  const nuevaVaca = await EventoVaca.create({
    titulo: titulo.trim(),
    descripcion: descripcion?.trim() || null,
    fechaEvento: fechaEvento || null,
    montoTotal,
    pagosPorPersona,
    creadorId: sesion.id,
    receptorPagoNombre: receptorPagoNombre.trim(),
    receptorPagoUsuarioId: receptorId,
    datosPagoMovil: datosPagoMovil?.trim() || null,
    estado: 'recaudando'
  })

  // 4. Crear Rubros
  const registrosRubros = rubros.map((r, i) => ({
    vacaId: nuevaVaca.id,
    concepto: r.concepto.trim(),
    monto: Number(r.monto),
    icono: r.icono || '🥩',
    orden: i + 1
  }))
  await RubroVaca.bulkCreate(registrosRubros)

  // 5. Calcular cuota equitativa por participante
  const totalPersonas = participantes.length
  const cuotaBasePorPersona = Math.floor((montoTotal / totalPersonas) * 100) / 100
  const restoCentavos = Math.round((montoTotal - (cuotaBasePorPersona * totalPersonas)) * 100) / 100

  // 6. Crear Participantes y sus Casillas individuales
  for (let idx = 0; idx < participantes.length; idx++) {
    const p = participantes[idx]
    const montoPersona = idx === 0 ? Math.round((cuotaBasePorPersona + restoCentavos) * 100) / 100 : cuotaBasePorPersona

    const esElReceptor = p.esReceptorPago || p.nombreParticipante.trim().toLowerCase() === receptorPagoNombre.trim().toLowerCase()

    // Buscar si el usuario existe por correo o nombreUsuario
    let uId = p.usuarioId || null
    if (!uId) {
      const condiciones = []
      if (p.correo) condiciones.push({ correo: p.correo.toLowerCase().trim() })
      if (p.nombreUsuario) condiciones.push({ nombreUsuario: p.nombreUsuario.toLowerCase().trim().replace(/^@/, '') })

      if (condiciones.length > 0) {
        const u = await Usuario.findOne({ where: { [Op.or]: condiciones } })
        if (u) {
          uId = u.id
        }
      }
    }

    if (!uId && p.nombreParticipante.trim().toLowerCase() === sesion.nombre.trim().toLowerCase()) {
      uId = sesion.id
    }

    const participanteCreado = await ParticipanteVaca.create({
      vacaId: nuevaVaca.id,
      usuarioId: uId,
      nombreParticipante: p.nombreParticipante.trim(),
      nombreUsuario: p.nombreUsuario ? p.nombreUsuario.toLowerCase().trim().replace(/^@/, '') : null,
      correo: p.correo ? p.correo.toLowerCase().trim() : null,
      colorAvatar: p.colorAvatar || '#58CC02',
      montoAsignado: montoPersona,
      esReceptorPago: esElReceptor
    })

    // Generar las casillas para este participante
    const cuotas = pagosPorPersona || 1
    const montoPorCuota = Math.floor((montoPersona / cuotas) * 100) / 100
    const restoCuotaCentavos = Math.round((montoPersona - (montoPorCuota * cuotas)) * 100) / 100

    const casillasParaCrear = []
    for (let c = 1; c <= cuotas; c++) {
      const montoCasilla = c === 1 ? Math.round((montoPorCuota + restoCuotaCentavos) * 100) / 100 : montoPorCuota
      casillasParaCrear.push({
        vacaId: nuevaVaca.id,
        participanteId: participanteCreado.id,
        numeroCuota: c,
        monto: montoCasilla,
        estaPagada: false,
        estadoVerificacion: 'pendiente',
        metodoPago: null,
        comprobanteUrl: null,
        referenciaPago: null,
        notaPago: null,
        fechaPago: null
      })
    }

    await CasillaVaca.bulkCreate(casillasParaCrear)
  }

  return {
    mensaje: '¡Vaca creada exitosamente! A recaudar para el evento 🎉🥩',
    id: nuevaVaca.id
  }
})
