import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Camera, Upload, X, Check } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { addWardrobeItem } from '@/store/slices/wardrobeSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { LoadingSpinner } from './UI/LoadingStates'
import { WardrobeItem } from '@/types'

interface PhotoCaptureProps {
  onPhotoCapture?: (item: WardrobeItem) => void
  category?: string
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ 
  onPhotoCapture, 
  category = 'tops' 
}) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(category)
  const [color, setColor] = useState('')
  const [style, setStyle] = useState('')
  const [season, setSeason] = useState('')
  const [tags, setTags] = useState('')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const dispatch = useAppDispatch()
  const loading = useAppSelector(state => state.ui.loading.wardrobe)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      dispatch(addNotification({
        type: 'error',
        title: 'Camera Error',
        message: 'Unable to access camera. Please check permissions.'
      }))
    }
  }

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setIsStreaming(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageData)
    setPreviewImage(imageData)
    stopCamera()
  }, [stopCamera])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCapturedImage(result)
        setPreviewImage(result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const retakePhoto = () => {
    setCapturedImage(null)
    setPreviewImage(null)
  }

  const savePhoto = async () => {
    if (!capturedImage) return
    
    try {
      const itemData = {
        image_url: capturedImage,
        category: selectedCategory,
        color: color || undefined,
        style: style || undefined,
        season: season || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined
      }

      await dispatch(addWardrobeItem(itemData)).unwrap()
      
      dispatch(addNotification({
        type: 'success',
        title: 'Success',
        message: 'Item added to wardrobe successfully'
      }))

      if (onPhotoCapture) {
        onPhotoCapture(itemData as WardrobeItem)
      }
      
      // Reset form
      setCapturedImage(null)
      setPreviewImage(null)
      setColor('')
      setStyle('')
      setSeason('')
      setTags('')
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save item. Please try again.'
      }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            Add to Wardrobe
          </h2>
          <p className="text-gray-600">
            Take a photo or upload an image to add items to your wardrobe.
          </p>
        </div>

        {/* Camera/Upload Area */}
        <div className="p-6">
          {!capturedImage ? (
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-black bg-gray-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              
              {isStreaming ? (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={capturePhoto}
                      className="px-6 py-3 bg-black text-white rounded-lg flex items-center gap-2"
                    >
                      <Camera size={20} />
                      Capture
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopCamera}
                      className="px-6 py-3 border border-gray-300 rounded-lg flex items-center gap-2"
                    >
                      <X size={20} />
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {isDragActive ? 'Drop your image here' : 'Drop image here or click to browse'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Supports JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startCamera}
                      className="px-6 py-3 bg-black text-white rounded-lg flex items-center gap-2"
                    >
                      <Camera size={20} />
                      Take Photo
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 border border-gray-300 rounded-lg flex items-center gap-2"
                    >
                      <Upload size={20} />
                      Choose File
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative">
                <img
                  src={previewImage || ''}
                  alt="Captured"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={retakePhoto}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="tops">Tops</option>
                    <option value="bottoms">Bottoms</option>
                    <option value="dresses">Dresses</option>
                    <option value="outerwear">Outerwear</option>
                    <option value="shoes">Shoes</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., Blue, Black, White"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g., Casual, Formal, Sport"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Season
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="">All Seasons</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., Work, Party, Comfortable"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={savePhoto}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Check size={20} />
                      Save to Wardrobe
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={retakePhoto}
                  className="px-6 py-3 border border-gray-300 rounded-lg"
                >
                  Retake
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PhotoCapture