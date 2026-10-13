import { createContext, useContext } from 'react'

/**
 * Where the app is running. Set once in App.tsx at startup and read by
 * any component that needs to behave differently inside Farcaster.
 *
 * 'miniapp' = inside a Farcaster client (Warpcast phone app or web).
 * 'web'     = a normal browser tab, including wallet in-app browsers.
 */
export type AppEnv = 'miniapp' | 'web'

export const AppEnvContext = createContext<AppEnv>('web')

export function useAppEnv(): AppEnv {
  return useContext(AppEnvContext)
}

/** Name the Farcaster wallet registers under via Wallet Standard. */
export const FARCASTER_WALLET_NAME = 'Farcaster'