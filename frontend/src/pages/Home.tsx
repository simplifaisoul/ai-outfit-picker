import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Camera, Heart } from 'lucide-react'

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20"
      >
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-black text-white rounded-full mb-6"
          >
            <Sparkles size={32} />
          </motion.div>
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl md:text-6xl font-light text-gray-900 mb-6 leading-tight"
        >
          Dress Better
          <br />
          Every Day
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          AI-powered outfit curation that understands your style, 
          respects your preferences, and helps you look your best.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/add-item"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-lg font-medium hover:bg-gray-900 transition-all"
          >
            <Camera size={20} />
            Build Your Wardrobe
            <ArrowRight 
              size={20} 
              className="transform group-hover:translate-x-1 transition-transform" 
            />
          </Link>
          
          <Link
            to="/outfit-picker"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black border border-gray-300 text-lg font-medium hover:border-gray-400 transition-all"
          >
            Get Today's Outfit
            <ArrowRight 
              size={20} 
              className="transform group-hover:translate-x-1 transition-transform" 
            />
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mb-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Camera size={32} />,
              title: "Smart Photography",
              description: "Capture your clothing collection with our intelligent photo system that automatically categorizes and organizes your items."
            },
            {
              icon: <Sparkles size={32} />,
              title: "AI Curation",
              description: "Get personalized outfit suggestions based on your style, weather conditions, and scheduled occasions."
            },
            {
              icon: <Heart size={32} />,
              title: "Timeless Design",
              description: "Experience a beautifully crafted interface that prioritizes elegance, simplicity, and functionality."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="bg-white border border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 transition-all"
            >
              <div className="flex justify-center mb-6 text-gray-900">
                {feature.icon}
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center"
      >
        <h2 className="text-3xl font-light text-gray-900 mb-12">
          Designed for the Modern Wardrobe
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: "∞", label: "Outfit Combinations" },
            { number: "24/7", label: "AI Assistance" },
            { number: "100%", label: "Privacy Focused" },
            { number: "0", label: "Ads" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 + index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <div className="text-3xl font-light text-gray-900 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="text-center"
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          Ready to Transform Your Style?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands who have simplified their daily dressing routine with intelligent outfit recommendations.
        </p>
        
        <Link
          to="/wardrobe"
          className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-lg font-medium hover:bg-gray-900 transition-all"
        >
          Get Started Now
          <ArrowRight size={20} />
        </Link>
      </motion.section>
    </div>
  )
}

export default Home