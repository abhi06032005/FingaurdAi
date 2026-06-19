import type { Metadata } from 'next';
import ScreenerClient from './ScreenerClient';

export const metadata: Metadata = {
  title: 'AI Stock Screener | FinGuard AI',
  description:
    'Screen Indian stocks using natural language. Find stocks above SMA, with MACD crossovers, RSI extremes, volume spikes, and more — powered by AI.',
};

export default function ScreenerPage() {
  return <ScreenerClient />;
}
