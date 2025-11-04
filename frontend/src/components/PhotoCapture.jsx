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
          max-width: 600px;
          margin: 0 auto;
        }
        
        .capture-container {
          background: #fff;
          border: 1px solid #e0e0e0;
          overflow: hidden;
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
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
        }
        
        .capture-btn, .cancel-btn {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }
        
        .capture-btn {
          background: #333;
          border-color: #333;
          color: #fff;
        }
        
        .capture-btn:hover {
          background: #000;
          transform: scale(1.05);
        }
        
        .cancel-btn {
          background: #fff;
          color: #333;
        }
        
        .cancel-btn:hover {
          background: #f0f0f0;
        }
        
        .capture-options {
          padding: 50px 30px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        
        .camera-btn, .upload-btn {
          padding: 30px;
          border: 1px solid #d0d0d0;
          background: #fff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          transition: all 0.3s ease;
        }
        
        .camera-btn:hover, .upload-btn:hover {
          border-color: #333;
          background: #f8f8f8;
        }
        
        .camera-btn span, .upload-btn span {
          font-size: 1.1rem;
          letter-spacing: 0.5px;
          color: #333;
        }
        
        .photo-review {
          padding: 30px;
        }
        
        .captured-image {
          width: 100%;
          height: auto;
          border: 1px solid #e0e0e0;
          margin-bottom: 30px;
        }
        
        .review-controls {
          display: flex;
          gap: 15px;
        }
        
        .retake-btn, .save-btn {
          flex: 1;
          padding: 15px;
          border: 1px solid #333;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .retake-btn {
          color: #666;
          border-color: #666;
        }
        
        .retake-btn:hover {
          background: #666;
          color: #fff;
        }
        
        .save-btn {
          background: #333;
          color: #fff;
          border-color: #333;
        }
        
        .save-btn:hover:not(:disabled) {
          background: #000;
          border-color: #000;
        }
        
        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default PhotoCapture;