import React from "react";
import { StarknetkitConnectButton } from "./provider/StarknetkitProvider";
import ChainChat from "./components/ChainChat";
import { useGlobalContext } from "./provider/GlobalContext";

const App = () => {
  const { account } = useGlobalContext();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {account ? (
        <ChainChat /> // Show HomePage if connected
      ) : (
        <div className="space-y-12">
          {/* Logo and Tagline */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              ChainChat
            </h1>
            <p className="text-lg text-gray-400">
              Simplifying starknet interactions, one message at a time.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="features-section space-y-8">
            <h2 className="text-2xl font-bold text-center">
              Why Use ChainChat?
            </h2>
            <ul className="space-y-6">
              <li className="flex items-center space-x-4">
                <span className="icon bg-blue-500 text-white p-3 rounded-full">
                  💬
                </span>
                <span>Send tokens with simple commands.</span>
              </li>
              <li className="flex items-center space-x-4">
                <span className="icon bg-green-500 text-white p-3 rounded-full">
                  🔄
                </span>
                <span>Swap tokens easily through AVNU.</span>
              </li>
              <li className="flex items-center space-x-4">
                <span className="icon bg-yellow-500 text-white p-3 rounded-full">
                  🚀
                </span>
                <span>Deploy unruggable meme coins instantly.</span>
              </li>
              <li className="flex items-center space-x-4">
                <span className="icon bg-pink-500 text-white p-3 rounded-full">
                  📊
                </span>
                <span>Get real-time  insights.</span>
              </li>
            </ul>
          </div>

          {/* Call-to-Action */}
          <div className="text-center">
            {/* StarknetkitConnectButton used as-is */}
            <StarknetkitConnectButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
