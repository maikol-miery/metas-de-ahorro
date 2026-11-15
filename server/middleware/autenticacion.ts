import { defineEventHandler } from 'h3'
import { obtenerUsuarioDeEvento } from '../utils/jwt'
import { sincronizarBD } from '../models'

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

export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/api/')) {
    await sincronizarBD()
  }

  const usuario = obtenerUsuarioDeEvento(event)
  if (usuario) {
    event.context.usuario = usuario
  }
})
