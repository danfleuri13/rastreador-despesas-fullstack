import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// --- NOVAS IMPORTAÇÕES DO CALENDÁRIO ---
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ptBR } from 'date-fns/locale'; // Para deixar em português
import './App.css'

// Registra o idioma português
registerLocale('pt-BR', ptBR)

function App() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState({ 
    descricao: '', 
    valor: '', 
    categoria: '', 
    // MUDANÇA 1: O estado inicial agora é um objeto Date real, não string
    data: new Date(), 
    tipo: 'saida' 
  })

  const CORES = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

  const fetchTransacoes = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/transacoes')
      setLista(response.data)
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  useEffect(() => { fetchTransacoes() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data || !form.categoria) return

    // MUDANÇA 2: Antes de enviar pro Python, transformamos a Data em String (YYYY-MM-DD)
    const dataFormatada = form.data.toISOString().split('T')[0]

    try {
      await axios.post('http://127.0.0.1:5000/transacoes', {
        descricao: form.descricao,
        valor: parseFloat(form.valor),
        categoria: form.categoria,
        data: dataFormatada, // Envia a string formatada
        tipo: form.tipo
      })
      
      setForm({ ...form, descricao: '', valor: '', categoria: '' }) 
      fetchTransacoes()
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/transacoes/${id}`)
      fetchTransacoes()
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  // --- CÁLCULOS ---
  const entradas = lista.filter(item => item.tipo === 'entrada').reduce((acc, item) => acc + item.valor, 0)
  const saidas = lista.filter(item => item.tipo === 'saida').reduce((acc, item) => acc + item.valor, 0)
  const saldo = entradas - saidas

  const dadosGrafico = lista
    .filter(item => item.tipo === 'saida' && item.categoria)
    .reduce((acc, item) => {
      const cat = acc.find(c => c.name === item.categoria)
      if (cat) { cat.value += item.valor }
      else { acc.push({ name: item.categoria, value: item.valor }) }
      return acc
    }, [])
    .sort((a, b) => b.value - a.value);

  const formatarData = (data) => data.split('-').reverse().join('/')
  const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="container">
      <h1>Controle de Fluxo de Caixa</h1>
      
      <div className="summary-cards">
        <div className="card-resumo bg-entrada"><span>Entradas</span><h3>{formatarMoeda(entradas)}</h3></div>
        <div className="card-resumo bg-saida"><span>Saídas</span><h3>{formatarMoeda(saidas)}</h3></div>
        <div className="card-resumo bg-saldo"><span>Saldo</span><h3>{formatarMoeda(saldo)}</h3></div>
      </div>

      {dadosGrafico.length > 0 && (
        <div className="chart-container" style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dadosGrafico} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                {dadosGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatarMoeda(value)} />
              <Legend layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="radio-group">
          <label className={`radio-label ${form.tipo === 'entrada' ? 'active-entrada' : ''}`}>
            <input type="radio" name="tipo" checked={form.tipo === 'entrada'} onChange={() => setForm({...form, tipo: 'entrada'})} />
            <span>⬆️ Entrada</span>
          </label>
          <label className={`radio-label ${form.tipo === 'saida' ? 'active-saida' : ''}`}>
            <input type="radio" name="tipo" checked={form.tipo === 'saida'} onChange={() => setForm({...form, tipo: 'saida'})} />
            <span>⬇️ Saída</span>
          </label>
        </div>

        <div className="input-group">
          {/* MUDANÇA 3: O Componente DatePicker substitui o input antigo */}
          <div className="custom-datepicker-wrapper">
            <DatePicker 
                selected={form.data} 
                onChange={(date) => setForm({...form, data: date})} 
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                className="custom-datepicker"
            />
          </div>
          
          <input placeholder="Descrição" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} style={{ flexGrow: 2, minWidth: '200px' }} />
          <input type="number" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} style={{ flexBasis: '120px' }} />

          <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={{ flexGrow: 1 }}>
            <option value="">Selecione a Categoria</option>
            {form.tipo === 'entrada' ? (
              <>
                <option value="Salário">💰 Salário</option>
                <option value="Freelance">👨‍💻 Freelance</option>
                <option value="Vendas">📈 Vendas</option>
                <option value="Investimentos">🏦 Investimentos</option>
                <option value="Outros">➕ Outros</option>
              </>
            ) : (
              <>
                <option value="Alimentação">🍔 Alimentação</option>
                <option value="Moradia">🏠 Moradia</option>
                <option value="Transporte">🚗 Transporte</option>
                <option value="Lazer">🎉 Lazer</option>
                <option value="Saúde">💊 Saúde</option>
                <option value="Educação">📚 Educação</option>
                <option value="Contas Fixas">🧾 Contas</option>
                <option value="Outros">💸 Outros</option>
              </>
            )}
          </select>
          <button type="submit">Adicionar</button>
        </div>
      </form>

      <ul className="lista">
        {lista.map(item => (
          <li key={item.id} className={`item ${item.tipo}`}>
            <div className="info">
              <small>{formatarData(item.data)}</small>
              <strong>{item.descricao}</strong>
              <span>{item.categoria}</span>
            </div>
            <div className="valores">
              <span className="preco">{item.tipo === 'saida' ? '- ' : '+ '}{formatarMoeda(item.valor)}</span>
              <button onClick={() => handleDelete(item.id)} className="delete-btn">🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App