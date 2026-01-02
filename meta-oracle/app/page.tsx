'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface ConsensusData {
  consensus: number
  confidence: number
  divergence: number
  timestamp: number
  interpretation: {
    signal: string
    risk: string
    strength: number
  }
}

interface OracleHealth {
  id: string
  type: string
  weight: number
  accuracy: number
  status: string
  influence: string
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'oracle'
  content: string
  timestamp: Date
}

export default function MetaOracleTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'oracle', content: '🔮 META-ORACLE v2.0 - Multi-Layer Oracle Network', timestamp: new Date() },
    { type: 'oracle', content: 'Self-Evolving Intelligence Fabric Initialized', timestamp: new Date() },
    { type: 'output', content: 'Type "help" for commands or "consensus" for live oracle data', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [consensusData, setConsensusData] = useState<ConsensusData | null>(null)
  const [oracleHealth, setOracleHealth] = useState<OracleHealth[]>([])
  const [consensusHistory, setConsensusHistory] = useState<any[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const addLine = (type: 'input' | 'output' | 'error' | 'oracle', content: string) => {
    setLines(prev => [...prev, { type, content, timestamp: new Date() }])
  }

  const fetchConsensus = async () => {
    try {
      const response = await axios.get('/api/consensus')
      const data = response.data
      setConsensusData(data)
      setConsensusHistory(prev => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString(),
        consensus: data.consensus,
        confidence: data.confidence
      }])
      return data
    } catch (error) {
      addLine('error', 'Failed to fetch oracle consensus')
      return null
    }
  }

  const fetchOracleHealth = async () => {
    try {
      const response = await axios.get('/api/oracle')
      setOracleHealth(response.data.oracles)
      return response.data
    } catch (error) {
      addLine('error', 'Failed to fetch oracle health')
      return null
    }
  }

  const executeCommand = async (cmd: string) => {
    const [command, ...args] = cmd.toLowerCase().trim().split(' ')
    
    addLine('input', `> ${cmd}`)

    switch (command) {
      case 'help':
        addLine('oracle', '🔮 META-ORACLE Commands:')
        addLine('output', '  consensus - Run oracle consensus and get market signal')
        addLine('output', '  health - Show oracle network health status')
        addLine('output', '  oracles - List all oracles and their performance')
        addLine('output', '  trifurcation - Explain Oracle Trifurcation Model')
        addLine('output', '  adversarial - Show adversarial validation results')
        addLine('output', '  clear - Clear terminal')
        break

      case 'consensus':
        addLine('oracle', '🔄 Running Oracle Trifurcation Model...')
        const consensus = await fetchConsensus()
        if (consensus) {
          addLine('oracle', '┌─────────────────────────────────────────┐')
          addLine('oracle', '│           ORACLE CONSENSUS              │')
          addLine('oracle', '├─────────────────────────────────────────┤')
          addLine('oracle', `│ Signal: ${consensus.interpretation.signal.padEnd(15)} │`)
          addLine('oracle', `│ Consensus: ${(consensus.consensus * 100).toFixed(1).padEnd(13)}% │`)
          addLine('oracle', `│ Confidence: ${(consensus.confidence * 100).toFixed(1).padEnd(12)}% │`)
          addLine('oracle', `│ Divergence: ${(consensus.divergence * 100).toFixed(1).padEnd(12)}% │`)
          addLine('oracle', `│ Risk Level: ${consensus.interpretation.risk.padEnd(12)} │`)
          addLine('oracle', '└─────────────────────────────────────────┘')
          
          const emoji = consensus.interpretation.signal.includes('BULLISH') ? '📈' : 
                       consensus.interpretation.signal.includes('BEARISH') ? '📉' : '⚖️'
          addLine('oracle', `${emoji} Oracle Network Verdict: ${consensus.interpretation.signal}`)
        }
        break

      case 'health':
        const health = await fetchOracleHealth()
        if (health) {
          addLine('oracle', '🏥 Oracle Network Health Status:')
          addLine('output', `Network Status: ${health.network.status}`)
          addLine('output', `Average Accuracy: ${health.network.avgAccuracy}`)
          addLine('output', `Network Stability: ${health.network.stability}`)
          addLine('output', `Active Oracles: ${health.network.totalOracles}`)
        }
        break

      case 'oracles':
        const oracleData = await fetchOracleHealth()
        if (oracleData) {
          addLine('oracle', '🔮 Oracle Performance Matrix:')
          addLine('output', '┌─────────────────────┬────────┬─────────┬──────────┬───────────┐')
          addLine('output', '│ Oracle ID           │ Type   │ Weight  │ Accuracy │ Status    │')
          addLine('output', '├─────────────────────┼────────┼─────────┼──────────┼───────────┤')
          oracleData.oracles.forEach((oracle: OracleHealth) => {
            const id = oracle.id.padEnd(19)
            const type = oracle.type.padEnd(6)
            const weight = oracle.weight.toFixed(2).padEnd(7)
            const accuracy = (oracle.accuracy * 100).toFixed(1).padEnd(8) + '%'
            const status = oracle.status.padEnd(9)
            addLine('output', `│ ${id} │ ${type} │ ${weight} │ ${accuracy} │ ${status} │`)
          })
          addLine('output', '└─────────────────────┴────────┴─────────┴──────────┴───────────┘')
        }
        break

      case 'trifurcation':
        addLine('oracle', '🔱 Oracle Trifurcation Model (OTM):')
        addLine('output', '┌─────────────────┐')
        addLine('output', '│ Signal Oracles  │ → Raw data ingestion')
        addLine('output', '└─────────────────┘')
        addLine('output', '        ↓')
        addLine('output', '┌─────────────────┐')
        addLine('output', '│ Reasoning Oracles│ → Interpretation + prediction')
        addLine('output', '└─────────────────┘')
        addLine('output', '        ↓')
        addLine('output', '┌─────────────────┐')
        addLine('output', '│ Verification Oracles│ → Adversarial validation')
        addLine('output', '└─────────────────┘')
        addLine('oracle', 'Each oracle competes, learns, and evolves based on accuracy')
        break

      case 'adversarial':
        addLine('oracle', '⚔️ Adversarial Validation Active:')
        addLine('output', '• Verification oracles challenge reasoning oracles')
        addLine('output', '• Malicious signals are penalized automatically')
        addLine('output', '• Oracle weights adjust based on performance')
        addLine('output', '• Self-policing intelligence mesh operational')
        break

      case 'clear':
        setLines([
          { type: 'oracle', content: '🔮 META-ORACLE v2.0 - Multi-Layer Oracle Network', timestamp: new Date() },
          { type: 'oracle', content: 'Self-Evolving Intelligence Fabric Initialized', timestamp: new Date() },
          { type: 'output', content: 'Type "help" for commands or "consensus" for live oracle data', timestamp: new Date() }
        ])
        break

      default:
        addLine('error', `Unknown command: ${command}. Type "help" for available commands.`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      executeCommand(input)
      setInput('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ELITE': return 'text-purple-400'
      case 'HEALTHY': return 'text-green-400'
      case 'STABLE': return 'text-blue-400'
      case 'DEGRADED': return 'text-yellow-400'
      case 'CRITICAL': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="flex h-screen">
        {/* Main Terminal */}
        <div className="flex-1 p-4">
          <div 
            ref={terminalRef}
            className="bg-gray-900 border border-green-400 rounded-lg p-4 h-5/6 overflow-y-auto mb-4"
          >
            {lines.map((line, index) => (
              <div key={index} className={`mb-1 ${
                line.type === 'error' ? 'text-red-400' : 
                line.type === 'input' ? 'text-yellow-400' :
                line.type === 'oracle' ? 'text-cyan-400 font-bold' : 'text-green-400'
              }`}>
                {line.content}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="flex">
            <span className="text-cyan-400 mr-2">🔮</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-green-400"
              placeholder="Enter oracle command..."
              autoFocus
            />
          </form>
        </div>

        {/* Oracle Dashboard */}
        <div className="w-96 p-4 border-l border-green-400">
          <div className="mb-6">
            <h3 className="text-cyan-400 font-bold mb-2">🔮 LIVE CONSENSUS</h3>
            {consensusData && (
              <div className="bg-gray-900 p-3 rounded border">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Signal:</span>
                    <span className={consensusData.interpretation.signal.includes('BULLISH') ? 'text-green-400' : 
                                   consensusData.interpretation.signal.includes('BEARISH') ? 'text-red-400' : 'text-yellow-400'}>
                      {consensusData.interpretation.signal}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span>{(consensusData.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk:</span>
                    <span className={consensusData.interpretation.risk === 'HIGH' ? 'text-red-400' : 
                                   consensusData.interpretation.risk === 'LOW' ? 'text-green-400' : 'text-yellow-400'}>
                      {consensusData.interpretation.risk}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-cyan-400 font-bold mb-2">📊 CONSENSUS HISTORY</h3>
            {consensusHistory.length > 0 && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consensusHistory}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 1]} hide />
                    <Line type="monotone" dataKey="consensus" stroke="#00ff00" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="confidence" stroke="#00ffff" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-cyan-400 font-bold mb-2">🏥 ORACLE HEALTH</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {oracleHealth.map((oracle, index) => (
                <div key={index} className="bg-gray-900 p-2 rounded border text-xs">
                  <div className="flex justify-between">
                    <span className="truncate">{oracle.id}</span>
                    <span className={getStatusColor(oracle.status)}>{oracle.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>{oracle.type}</span>
                    <span>{oracle.influence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}