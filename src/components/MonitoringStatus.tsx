'use client'

import { useState, useEffect } from 'react'
import { monitor, type LogEvent } from '@/lib/monitoring'

export default function MonitoringStatus() {
  const [isVisible, setIsVisible] = useState(false)
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    // Показываем только в development или при ошибках
    const isDev = process.env.NODE_ENV === 'development'
    
    const updateLogs = () => {
      const currentLogs = monitor.exportLocalLogs()
      setLogs(currentLogs.slice(-10)) // Последние 10 логов
      
      const errors = currentLogs.filter(log => log.level === 'error')
      setErrorCount(errors.length)
      
      // Показываем статус если есть ошибки или в dev режиме
      setIsVisible(isDev || errors.length > 0)
    }

    updateLogs()
    
    // Обновляем каждые 5 секунд
    const interval = setInterval(updateLogs, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">🔍 Monitoring</span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-1">
          <div>Logs: {logs.length}/10</div>
          {errorCount > 0 && (
            <div className="text-red-400">❌ Errors: {errorCount}</div>
          )}
          
          <div className="mt-2 text-gray-400">
            Open console and run:
            <br />
            <code className="bg-gray-700 px-1 rounded">carlynxLogs()</code>
          </div>
        </div>
      </div>
    </div>
  )
}