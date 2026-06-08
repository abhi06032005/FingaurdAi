import yahooFinance from 'yahoo-finance2';
yahooFinance.quote('AAPL').then(console.log).catch(console.error);
