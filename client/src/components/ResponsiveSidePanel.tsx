import React, { memo } from 'react';
import { X } from 'lucide-react';

const ResponsiveSidePanel = ({ isSidePanelOpen, setIsSidePanelOpen, children }: { isSidePanelOpen: any, setIsSidePanelOpen: any, children: any }) => {
  return (
    <>
      {/* Overlay for mobile - only shows when panel is open */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 lg:hidden ${
          isSidePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidePanelOpen(false)}
      />

      {/* Side Panel */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${
          isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
        } w-full sm:w-96 lg:w-80 bg-slate-800 border-r border-gray-700 transition-transform duration-300 ease-in-out z-50
        lg:relative lg:translate-x-0`} // Makes panel always visible on large screens
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setIsSidePanelOpen(false)}
              className="text-gray-400 hover:text-gray-200 lg:hidden" // Hide close button on large screens
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-3">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(ResponsiveSidePanel);