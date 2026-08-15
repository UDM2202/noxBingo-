import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygonAmoy } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'NoxBingo',
  projectId: '218bfbc971e87e3fd26448ae63e2ccef',
  chains: [polygonAmoy],
  ssr: false,
});
