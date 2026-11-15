# 🦉 Metas de Ahorro Gamificadas ($ USD)

Una Progressive Web App (PWA) moderna, adictiva y gamificada inspirada en la psicología visual y háptica de **Duolingo** para ahorrar dinero quincenalmente en dólares estadounidenses.

---

## 🚀 Características Principales

1. **Diseño Gamificado Chunky 3D (Estilo Duolingo):**
   - Botones y tarjetas con bordes gruesos (`border-b-4` y `border-b-[6px]`) que se hunden físicamente al tocarlos.
   - Barras de progreso con efecto jugoso de cápsula y destello translúcido.
   - Celebraciones con confeti al tachar cuadritos y cumplir metas o hitos.
   - Racha quincenal (🔥) que premia la constancia.

2. **Tres Vistas Gamificadas:**
   - 🟩 **El Tablero:** Cuadrícula de cuadritos con montos redondos generados dinámicamente mediante algoritmo inteligente.
   - 🗺️ **El Camino de Hitos:** Desglose secuencial de sub-metas (ej. 🪪 Licencia $100 ➔ 🪖 Cascos $150 ➔ 🏍️ Moto $1,400) que se van desbloqueando a medida que acumulas dinero.
   - 📅 **Calendario e Historial:** Calendario interactivo mes a mes donde los días con ahorro brillan en verde esmeralda y al tocarlos se filtra el historial detallado de movimientos.

3. **Abonos Flexibles y Metas Compartidas:**
   - Botón de **Abono Libre** para registrar ingresos imprevistos o bonos fuera de los cuadritos.
   - Modo de **Meta Compartida** para invitar a tu pareja o familiar por correo y ahorrar en equipo.

4. **Soporte Dual Nativo (Light & Dark Mode):**
   - Modo Claro con fondos suaves y tarjetas blancas.
   - Modo Oscuro estilo Duolingo Dark (#131F24).

---

## 🛠️ Stack Tecnológico

- **Frontend & Fullstack:** Nuxt 3 (SSR + Nitro Server Routes)
- **UI & Estilos:** @nuxt/ui + Tailwind CSS
- **Estado Global:** Pinia
- **PWA:** @vite-pwa/nuxt (Instalable en iOS y Android)
- **Base de Datos & ORM:** PostgreSQL con Sequelize (con fallback SQLite local para desarrollo inmediato sin configuración previa)
- **Seguridad:** JWT en cookies HTTP-only + contraseñas cifradas con bcryptjs + esquemas de validación Zod

---

## 🏃‍♂️ Cómo Ejecutar en Desarrollo Local

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará lista en `http://localhost:3000`.

---

## 🌐 Despliegue en Producción (Vercel / Supabase / Neon)

1. En tu panel de Vercel o hosting favorito, agrega las siguientes variables de entorno:
   - `DATABASE_URL`: Tu cadena de conexión PostgreSQL (ej. Neon o Supabase: `postgres://usuario:clave@host:5432/db`)
   - `JWT_SECRET`: Una clave secreta segura para firmar tokens.

2. El proyecto sincronizará automáticamente las tablas en PostgreSQL con Sequelize (`sync({ alter: true })`).
