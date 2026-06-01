import React, { useState } from 'react'
import axios from 'axios'

export default function App() {
  const [backendStatus, setBackendStatus] = useState(null)
  const [tenants, setTenants] = useState([])
  const [loadingTenants, setLoadingTenants] = useState(false)

  const checkHealth = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/health')
      setBackendStatus(res.data)
    } catch (err) {
      setBackendStatus({ status: 'down', error: err.message })
    }
  }

  const fetchTenants = async () => {
    setLoadingTenants(true)
    try {
      const res = await axios.get('http://localhost:3001/api/test-db')
      if (res.data && res.data.tenants) setTenants(res.data.tenants)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTenants(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-sky-700">Biblioteca Inteligente — Diagnósticos</h1>
          <p className="text-sm text-gray-600">Prueba rápida de conexión Backend y DB</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-4 bg-white rounded shadow">
            <h2 className="font-semibold">Estatus del Backend</h2>
            <p className="text-sm text-gray-500 mb-3">Comprueba si el backend responde</p>
            <button
              onClick={checkHealth}
              className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
            >
              Comprobar Backend
            </button>

            {backendStatus && (
              <div className="mt-4">
                <div className={`inline-block px-3 py-1 rounded text-white ${backendStatus.status === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {backendStatus.status}
                </div>
                <div className="mt-2 text-xs text-gray-600">{backendStatus.timestamp || backendStatus.error}</div>
              </div>
            )}
          </section>

          <section className="p-4 bg-white rounded shadow">
            <h2 className="font-semibold">Datos de la Base de Datos</h2>
            <p className="text-sm text-gray-500 mb-3">Recupera las escuelas (tenants) de prueba</p>
            <button
              onClick={fetchTenants}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
            >
              Traer Tenants
            </button>

            <div className="mt-4">
              {loadingTenants && <div className="text-sm text-gray-500">Cargando...</div>}
              <div className="grid gap-3 mt-3">
                {tenants.map((t) => (
                  <div key={t.id} className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.emailDomain}</div>
                      </div>
                      <div className={`text-sm px-2 py-1 rounded ${t.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {t.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
