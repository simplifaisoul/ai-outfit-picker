import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WardrobeManager from './components/WardrobeManager';
import OutfitPicker from './components/OutfitPicker';
import PhotoCapture from './components/PhotoCapture';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>👔 AI Outfit Picker</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/wardrobe" className="nav-link">Wardrobe</Link>
            <Link to="/outfit-picker" className="nav-link">Outfit Picker</Link>
            <Link to="/add-item" className="nav-link">Add Item</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wardrobe" element={<WardrobeManager />} />
            <Route path="/outfit-picker" element={<OutfitPicker />} />
            <Route path="/add-item" element={<AddItem />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h2>Welcome to AI Outfit Picker</h2>
        <p>Let AI help you choose the perfect outfit every day!</p>
        <div className="hero-actions">
          <Link to="/add-item" className="btn btn-primary">
            Start Building Your Wardrobe
          </Link>
          <Link to="/outfit-picker" className="btn btn-secondary">
            Get Today's Outfit
          </Link>
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <h3>📸 Photo Capture</h3>
          <p>Take photos of your clothes to build your digital wardrobe</p>
        </div>
        <div className="feature">
          <h3>🤖 AI Recommendations</h3>
          <p>Get personalized outfit suggestions based on weather and occasion</p>
        </div>
        <div className="feature">
          <h3>📱 Easy Management</h3>
          <p>Organize and manage your wardrobe with our intuitive interface</p>
        </div>
      </div>
    </div>
  );
}

function AddItem() {
  return (
    <div className="add-item-page">
      <h2>Add New Item to Wardrobe</h2>
      <PhotoCapture />
    </div>
  );
}

export default App;