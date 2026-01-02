export interface OracleSignal {
  source: string
  confidence: number
  payload: any
  timestamp: number
  hash: string
}

export interface OracleVerdict {
  prediction: number
  uncertainty: number
  oracleId: string
  reasoning: string
}

export interface ConsensusResult {
  oracleConsensus: number
  confidence: number
  divergence: number
  timestamp: number
}

export abstract class BaseOracle {
  id: string
  weight: number
  accuracy: number
  type: 'signal' | 'reasoning' | 'verification'

  constructor(id: string, type: 'signal' | 'reasoning' | 'verification') {
    this.id = id
    this.weight = 1.0
    this.accuracy = 0.5
    this.type = type
  }

  abstract observe(): Promise<OracleSignal[]>
  abstract reason(signals: OracleSignal[]): Promise<OracleVerdict>
  
  updateWeight(reward: number) {
    const α = 0.1 // learning rate
    this.weight = Math.max(0.1, this.weight + α * reward)
    this.accuracy = Math.max(0, Math.min(1, this.accuracy + α * reward * 0.1))
  }
}

export class MetaOracleEngine {
  private oracles: Map<string, BaseOracle> = new Map()
  private history: ConsensusResult[] = []

  register(oracle: BaseOracle) {
    this.oracles.set(oracle.id, oracle)
  }

  async runConsensus(): Promise<ConsensusResult> {
    // Phase 1: Signal Collection
    const signalOracles = Array.from(this.oracles.values()).filter(o => o.type === 'signal')
    const signals = (await Promise.all(signalOracles.map(o => o.observe()))).flat()

    // Phase 2: Reasoning
    const reasoningOracles = Array.from(this.oracles.values()).filter(o => o.type === 'reasoning')
    const verdicts = await Promise.all(reasoningOracles.map(o => o.reason(signals)))

    // Phase 3: Verification (Adversarial)
    const verificationOracles = Array.from(this.oracles.values()).filter(o => o.type === 'verification')
    const verifications = await Promise.all(verificationOracles.map(o => o.reason(signals)))

    // Weighted Consensus with Adversarial Adjustment
    const consensus = this.weightedConsensus(verdicts, verifications)
    this.history.push(consensus)

    return consensus
  }

  private weightedConsensus(verdicts: OracleVerdict[], verifications: OracleVerdict[]): ConsensusResult {
    let score = 0
    let totalWeight = 0
    let divergenceSum = 0

    // Primary consensus from reasoning oracles
    for (const v of verdicts) {
      const oracle = this.oracles.get(v.oracleId)!
      const weight = oracle.weight * oracle.accuracy
      score += v.prediction * weight
      totalWeight += weight
    }

    // Adversarial adjustment from verification oracles
    let adversarialPenalty = 0
    for (const v of verifications) {
      const oracle = this.oracles.get(v.oracleId)!
      adversarialPenalty += Math.abs(v.prediction - (score / totalWeight)) * oracle.weight
    }

    // Calculate divergence (oracle disagreement)
    const avgPrediction = score / totalWeight
    for (const v of verdicts) {
      divergenceSum += Math.abs(v.prediction - avgPrediction)
    }

    return {
      oracleConsensus: score / totalWeight,
      confidence: Math.max(0, totalWeight / this.oracles.size - adversarialPenalty * 0.1),
      divergence: divergenceSum / verdicts.length,
      timestamp: Date.now()
    }
  }

  async updateOracleWeights(actualOutcome: number) {
    const lastConsensus = this.history[this.history.length - 1]
    if (!lastConsensus) return

    for (const oracle of this.oracles.values()) {
      // Reward function: R = α(correctness) - β(volatility) - γ(latency) + δ(consensus)
      const α = 1.0, β = 0.3, γ = 0.1, δ = 0.2
      
      const correctness = 1 - Math.abs(actualOutcome - lastConsensus.oracleConsensus)
      const volatility = lastConsensus.divergence
      const latency = 0 // Simplified for demo
      const consensus = lastConsensus.confidence
      
      const reward = α * correctness - β * volatility - γ * latency + δ * consensus
      oracle.updateWeight(reward)
    }
  }

  getOracleHealth() {
    return Array.from(this.oracles.values()).map(o => ({
      id: o.id,
      type: o.type,
      weight: o.weight,
      accuracy: o.accuracy
    }))
  }
}