async function run() {
  try {
    const res = await fetch('http://127.0.0.1:5000/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_2test',
        symbol: 'TCS',
        instrumentType: 'Equity',
        direction: 'Long',
        entryPrice: '3000',
        exitPrice: '3100',
        quantity: '10',
        entryDate: '2026-06-01',
        exitDate: '2026-06-02',
        strategy: 'Breakout',
        confidenceScore: '4'
      })
    });
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('DATA:', data);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
