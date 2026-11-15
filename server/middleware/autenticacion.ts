import { defineEventHandler } from 'h3'
import { obtenerUsuarioDeEvento } from '../utils/jwt'

declare module 'h3' {
  interface H3EventContext {
    usuario?: {
      id: number
      correo: string
      nombre: string
      nombreUsuario?: string | null
    }
  }
}

export default defineEventHandler((event) => {
  const usuario = obtenerUsuarioDeEvento(event)
  if (usuario) {
    event.context.usuario = usuario
  }
})
