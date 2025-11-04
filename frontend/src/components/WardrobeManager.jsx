import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';

const WardrobeManager = () => {
  const [wardrobe, setWardrobe] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const categories = [
    'all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'
  ];

  useEffect(() => {
    fetchWardrobe();
  }, []);

  const fetchWardrobe = async () => {
    try {
      const response = await fetch('/.netlify/functions/api/wardrobe');
      if (response.ok) {
        const data = await response.json();
        setWardrobe(data);
      }
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/.netlify/functions/api/wardrobe/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setWardrobe(wardrobe.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredWardrobe = selectedCategory === 'all' 
    ? wardrobe 
    : wardrobe.filter(item => item.category === selectedCategory);

  return (
    <div className="wardrobe-manager">
      <div className="wardrobe-header">
        <h2>My Wardrobe</h2>
        <button 
          onClick={() => setIsAddingItem(true)}
          className="add-item-btn"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {isAddingItem && (
        <div className="add-item-modal">
          <div className="modal-content">
            <h3>Add New Item</h3>
            <select 
              value={selectedCategory === 'all' ? 'tops' : selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="">Select Category</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <PhotoCapture 
              onPhotoCapture={() => {
                setIsAddingItem(false);
                fetchWardrobe();
              }}
              category={selectedCategory === 'all' ? 'tops' : selectedCategory}
            />
            <button 
              onClick={() => setIsAddingItem(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="wardrobe-grid">
        {filteredWardrobe.map(item => (
          <div key={item.id} className="wardrobe-item">
            <img src={item.image_url} alt={item.category} className="item-image" />
            <div className="item-info">
              <span className="item-category">{item.category}</span>
              <div className="item-actions">
                <button className="action-btn view-btn">
                  <Eye size={16} />
                </button>
                <button className="action-btn edit-btn">
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="action-btn delete-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wardrobe-manager {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }
        
        .wardrobe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .wardrobe-header h2 {
          margin: 0;
          color: #333;
          font-weight: 300;
          font-size: 2rem;
          letter-spacing: -0.5px;
        }
        
        .add-item-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: #333;
          color: #fff;
          border: 1px solid #333;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .add-item-btn:hover {
          background: #000;
          border-color: #000;
        }
        
        .category-filter {
          display: flex;
          gap: 15px;
          margin-bottom: 40px;
          flex-wrap: wrap;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .category-btn {
          padding: 10px 20px;
          border: 1px solid #d0d0d0;
          background: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          text-transform: capitalize;
        }
        
        .category-btn.active {
          background: #333;
          color: #fff;
          border-color: #333;
        }
        
        .category-btn:hover:not(.active) {
          border-color: #333;
          background: #f8f8f8;
        }
        
        .add-item-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: #fff;
          padding: 40px;
          border: 1px solid #e0e0e0;
          max-width: 700px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 30px;
          font-weight: 300;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
        }
        
        .category-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d0d0d0;
          background: #fff;
          margin-bottom: 30px;
          font-size: 1rem;
        }
        
        .cancel-btn {
          width: 100%;
          padding: 12px;
          background: #fff;
          color: #666;
          border: 1px solid #666;
          cursor: pointer;
          margin-top: 30px;
          transition: all 0.3s ease;
        }
        
        .cancel-btn:hover {
          background: #666;
          color: #fff;
        }
        
        .wardrobe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 30px;
        }
        
        .wardrobe-item {
          background: #fff;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .wardrobe-item:hover {
          border-color: #333;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .item-image {
          width: 100%;
          height: 250px;
          object-fit: cover;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .item-info {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .item-category {
          font-weight: 400;
          color: #333;
          text-transform: capitalize;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .item-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #d0d0d0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .action-btn:hover {
          border-color: #333;
          background: #333;
          color: #fff;
        }
        
        .view-btn:hover {
          background: #333;
          border-color: #333;
        }
        
        .edit-btn:hover {
          background: #333;
          border-color: #333;
        }
        
        .delete-btn:hover {
          background: #333;
          border-color: #333;
        }
      `}</style>
    </div>
  );
};

export default WardrobeManager;