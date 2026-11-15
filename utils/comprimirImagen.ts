/**
 * Comprime en el navegador cualquier captura de pantalla (capture) antes de enviarla al backend.
 * Reduce el tamaño a un ancho/alto máximo de 800px y comprime en formato JPEG a 75% de calidad.
 */
export function comprimirImagen(archivo: File, calidad: number = 0.75, dimensionMaxima: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!archivo.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida'))
      return
    }

    const lector = new FileReader()
    lector.onload = (evento) => {
      const img = new Image()
      img.onload = () => {
        let ancho = img.width
        let alto = img.height

        if (ancho > dimensionMaxima || alto > dimensionMaxima) {
          if (ancho > alto) {
            alto = Math.round((alto * dimensionMaxima) / ancho)
            ancho = dimensionMaxima
          } else {
            ancho = Math.round((ancho * dimensionMaxima) / alto)
            dimensionMaxima
            ancho = Math.round((ancho * dimensionMaxima) / img.height)
            alto = dimensionMaxima
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = ancho
        canvas.height = alto
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('No se pudo inicializar el procesador de imágenes del navegador'))
          return
        }

        ctx.drawImage(img, 0, 0, ancho, alto)
        const imagenComprimidaBase64 = canvas.toDataURL('image/jpeg', calidad)
        resolve(imagenComprimidaBase64)
      }

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen para compresión'))
      }

      img.src = evento.target?.result as string
    }

    lector.onerror = () => {
      reject(new Error('Error al leer el archivo de comprobante'))
    }

    lector.readAsDataURL(archivo)
  })
}
