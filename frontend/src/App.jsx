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
            <h1>Outfit Picker</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/wardrobe" className="nav-link">Wardrobe</Link>
            <Link to="/outfit-picker" className="nav-link">Outfits</Link>
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
        <h2>Dress Better Every Day</h2>
        <p>Curated outfit recommendations based on your wardrobe and lifestyle</p>
        <div className="hero-actions">
          <Link to="/add-item" className="btn btn-primary">
            Build Your Wardrobe
          </Link>
          <Link to="/outfit-picker" className="btn btn-secondary">
            Today's Outfit
          </Link>
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <h3>Photography</h3>
          <p>Capture your clothing collection with our intuitive photo system</p>
        </div>
        <div className="feature">
          <h3>Smart Curation</h3>
          <p>Intelligent outfit suggestions tailored to your style and needs</p>
        </div>
        <div className="feature">
          <h3>Timeless Design</h3>
          <p>Classic interface focused on simplicity and functionality</p>
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