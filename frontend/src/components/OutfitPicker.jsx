import React, { useState, useEffect } from 'react';
import { Shuffle, Calendar, Heart, Star } from 'lucide-react';

const OutfitPicker = () => {
  const [outfits, setOutfits] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [weather, setWeather] = useState(null);
  const [occasion, setOccasion] = useState('casual');
  const [isGenerating, setIsGenerating] = useState(false);

  const occasions = ['casual', 'work', 'formal', 'party', 'sport', 'date'];

  useEffect(() => {
    fetchWeather();
    generateOutfits();
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await fetch('/.netlify/functions/api/weather');
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const generateOutfits = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/.netlify/functions/api/outfits/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          occasion: occasion,
          weather: weather,
          count: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOutfits(data.outfits);
        if (data.outfits.length > 0) {
          setSelectedOutfit(data.outfits[0]);
        }
      }
    } catch (error) {
      console.error('Error generating outfits:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveOutfit = async (outfit) => {
    try {
      const response = await fetch('/.netlify/functions/api/outfits/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfit: outfit,
          occasion: occasion,
          date: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Outfit saved successfully!');
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
    }
  };

  const getWeatherIcon = (weather) => {
    if (!weather) return '🌤️';
    switch (weather.condition.toLowerCase()) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snowy': return '❄️';
      default: return '🌤️';
    }
  };

  return (
    <div className="outfit-picker">
      <div className="picker-header">
        <h2>Today's Outfit</h2>
        <div className="header-info">
          {weather && (
            <div className="weather-info">
              <span>{getWeatherIcon(weather)}</span>
              <span>{weather.temperature}°F</span>
            </div>
          )}
          <div className="date-info">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="occasion-selector">
        <label>Occasion:</label>
        <select 
          value={occasion} 
          onChange={(e) => setOccasion(e.target.value)}
          className="occasion-select"
        >
          {occasions.map(occ => (
            <option key={occ} value={occ}>
              {occ.charAt(0).toUpperCase() + occ.slice(1)}
            </option>
          ))}
        </select>
        <button 
          onClick={generateOutfits}
          disabled={isGenerating}
          className="generate-btn"
        >
          <Shuffle size={16} />
          {isGenerating ? 'Generating...' : 'Generate New'}
        </button>
      </div>

      {selectedOutfit && (
        <div className="selected-outfit">
          <h3>Recommended Outfit</h3>
          <div className="outfit-display">
            {selectedOutfit.items.map((item, index) => (
              <div key={index} className="outfit-item">
                <img src={item.image_url} alt={item.category} />
                <span className="item-label">{item.category}</span>
              </div>
            ))}
          </div>
          <div className="outfit-actions">
            <button 
              onClick={() => saveOutfit(selectedOutfit)}
              className="save-outfit-btn"
            >
              <Heart size={16} />
              Save Outfit
            </button>
            <button className="rate-btn">
              <Star size={16} />
              Rate
            </button>
          </div>
        </div>
      )}

      <div className="outfit-alternatives">
        <h3>More Options</h3>
        <div className="alternatives-grid">
          {outfits.map((outfit, index) => (
            <div 
              key={index}
              onClick={() => setSelectedOutfit(outfit)}
              className={`alternative-outfit ${selectedOutfit === outfit ? 'selected' : ''}`}
            >
              <div className="mini-outfit">
                {outfit.items.slice(0, 3).map((item, itemIndex) => (
                  <img 
                    key={itemIndex} 
                    src={item.image_url} 
                    alt={item.category}
                    className="mini-item"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .outfit-picker {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .picker-header h2 {
          margin: 0;
          color: #333;
        }
        
        .header-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .weather-info, .date-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-size: 14px;
        }
        
        .occasion-selector {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .occasion-selector label {
          font-weight: 500;
        }
        
        .occasion-select {
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
        }
        
        .generate-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .generate-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .selected-outfit {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        
        .selected-outfit h3 {
          margin-top: 0;
          color: #333;
        }
        
        .outfit-display {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        
        .outfit-item {
          text-align: center;
        }
        
        .outfit-item img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .item-label {
          font-size: 12px;
          color: #666;
          text-transform: capitalize;
        }
        
        .outfit-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .save-outfit-btn, .rate-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .save-outfit-btn {
          background: #28a745;
          color: white;
        }
        
        .save-outfit-btn:hover {
          background: #218838;
        }
        
        .rate-btn {
          background: #ffc107;
          color: white;
        }
        
        .rate-btn:hover {
          background: #e0a800;
        }
        
        .outfit-alternatives h3 {
          margin-bottom: 20px;
          color: #333;
        }
        
        .alternatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }
        
        .alternative-outfit {
          background: white;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .alternative-outfit:hover {
          border-color: #007bff;
        }
        
        .alternative-outfit.selected {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .mini-outfit {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        
        .mini-item {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default OutfitPicker;