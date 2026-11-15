import { DataTypes, Model } from 'sequelize'
import { obtenerBD, sincronizarBD } from '../utils/db'

export { sincronizarBD }

const bd = obtenerBD()

// 1. Modelo Usuario
export class Usuario extends Model {
  declare id: number
  declare nombre: string
  declare nombreUsuario: string | null
  declare correo: string
  declare claveHash: string
  declare colorAvatar: string
  declare rachaQuincenas: number
  declare createdAt: Date
  declare updatedAt: Date
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    nombreUsuario: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    claveHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    colorAvatar: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '#58CC02' // Verde Duolingo por defecto
    },
    rachaQuincenas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize: bd,
    tableName: 'usuarios',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['nombreUsuario']
      }
    ]
  }
)

// 2. Modelo Meta
export class Meta extends Model {
  declare id: number
  declare titulo: string
  declare descripcion: string | null
  declare montoObjetivo: number
  declare topeMaximoCelda: number
  declare esCompartida: boolean
  declare creadorId: number
  declare estado: 'activa' | 'completada'
  declare createdAt: Date
  declare updatedAt: Date
}

Meta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    montoObjetivo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('montoObjetivo')
        return val === null ? 0 : parseFloat(val)
      }
    },
    topeMaximoCelda: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('topeMaximoCelda')
        return val === null ? 0 : parseFloat(val)
      }
    },
    esCompartida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    creadorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('activa', 'completada'),
      allowNull: false,
      defaultValue: 'activa'
    }
  },
  {
    sequelize: bd,
    tableName: 'metas',
    timestamps: true
  }
)

// 3. Modelo MiembroMeta
export class MiembroMeta extends Model {
  declare id: number
  declare metaId: number
  declare usuarioId: number | null
  declare correoInvitado: string | null
  declare nombreInvitado: string | null
  declare rol: 'creador' | 'colaborador'
  declare createdAt: Date
  declare updatedAt: Date
}

MiembroMeta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    metaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    correoInvitado: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    nombreInvitado: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    rol: {
      type: DataTypes.ENUM('creador', 'colaborador'),
      allowNull: false,
      defaultValue: 'colaborador'
    }
  },
  {
    sequelize: bd,
    tableName: 'miembros_meta',
    timestamps: true
  }
)

// 4. Modelo SubMeta (Etapas / Desglose)
export class SubMeta extends Model {
  declare id: number
  declare metaId: number
  declare titulo: string
  declare montoObjetivo: number
  declare orden: number
  declare icono: string
  declare createdAt: Date
  declare updatedAt: Date
}

SubMeta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    metaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    titulo: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    montoObjetivo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('montoObjetivo')
        return val === null ? 0 : parseFloat(val)
      }
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    icono: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '🎯'
    }
  },
  {
    sequelize: bd,
    tableName: 'submetas',
    timestamps: true
  }
)

// 5. Modelo CeldaCuadricula
export class CeldaCuadricula extends Model {
  declare id: number
  declare metaId: number
  declare monto: number
  declare estaTachada: boolean
  declare tachadaPorUsuarioId: number | null
  declare fechaTachado: Date | null
  declare createdAt: Date
  declare updatedAt: Date
}

CeldaCuadricula.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    metaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('monto')
        return val === null ? 0 : parseFloat(val)
      }
    },
    estaTachada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    tachadaPorUsuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fechaTachado: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize: bd,
    tableName: 'celdas_cuadricula',
    timestamps: true
  }
)

// 6. Modelo HistorialAbono
export class HistorialAbono extends Model {
  declare id: number
  declare metaId: number
  declare usuarioId: number
  declare celdaId: number | null
  declare monto: number
  declare tipo: 'cuadrito_tachado' | 'cuadrito_desmarcado' | 'abono_libre'
  declare nota: string | null
  declare fechaAbono: Date
  declare createdAt: Date
  declare updatedAt: Date
}

HistorialAbono.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    metaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    celdaId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('monto')
        return val === null ? 0 : parseFloat(val)
      }
    },
    tipo: {
      type: DataTypes.ENUM('cuadrito_tachado', 'cuadrito_desmarcado', 'abono_libre'),
      allowNull: false
    },
    nota: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fechaAbono: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize: bd,
    tableName: 'historial_abonos',
    timestamps: true
  }
)

// ==========================================
// MÓDULO EVENTOS / LA VACA (RECAUDACIÓN GRUPAL)
// ==========================================

// 7. Modelo EventoVaca
export class EventoVaca extends Model {
  declare id: number
  declare titulo: string
  declare descripcion: string | null
  declare fechaEvento: string | null
  declare montoTotal: number
  declare pagosPorPersona: number
  declare creadorId: number
  declare receptorPagoNombre: string
  declare receptorPagoUsuarioId: number | null
  declare datosPagoMovil: string | null
  declare estado: 'recaudando' | 'completada'
  declare createdAt: Date
  declare updatedAt: Date
}

EventoVaca.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fechaEvento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    montoTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('montoTotal')
        return val === null ? 0 : parseFloat(val)
      }
    },
    pagosPorPersona: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    creadorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receptorPagoNombre: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    receptorPagoUsuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    datosPagoMovil: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('recaudando', 'completada'),
      allowNull: false,
      defaultValue: 'recaudando'
    }
  },
  {
    sequelize: bd,
    tableName: 'eventos_vaca',
    timestamps: true
  }
)

// 8. Modelo RubroVaca (Presupuesto del evento)
export class RubroVaca extends Model {
  declare id: number
  declare vacaId: number
  declare concepto: string
  declare monto: number
  declare icono: string
  declare orden: number
  declare createdAt: Date
  declare updatedAt: Date
}

RubroVaca.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vacaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    concepto: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('monto')
        return val === null ? 0 : parseFloat(val)
      }
    },
    icono: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '🥩'
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
    sequelize: bd,
    tableName: 'rubros_vaca',
    timestamps: true
  }
)

// 9. Modelo ParticipanteVaca
export class ParticipanteVaca extends Model {
  declare id: number
  declare vacaId: number
  declare usuarioId: number | null
  declare nombreParticipante: string
  declare nombreUsuario: string | null
  declare correo: string | null
  declare colorAvatar: string
  declare montoAsignado: number
  declare esReceptorPago: boolean
  declare createdAt: Date
  declare updatedAt: Date
}

ParticipanteVaca.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vacaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nombreParticipante: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    nombreUsuario: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    correo: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    colorAvatar: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '#58CC02'
    },
    montoAsignado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('montoAsignado')
        return val === null ? 0 : parseFloat(val)
      }
    },
    esReceptorPago: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize: bd,
    tableName: 'participantes_vaca',
    timestamps: true
  }
)

// 10. Modelo CasillaVaca (Cuadritos de pago)
export class CasillaVaca extends Model {
  declare id: number
  declare vacaId: number
  declare participanteId: number
  declare numeroCuota: number
  declare monto: number
  declare estaPagada: boolean
  declare estadoVerificacion: 'pendiente' | 'en_revision' | 'verificado' | 'rechazado'
  declare metodoPago: 'comprobante' | 'efectivo' | null
  declare comprobanteUrl: string | null
  declare referenciaPago: string | null
  declare notaPago: string | null
  declare fechaPago: Date | null
  declare createdAt: Date
  declare updatedAt: Date
}

CasillaVaca.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    vacaId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    participanteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    numeroCuota: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('monto')
        return val === null ? 0 : parseFloat(val)
      }
    },
    estaPagada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    estadoVerificacion: {
      type: DataTypes.ENUM('pendiente', 'en_revision', 'verificado', 'rechazado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    metodoPago: {
      type: DataTypes.ENUM('comprobante', 'efectivo'),
      allowNull: true
    },
    comprobanteUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referenciaPago: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    notaPago: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize: bd,
    tableName: 'casillas_vaca',
    timestamps: true
  }
)

// Relaciones
Usuario.hasMany(Meta, { foreignKey: 'creadorId', as: 'metasCreadas' })
Meta.belongsTo(Usuario, { foreignKey: 'creadorId', as: 'creador' })

Meta.hasMany(MiembroMeta, { foreignKey: 'metaId', as: 'miembros' })
MiembroMeta.belongsTo(Meta, { foreignKey: 'metaId', as: 'meta' })

Usuario.hasMany(MiembroMeta, { foreignKey: 'usuarioId', as: 'membresias' })
MiembroMeta.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })

Meta.hasMany(SubMeta, { foreignKey: 'metaId', as: 'submetas' })
SubMeta.belongsTo(Meta, { foreignKey: 'metaId', as: 'meta' })

Meta.hasMany(CeldaCuadricula, { foreignKey: 'metaId', as: 'celdas' })
CeldaCuadricula.belongsTo(Meta, { foreignKey: 'metaId', as: 'meta' })

CeldaCuadricula.belongsTo(Usuario, { foreignKey: 'tachadaPorUsuarioId', as: 'tachadaPor' })

Meta.hasMany(HistorialAbono, { foreignKey: 'metaId', as: 'historial' })
HistorialAbono.belongsTo(Meta, { foreignKey: 'metaId', as: 'meta' })

HistorialAbono.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })
HistorialAbono.belongsTo(CeldaCuadricula, { foreignKey: 'celdaId', as: 'celda' })

// Relaciones Módulo Eventos / La Vaca
Usuario.hasMany(EventoVaca, { foreignKey: 'creadorId', as: 'vacasCreadas' })
EventoVaca.belongsTo(Usuario, { foreignKey: 'creadorId', as: 'creador' })
EventoVaca.belongsTo(Usuario, { foreignKey: 'receptorPagoUsuarioId', as: 'receptorUsuario' })

EventoVaca.hasMany(RubroVaca, { foreignKey: 'vacaId', as: 'rubros' })
RubroVaca.belongsTo(EventoVaca, { foreignKey: 'vacaId', as: 'vaca' })

EventoVaca.hasMany(ParticipanteVaca, { foreignKey: 'vacaId', as: 'participantes' })
ParticipanteVaca.belongsTo(EventoVaca, { foreignKey: 'vacaId', as: 'vaca' })
ParticipanteVaca.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' })

EventoVaca.hasMany(CasillaVaca, { foreignKey: 'vacaId', as: 'casillas' })
CasillaVaca.belongsTo(EventoVaca, { foreignKey: 'vacaId', as: 'vaca' })

ParticipanteVaca.hasMany(CasillaVaca, { foreignKey: 'participanteId', as: 'casillas' })
CasillaVaca.belongsTo(ParticipanteVaca, { foreignKey: 'participanteId', as: 'participante' })

// Sincronización inicial
sincronizarBD()

export default {
  Usuario,
  Meta,
  MiembroMeta,
  SubMeta,
  CeldaCuadricula,
  HistorialAbono,
  EventoVaca,
  RubroVaca,
  ParticipanteVaca,
  CasillaVaca,
  sincronizarBD
}
