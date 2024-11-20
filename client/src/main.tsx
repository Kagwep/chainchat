import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider} from "./providers";
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <ThemeProvider>
              < WalletProvider>
                <App />
                <Toaster position="top-right" reverseOrder={false} />
              </WalletProvider>
 
        </ThemeProvider>
  </StrictMode>,
)
