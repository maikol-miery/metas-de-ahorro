import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

const NOMBRE_COOKIE_AUTH = 'token_ahorro_gamificado'

export interface PayloadUsuario {
  id: number
  correo: string
  nombre: string
  nombreUsuario?: string | null
}

export function obtenerSecretoJwt(): string {
  return process.env.JWT_SECRET || 'super_secreto_duolingo_ahorros_jwt_2025_seguro_y_robusto'
}

/**
 * Genera un token JWT con vigencia de 30 días
 */
export function generarToken(payload: PayloadUsuario): string {
  return jwt.sign(payload, obtenerSecretoJwt(), {
    expiresIn: '30d'
  })
}

/**
 * Verifica y decodifica un token JWT
 */
export function verificarToken(token: string): PayloadUsuario | null {
  try {
    return jwt.verify(token, obtenerSecretoJwt()) as PayloadUsuario
  } catch {
    return null
  }
}

/**
 * Guarda el token en una cookie HTTP-Only segura
 */
export function establecerCookieToken(event: H3Event, token: string) {
  setCookie(event, NOMBRE_COOKIE_AUTH, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días en segundos
    path: '/'
  })
}

/**
 * Elimina la cookie de autenticación
 */
export function limpiarCookieToken(event: H3Event) {
  deleteCookie(event, NOMBRE_COOKIE_AUTH, {
    path: '/'
  })
}

/**
 * Extrae y valida el usuario autenticado desde las cookies o cabecera Authorization
 */
export function obtenerUsuarioDeEvento(event: H3Event): PayloadUsuario | null {
  let token = getCookie(event, NOMBRE_COOKIE_AUTH)

  if (!token) {
    const cabeceraAuth = getHeader(event, 'authorization')
    if (cabeceraAuth && cabeceraAuth.startsWith('Bearer ')) {
      token = cabeceraAuth.substring(7)
    }
  }

  if (!token) return null

  return verificarToken(token)
}
