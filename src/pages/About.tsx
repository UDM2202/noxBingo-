import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

// Plain, crawlable text about the game. The lobby is the app itself
// and has little readable copy, so this page is what search engines
// (and AI summaries built on them) read to describe NoxBingo.
// Keep the facts here in step with the server's game config.

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is NoxBingo?',
    a: 'NoxBingo is an online 75-ball bingo game on the Solana blockchain. You pay for your cards with SOL or the OREN token, play solo or against other players, and prizes are paid in OREN straight to your Solana wallet.',
  },
  {
    q: 'How does a game work?',
    a: 'Each card is a 5×5 grid with B (1–15), I (16–30), N (31–45), G (46–60) and O (61–75) columns. You buy a bundle of 1, 3 or 5 cards, and fresh cards are generated for every game. Once the game starts, the server draws a ball every 3 seconds and every card is marked automatically, so you never miss a number.',
  },
  {
    q: 'How do you win?',
    a: 'The first player to complete a full row or a full column wins. Games last at most 25 balls: if nobody has won by the 25th ball, the game ends with no winner and entry fees are not returned.',
  },
  {
    q: 'What can I win playing solo?',
    a: 'In a solo game you play against the house. If you win, your stake is multiplied by your bundle’s multiplier: 15× for 1 card, 6× for 3 cards and 3.5× for 5 cards. If you don’t win, the house keeps the stake.',
  },
  {
    q: 'What can I win in multiplayer?',
    a: 'In a multiplayer room, everyone’s entry fees go into one pot. The winner receives 85% of the pot and NoxBingo keeps 15% as the house cut. Create a room and share its code with friends, or join a room with someone else’s code.',
  },
  {
    q: 'How are prizes paid?',
    a: 'Automatically, in OREN, to the same wallet that paid the entry. You can pay to enter with SOL or OREN. Payments and payouts happen on the Solana blockchain, and every winner gets a transaction link to check the payout on Solscan. Players pay Solana network fees on entries; NoxBingo pays them on payouts.',
  },
  {
    q: 'Is there a jackpot?',
    a: 'Yes. Every game that has a winner also gets a random jackpot roll. If it hits, the winner receives a jackpot in OREN on top of their normal prize.',
  },
  {
    q: 'What are NOX points?',
    a: 'Every card has one NOX square. If its number is drawn, you earn 25 NOX points for that card, so three cards hitting their NOX square earns 75 points. NOX points are reward points, not a token, and can’t be withdrawn. Collect 300 NOX points for a free game.',
  },
  {
    q: 'How are draws made?',
    a: 'Every game is drawn by our server using cryptographically secure random number generation, and cards are generated fresh for each game. Payments and prize payouts happen on the Solana blockchain and can be viewed on Solscan.',
  },
  {
    q: 'Can I try it for free?',
    a: 'Yes. Practice games, played without signing in, are free and involve no money.',
  },
  {
    q: 'Can I play inside Farcaster?',
    a: 'Yes. NoxBingo also runs as a Farcaster Mini App, using your Farcaster Solana wallet.',
  },
  {
    q: 'Who can play?',
    a: 'You must be 18 or over to play for money, or older where the law in your country requires it. NoxBingo is not available where online gambling is prohibited. You are responsible for checking it is legal where you live.',
  },
];

function About() {
  usePageMeta(
    'About NoxBingo — Online Bingo on Solana',
    'NoxBingo is an online 75-ball bingo game on Solana. Pay for cards with SOL or OREN, play solo or multiplayer, and get prizes paid automatically in OREN to your wallet.',
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
        Solana wallet, buy 1, 3 or 5 bingo cards with SOL or OREN, and play solo against the house
        or in multiplayer rooms. The server draws a ball every 3 seconds, cards are marked
        automatically, and the first full row or column wins. Prizes are paid automatically in
        OREN to the player’s wallet, with every payout visible on the Solana blockchain.
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
