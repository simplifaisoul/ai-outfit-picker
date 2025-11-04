# AI Outfit Picker

An AI-powered outfit picker application that helps you choose the perfect outfit every day based on your wardrobe, weather conditions, and occasions.

## 🚀 Live Demo

**Deployed on Netlify**: [https://ai-outfit-picker.netlify.app](https://ai-outfit-picker.netlify.app)

## ✨ Features

- 📸 **Photo Capture**: Take photos or upload images of your clothes to build a digital wardrobe
- 🤖 **AI Recommendations**: Get personalized outfit suggestions based on weather and occasion
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🗄️ **Wardrobe Management**: Organize your clothes by category, color, style, and occasion
- 🌤️ **Weather Integration**: Automatic weather-based outfit recommendations
- ⏰ **Daily Suggestions**: Automated daily outfit recommendations via n8n workflow

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Lucide React (icons)
- Axios

### Backend (Netlify Functions)
- Node.js
- Express
- SQLite (in-memory for serverless)
- Sharp (image processing)
- Multer (file uploads)

### Deployment
- Netlify (Frontend + Serverless Functions)
- GitHub (Source Control)

## 📱 How to Use

### 1. Build Your Wardrobe
- Navigate to "Add Item" or "Wardrobe" section
- Take photos or upload images of your clothes
- Categorize items by type (tops, bottoms, dresses, etc.)

### 2. Get Outfit Suggestions
- Go to "Outfit Picker"
- Select the occasion (casual, work, formal, etc.)
- View AI-generated outfit combinations
- Save your favorite outfits

### 3. Set Up Daily Suggestions (Optional)
- Import the n8n workflow from `n8n-workflow.json`
- Configure your email settings in n8n
- Activate the workflow for daily outfit suggestions

## 🚀 Deployment

This project is configured for Netlify deployment:

### Automatic Deployment
1. Push changes to GitHub
2. Netlify automatically builds and deploys the site
3. The site is live at your Netlify URL

### Manual Deployment Steps
1. **Connect GitHub Repository**
   - Go to Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account
   - Select the `ai-outfit-picker` repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Node version: 18

3. **Environment Variables** (if needed)
   - Add any required environment variables in Netlify dashboard

### Local Development

```bash
# Clone the repository
git clone https://github.com/simplifaisoul/ai-outfit-picker.git
cd ai-outfit-picker

# Install dependencies
npm install
cd frontend && npm install

# Start development server
npm run dev
```

## 📁 Project Structure

```
ai-outfit-picker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PhotoCapture.jsx
│   │   │   ├── WardrobeManager.jsx
│   │   │   └── OutfitPicker.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── netlify/
│   └── functions/
│       └── api.js
├── netlify.toml
├── package.json
├── n8n-workflow.json
└── README.md
```

## 🔧 Configuration Files

### `netlify.toml`
- Configures build settings for Netlify
- Sets up redirects for API calls to serverless functions
- Handles SPA routing

### `netlify/functions/api.js`
- Serverless function handling all API endpoints
- In-memory SQLite database for wardrobe storage
- Image processing with Sharp
- CORS enabled for frontend communication

## 🎨 Features in Detail

### Photo Capture Component
- Camera access using WebRTC
- File upload support
- Image preview and retake functionality
- Base64 encoding for serverless compatibility

### Wardrobe Management
- Grid layout with responsive design
- Category filtering
- Item deletion and editing
- Image optimization

### Outfit Generation Algorithm
- Weather-based recommendations
- Occasion-specific outfit creation
- Multiple outfit options with scoring
- Category-based item selection

## 🌐 API Endpoints

All API calls are proxied through Netlify functions:

- `GET /api/wardrobe` - Get all wardrobe items
- `POST /api/wardrobe` - Add new wardrobe item
- `DELETE /api/wardrobe/:id` - Delete wardrobe item
- `POST /api/outfits/generate` - Generate outfit suggestions
- `POST /api/outfits/save` - Save an outfit
- `GET /api/weather` - Get current weather data

## 🔮 Future Enhancements

- [ ] Real weather API integration
- [ ] Machine learning for better outfit recommendations
- [ ] Outfit rating and learning system
- [ ] Social sharing features
- [ ] Mobile app development
- [ ] Style trend analysis
- [ ] Shopping recommendations based on wardrobe gaps
- [ ] Persistent database with Netlify's database service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Netlify for providing excellent serverless hosting
- React community for amazing UI components
- Sharp for powerful image processing
- All contributors and users of this project