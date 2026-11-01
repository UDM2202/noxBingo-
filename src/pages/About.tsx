import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

// Plain, crawlable text about the game. The lobby is the app itself
// and has little readable copy, so this page is what search engines
// (and AI summaries built on them) read to describe NoxBingo.

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is NoxBingo?',
    a: 'NoxBingo is an online 75-ball bingo game built on the Solana blockchain. You pay for your cards with SOL or the OREN token, and prizes are paid in OREN straight to your Solana wallet.',
  },
  {
    q: 'How do I play?',
    a: 'Open www.noxbingo.io, connect a Solana wallet such as Phantom, Solflare, Trust Wallet or Coinbase Wallet, then play solo or create or join a room with friends. Choose a bundle of 1, 3 or 5 cards, pay with SOL or OREN, and the game starts. Numbers are called automatically and marked on your cards for you (auto-daub).',
  },
  {
    q: 'How do you win?',
    a: 'The first card to complete a full row or a full column wins the game. Cards can also hit the NOX bonus during a game, which pays out on top of the main prize.',
  },
  {
    q: 'How are prizes paid?',
    a: 'Payouts are automatic. When you win, the prize is sent in OREN to the wallet you played with, and you get a Solana transaction link so you can check it on the blockchain yourself. Some rooms also have a jackpot, paid in OREN on top of the normal prize.',
  },
  {
    q: 'Can I play with friends?',
    a: 'Yes. Create a room and share its code, or join a friend’s room with theirs. Everyone connects a wallet and buys their cards before the host starts the game.',
  },
  {
    q: 'Can I play inside Farcaster?',
    a: 'Yes. NoxBingo also runs as a Farcaster Mini App, using your Farcaster Solana wallet.',
  },
  {
    q: 'Is there a leaderboard?',
    a: 'Yes. The NoxBingo leaderboard ranks players by games played, wins and total winnings.',
  },
];

function About() {
  usePageMeta(
    'About NoxBingo — Online Bingo on Solana',
    'NoxBingo is an online 75-ball bingo game on Solana. Pay for cards with SOL or OREN, play solo or with friends, and get prizes paid automatically to your wallet.',
    '/about'
  );

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#FFD700', textAlign: 'center', letterSpacing: '0.05em', margin: '0 0 16px' }}>
        About NoxBingo
      </h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <Link to="/" style={{ color: '#5C5C9E', fontSize: '13px', textDecoration: 'none' }}>Back to Lobby</Link>
      </div>

      <p style={{ color: '#B8B8E8', fontSize: '16px', lineHeight: 1.7, margin: '0 0 32px' }}>
        NoxBingo is an online 75-ball bingo game on the Solana blockchain. Players connect a
        Solana wallet, buy bingo cards with SOL or OREN, and play solo or in rooms with friends.
        Numbers are called and marked automatically, and winners are paid in OREN directly to
        their wallet, with a public transaction link as proof.
      </p>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', letterSpacing: '0.05em', margin: '0 0 16px' }}>
        Frequently asked questions
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {FAQ.map(({ q, a }) => (
          <section key={q}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 6px' }}>{q}</h3>
            <p style={{ fontSize: '14px', color: '#8B8BD4', lineHeight: 1.7, margin: 0 }}>{a}</p>
          </section>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '40px' }}>
        <Link to="/" style={{ color: '#00E5FF', fontSize: '14px', textDecoration: 'none' }}>Play NoxBingo</Link>
        <Link to="/leaderboard" style={{ color: '#5C5C9E', fontSize: '14px', textDecoration: 'none' }}>View Leaderboard</Link>
      </div>
    </div>
  );
}

export default About;
