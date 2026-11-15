import { z } from 'zod'

export const esquemaRegistro = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es muy largo'),
  nombreUsuario: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario es muy largo')
    .regex(/^@?[a-zA-Z0-9_]+$/, 'El usuario solo puede tener letras, números y guión bajo (ej. carlos_21)')
    .transform((val) => val.replace(/^@/, '').toLowerCase()),
  correo: z
    .string()
    .email('Ingresa un correo electrónico válido'),
  clave: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  colorAvatar: z
    .string()
    .default('#58CC02')
})

export const esquemaLogin = z.object({
  identificador: z.string().optional(),
  correo: z.string().optional(),
  clave: z
    .string()
    .min(1, 'Debes ingresar tu contraseña')
}).superRefine((data, ctx) => {
  if (!data.identificador && !data.correo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identificador'],
      message: 'Ingresa tu correo o nombre de usuario'
    })
  }
})

export const esquemaSubMeta = z.object({
  titulo: z.string().min(1, 'El título de la etapa es requerido'),
  montoObjetivo: z.number().positive('El monto de la etapa debe ser mayor a 0'),
  icono: z.string().default('🎯')
})

export const esquemaCrearMeta = z.object({
  titulo: z
    .string()
    .min(2, 'El título de la meta debe tener al menos 2 caracteres')
    .max(150, 'El título es muy largo'),
  descripcion: z.string().optional().default(''),
  montoObjetivo: z
    .number()
    .positive('El monto objetivo debe ser mayor a 0'),
  topeMaximoCelda: z
    .number()
    .positive('El tope por cuadrito debe ser mayor a 0'),
  esCompartida: z.boolean().default(false),
  submetas: z.array(esquemaSubMeta).optional().default([])
})

export const esquemaTacharCelda = z.object({
  celdaId: z.number().int().positive('ID de celda inválido'),
  nota: z.string().max(250).optional().default('')
})

export const esquemaAbonoLibre = z.object({
  monto: z.number().positive('El monto a abonar debe ser mayor a 0'),
  nota: z.string().max(250).optional().default('Abono libre')
})

export const esquemaInvitarColaborador = z.object({
  identificador: z.string().optional(),
  correo: z.string().optional()
}).superRefine((data, ctx) => {
  if (!data.identificador && !data.correo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identificador'],
      message: 'Ingresa el correo o nombre de usuario del amigo'
    })
  }
})

// ==========================================
// ESQUEMAS MÓDULO EVENTOS / LA VACA
// ==========================================

export const esquemaRubroVaca = z.object({
  concepto: z.string().min(1, 'El concepto del rubro es requerido'),
  monto: z.number().positive('El monto del rubro debe ser mayor a 0'),
  icono: z.string().default('🥩')
})

export const esquemaParticipanteVaca = z.object({
  nombreParticipante: z.string().min(1, 'El nombre del participante es requerido'),
  nombreUsuario: z.string().optional().nullable(),
  correo: z.string().optional().nullable(),
  colorAvatar: z.string().default('#58CC02'),
  usuarioId: z.number().nullable().optional(),
  esReceptorPago: z.boolean().default(false)
})

export const esquemaCrearVaca = z.object({
  titulo: z
    .string()
    .min(2, 'El título del evento debe tener al menos 2 caracteres')
    .max(150, 'El título es muy largo'),
  descripcion: z.string().optional().default(''),
  fechaEvento: z.string().optional().nullable(),
  pagosPorPersona: z.number().int().min(1).max(10).default(1),
  receptorPagoNombre: z
    .string()
    .min(1, 'Debes seleccionar quién recibirá el dinero (Tesorero/Receptor)'),
  receptorPagoUsuarioId: z.number().nullable().optional(),
  datosPagoMovil: z.string().optional().default(''),
  rubros: z.array(esquemaRubroVaca).min(1, 'Agrega al menos un rubro o gasto presupuestado'),
  participantes: z.array(esquemaParticipanteVaca).min(1, 'Agrega al menos un participante')
})

export const esquemaPagarCasillasVaca = z
  .object({
    casillasIds: z.array(z.number().int().positive()).min(1, 'Selecciona al menos una casilla para pagar'),
    metodoPago: z.enum(['comprobante', 'efectivo']),
    comprobanteUrl: z.string().optional().nullable(),
    referenciaPago: z.string().optional().nullable(),
    notaPago: z.string().optional().nullable()
  })
  .superRefine((datos, contexto) => {
    if (datos.metodoPago === 'comprobante') {
      if (!datos.comprobanteUrl || datos.comprobanteUrl.trim().length === 0) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['comprobanteUrl'],
          message: 'Es 100% obligatorio adjuntar la foto o captura del comprobante de Pago Móvil'
        })
      }
      if (!datos.referenciaPago || datos.referenciaPago.trim().length === 0) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['referenciaPago'],
          message: 'Debes ingresar los últimos dígitos o número de referencia del Pago Móvil'
        })
      }
    } else if (datos.metodoPago === 'efectivo') {
      if (!datos.notaPago || datos.notaPago.trim().length === 0) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['notaPago'],
          message: 'Debes ingresar una nota confirmando a quién y en qué lugar se le entregó el efectivo'
        })
      }
    }
  })

export const esquemaVerificarPagoVaca = z.object({
  casillasIds: z.array(z.number().int().positive()).min(1, 'Selecciona al menos una casilla'),
  accion: z.enum(['verificar', 'rechazar']),
  motivoRechazo: z.string().optional().default('')
})
