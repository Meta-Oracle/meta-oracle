import { NextRequest, NextResponse } from 'next/server'
import { MetaOracleEngine } from '../../../lib/engine'
import { PriceSignalOracle, VolumeSignalOracle } from '../../../lib/oracles/signal'
import { TrendReasoningOracle, MomentumReasoningOracle } from '../../../lib/oracles/reasoning'
import { AdversarialVerificationOracle, ConsistencyVerificationOracle } from '../../../lib/oracles/verification'

// Global engine instance (in production, use Redis/KV store)
let engine: MetaOracleEngine | null = null

function initializeEngine() {
  if (!engine) {
    engine = new MetaOracleEngine()
    
    // Register Signal Oracles
    engine.register(new PriceSignalOracle())
    engine.register(new VolumeSignalOracle())
    
    // Register Reasoning Oracles
    engine.register(new TrendReasoningOracle())
    engine.register(new MomentumReasoningOracle())
    
    // Register Verification Oracles
    engine.register(new AdversarialVerificationOracle())
    engine.register(new ConsistencyVerificationOracle())
  }
  return engine
}

export async function GET(request: NextRequest) {
  try {
    const oracleEngine = initializeEngine()
    const consensus = await oracleEngine.runConsensus()
    
    return NextResponse.json({
      consensus: consensus.oracleConsensus,
      confidence: consensus.confidence,
      divergence: consensus.divergence,
      timestamp: consensus.timestamp,
      interpretation: getInterpretation(consensus.oracleConsensus, consensus.confidence, consensus.divergence)
    })
  } catch (error) {
    console.error('Consensus error:', error)
    return NextResponse.json(
      { error: 'Oracle consensus failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { actualOutcome } = await request.json()
    const oracleEngine = initializeEngine()
    
    await oracleEngine.updateOracleWeights(actualOutcome)
    
    return NextResponse.json({ 
      message: 'Oracle weights updated',
      oracleHealth: oracleEngine.getOracleHealth()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update oracle weights' },
      { status: 500 }
    )
  }
}

function getInterpretation(consensus: number, confidence: number, divergence: number) {
  let signal = 'NEUTRAL'
  let risk = 'MEDIUM'
  
  if (consensus > 0.7 && confidence > 0.6) signal = 'STRONG BULLISH'
  else if (consensus > 0.6) signal = 'BULLISH'
  else if (consensus < 0.3 && confidence > 0.6) signal = 'STRONG BEARISH'
  else if (consensus < 0.4) signal = 'BEARISH'
  
  if (divergence > 0.3) risk = 'HIGH'
  else if (divergence < 0.1) risk = 'LOW'
  
  return { signal, risk, strength: confidence }
}