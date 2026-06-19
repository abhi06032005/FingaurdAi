import type { Metadata } from 'next';
import PatternSearchClient from './PatternSearchClient';

export const metadata: Metadata = {
  title: 'Draw Pattern Search | FinGuard AI',
  description:
    'Draw any price pattern and discover historically similar stock setups across NIFTY 50. Find patterns that match, review historical returns, and analyze what happened next.',
};

export default function PatternSearchPage() {
  return <PatternSearchClient />;
}
