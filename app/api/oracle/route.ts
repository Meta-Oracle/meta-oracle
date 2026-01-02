import { NextRequest, NextResponse } from 'next/server'
import { MetaOracleEngine } from '../../../lib/engine'
import { PriceSignalOracle, VolumeSignalOracle } from '../../../lib/oracles/signal'
import { TrendReasoningOracle, MomentumReasoningOracle } from '../../../lib/oracles/reasoning'
import { AdversarialVerificationOracle, ConsistencyVerificationOracle } from '../../../lib/oracles/verification'

let engine: MetaOracleEngine | null = null

function getEngine() {
  if (!engine) {
    engine = new MetaOracleEngine()
    engine.register(new PriceSignalOracle())
    engine.register(new VolumeSignalOracle())
    engine.register(new TrendReasoningOracle())
    engine.register(new MomentumReasoningOracle())
    engine.register(new AdversarialVerificationOracle())
    engine.register(new ConsistencyVerificationOracle())
  }
  return engine
}

export async function GET() {
  try {
    const oracleEngine = getEngine()
    const health = oracleEngine.getOracleHealth()
    
    // Calculate network metrics
    const totalWeight = health.reduce((sum, o) => sum + o.weight, 0)
    const avgAccuracy = health.reduce((sum, o) => sum + o.accuracy, 0) / health.length
    const networkStability = Math.min(...health.map(o => o.weight)) / Math.max(...health.map(o => o.weight))
    
    return NextResponse.json({
      oracles: health.map(o => ({
        ...o,
        status: getOracleStatus(o.weight, o.accuracy),
        influence: (o.weight / totalWeight * 100).toFixed(1) + '%'
      })),
      network: {
        totalOracles: health.length,
        avgAccuracy: (avgAccuracy * 100).toFixed(1) + '%',
        stability: (networkStability * 100).toFixed(1) + '%',
        status: getNetworkStatus(avgAccuracy, networkStability)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get oracle health' },
      { status: 500 }
    )
  }
}

function getOracleStatus(weight: number, accuracy: number) {
  if (weight > 1.5 && accuracy > 0.7) return 'ELITE'
  if (weight > 1.0 && accuracy > 0.6) return 'HEALTHY'
  if (weight > 0.5 && accuracy > 0.4) return 'STABLE'
  if (weight > 0.2) return 'DEGRADED'
  return 'CRITICAL'
}

function getNetworkStatus(avgAccuracy: number, stability: number) {
  if (avgAccuracy > 0.7 && stability > 0.6) return 'OPTIMAL'
  if (avgAccuracy > 0.6 && stability > 0.4) return 'STABLE'
  if (avgAccuracy > 0.4) return 'UNSTABLE'
  return 'CRITICAL'
}