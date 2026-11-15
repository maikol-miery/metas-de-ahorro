import { Sequelize } from 'sequelize'

let instanciaSequelize: Sequelize | null = null

/**
 * Inicializa y obtiene la instancia de Sequelize.
 * Compatible con PostgreSQL (Vercel, Supabase, Neon, Render) y con respaldo SQLite para desarrollo local.
 */
export function obtenerBD(): Sequelize {
  if (instanciaSequelize) {
    return instanciaSequelize
  }

  const urlBaseDatos = process.env.DATABASE_URL

  if (urlBaseDatos && urlBaseDatos.startsWith('postgres')) {
    const esRemota = !urlBaseDatos.includes('localhost') && !urlBaseDatos.includes('127.0.0.1')
    const urlLimpia = urlBaseDatos
      .replace(/[?&]channel_binding=require/g, '')
      .replace(/\?&/, '?')
      .replace(/\?$/, '')

    instanciaSequelize = new Sequelize(urlLimpia, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: esRemota
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        : {}
    })
  } else {
    // Modo local / Fallback SQLite portátil
    instanciaSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './datos_metas.sqlite',
      logging: false
    })
  }

  return instanciaSequelize
}

export const sequelize = obtenerBD()

let sincronizado = false

/**
 * Asegura la sincronización de las tablas de la base de datos de manera segura.
 * Compatible con PostgreSQL (en producción) y SQLite local sin romper por limitaciones de ALTER TABLE.
 */
export async function sincronizarBD() {
  if (sincronizado) return
  try {
    const bd = obtenerBD()
    await bd.authenticate()

    const dialecto = bd.getDialect()

    if (dialecto === 'postgres') {
      await bd.sync({ alter: true })
    } else {
      // En SQLite local, sync() normal crea las tablas nuevas que falten sin disparar el error de SQLite al alterar columnas únicas
      await bd.sync()

      // Asegurar columnas y restricciones de forma idempotente para SQLite existente
      const agregarColumnaSiNoExiste = async (tabla: string, columna: string, definicion: string) => {
        try {
          await bd.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion};`)
        } catch {
          // Ignorar si la columna ya existe
        }
      }

      await agregarColumnaSiNoExiste('usuarios', 'nombreUsuario', 'VARCHAR(50)')
      await agregarColumnaSiNoExiste('miembros_meta', 'correoInvitado', 'VARCHAR(150)')
      await agregarColumnaSiNoExiste('miembros_meta', 'nombreInvitado', 'VARCHAR(120)')
      await agregarColumnaSiNoExiste('participantes_vaca', 'nombreUsuario', 'VARCHAR(50)')
      await agregarColumnaSiNoExiste('participantes_vaca', 'correo', 'VARCHAR(150)')

      try {
        await bd.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_nombre_usuario ON usuarios(nombreUsuario);')
      } catch {}
    }

    sincronizado = true
    console.log('✓ Base de datos sincronizada correctamente con Sequelize.')
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error)
  }
}
