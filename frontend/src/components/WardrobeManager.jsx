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
          padding: 20px;
        }
        
        .wardrobe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .wardrobe-header h2 {
          margin: 0;
          color: #333;
        }
        
        .add-item-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .add-item-btn:hover {
          background: #0056b3;
        }
        
        .category-filter {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .category-btn {
          padding: 8px 16px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .category-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .category-btn:hover:not(.active) {
          background: #f8f9fa;
        }
        
        .add-item-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .category-select {
          width: 100%;
          padding: 10px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .cancel-btn {
          width: 100%;
          padding: 10px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 20px;
        }
        
        .wardrobe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .wardrobe-item {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        
        .wardrobe-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .item-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        
        .item-info {
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .item-category {
          font-weight: 500;
          color: #333;
          text-transform: capitalize;
        }
        
        .item-actions {
          display: flex;
          gap: 5px;
        }
        
        .action-btn {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .view-btn {
          background: #17a2b8;
          color: white;
        }
        
        .edit-btn {
          background: #ffc107;
          color: white;
        }
        
        .delete-btn {
          background: #dc3545;
          color: white;
        }
        
        .action-btn:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default WardrobeManager;