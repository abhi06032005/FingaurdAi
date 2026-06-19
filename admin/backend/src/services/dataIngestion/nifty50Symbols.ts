export interface StockMetadata {
  symbol: string;
  companyName: string;
  sector: string;
}

export const NIFTY_50_METADATA: Record<string, StockMetadata> = {
  'RELIANCE.NS': { symbol: 'RELIANCE.NS', companyName: 'Reliance Industries Ltd.', sector: 'Energy' },
  'TCS.NS': { symbol: 'TCS.NS', companyName: 'Tata Consultancy Services Ltd.', sector: 'Information Technology' },
  'HDFCBANK.NS': { symbol: 'HDFCBANK.NS', companyName: 'HDFC Bank Ltd.', sector: 'Financial Services' },
  'ICICIBANK.NS': { symbol: 'ICICIBANK.NS', companyName: 'ICICI Bank Ltd.', sector: 'Financial Services' },
  'INFY.NS': { symbol: 'INFY.NS', companyName: 'Infosys Ltd.', sector: 'Information Technology' },
  'HINDUNILVR.NS': { symbol: 'HINDUNILVR.NS', companyName: 'Hindustan Unilever Ltd.', sector: 'Fast Moving Consumer Goods' },
  'ITC.NS': { symbol: 'ITC.NS', companyName: 'ITC Ltd.', sector: 'Fast Moving Consumer Goods' },
  'SBIN.NS': { symbol: 'SBIN.NS', companyName: 'State Bank of India', sector: 'Financial Services' },
  'BHARTIARTL.NS': { symbol: 'BHARTIARTL.NS', companyName: 'Bharti Airtel Ltd.', sector: 'Telecommunication' },
  'KOTAKBANK.NS': { symbol: 'KOTAKBANK.NS', companyName: 'Kotak Mahindra Bank Ltd.', sector: 'Financial Services' },
  'LT.NS': { symbol: 'LT.NS', companyName: 'Larsen & Toubro Ltd.', sector: 'Construction' },
  'AXISBANK.NS': { symbol: 'AXISBANK.NS', companyName: 'Axis Bank Ltd.', sector: 'Financial Services' },
  'ASIANPAINT.NS': { symbol: 'ASIANPAINT.NS', companyName: 'Asian Paints Ltd.', sector: 'Consumer Durables' },
  'MARUTI.NS': { symbol: 'MARUTI.NS', companyName: 'Maruti Suzuki India Ltd.', sector: 'Automobile' },
  'BAJFINANCE.NS': { symbol: 'BAJFINANCE.NS', companyName: 'Bajaj Finance Ltd.', sector: 'Financial Services' },
  'HCLTECH.NS': { symbol: 'HCLTECH.NS', companyName: 'HCL Technologies Ltd.', sector: 'Information Technology' },
  'SUNPHARMA.NS': { symbol: 'SUNPHARMA.NS', companyName: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare' },
  'TITAN.NS': { symbol: 'TITAN.NS', companyName: 'Titan Company Ltd.', sector: 'Consumer Durables' },
  'WIPRO.NS': { symbol: 'WIPRO.NS', companyName: 'Wipro Ltd.', sector: 'Information Technology' },
  'ULTRACEMCO.NS': { symbol: 'ULTRACEMCO.NS', companyName: 'UltraTech Cement Ltd.', sector: 'Construction Materials' },
  'ONGC.NS': { symbol: 'ONGC.NS', companyName: 'Oil & Natural Gas Corporation Ltd.', sector: 'Energy' },
  'POWERGRID.NS': { symbol: 'POWERGRID.NS', companyName: 'Power Grid Corporation of India Ltd.', sector: 'Utilities' },
  'NTPC.NS': { symbol: 'NTPC.NS', companyName: 'NTPC Ltd.', sector: 'Utilities' },
  'TECHM.NS': { symbol: 'TECHM.NS', companyName: 'Tech Mahindra Ltd.', sector: 'Information Technology' },
  'M&M.NS': { symbol: 'M&M.NS', companyName: 'Mahindra & Mahindra Ltd.', sector: 'Automobile' },
  'JSWSTEEL.NS': { symbol: 'JSWSTEEL.NS', companyName: 'JSW Steel Ltd.', sector: 'Metals & Mining' },
  'TATASTEEL.NS': { symbol: 'TATASTEEL.NS', companyName: 'Tata Steel Ltd.', sector: 'Metals & Mining' },
  'INDUSINDBK.NS': { symbol: 'INDUSINDBK.NS', companyName: 'IndusInd Bank Ltd.', sector: 'Financial Services' },
  'BAJAJFINSV.NS': { symbol: 'BAJAJFINSV.NS', companyName: 'Bajaj Finserv Ltd.', sector: 'Financial Services' },
  'COALINDIA.NS': { symbol: 'COALINDIA.NS', companyName: 'Coal India Ltd.', sector: 'Energy' },
  'NESTLEIND.NS': { symbol: 'NESTLEIND.NS', companyName: 'Nestle India Ltd.', sector: 'Fast Moving Consumer Goods' },
  'BPCL.NS': { symbol: 'BPCL.NS', companyName: 'Bharat Petroleum Corporation Ltd.', sector: 'Energy' },
  'ADANIENT.NS': { symbol: 'ADANIENT.NS', companyName: 'Adani Enterprises Ltd.', sector: 'Metals & Mining' },
  'ADANIPORTS.NS': { symbol: 'ADANIPORTS.NS', companyName: 'Adani Ports and Special Economic Zone Ltd.', sector: 'Services' },
  'DRREDDY.NS': { symbol: 'DRREDDY.NS', companyName: "Dr. Reddy's Laboratories Ltd.", sector: 'Healthcare' },
  'GRASIM.NS': { symbol: 'GRASIM.NS', companyName: 'Grasim Industries Ltd.', sector: 'Materials' },
  'CIPLA.NS': { symbol: 'CIPLA.NS', companyName: 'Cipla Ltd.', sector: 'Healthcare' },
  'HINDALCO.NS': { symbol: 'HINDALCO.NS', companyName: 'Hindalco Industries Ltd.', sector: 'Metals & Mining' },
  'DIVISLAB.NS': { symbol: 'DIVISLAB.NS', companyName: "Divi's Laboratories Ltd.", sector: 'Healthcare' },
  'EICHERMOT.NS': { symbol: 'EICHERMOT.NS', companyName: 'Eicher Motors Ltd.', sector: 'Automobile' },
  'BRITANNIA.NS': { symbol: 'BRITANNIA.NS', companyName: 'Britannia Industries Ltd.', sector: 'Fast Moving Consumer Goods' },
  'APOLLOHOSP.NS': { symbol: 'APOLLOHOSP.NS', companyName: 'Apollo Hospitals Enterprise Ltd.', sector: 'Healthcare' },
  'BAJAJ-AUTO.NS': { symbol: 'BAJAJ-AUTO.NS', companyName: 'Bajaj Auto Ltd.', sector: 'Automobile' },
  'TATACONSUM.NS': { symbol: 'TATACONSUM.NS', companyName: 'Tata Consumer Products Ltd.', sector: 'Fast Moving Consumer Goods' },
  'HEROMOTOCO.NS': { symbol: 'HEROMOTOCO.NS', companyName: 'Hero MotoCorp Ltd.', sector: 'Automobile' },
  'SBILIFE.NS': { symbol: 'SBILIFE.NS', companyName: 'SBI Life Insurance Company Ltd.', sector: 'Financial Services' },
  'HDFCLIFE.NS': { symbol: 'HDFCLIFE.NS', companyName: 'HDFC Life Insurance Company Ltd.', sector: 'Financial Services' },
  'LTIM.NS': { symbol: 'LTIM.NS', companyName: 'LTIMindtree Ltd.', sector: 'Information Technology' },
  'UPL.NS': { symbol: 'UPL.NS', companyName: 'UPL Ltd.', sector: 'Chemicals' },
  'BEL.NS': { symbol: 'BEL.NS', companyName: 'Bharat Electronics Ltd.', sector: 'Capital Goods' }
};

export function getStockName(symbol: string): string {
  return NIFTY_50_METADATA[symbol]?.companyName ?? symbol;
}
