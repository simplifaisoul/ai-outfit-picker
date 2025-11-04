# AI Outfit Picker

An AI-powered outfit picker application that helps you choose the perfect outfit every day based on your wardrobe, weather conditions, and occasions.

## Features

- 📸 **Photo Capture**: Take photos or upload images of your clothes to build a digital wardrobe
- 🤖 **AI Recommendations**: Get personalized outfit suggestions based on weather and occasion
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🗄️ **Wardrobe Management**: Organize your clothes by category, color, style, and occasion
- 🌤️ **Weather Integration**: Automatic weather-based outfit recommendations
- ⏰ **Daily Suggestions**: Automated daily outfit recommendations via n8n workflow

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Lucide React (icons)
- Axios

### Backend
- Node.js
- Express
- SQLite
- Sharp (image processing)
- Multer (file uploads)

### Automation
- n8n workflows for daily outfit suggestions

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/simplifaisoul/ai-outfit-picker.git
cd ai-outfit-picker
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development servers:
```bash
# From the root directory
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

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

## API Endpoints

### Wardrobe Management
- `GET /api/wardrobe` - Get all wardrobe items
- `POST /api/wardrobe` - Add new wardrobe item
- `DELETE /api/wardrobe/:id` - Delete wardrobe item

### Outfit Generation
- `POST /api/outfits/generate` - Generate outfit suggestions
- `POST /api/outfits/save` - Save an outfit

### Weather
- `GET /api/weather` - Get current weather data

## Project Structure

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
│   └── package.json
├── backend/
│   ├── server.js
│   ├── uploads/
│   └── package.json
├── n8n-workflow.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- [ ] Real weather API integration
- [ ] Machine learning for better outfit recommendations
- [ ] Outfit rating and learning system
- [ ] Social sharing features
- [ ] Mobile app development
- [ ] Style trend analysis
- [ ] Shopping recommendations based on wardrobe gaps