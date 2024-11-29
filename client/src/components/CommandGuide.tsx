import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Maximize2, Minimize2 } from 'lucide-react';

const CommandExamples = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedExample, setExpandedExample] = useState<number | null>(null);

  const examples = [
    {
      text: "send 1000 Brother to 0x073d.....8c3 or send 1000 Brother to bigbrother.stark",
      description: "Send tokens"
    },
    {
      text: "swap 10 strk to Brother",
      description: "Swap tokens"
    },
    {
      text: "Deploy a meme coin named InfinityPaws, symbol PAWS, with an initial supply of 10,000,000,000",
      description: "Deploy tokens"
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-gray-300 hover:text-gray-100"
            >
              <span className="font-medium">Examples</span>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-200"
              aria-label="Close examples"
            >
              <X size={18} />
            </button>
          </div>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {examples.map((example, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="text-gray-300 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <code className={`bg-gray-700 px-2 py-1 rounded block ${
                        expandedExample === index ? '' : 'truncate'
                      }`}>
                        {example.text}
                      </code>
                      <button
                        onClick={() => setExpandedExample(expandedExample === index ? null : index)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-200 p-1"
                        aria-label={expandedExample === index ? "Collapse" : "Expand"}
                      >
                        {expandedExample === index ? (
                          <Minimize2 size={14} />
                        ) : (
                          <Maximize2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandExamples;