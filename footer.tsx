
import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  const handleHelpClick = () => {
    window.location.href = 'mailto:lisboagopt@hotmail.com'
  }

  return (
    <footer className="bg-black text-white py-3 relative z-50 mobile-footer">
      <div className="max-w-md mx-auto flex justify-between items-center px-4">
        <Link 
          to="/" 
          className="text-white hover:text-yellow-400 transition-colors text-sm md:text-base"
        >
          Home
        </Link>
        
        <button 
          onClick={handleHelpClick}
          className="text-white hover:text-yellow-400 transition-colors text-sm md:text-base"
        >
          Ajuda
        </button>
        
        <Link 
          to="/client-login" 
          className="text-white hover:text-yellow-400 transition-colors text-sm md:text-base"
        >
          Conta
        </Link>
      </div>
    </footer>
  )
}

export default Footer