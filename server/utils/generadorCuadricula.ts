/**
 * Generador de montos de cuadrícula gamificada de ahorro.
 * Reglas:
 * 1. La suma total de los montos debe ser exactamente igual a montoObjetivo.
 * 2. Ningún monto puede ser superior a topeMaximoCelda.
 * 3. Los montos son variados y redondos (múltiplos de $5 o $1 según aplique).
 * 4. El arreglo resultante está mezclado aleatoriamente para mayor dinamismo quincenal.
 */
export function generarMontosCuadricula(montoObjetivo: number, topeMaximoCelda: number): number[] {
  if (montoObjetivo <= 0 || topeMaximoCelda <= 0) {
    throw new Error('El monto objetivo y el tope máximo deben ser mayores a cero.')
  }

  // Si el objetivo es menor o igual al tope, una sola celda basta
  if (montoObjetivo <= topeMaximoCelda) {
    return [montoObjetivo]
  }

  const esMultiploDe5 = montoObjetivo % 5 === 0 && topeMaximoCelda % 5 === 0
  const pasoMinimo = esMultiploDe5 ? 5 : 1

  // Construir opciones de denominaciones interesantes hasta el tope
  const opcionesBase = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100, 125, 150, 200]
  let denominacionesValidas = opcionesBase.filter(
    (valor) => valor <= topeMaximoCelda && valor >= pasoMinimo && (esMultiploDe5 ? valor % 5 === 0 : true)
  )

  if (!denominacionesValidas.includes(topeMaximoCelda)) {
    denominacionesValidas.push(topeMaximoCelda)
  }

  denominacionesValidas.sort((a, b) => a - b)

  const celdas: number[] = []
  let restante = montoObjetivo

  while (restante > 0) {
    // Filtrar denominaciones que no excedan el restante
    const disponibles = denominacionesValidas.filter((d) => d <= restante)

    if (disponibles.length === 0) {
      // El restante es menor que la denominación más pequeña disponible
      celdas.push(Math.round(restante * 100) / 100)
      restante = 0
      break
    }

    // Elegir aleatoriamente con preferencia distribuida (pesos para variedad)
    const indiceAleatorio = Math.floor(Math.random() * disponibles.length)
    const montoElegido = disponibles[indiceAleatorio]

    celdas.push(montoElegido)
    restante = Math.round((restante - montoElegido) * 100) / 100
  }

  // Mezclar con algoritmo Fisher-Yates
  for (let i = celdas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temporal = celdas[i]
    celdas[i] = celdas[j]
    celdas[j] = temporal
  }

  return celdas
}
