import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ptBR } from 'date-fns/locale'
import './App.css'

registerLocale('pt-BR', ptBR)

function App() {
  const [lista, setLista] = useState([])
  const [graficoExpandido, setGraficoExpandido] = useState(null)
  const [categoriaDetalhada, setCategoriaDetalhada] = useState(null)
  
  // NOVO ESTADO: Controla qual card de resumo está aberto ('entrada', 'saida', 'saldo' ou null)
  const [resumoExpandido, setResumoExpandido] = useState(null)

  const [form, setForm] = useState({ 
    descricao: '', valor: '', categoria: '', data: new Date(), tipo: 'saida' 
  })

  const CORES_CATEGORIAS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
  const CORES_BALANCO = ['#4CAF50', '#F44336'] 

  const fetchTransacoes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/transacoes')
      setLista(response.data)
    } catch (error) { console.error("Erro:", error) }
  }

  useEffect(() => { fetchTransacoes() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data || !form.categoria) return
    const dataFormatada = form.data.toISOString().split('T')[0]
    try {
      await axios.post('http://localhost:5000/transacoes', {
        descricao: form.descricao, valor: parseFloat(form.valor), categoria: form.categoria, data: dataFormatada, tipo: form.tipo
      })
      setForm({ ...form, descricao: '', valor: '', categoria: '' }) 
      fetchTransacoes()
    } catch (error) { console.error("Erro:", error) }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/transacoes/${id}`)
      fetchTransacoes()
    } catch (error) { console.error("Erro:", error) }
  }

  // --- PROCESSAMENTO DE DADOS ---
  const entradasTotal = lista.filter(i => i.tipo === 'entrada').reduce((acc, i) => acc + i.valor, 0)
  const saidasTotal = lista.filter(i => i.tipo === 'saida').reduce((acc, i) => acc + i.valor, 0)
  const saldo = entradasTotal - saidasTotal

  const agruparDados = (tipo) => {
    return lista
      .filter(item => item.tipo === tipo && item.categoria)
      .reduce((acc, item) => {
        const cat = acc.find(c => c.name === item.categoria)
        if (cat) { cat.value += item.valor }
        else { acc.push({ name: item.categoria, value: item.valor }) }
        return acc
      }, [])
      .sort((a, b) => b.value - a.value)
  }

  const dadosSaidas = agruparDados('saida')
  const dadosEntradas = agruparDados('entrada')
  const dadosBalanco = [ { name: 'Entradas', value: entradasTotal }, { name: 'Saídas', value: saidasTotal } ]

  const formatarData = (data) => data.split('-').reverse().join('/')
  const formatarMoeda = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // --- COMPONENTE DO MODAL DE RESUMO (NOVO) ---
  const RenderModalResumo = () => {
    if (!resumoExpandido) return null;

    // Filtra a lista baseada no card clicado
    let titulo = "";
    let itensFiltrados = [];
    let corTema = "";

    if (resumoExpandido === 'entrada') {
      titulo = "Relatório de Entradas";
      itensFiltrados = lista.filter(i => i.tipo === 'entrada');
      corTema = "var(--primary-color)";
    } else if (resumoExpandido === 'saida') {
      titulo = "Relatório de Saídas";
      itensFiltrados = lista.filter(i => i.tipo === 'saida');
      corTema = "var(--secondary-color)";
    } else {
      titulo = "Extrato Completo (Saldo)";
      itensFiltrados = [...lista].sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena por data
      corTema = "var(--accent-color)";
    }

    return (
      <div className="modal-overlay" onClick={() => setResumoExpandido(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderTop: `6px solid ${corTema}` }}>
          <div className="modal-header">
            <h2 style={{ color: corTema }}>{titulo}</h2>
            <button className="btn-close-modal" onClick={() => setResumoExpandido(null)}>✕</button>
          </div>
          
          <div className="modal-body">
            {itensFiltrados.length === 0 ? (
              <p className="empty-state">Nenhum registro encontrado.</p>
            ) : (
              <ul className="details-list">
                {itensFiltrados.map(item => (
                  <li key={item.id} className="detail-item" style={{ borderLeftColor: item.tipo === 'entrada' ? '#4CAF50' : '#F44336' }}>
                    <div>
                      <div style={{fontWeight: 600, color: '#333'}}>{item.descricao}</div>
                      <small>{formatarData(item.data)} • {item.categoria}</small>
                    </div>
                    <div style={{fontWeight: 'bold', color: item.tipo === 'entrada' ? '#4CAF50' : '#F44336'}}>
                      {item.tipo === 'saida' ? '- ' : '+ '}{formatarMoeda(item.valor)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="modal-footer">
            Total: <strong>{formatarMoeda(itensFiltrados.reduce((acc, i) => acc + i.valor, 0))}</strong>
          </div>
        </div>
      </div>
    )
  }

  // --- COMPONENTE INTERNO DE GRÁFICO ---
  const RenderGrafico = ({ titulo, dados, cores, id }) => {
    if (dados.length === 0) return null;
    const isExpandido = graficoExpandido === id;
    if (graficoExpandido && !isExpandido) return null;

    const transacoesFiltradas = categoriaDetalhada 
      ? lista.filter(item => item.categoria === categoriaDetalhada && (id === 'balanco' ? (item.tipo === (categoriaDetalhada === 'Entradas' ? 'entrada' : 'saida')) : item.tipo === (id === 'entradas' ? 'entrada' : 'saida')))
      : [];

    return (
      <div 
        className={`chart-card ${isExpandido ? 'expanded' : 'clickable'}`}
        onClick={() => !isExpandido && setGraficoExpandido(id)}
      >
        {isExpandido && (
          <button className="btn-close-absolute" onClick={(e) => { e.stopPropagation(); setGraficoExpandido(null); setCategoriaDetalhada(null); }}>✕</button>
        )}
        <h3>{titulo}</h3>
        
        {isExpandido ? (
          <div className="expanded-content">
            <div className="expanded-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dados} cx="50%" cy="50%" innerRadius={100} outerRadius={160} paddingAngle={2} dataKey="value" cursor="pointer"
                    onClick={(data) => setCategoriaDetalhada(data.name === categoriaDetalhada ? null : data.name)}
                    label={({ percent, value }) => `${formatarMoeda(value)} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {dados.map((entry, index) => ( <Cell key={`cell-${index}`} fill={cores[index % cores.length]} opacity={categoriaDetalhada && categoriaDetalhada !== entry.name ? 0.3 : 1} /> ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatarMoeda(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              {!categoriaDetalhada && <p className="instruction-text">Clique em uma fatia para ver os detalhes</p>}
            </div>

            {categoriaDetalhada && (
              <div className="details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="details-header">Detalhes: <span style={{color: 'var(--primary-color)'}}>{categoriaDetalhada}</span></div>
                <div className="details-list">
                  {transacoesFiltradas.map(item => (
                    <div key={item.id} className="detail-item" style={{ borderLeftColor: item.tipo === 'entrada' ? '#4CAF50' : '#F44336' }}>
                      <div><div style={{fontWeight: 600, color: '#333'}}>{item.descricao}</div><div style={{fontSize: '0.8rem', color: '#999'}}>{formatarData(item.data)}</div></div>
                      <div style={{fontWeight: 'bold', color: '#555'}}>{formatarMoeda(item.valor)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dados} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {dados.map((entry, index) => ( <Cell key={`cell-${index}`} fill={cores[index % cores.length]} /> ))}
                </Pie>
                <Tooltip formatter={(value) => formatarMoeda(value)} />
                <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
            <span className="hint-click">Toque para ampliar</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Controle de Fluxo de Caixa</h1>
      
      {/* Renderiza o Modal se estiver aberto */}
      <RenderModalResumo />

      {/* RESUMO (Agora clicável) */}
      <div className="summary-cards">
        <div className="card-resumo bg-entrada clickable-card" onClick={() => setResumoExpandido('entrada')}>
          <span>Entradas</span><h3>{formatarMoeda(entradasTotal)}</h3><small>Ver detalhes</small>
        </div>
        <div className="card-resumo bg-saida clickable-card" onClick={() => setResumoExpandido('saida')}>
          <span>Saídas</span><h3>{formatarMoeda(saidasTotal)}</h3><small>Ver detalhes</small>
        </div>
        <div className="card-resumo bg-saldo clickable-card" onClick={() => setResumoExpandido('saldo')}>
          <span>Saldo</span><h3>{formatarMoeda(saldo)}</h3><small>Ver extrato</small>
        </div>
      </div>

      <div className={`charts-grid ${graficoExpandido ? 'single-view' : ''}`}>
        <RenderGrafico titulo="Entradas por Categoria" dados={dadosEntradas} cores={CORES_CATEGORIAS} id="entradas" />
        <RenderGrafico titulo="Balanço Geral" dados={dadosBalanco} cores={CORES_BALANCO} id="balanco" />
        <RenderGrafico titulo="Saídas por Categoria" dados={dadosSaidas} cores={CORES_CATEGORIAS} id="saidas" />
      </div>

      {!graficoExpandido && (
        <>
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
              <div className="custom-datepicker-wrapper">
                <DatePicker selected={form.data} onChange={(date) => setForm({...form, data: date})} dateFormat="dd/MM/yyyy" locale="pt-BR" className="custom-datepicker" />
              </div>
              <input placeholder="Descrição" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} style={{ flexGrow: 2, minWidth: '200px' }} />
              <input type="number" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} style={{ flexBasis: '120px' }} />
              <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={{ flexGrow: 1 }}>
                <option value="">Selecione a Categoria</option>
                {form.tipo === 'entrada' ? ( <> <option value="Salário">💰 Salário</option> <option value="Freelance">👨‍💻 Freelance</option> <option value="Vendas">📈 Vendas</option> <option value="Investimentos">🏦 Investimentos</option> <option value="Outros">➕ Outros</option> </> ) : ( <> <option value="Alimentação">🍔 Alimentação</option> <option value="Moradia">🏠 Moradia</option> <option value="Transporte">🚗 Transporte</option> <option value="Lazer">🎉 Lazer</option> <option value="Saúde">💊 Saúde</option> <option value="Educação">📚 Educação</option> <option value="Contas Fixas">🧾 Contas</option> <option value="Outros">💸 Outros</option> </> )}
              </select>
              <button type="submit">Adicionar</button>
            </div>
          </form>

          <ul className="lista">
            {lista.map(item => (
              <li key={item.id} className={`item ${item.tipo}`}>
                <div className="info"><small>{formatarData(item.data)}</small><strong>{item.descricao}</strong><span>{item.categoria}</span></div>
                <div className="valores"><span className="preco">{item.tipo === 'saida' ? '- ' : '+ '}{formatarMoeda(item.valor)}</span><button onClick={() => handleDelete(item.id)} className="delete-btn">🗑️</button></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default App