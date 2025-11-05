import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Grid, List, Heart, Eye, Edit, Trash2, X } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/hooks/redux'
import { 
  fetchWardrobe, 
  deleteWardrobeItem, 
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  clearError
} from '@/store/slices/wardrobeSlice'
import { setModal, addNotification } from '@/store/slices/uiSlice'
import { LoadingSpinner, ErrorDisplay } from './UI/LoadingStates'
import { WardrobeItem, FilterOption, SortOption } from '@/types'
import { FixedSizeGrid as GridList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

const WardrobeManager: React.FC = () => {
  const dispatch = useAppDispatch()
  const { 
    items, 
    categories, 
    selectedCategory, 
    loading, 
    error, 
    searchQuery, 
    sortBy, 
    sortOrder 
  } = useAppSelector(state => state.wardrobe)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    dispatch(fetchWardrobe())
  }, [dispatch])

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          break
        case 'name':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        default:
          comparison = 0
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [items, selectedCategory, searchQuery, sortBy, sortOrder])

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await dispatch(deleteWardrobeItem(id)).unwrap()
      dispatch(addNotification({
        type: 'success',
        title: 'Item Deleted',
        message: 'Item has been removed from your wardrobe'
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete item. Please try again.'
      }))
    }
  }

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const GridItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = filteredAndSortedItems[index]
    const isSelected = selectedItems.includes(item.id)

    return (
      <div style={style}>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ y: -4 }}
          className={`bg-white border rounded-lg overflow-hidden cursor-pointer transition-all ${
            isSelected ? 'border-black shadow-lg' : 'border-gray-200 hover:border-gray-400'
          }`}
          onClick={() => toggleItemSelection(item.id)}
        >
          <div className="relative">
            <img 
              src={item.image_url} 
              alt={item.category}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            {item.favorite && (
              <div className="absolute top-2 right-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium capitalize text-gray-900">
                  {item.category}
                </h3>
                {item.color && (
                  <p className="text-sm text-gray-600">{item.color}</p>
                )}
              </div>
              <div className="flex gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // View item details
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Eye size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Edit item
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Edit size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteItem(item.id)
                  }}
                  className="p-2 hover:bg-red-50 text-red-500 rounded"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </div>
            
            {item.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.slice(0, 3).map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            My Wardrobe
          </h1>
          <p className="text-gray-600">
            {filteredAndSortedItems.length} items
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
          </p>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => dispatch(setModal({ key: 'addItem', value: true }))}
            className="px-6 py-3 bg-black text-white border border-black hover:bg-gray-900"
          >
            Add Item
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-lg p-6 mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by color, style, or tags..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(setSelectedCategory(category))}
                className={`px-4 py-2 border capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 items-center">
            <select
              value={sortBy}
              onChange={(e) => dispatch(setSortBy(e.target.value as SortOption))}
              className="px-3 py-2 border border-gray-300 focus:border-black focus:outline-none"
            >
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))}
              className="p-2 border border-gray-300 hover:border-black"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </motion.button>

            <div className="flex border border-gray-300 rounded">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <Grid size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <List size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              dispatch(clearError())
              dispatch(fetchWardrobe())
            }}
            onDismiss={() => dispatch(clearError())}
          />
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && <LoadingSpinner overlay text="Loading wardrobe..." />}

      {/* Items Grid */}
      <AnimatePresence>
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-96 lg:h-screen"
          >
            {filteredAndSortedItems.length > 0 ? (
              <AutoSizer>
                {({ height, width }) => (
                  <GridList
                    columnCount={Math.floor(width / 280)}
                    columnWidth={280}
                    height={height}
                    rowCount={filteredAndSortedItems.length}
                    rowHeight={320}
                    itemData={filteredAndSortedItems}
                  >
                    {GridItem}
                  </GridList>
                )}
              </AutoSizer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-6xl mb-4">👔</div>
                <h3 className="text-xl font-light mb-2">No items found</h3>
                <p>Try adjusting your filters or add some items to your wardrobe</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WardrobeManager