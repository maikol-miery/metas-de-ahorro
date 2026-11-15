import { limpiarCookieToken } from '../../utils/jwt'

export default defineEventHandler((event) => {
  limpiarCookieToken(event)
  return {
    mensaje: 'Sesión cerrada correctamente'
  }
})
