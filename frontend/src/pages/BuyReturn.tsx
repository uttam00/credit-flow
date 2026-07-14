import { Link } from 'react-router-dom';

function BuyReturn() {
  return (
    <div>
      <h1>Thanks!</h1>
      <p>Credits are only granted once Stripe confirms your payment — this can take a few seconds.</p>
      <p>Check your wallet to see your updated balance.</p>
      <Link to="/wallet">Go to wallet</Link>
    </div>
  );
}

export default BuyReturn;
