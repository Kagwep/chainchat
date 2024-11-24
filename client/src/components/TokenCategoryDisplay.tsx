import React, { useState } from 'react';
import { Search, ExternalLink, CircleDollarSign, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { tokensAll } from '../utils';

type Token = {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  logoUri: string;
  lastDailyVolumeUsd: number;
  extensions: Record<string, any>;
  tags: string[];
};

const tokens: Token[] = tokensAll;

const TokenCategoryDisplay = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'standard' | 'unruggable'>('standard');
  const [expandedToken, setExpandedToken] = useState<string | null>(null);



  const isUnruggable = (token: Token) => {
    return token.tags.includes('Unruggable');
  };

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = 
      (activeCategory === 'unruggable' && isUnruggable(token)) ||
      (activeCategory === 'standard' && !isUnruggable(token));
    return matchesSearch && matchesCategory && token.tags.includes('Verified');
  });

  const TokenCard = ({ token }: { token: Token }) => {
    const unruggable = isUnruggable(token);
    const shortAddress = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;
    const [isExpanded, setIsExpanded] = useState(false);

    const [chartData, setChartData] = useState<{
        loading: boolean;
        error: boolean;
        poolAddress: string | null;
      }>({
        loading: false,
        error: false,
        poolAddress: null
      });
    
    

      const handleExpand = () => {
        if (!isExpanded) {
          setChartData({ loading: true, error: false, poolAddress: null });
          
          axios.get(`https://api.geckoterminal.com/api/v2/networks/starknet-alpha/tokens/${token.address}/pools`, {
            headers: {
              "Accept": "application/json;version=20230302"
            }
          })
          .then(response => {
            const pools = response.data.data;
            // Find pool with USDC/USDT
            const usdPair = pools.find((pool: any) => {
              const baseTokenId = pool.relationships.base_token.data.id;
              const quoteTokenId = pool.relationships.quote_token.data.id;
              const isUSDC = (tokenId: string) => tokenId.includes("0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8");
              const isUSDT = (tokenId: string) => tokenId.includes("0x68f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8");
              
              return (isUSDC(baseTokenId) || isUSDC(quoteTokenId) || 
                      isUSDT(baseTokenId) || isUSDT(quoteTokenId));
            });
    
            setChartData({
              loading: false,
              error: false,
              poolAddress: usdPair?.attributes?.address || null  // Using the pool's address directly
            });
          })
          .catch(error => {
            console.error('Error fetching pool:', error);
            setChartData({ loading: false, error: true, poolAddress: null });
          });
        }
        setIsExpanded(!isExpanded);
      };

    return (
      <div className="border-b border-gray-800">
        <div 
          className={`p-3 cursor-pointer ${
            unruggable 
              ? 'bg-gradient-to-r from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10' 
              : 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10'
          } transition-all duration-200`}
          onClick={handleExpand}
        >
          <div className="flex items-center space-x-3">
            <img 
              src={token.logoUri} 
              alt={token.name} 
              className="w-8 h-8 rounded-full border border-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/32/32';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-100 truncate">
                {token.name}
              </h3>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-400">{token.symbol}</p>
                {unruggable && (
                  <Shield className="w-3 h-3 text-purple-400" />
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          <div className="mt-2 flex flex-col space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="truncate">{shortAddress}</span>
              <a 
                href={`https://starkscan.co/contract/${token.address}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 ml-2"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            {token.lastDailyVolumeUsd > 0 && (
              <div className="text-xs text-gray-400">
                24h: ${token.lastDailyVolumeUsd.toLocaleString()}
              </div>
            )}
          </div>
        </div>

      {/* Chart only rendered when expanded */}
      {isExpanded && (
    <div className="border-t border-gray-800">
      {chartData.loading ? (
        <div className="h-[400px] flex items-center justify-center text-gray-400">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <span>Loading chart data...</span>
          </div>
        </div>
      ) : chartData.error ? (
        <div className="h-[100px] flex items-center justify-center text-gray-400">
          Failed to load chart data
        </div>
      ) : chartData.poolAddress ? (
        <div className="h-[400px]">
          <iframe 
            height="100%" 
            width="100%" 
            id="geckoterminal-embed"
            title="GeckoTerminal Embed" 
            src={`https://www.geckoterminal.com/starknet-alpha/pools/${chartData.poolAddress}?embed=1&info=1&swaps=1`}
            frameBorder="0" 
            allow="clipboard-write" 
            allowFullScreen
          />
        </div>
      ) : (
        <div className="h-[100px] flex items-center justify-center text-gray-400">
          No USD pair chart available
        </div>
      )}
    </div>
  )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-gray-900">
      {/* Fixed Header */}
      <div className="flex-none p-4 border-b border-gray-800">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Tokens</h2>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg 
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                     text-gray-100 placeholder-gray-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex rounded-lg bg-gray-800 p-1">
          <button
            onClick={() => setActiveCategory('standard')}
            className={`flex items-center justify-center space-x-1 flex-1 px-3 py-1.5 text-sm font-medium rounded-md 
                       transition-all duration-200 ${
              activeCategory === 'standard' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CircleDollarSign className="w-4 h-4" />
            <span>Tokens</span>
          </button>
          <button
            onClick={() => setActiveCategory('unruggable')}
            className={`flex items-center justify-center space-x-1 flex-1 px-3 py-1.5 text-sm font-medium rounded-md 
                       transition-all duration-200 ${
              activeCategory === 'unruggable' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Unruggable</span>
          </button>
        </div>
      </div>

      {/* Scrollable Token List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {filteredTokens.length > 0 ? (
          filteredTokens.map(token => (
            <TokenCard key={token.address} token={token} />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-gray-400">
            No {activeCategory} tokens found
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenCategoryDisplay;