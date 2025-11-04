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
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
        }
        
        .picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .picker-header h2 {
          margin: 0;
          color: #333;
          font-weight: 300;
          font-size: 2rem;
          letter-spacing: -0.5px;
        }
        
        .header-info {
          display: flex;
          gap: 25px;
          align-items: center;
        }
        
        .weather-info, .date-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: #fff;
          border: 1px solid #e0e0e0;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
        }
        
        .occasion-selector {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 40px;
          padding: 25px;
          background: #fff;
          border: 1px solid #e0e0e0;
        }
        
        .occasion-selector label {
          font-weight: 400;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .occasion-select {
          padding: 12px 16px;
          border: 1px solid #d0d0d0;
          background: #fff;
          font-size: 1rem;
        }
        
        .generate-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: #333;
          color: #fff;
          border: 1px solid #333;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .generate-btn:hover:not(:disabled) {
          background: #000;
          border-color: #000;
        }
        
        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .selected-outfit {
          background: #fff;
          border: 1px solid #e0e0e0;
          padding: 40px;
          margin-bottom: 40px;
        }
        
        .selected-outfit h3 {
          margin-top: 0;
          margin-bottom: 30px;
          color: #333;
          font-weight: 300;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
        }
        
        .outfit-display {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin: 40px 0;
          flex-wrap: wrap;
        }
        
        .outfit-item {
          text-align: center;
        }
        
        .outfit-item img {
          width: 140px;
          height: 140px;
          object-fit: cover;
          border: 1px solid #e0e0e0;
          margin-bottom: 12px;
        }
        
        .item-label {
          font-size: 0.9rem;
          color: #666;
          text-transform: capitalize;
          letter-spacing: 0.5px;
        }
        
        .outfit-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        
        .save-outfit-btn, .rate-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          border: 1px solid #333;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .save-outfit-btn {
          background: #333;
          color: #fff;
          border-color: #333;
        }
        
        .save-outfit-btn:hover {
          background: #000;
          border-color: #000;
        }
        
        .rate-btn {
          background: #fff;
          color: #333;
          border-color: #666;
        }
        
        .rate-btn:hover {
          background: #666;
          color: #fff;
          border-color: #666;
        }
        
        .outfit-alternatives {
          margin-top: 50px;
        }
        
        .outfit-alternatives h3 {
          margin-bottom: 30px;
          color: #333;
          font-weight: 300;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
        }
        
        .alternatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
        }
        
        .alternative-outfit {
          background: #fff;
          border: 1px solid #e0e0e0;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .alternative-outfit:hover {
          border-color: #333;
        }
        
        .alternative-outfit.selected {
          border-color: #333;
          background: #f8f8f8;
        }
        
        .mini-outfit {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }
        
        .mini-item {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border: 1px solid #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default OutfitPicker;