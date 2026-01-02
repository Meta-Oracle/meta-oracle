import { BaseOracle, OracleSignal, OracleVerdict } from '../engine'

export class AdversarialVerificationOracle extends BaseOracle {
  private suspiciousPatterns: string[] = []

  constructor() {
    super('adversarial-verification', 'verification')
  }

  async observe(): Promise<OracleSignal[]> {
    return []
  }

  async reason(signals: OracleSignal[]): Promise<OracleVerdict> {
    // Look for suspicious patterns in signals
    let suspicionScore = 0
    let totalSignals = signals.length

    // Check for duplicate hashes (potential manipulation)
    const hashes = signals.map(s => s.hash)
    const uniqueHashes = new Set(hashes)
    if (uniqueHashes.size < hashes.length) {
      suspicionScore += 0.3
    }

    // Check for confidence outliers
    const confidences = signals.map(s => s.confidence)
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length
    const outliers = confidences.filter(c => Math.abs(c - avgConfidence) > 0.4)
    suspicionScore += outliers.length / totalSignals * 0.2

    // Check timestamp clustering (potential coordinated attack)
    const timestamps = signals.map(s => s.timestamp).sort()
    let clusters = 0
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i-1] < 1000) { // Within 1 second
        clusters++
      }
    }
    suspicionScore += clusters / totalSignals * 0.1

    // Invert suspicion to prediction (high suspicion = low prediction)
    const prediction = Math.max(0, 1 - suspicionScore)
    const uncertainty = suspicionScore

    let reasoning = 'Adversarial check: '
    if (suspicionScore > 0.5) {
      reasoning += 'HIGH RISK - Potential manipulation detected'
    } else if (suspicionScore > 0.2) {
      reasoning += 'MEDIUM RISK - Some anomalies found'
    } else {
      reasoning += 'LOW RISK - Signals appear legitimate'
    }

    return {
      prediction,
      uncertainty,
      oracleId: this.id,
      reasoning
    }
  }
}

export class ConsistencyVerificationOracle extends BaseOracle {
  private historicalPredictions: number[] = []

  constructor() {
    super('consistency-verification', 'verification')
  }

  async observe(): Promise<OracleSignal[]> {
    return []
  }

  async reason(signals: OracleSignal[]): Promise<OracleVerdict> {
    // Check signal consistency across sources
    const priceSignals = signals.filter(s => s.payload.price)
    
    if (priceSignals.length < 2) {
      return {
        prediction: 0.5,
        uncertainty: 0.8,
        oracleId: this.id,
        reasoning: 'Insufficient signals for consistency check'
      }
    }

    // Calculate price variance across sources
    const prices = priceSignals.map(s => s.payload.price)
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / avgPrice

    // High consistency = low coefficient of variation
    const consistencyScore = Math.max(0, 1 - coefficientOfVariation * 10)
    
    // Store for historical analysis
    this.historicalPredictions.push(consistencyScore)
    if (this.historicalPredictions.length > 20) {
      this.historicalPredictions.shift()
    }

    const uncertainty = coefficientOfVariation

    return {
      prediction: consistencyScore,
      uncertainty,
      oracleId: this.id,
      reasoning: `Consistency score: ${(consistencyScore * 100).toFixed(1)}% (CV: ${(coefficientOfVariation * 100).toFixed(2)}%)`
    }
  }
}