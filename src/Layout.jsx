import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@200;300;400;500;600&display=swap');
        
        :root {
          --font-serif: 'Cormorant Garamond', Georgia, serif;
          --font-sans: 'Inter', system-ui, sans-serif;
        }
        
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }
        
        .font-serif {
          font-family: var(--font-serif);
        }
      `}</style>
      
      <Navbar currentPageName={currentPageName} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}