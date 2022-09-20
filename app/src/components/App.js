import { EthereumContext } from '../eth/context';
import { createProvider } from '../eth/provider';
import { createInstance } from '../eth/assetToken';

import './App.css';
import Minter from './Minter';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const provider = createProvider();
  const assetToken = createInstance(provider);
  const ethereumContext = { provider, assetToken };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Minter</h1>
      </header>
      <section className="App-content">
        <EthereumContext.Provider value={ethereumContext}>
          <Minter />
        </EthereumContext.Provider>
      </section>
      <ToastContainer hideProgressBar={true} />
    </div>
  );
}

export default App;
