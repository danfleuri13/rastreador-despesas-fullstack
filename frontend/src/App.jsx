import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [despesas, setDespesas] = useState([])
  // Adicionamos o campo 'data' no estado inicial com a data de hoje
  const [form, setForm] = useState({ 
    descricao: '', 
    valor: '', 
    categoria: '', 
    data: new Date().toISOString().split('T')[0] 
  })

  const fetchDespesas = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/despesas')
      setDespesas(response.data)
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  useEffect(() => { fetchDespesas() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data) return

    await axios.post('http://127.0.0.1:5000/despesas', {
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      categoria: form.categoria,
      data: form.data
    })
    
    setForm({ ...form, descricao: '', valor: '' }) // Mantém a data e categoria pra facilitar
    fetchDespesas()
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://127.0.0.1:5000/despesas/${id}`)
    fetchDespesas()
  }

  const total = despesas.reduce((acc, item) => acc + item.valor, 0)

  // Função auxiliar para formatar data (2025-11-19 -> 19/11/2025)
  const formatarData = (dataString) => {
    const [ano, mes, dia] = dataString.split('-')
    return `${dia}/${mes}/${ano}`
  }

  return (
    <div className="container">
      <h1>💰 Controle Financeiro</h1>
      
      <div style={{ padding: '15px', background: '#2ecc71', color: 'white', borderRadius: '8px', marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
        Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        {/* Novo input de Data */}
        <input 
          type="date" 
          value={form.data}
          onChange={e => setForm({...form, data: e.target.value})}
          style={{ maxWidth: '150px' }}
        />
        <input 
          placeholder="Descrição" 
          value={form.descricao}
          onChange={e => setForm({...form, descricao: e.target.value})}
        />
        <input 
          type="number" 
          placeholder="Valor" 
          value={form.valor}
          onChange={e => setForm({...form, valor: e.target.value})}
        />
        <select 
          value={form.categoria}
          onChange={e => setForm({...form, categoria: e.target.value})}
        >
          <option value="">Categoria</option>
          <option value="Alimentação">Alimentação</option>
          <option value="Contas">Contas</option>
          <option value="Lazer">Lazer</option>
          <option value="Saúde">Saúde</option>
          <option value="Transporte">Transporte</option>
        </select>
        <button type="submit">➕</button>
      </form>

      <ul className="lista">
        {despesas.map(item => (
          <li key={item.id} className="item">
            <div className="info">
              {/* Mostra a data formatada acima da descrição */}
              <small style={{ color: '#888', fontSize: '12px' }}>{formatarData(item.data)}</small>
              <strong>{item.descricao}</strong>
              <span style={{ fontSize: '14px', color: '#555' }}>{item.categoria}</span>
            </div>
            <div className="valores">
              <span className="preco">
                {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <button onClick={() => handleDelete(item.id)} className="delete-btn">🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App