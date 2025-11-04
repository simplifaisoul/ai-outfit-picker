import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

let db;

const initDb = async () => {
  try {
    db = await open({
      filename: './wardrobe.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS wardrobe_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        category TEXT NOT NULL,
        color TEXT,
        style TEXT,
        season TEXT,
        occasion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        items TEXT NOT NULL,
        occasion TEXT,
        season TEXT,
        weather TEXT,
        rating INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS saved_outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outfit_id INTEGER,
        date DATE,
        notes TEXT,
        FOREIGN KEY (outfit_id) REFERENCES outfits (id)
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

app.get('/api/wardrobe', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM wardrobe_items';
    let params = [];

    if (category && category !== 'all') {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const items = await db.all(query, params);
    res.json(items);
  } catch (error) {
    console.error('Error fetching wardrobe:', error);
    res.status(500).json({ error: 'Failed to fetch wardrobe items' });
  }
});

app.post('/api/wardrobe', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { category, color, style, season, occasion } = req.body;

    // Process image with sharp
    const processedImagePath = `processed-${req.file.filename}`;
    await sharp(req.file.path)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(path.join('uploads', processedImagePath));

    const imageUrl = `/uploads/${processedImagePath}`;

    const result = await db.run(
      `INSERT INTO wardrobe_items (image_url, category, color, style, season, occasion) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [imageUrl, category, color, style, season, occasion]
    );

    res.json({
      id: result.lastID,
      image_url: imageUrl,
      category,
      color,
      style,
      season,
      occasion
    });
  } catch (error) {
    console.error('Error adding wardrobe item:', error);
    res.status(500).json({ error: 'Failed to add wardrobe item' });
  }
});

app.delete('/api/wardrobe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the item to delete the image file
    const item = await db.get('SELECT image_url FROM wardrobe_items WHERE id = ?', [id]);
    
    if (item) {
      const imagePath = path.join(__dirname, item.image_url);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }

    await db.run('DELETE FROM wardrobe_items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting wardrobe item:', error);
    res.status(500).json({ error: 'Failed to delete wardrobe item' });
  }
});

app.post('/api/outfits/generate', async (req, res) => {
  try {
    const { occasion, weather, count = 5 } = req.body;

    // Get all wardrobe items
    const items = await db.all('SELECT * FROM wardrobe_items');
    
    if (items.length < 2) {
      return res.status(400).json({ error: 'Not enough items in wardrobe to generate outfits' });
    }

    const outfits = generateOutfits(items, { occasion, weather }, count);
    
    res.json({ outfits });
  } catch (error) {
    console.error('Error generating outfits:', error);
    res.status(500).json({ error: 'Failed to generate outfits' });
  }
});

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
    
    // Basic outfit logic
    if (categories.dresses.length > 0 && Math.random() > 0.5) {
      // Dress-based outfit
      const dress = categories.dresses[Math.floor(Math.random() * categories.dresses.length)];
      outfit.push(dress);
      
      if (categories.shoes.length > 0) {
        const shoes = categories.shoes[Math.floor(Math.random() * categories.shoes.length)];
        outfit.push(shoes);
      }
    } else {
      // Top + bottom outfit
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

    // Add outerwear if weather suggests it
    if (preferences.weather && preferences.weather.temperature < 60 && categories.outerwear.length > 0) {
      const outerwear = categories.outerwear[Math.floor(Math.random() * categories.outerwear.length)];
      outfit.push(outerwear);
    }

    // Add accessories occasionally
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
        score: Math.random() * 5 // Random "AI" score for now
      });
    }
  }

  return outfits.sort((a, b) => b.score - a.score);
}

app.post('/api/outfits/save', async (req, res) => {
  try {
    const { outfit, occasion, date, notes } = req.body;

    const result = await db.run(
      `INSERT INTO outfits (name, items, occasion, season, weather) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        `Outfit for ${occasion}`,
        JSON.stringify(outfit.items),
        occasion,
        outfit.weather?.season || 'all',
        JSON.stringify(outfit.weather)
      ]
    );

    if (date) {
      await db.run(
        'INSERT INTO saved_outfits (outfit_id, date, notes) VALUES (?, ?, ?)',
        [result.lastID, date, notes]
      );
    }

    res.json({ 
      message: 'Outfit saved successfully',
      outfitId: result.lastID 
    });
  } catch (error) {
    console.error('Error saving outfit:', error);
    res.status(500).json({ error: 'Failed to save outfit' });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    // Mock weather data - in production, integrate with real weather API
    const mockWeather = {
      temperature: Math.floor(Math.random() * 40) + 50, // 50-90°F
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
      humidity: Math.floor(Math.random() * 50) + 30,
      season: new Date().getMonth() >= 3 && new Date().getMonth() <= 9 ? 'summer' : 'winter'
    };
    
    res.json(mockWeather);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on port ${PORT}`);
});