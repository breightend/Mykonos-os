import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { LoaderCircle, CloudUpload, Trash2 } from 'lucide-react'

// Helper function to convert a file to a base64 string
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Helper function to create a displayable URL from base64
const base64ToObjectUrl = (base64Data) => {
  if (!base64Data) return ''
  try {
    const byteCharacters = atob(base64Data.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' }) // You can adjust MIME type
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error converting base64 to object URL:', error)
    return ''
  }
}

export default function ProductImageUploader({ productImage, onImageDrop, onImageRemove, error }) {
  // Local state for this specific uploader instance
  const [isUploading, setIsUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10485760, // 10 MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setIsUploading(true)
        try {
          const base64 = await convertToBase64(file)
          onImageDrop(base64) // Pass the result up to the parent
        } catch (err) {
          console.error('Error converting image:', err)
          // You could also pass an error message up to the parent
        } finally {
          setIsUploading(false)
        }
      }
    }
  })

  return (
    <div>
      {/* Image Preview */}
      {productImage && (
        <div className="relative mx-auto mb-4 flex flex-col items-center justify-center">

          <div className="group relative h-40 w-40 overflow-hidden rounded-2xl shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-base-100 transition-transform duration-200 hover:scale-105 hover:ring-accent">
            <img
              src={base64ToObjectUrl(productImage)}
              alt="Vista previa del producto"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />

            <button
              type="button"
              onClick={onImageRemove}
              title="Quitar imagen"
              className="absolute right-2 top-2 z-10 flex h-9 w-9 scale-90 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-error hover:!opacity-100 group-hover:scale-100 group-hover:opacity-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-base-300'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {isUploading ? (
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <CloudUpload className="h-6 w-6 text-primary" />
            )}
          </div>
          <p className="text-sm font-semibold">
            {isUploading
              ? 'Procesando...'
              : isDragActive
                ? '¡Suelta la imagen!'
                : 'Arrastra o haz clic para subir'}
          </p>
          <p className="text-base-content/60 text-xs">Hasta 10MB</p>
        </div>
      </div>
      {error && <span className="mt-1 text-xs text-error">{error}</span>}
    </div>
  )
}
