import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal}
                    style={{
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      backgroundColor: '#1A1A5E',
                      border: '1px solid rgba(0,229,255,0.5)',
                      borderRadius: '10px',
                      color: '#00E5FF',
                      cursor: 'pointer',
                    }}>
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FF88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }} />
                  <span style={{ fontSize: '12px', color: '#8B8BD4', fontFamily: 'monospace' }}>
                    {account.displayName}
                  </span>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
