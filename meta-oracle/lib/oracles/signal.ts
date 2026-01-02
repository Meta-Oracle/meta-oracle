import { BaseOracle, OracleSignal, OracleVerdict } from '../engine'
import axios from 'axios'
import CryptoJS from 'crypto-js'

export class PriceSignalOracle extends BaseOracle {
  private sources = [
    'coingecko',
    'coinmarketcap',
    'binance'
  ]

  constructor() {
    super('price-signal', 'signal')
  }

  async observe(): Promise<OracleSignal[]> {
    const signals: OracleSignal[] = []
    
    try {
      // CoinGecko signal
      const cgResponse = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
      )
      
      for (const [coin, data] of Object.entries(cgResponse.data)) {
        const payload = { price: (data as any).usd, change: (data as any).usd_24h_change }
        signals.push({
          source: 'coingecko',
          confidence: 0.9,
          payload,
          timestamp: Date.now(),
          hash: CryptoJS.SHA256(JSON.stringify(payload)).toString()
        })
      }
    } catch (error) {
      // Fallback signal with lower confidence
      signals.push({
        source: 'fallback',
        confidence: 0.3,
        payload: { price: 0, change: 0 },
        timestamp: Date.now(),
        hash: CryptoJS.SHA256('fallback').toString()
      })
    }

    return signals
  }

  async reason(signals: OracleSignal[]): Promise<OracleVerdict> {
    // Signal oracles don't reason, they just collect
    return {
      prediction: 0,
      uncertainty: 1,
      oracleId: this.id,
      reasoning: 'Signal oracle - no reasoning'
    }
  }
}

export class VolumeSignalOracle extends BaseOracle {
  constructor() {
    super('volume-signal', 'signal')
  }

  async observe(): Promise<OracleSignal[]> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_vol=true'
      )
      
      return Object.entries(response.data).map(([coin, data]) => {
        const payload = { volume: (data as any).usd_24h_vol }
        return {
          source: 'coingecko-volume',
          confidence: 0.85,
          payload,
          timestamp: Date.now(),
          hash: CryptoJS.SHA256(JSON.stringify(payload)).toString()
        }
      })
    } catch {
      return [{
        source: 'volume-fallback',
        confidence: 0.2,
        payload: { volume: 0 },
        timestamp: Date.now(),
        hash: CryptoJS.SHA256('volume-fallback').toString()
      }]
    }
  }

  async reason(): Promise<OracleVerdict> {
    return {
      prediction: 0,
      uncertainty: 1,
      oracleId: this.id,
      reasoning: 'Volume signal oracle'
    }
  }
}