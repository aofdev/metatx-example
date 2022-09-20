import { useRef, useState, useContext } from 'react';
import { minter } from '../eth/minter';
import { EthereumContext } from "../eth/context";
import { toast } from 'react-toastify';
import './Minter.css';

function Minter() {
  const mintInput = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const { assetToken, provider } = useContext(EthereumContext);

  const sendTx = async (event) => {
    event.preventDefault();
    const mint = mintInput.current.value;
    setSubmitting(true);
    
    try {
      const response = await minter(assetToken, provider, mint);
      const hash = response.hash;
      const onClick = hash
        ? () => window.open(`https://testnet.bscscan.com/tx/${hash}`)
        : undefined;
      toast('Transaction sent!', { type: 'info', onClick });
      mintInput.current.value = '';
    } catch(err) {
      toast(err.message || err, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="Container">
    <form onSubmit={sendTx}>
      <input type="number" required={true} placeholder="Mint number" ref={mintInput}></input>
      <button type="submit" disabled={submitting}>{submitting ? 'Minting...' : 'Minter'}</button>
    </form>
  </div>
}

export default Minter;