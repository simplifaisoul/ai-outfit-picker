const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));

// In-memory storage for Netlify Functions
let db = null;

// Initialize database
const initDb = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(':memory:');
    
    db.serialize(() => {
      db.run(`
        CREATE TABLE wardrobe_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_url TEXT NOT NULL,
          category TEXT NOT NULL,
          color TEXT,
          style TEXT,
          season TEXT,
          occasion TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE outfits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          items TEXT NOT NULL,
          occasion TEXT,
          season TEXT,
          weather TEXT,
          rating INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE saved_outfits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          outfit_id INTEGER,
          date DATE,
          notes TEXT
        )
      `);
    });
    
    resolve();
  });
};

// Helper function to process base64 image
const processBase64Image = async (base64String) => {
  try {
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }

    const imageType = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    return `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// API Routes
exports.handler = async (event, context) => {
  if (!db) {
    await initDb();
  }

  const { httpMethod, path: eventPath, body, queryStringParameters } = event;
  
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Parse path
    const pathParts = eventPath.replace('/.netlify/functions/api', '').split('/').filter(Boolean);
    
    if (pathParts[0] === 'wardrobe') {
      if (httpMethod === 'GET') {
        const category = queryStringParameters?.category;
        let query = 'SELECT * FROM wardrobe_items';
        let params = [];

        if (category && category !== 'all') {
          query += ' WHERE category = ?';
          params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        return new Promise((resolve, reject) => {
          db.all(query, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify(rows)
              });
            }
          });
        });
      }

      if (httpMethod === 'POST') {
        const data = JSON.parse(body);
        const { image, category, color, style, season, occasion } = data;

        if (!image || !category) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Image and category are required' })
          };
        }

        try {
          const processedImage = await processBase64Image(image);
          
          return new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO wardrobe_items (image_url, category, color, style, season, occasion) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [processedImage, category, color, style, season, occasion],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                      id: this.lastID,
                      image_url: processedImage,
                      category,
                      color,
                      style,
                      season,
                      occasion
                    })
                  });
                }
              }
            );
          });
        } catch (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to process image' })
          };
        }
      }

      if (httpMethod === 'DELETE') {
        const id = pathParts[1];
        
        return new Promise((resolve, reject) => {
          db.run('DELETE FROM wardrobe_items WHERE id = ?', [id], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Item deleted successfully' })
              });
            }
          });
        });
      }
    }

    if (pathParts[0] === 'outfits') {
      if (pathParts[1] === 'generate' && httpMethod === 'POST') {
        const data = JSON.parse(body);
        const { occasion, weather, count = 5 } = data;

        return new Promise((resolve, reject) => {
          db.all('SELECT * FROM wardrobe_items', [], async (err, items) => {
            if (err) {
              reject(err);
              return;
            }

            if (items.length < 2) {
              resolve({
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Not enough items in wardrobe to generate outfits' })
              });
              return;
            }

            const outfits = generateOutfits(items, { occasion, weather }, count);
            
            resolve({
              statusCode: 200,
              headers,
              body: JSON.stringify({ outfits })
            });
          });
        });
      }

      if (pathParts[1] === 'save' && httpMethod === 'POST') {
        const data = JSON.parse(body);
        const { outfit, occasion, date, notes } = data;

        return new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO outfits (name, items, occasion, season, weather) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              `Outfit for ${occasion}`,
              JSON.stringify(outfit.items),
              occasion,
              outfit.weather?.season || 'all',
              JSON.stringify(outfit.weather)
            ],
            function(err) {
              if (err) {
                reject(err);
              } else {
                if (date) {
                  db.run(
                    'INSERT INTO saved_outfits (outfit_id, date, notes) VALUES (?, ?, ?)',
                    [this.lastID, date, notes]
                  );
                }
                
                resolve({
                  statusCode: 200,
                  headers,
                  body: JSON.stringify({
                    message: 'Outfit saved successfully',
                    outfitId: this.lastID
                  })
                });
              }
            }
          );
        });
      }
    }

    if (pathParts[0] === 'weather' && httpMethod === 'GET') {
      // Mock weather data
      const mockWeather = {
        temperature: Math.floor(Math.random() * 40) + 50,
        condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 50) + 30,
        season: new Date().getMonth() >= 3 && new Date().getMonth() <= 9 ? 'summer' : 'winter'
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockWeather)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function generateOutfits(items, preferences, count) {
  const outfits = [];
  const categories = {
    tops: items.filter(item => item.category === 'tops'),
    bottoms: items.filter(item => item.category === 'bottoms'),
    dresses: items.filter(item => item.category === 'dresses'),
    outerwear: items.filter(item => item.category === 'outerwear'),
    shoes: items.filter(item => item.category === 'shoes'),
    accessories: items.filter(item => item.category === 'accessories')
  };

  for (let i = 0; i < count; i++) {
    const outfit = [];
    
    if (categories.dresses.length > 0 && Math.random() > 0.5) {
      const dress = categories.dresses[Math.floor(Math.random() * categories.dresses.length)];
      outfit.push(dress);
      
      if (categories.shoes.length > 0) {
        const shoes = categories.shoes[Math.floor(Math.random() * categories.shoes.length)];
        outfit.push(shoes);
      }
    } else {
      if (categories.tops.length > 0) {
        const top = categories.tops[Math.floor(Math.random() * categories.tops.length)];
        outfit.push(top);
      }
      
      if (categories.bottoms.length > 0) {
        const bottom = categories.bottoms[Math.floor(Math.random() * categories.bottoms.length)];
        outfit.push(bottom);
      }
      
      if (categories.shoes.length > 0) {
        const shoes = categories.shoes[Math.floor(Math.random() * categories.shoes.length)];
        outfit.push(shoes);
      }
    }

    if (preferences.weather && preferences.weather.temperature < 60 && categories.outerwear.length > 0) {
      const outerwear = categories.outerwear[Math.floor(Math.random() * categories.outerwear.length)];
      outfit.push(outerwear);
    }

    if (categories.accessories.length > 0 && Math.random() > 0.3) {
      const accessory = categories.accessories[Math.floor(Math.random() * categories.accessories.length)];
      outfit.push(accessory);
    }

    if (outfit.length > 0) {
      outfits.push({
        id: `generated-${i}`,
        items: outfit,
        occasion: preferences.occasion || 'casual',
        weather: preferences.weather,
        score: Math.random() * 5
      });
    }
  }

  return outfits.sort((a, b) => b.score - a.score);
}