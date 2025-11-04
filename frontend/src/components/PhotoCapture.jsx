import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';

const PhotoCapture = ({ onPhotoCapture, category }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    stopCamera();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const savePhoto = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/.netlify/functions/api/wardrobe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          category: category,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        onPhotoCapture && onPhotoCapture(result);
        setCapturedImage(null);
      } else {
        throw new Error('Failed to save photo');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Failed to save photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="photo-capture">
      <div className="capture-container">
        {!capturedImage ? (
          <>
            {isStreaming ? (
              <div className="camera-preview">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="video-feed"
                />
                <div className="camera-controls">
                  <button onClick={capturePhoto} className="capture-btn">
                    <Camera size={24} />
                  </button>
                  <button onClick={stopCamera} className="cancel-btn">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="capture-options">
                <button onClick={startCamera} className="camera-btn">
                  <Camera size={32} />
                  <span>Take Photo</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="upload-btn"
                >
                  <Upload size={32} />
                  <span>Upload Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="photo-review">
            <img src={capturedImage} alt="Captured clothing item" className="captured-image" />
            <div className="review-controls">
              <button onClick={retakePhoto} className="retake-btn">
                <X size={20} />
                Retake
              </button>
              <button 
                onClick={savePhoto} 
                className="save-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <Check size={20} />
                    Save to Wardrobe
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <style jsx>{`
        .photo-capture {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .capture-container {
          background: #f8f9fa;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .camera-preview {
          position: relative;
        }
        
        .video-feed {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .camera-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
        }
        
        .capture-btn, .cancel-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .capture-btn {
          background: #007bff;
          color: white;
        }
        
        .capture-btn:hover {
          background: #0056b3;
          transform: scale(1.1);
        }
        
        .cancel-btn {
          background: #dc3545;
          color: white;
        }
        
        .cancel-btn:hover {
          background: #c82333;
        }
        
        .capture-options {
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .camera-btn, .upload-btn {
          padding: 20px;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }
        
        .camera-btn:hover, .upload-btn:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .photo-review {
          padding: 20px;
        }
        
        .captured-image {
          width: 100%;
          height: auto;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .review-controls {
          display: flex;
          gap: 10px;
        }
        
        .retake-btn, .save-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        
        .retake-btn {
          background: #6c757d;
          color: white;
        }
        
        .retake-btn:hover {
          background: #5a6268;
        }
        
        .save-btn {
          background: #28a745;
          color: white;
        }
        
        .save-btn:hover:not(:disabled) {
          background: #218838;
        }
        
        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default PhotoCapture;