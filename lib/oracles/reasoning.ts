import { BaseOracle, OracleSignal, OracleVerdict } from '../engine'

export class TrendReasoningOracle extends BaseOracle {
  constructor() {
    super('trend-reasoning', 'reasoning')
  }

  async observe(): Promise<OracleSignal[]> {
    return [] // Reasoning oracles don't observe, they reason
  }

  async reason(signals: OracleSignal[]): Promise<OracleVerdict> {
    const priceSignals = signals.filter(s => s.payload.price)
    const volumeSignals = signals.filter(s => s.payload.volume)
    
    if (priceSignals.length === 0) {
      return {
        prediction: 0.5,
        uncertainty: 0.9,
        oracleId: this.id,
        reasoning: 'Insufficient price data'
      }
    }

    // Simple trend analysis
    let bullishScore = 0
    let totalWeight = 0

    for (const signal of priceSignals) {
      const change = signal.payload.change || 0
      const weight = signal.confidence
      
      if (change > 5) bullishScore += 0.8 * weight
      else if (change > 0) bullishScore += 0.6 * weight
      else if (change > -5) bullishScore += 0.4 * weight
      else bullishScore += 0.2 * weight
      
      totalWeight += weight
    }

    // Volume confirmation
    const avgVolume = volumeSignals.reduce((sum, s) => sum + (s.payload.volume || 0), 0) / volumeSignals.length
    const volumeMultiplier = avgVolume > 1e9 ? 1.1 : 0.9

    const prediction = Math.min(1, Math.max(0, (bullishScore / totalWeight) * volumeMultiplier))
    const uncertainty = 1 - (totalWeight / signals.length)

    return {
      prediction,
      uncertainty,
      oracleId: this.id,
      reasoning: `Trend analysis: ${(prediction * 100).toFixed(1)}% bullish confidence`
    }
  }
}

export class MomentumReasoningOracle extends BaseOracle {
  private priceHistory: number[] = []

  constructor() {
    super('momentum-reasoning', 'reasoning')
  }

  async observe(): Promise<OracleSignal[]> {
    return []
  }

  async reason(signals: OracleSignal[]): Promise<OracleVerdict> {
    const priceSignals = signals.filter(s => s.payload.price)
    
    if (priceSignals.length === 0) {
      return {
        prediction: 0.5,
        uncertainty: 0.8,
        oracleId: this.id,
        reasoning: 'No price data for momentum analysis'
      }
    }

    // Update price history
    const currentPrice = priceSignals[0].payload.price
    this.priceHistory.push(currentPrice)
    if (this.priceHistory.length > 10) {
      this.priceHistory.shift()
    }

    if (this.priceHistory.length < 3) {
      return {
        prediction: 0.5,
        uncertainty: 0.7,
        oracleId: this.id,
        reasoning: 'Insufficient history for momentum'
      }
    }

    // Calculate momentum
    const recent = this.priceHistory.slice(-3)
    const older = this.priceHistory.slice(0, -3)
    
    const recentAvg = recent.reduce((a, b) => a + b) / recent.length
    const olderAvg = older.reduce((a, b) => a + b) / older.length
    
    const momentum = (recentAvg - olderAvg) / olderAvg
    const prediction = Math.min(1, Math.max(0, 0.5 + momentum * 2))

    return {
      prediction,
      uncertainty: 0.3,
      oracleId: this.id,
      reasoning: `Momentum: ${(momentum * 100).toFixed(2)}% price velocity`
    }
  }
}