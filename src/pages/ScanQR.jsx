import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, QrCode, Camera } from 'lucide-react';

export default function ScanQR() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a2332' }}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-4">
          <Link 
            to={createPageUrl('MyGroups')}
            className="p-2 rounded-xl"
            style={{ backgroundColor: '#243447' }}
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </Link>
          <h1 className="text-xl font-bold text-white">Scan QR Code</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-64 h-64 rounded-3xl flex items-center justify-center mb-8" style={{ backgroundColor: '#243447' }}>
          <div className="w-48 h-48 border-4 border-cyan-400 rounded-2xl flex items-center justify-center">
            <Camera className="w-16 h-16 text-cyan-400" />
          </div>
        </div>
        
        <p className="text-white text-lg font-medium mb-2">Point camera at QR code</p>
        <p className="text-gray-400 text-sm text-center mb-8">
          Position the QR code within the frame to scan and join a group
        </p>

        <div className="rounded-xl p-4 w-full max-w-sm" style={{ backgroundColor: '#243447' }}>
          <p className="text-amber-400 text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Scanner Coming Soon
          </p>
          <p className="text-gray-400 text-xs mt-2">
            For now, please use the join code option to join a group. Ask the group leader for the 6-character code.
          </p>
        </div>

        <Link 
          to={createPageUrl('MyGroups')}
          className="mt-6 text-cyan-400 font-medium"
        >
          Use Join Code Instead
        </Link>
      </main>
    </div>
  );
}