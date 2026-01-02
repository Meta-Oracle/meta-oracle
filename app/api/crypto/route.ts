import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols')?.split(',') || ['bitcoin', 'ethereum']
  
  try {
    // Map common symbols to CoinGecko IDs
    const symbolMap: { [key: string]: string } = {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'ada': 'cardano',
      'sol': 'solana',
      'bnb': 'binancecoin',
      'xrp': 'ripple',
      'dot': 'polkadot',
      'doge': 'dogecoin'
    }
    
    const coinIds = symbols.map(symbol => 
      symbolMap[symbol.toLowerCase()] || symbol.toLowerCase()
    ).join(',')
    
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    )
    
    const data = Object.entries(response.data).map(([id, info]: [string, any]) => ({
      symbol: Object.keys(symbolMap).find(key => symbolMap[key] === id)?.toUpperCase() || 
              id.charAt(0).toUpperCase() + id.slice(1),
      price: info.usd,
      change24h: info.usd_24h_change || 0,
      volume: info.usd_24h_vol || 0,
      marketCap: info.usd_market_cap || 0
    }))
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Crypto API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crypto data' },
      { status: 500 }
    )
  }
}