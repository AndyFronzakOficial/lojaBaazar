import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import {
  Banknote, BarChart3, CalendarCheck, Download, Home, LogOut, Menu, Package,
  Receipt, Save, Search, Settings, ShoppingCart, Trash2, UserRound
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './styles.css'

type Page = 'dashboard' | 'caixa' | 'pdv' | 'financeiro' | 'relatorios' | 'produtos' | 'clientes' | 'configuracoes'

type Product = {
  id?: string
  user_id?: string
  name: string
  product_code: string | null
  barcode: string | null
  brand: string | null
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
}

type Customer = {
  id?: string
  user_id?: string
  name: string
  document: string | null
  phone: string | null
  address: string | null
  notes: string | null
}

type CartItem = {
  product: Product
  quantity: number
  unit_price: number
  discount: number
}

const emptyProduct: Product = {
  name: '',
  product_code: '',
  barcode: '',
  brand: '',
  cost_price: 0,
  sale_price: 0,
  stock: 0,
  min_stock: 0
}

const emptyCustomer: Customer = {
  name: '',
  document: '',
  phone: '',
  address: '',
  notes: ''
}

function money(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function brDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function firstDayOfMonth(month = currentMonth()) {
  return `${month}-01`
}

function lastDayOfMonth(month = currentMonth()) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).toISOString().slice(0, 10)
}

function dateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

async function getUserId() {
  const { data } = await supabase.auth.getUser()
  return data.user?.id || ''
}

async function getUserEmail() {
  const { data } = await supabase.auth.getUser()
  return data.user?.email || ''
}

async function getStoreSettings() {
  const user_id = await getUserId()
  const { data } = await supabase.from('store_settings').select('*').eq('user_id', user_id).limit(1).maybeSingle()
  if (data) return data

  const { data: created } = await supabase.from('store_settings').insert({
    user_id,
    store_name: 'Bazar Eletrônicos',
    cnpj: '',
    phone: '',
    address: '',
    theme: 'dark'
  }).select().single()

  return created || { store_name: 'Bazar Eletrônicos', cnpj: '', phone: '', address: '' }
}


function gerarCupom80mm({ saleId, settings, items, subtotal, discount, addition, total, payment }: any) {
  const height = Math.max(120, 90 + items.length * 9)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, height] })
  let y = 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(settings.store_name || 'Bazar Eletrônicos', 40, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  if (settings.cnpj) {
    doc.text(`CNPJ: ${settings.cnpj}`, 40, y, { align: 'center' })
    y += 4
  }

  if (settings.address) {
    doc.text(String(settings.address).slice(0, 44), 40, y, { align: 'center' })
    y += 4
  }

  if (settings.phone) {
    doc.text(settings.phone, 40, y, { align: 'center' })
    y += 4
  }

  doc.text('----------------------------------------', 40, y, { align: 'center' })
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('CUPOM NÃO FISCAL', 40, y, { align: 'center' })
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.text(`Venda: ${String(saleId).slice(0, 8)}`, 4, y)
  y += 4
  doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 4, y)
  y += 4
  doc.text('----------------------------------------', 40, y, { align: 'center' })
  y += 4

  items.forEach((item: CartItem) => {
    const totalItem = item.quantity * item.unit_price - item.discount
    doc.setFont('helvetica', 'bold')
    doc.text(item.product.name.slice(0, 32), 4, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.text(`${item.quantity} x ${money(item.unit_price)}`, 4, y)
    doc.text(money(totalItem), 76, y, { align: 'right' })
    y += 5
  })

  doc.text('----------------------------------------', 40, y, { align: 'center' })
  y += 4
  doc.text('Subtotal', 4, y)
  doc.text(money(subtotal), 76, y, { align: 'right' })
  y += 4
  doc.text('Desconto', 4, y)
  doc.text(money(discount), 76, y, { align: 'right' })
  y += 4
  doc.text('Acréscimo', 4, y)
  doc.text(money(addition), 76, y, { align: 'right' })
  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL', 4, y)
  doc.text(money(total), 76, y, { align: 'right' })
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Pagamento: ${payment}`, 4, y)
  y += 5
  doc.text('Obrigado pela preferência!', 40, y, { align: 'center' })
  y += 4
  doc.text('Volte sempre.', 40, y, { align: 'center' })

  doc.save(`cupom-${String(saleId).slice(0, 8)}.pdf`)
}


function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-2xl">B</div>
        <h1 className="mt-6 text-3xl font-bold">Bazar Eletrônicos</h1>
        <p className="text-slate-400 mt-2">Cada login acessa sua própria loja.</p>
        <label className="label mt-8">E-mail</label>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="label mt-4">Senha</label>
        <input className="input" value={password} onChange={e => setPassword(e.target.value)} type="password" />
        {error && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}
        <button className="btn mt-6 w-full">Entrar</button>
      </form>
    </main>
  )
}

function Sidebar({ page, setPage, collapsed, setCollapsed }: { page: Page, setPage: (p: Page) => void, collapsed: boolean, setCollapsed: (v: boolean) => void }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'caixa', label: 'Caixa', icon: Banknote },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'financeiro', label: 'Financeiro', icon: CalendarCheck },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: UserRound },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ] as const

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-slate-950 border-r border-slate-800 p-4 hidden lg:flex flex-col transition-all duration-200`}>
      <div className="flex items-center justify-between gap-3 px-2 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0">B</div>
          {!collapsed && <div><strong>Bazar ERP</strong><p className="text-xs text-slate-400">V18 multi-loja</p></div>}
        </div>

        <button type="button" onClick={() => setCollapsed(!collapsed)} className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-900" title={collapsed ? 'Mostrar menu' : 'Ocultar menu'}>
          <Menu size={18} />
        </button>
      </div>

      <nav className="mt-4 space-y-1 flex-1 overflow-auto">
        {items.map(item => {
          const Icon = item.icon
          return (
            <button key={item.id} onClick={() => setPage(item.id as Page)} className={`nav ${collapsed ? 'justify-center px-2' : ''} ${page === item.id ? 'nav-active' : ''}`} title={item.label}>
              <Icon size={18}/>
              {!collapsed && item.label}
            </button>
          )
        })}
      </nav>

      <button onClick={logout} className={`nav text-red-300 ${collapsed ? 'justify-center px-2' : ''}`} title="Sair">
        <LogOut size={18}/>
        {!collapsed && 'Sair'}
      </button>
    </aside>
  )
}

function Header({ title }: { title: string }) {
  return <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-4"><h2 className="text-xl font-bold">{title}</h2></header>
}

function Card({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return <div className="card flex justify-between items-center"><div><p className="text-slate-400 text-sm">{title}</p><strong className="text-2xl">{value}</strong></div><Icon className="text-emerald-400" /></div>
}

function aggregateProductsSold(saleItems: any[]) {
  const map: any = {}
  saleItems.forEach(item => {
    const id = item.product_id || item.products?.name || 'sem-id'
    if (!map[id]) {
      map[id] = {
        product: item.products?.name || 'Produto',
        code: item.products?.product_code || '',
        quantity: 0,
        total: 0,
        profit: 0
      }
    }
    map[id].quantity += Number(item.quantity || 0)
    map[id].total += Number(item.total || 0)
    map[id].profit += Number(item.profit || 0)
  })
  return Object.values(map) as any[]
}

function Dashboard() {
  const [data, setData] = useState<any>({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    ticket: 0,
    top: [],
    bottom: []
  })

  async function load() {
    const user_id = await getUserId()
    const monthStart = firstDayOfMonth()
    const monthEnd = `${lastDayOfMonth()}T23:59:59`
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', `${monthStart}T00:00:00`)
      .lte('created_at', monthEnd)

    const validSales = (sales || []).filter(s => s.status !== 'cancelada')
    const saleIds = validSales.map(s => s.id)

    let items: any[] = []
    if (saleIds.length) {
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('*, products(name, product_code)')
        .eq('user_id', user_id)
        .in('sale_id', saleIds)
      items = saleItems || []
    }

    const todayRevenue = validSales
      .filter(s => String(s.created_at).slice(0, 10) === today())
      .reduce((a, s) => a + Number(s.total || 0), 0)

    const weekRevenue = validSales
      .filter(s => String(s.created_at).slice(0, 10) >= dateDaysAgo(6))
      .reduce((a, s) => a + Number(s.total || 0), 0)

    const monthRevenue = validSales.reduce((a, s) => a + Number(s.total || 0), 0)
    const ticket = validSales.length ? monthRevenue / validSales.length : 0

    const sold = aggregateProductsSold(items)
    const top = [...sold].sort((a, b) => b.quantity - a.quantity).slice(0, 3)
    const bottom = [...sold].sort((a, b) => a.quantity - b.quantity).slice(0, 3)

    setData({ todayRevenue, weekRevenue, monthRevenue, ticket, top, bottom })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Faturamento do dia" value={money(data.todayRevenue)} icon={Receipt} />
        <Card title="Últimos 7 dias" value={money(data.weekRevenue)} icon={BarChart3} />
        <Card title="Faturamento do mês" value={money(data.monthRevenue)} icon={Banknote} />
        <Card title="Ticket médio" value={money(data.ticket)} icon={ShoppingCart} />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <section className="panel">
          <h3>Top 3 produtos mais vendidos</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Produto</th><th>Quantidade</th><th>Total</th></tr></thead>
            <tbody>
              {data.top.map((p: any) => <tr key={p.product}><td>{p.product}</td><td>{p.quantity}</td><td>{money(p.total)}</td></tr>)}
              {!data.top.length && <tr><td colSpan={3} className="text-slate-500">Sem vendas no mês.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Top 3 produtos menos vendidos</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Produto</th><th>Quantidade</th><th>Total</th></tr></thead>
            <tbody>
              {data.bottom.map((p: any) => <tr key={p.product}><td>{p.product}</td><td>{p.quantity}</td><td>{money(p.total)}</td></tr>)}
              {!data.bottom.length && <tr><td colSpan={3} className="text-slate-500">Sem vendas no mês.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}


function CashPage() {
  const [session, setSession] = useState<any>(null)
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [entries, setEntries] = useState<any[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [message, setMessage] = useState('')

  async function load() {
    const user_id = await getUserId()

    const { data: opened } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'aberto')
      .maybeSingle()

    setSession(opened)

    const start = `${month}-01`
    const endDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10)

    const { data } = await supabase
      .from('financial_entries')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', `${start}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false })

    setEntries(data || [])
  }

  useEffect(() => { load() }, [month])

  const entradaTypes = ['entrada', 'suprimento', 'abertura']
  const saidaTypes = ['saida', 'sangria', 'pagar', 'cancelada']

  const entradas = entries
    .filter(e => entradaTypes.includes(e.type))
    .reduce((a, e) => a + Number(e.amount || 0), 0)

  const saidas = entries
    .filter(e => saidaTypes.includes(e.type))
    .reduce((a, e) => a + Number(e.amount || 0), 0)

  const expected = Number(session?.opening_amount || 0) + entradas - saidas
  const difference = closingAmount === '' ? 0 : Number(closingAmount || 0) - expected

  async function openCash() {
    const user_id = await getUserId()
    const value = Number(openingAmount || 0)

    const { data, error } = await supabase
      .from('cash_sessions')
      .insert({
        user_id,
        opened_at: new Date().toISOString(),
        opening_amount: value,
        status: 'aberto'
      })
      .select()
      .single()

    if (error || !data) {
      setMessage(error?.message || 'Erro ao abrir caixa.')
      return
    }

    await supabase.from('financial_entries').insert({
      user_id,
      description: 'Abertura de caixa',
      type: 'abertura',
      payment_method: 'Dinheiro',
      amount: value,
      paid_at: new Date().toISOString(),
      cash_session_id: data.id
    })

    setOpeningAmount('')
    setMessage('Caixa aberto com sucesso.')
    await load()
  }

  async function closeCash() {
    if (!session) return

    const user_id = await getUserId()
    const value = Number(closingAmount || 0)
    const diff = value - expected

    await supabase
      .from('cash_sessions')
      .update({
        closed_at: new Date().toISOString(),
        closing_amount: value,
        expected_amount: expected,
        difference: diff,
        status: 'fechado'
      })
      .eq('id', session.id)
      .eq('user_id', user_id)

    await supabase.from('financial_entries').insert({
      user_id,
      description: 'Fechamento de caixa',
      type: 'fechamento',
      payment_method: 'Dinheiro',
      amount: value,
      paid_at: new Date().toISOString(),
      cash_session_id: session.id
    })

    setClosingAmount('')
    setMessage('Caixa fechado com sucesso.')
    await load()
  }

  async function quickEntry(type: 'sangria' | 'suprimento') {
    if (!session) {
      setMessage('Abra o caixa antes.')
      return
    }

    const value = Number(prompt(type === 'sangria' ? 'Valor da sangria:' : 'Valor do suprimento:') || 0)
    if (!value) return

    const user_id = await getUserId()

    await supabase.from('financial_entries').insert({
      user_id,
      description: type === 'sangria' ? 'Sangria de caixa' : 'Suprimento de caixa',
      type,
      payment_method: 'Dinheiro',
      amount: value,
      paid_at: new Date().toISOString(),
      cash_session_id: session.id
    })

    setMessage(type === 'sangria' ? 'Sangria registrada.' : 'Suprimento registrado.')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-5 gap-4">
        <Card title="Status" value={session ? 'Aberto' : 'Fechado'} icon={Banknote} />
        <Card title="Valor inicial" value={money(Number(session?.opening_amount || 0))} icon={Banknote} />
        <Card title="Entradas" value={money(entradas)} icon={Receipt} />
        <Card title="Saídas" value={money(saidas)} icon={CalendarCheck} />
        <Card title="Valor esperado" value={money(expected)} icon={BarChart3} />
      </div>

      <section className="panel">
        <h3>{session ? 'Fechamento de caixa' : 'Abertura de caixa'}</h3>

        {!session && (
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Valor inicial em dinheiro</label>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Ex: 100.00"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
              />
            </div>
            <button className="btn self-end" onClick={openCash}>Abrir caixa</button>
          </div>
        )}

        {session && (
          <div className="grid md:grid-cols-5 gap-3">
            <div>
              <label className="label">Valor contado no caixa</label>
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Ex: 400.00"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
              />
            </div>

            <div className="mini">
              Diferença<br/>
              <b className={difference < 0 ? 'text-red-300' : 'text-emerald-300'}>
                {money(difference)}
              </b>
            </div>

            <button className="btn self-end" onClick={closeCash}>Fechar caixa</button>
            <button className="btn2 self-end" onClick={() => quickEntry('sangria')}>Sangria</button>
            <button className="btn2 self-end" onClick={() => quickEntry('suprimento')}>Suprimento</button>
          </div>
        )}

        {message && <p className="mt-4 mini">{message}</p>}
      </section>

      <section className="panel">
        <h3>Fluxo de caixa</h3>
        <div className="mb-4 w-64">
          <label className="label">Filtrar mês</label>
          <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Forma</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.created_at).toLocaleString('pt-BR')}</td>
                <td>{e.description}</td>
                <td>{e.type}</td>
                <td>{e.payment_method}</td>
                <td>{money(e.amount)}</td>
              </tr>
            ))}
            {!entries.length && <tr><td colSpan={5} className="text-slate-500">Nenhum lançamento no período.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  )
}


function FinancePage() {
  const [month, setMonth] = useState(currentMonth())
  const [entries, setEntries] = useState<any[]>([])

  async function load() {
    const user_id = await getUserId()
    const { data } = await supabase
      .from('financial_entries')
      .select('*, customers(name), suppliers(name)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    setEntries(data || [])
  }

  useEffect(() => { load() }, [])

  const monthEntries = entries.filter(e => String(e.created_at || '').slice(0, 7) === month)

  const entradaTypes = ['entrada', 'suprimento', 'abertura']
  const saidaTypes = ['saida', 'sangria', 'pagar', 'cancelada']

  const saldoAtual =
    entries.filter(e => e.paid_at && entradaTypes.includes(e.type)).reduce((a, e) => a + Number(e.amount || 0), 0)
    - entries.filter(e => e.paid_at && saidaTypes.includes(e.type)).reduce((a, e) => a + Number(e.amount || 0), 0)

  const aReceber = entries.filter(e => e.type === 'receber' && !e.paid_at).reduce((a, e) => a + Number(e.amount || 0), 0)
  const aPagar = entries.filter(e => e.type === 'pagar' && !e.paid_at).reduce((a, e) => a + Number(e.amount || 0), 0)
  const saldoPrevisto = saldoAtual + aReceber - aPagar

  const days = Array.from({ length: new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate() }, (_, i) => {
    const day = String(i + 1).padStart(2, '0')
    const date = `${month}-${day}`
    const entradas = monthEntries.filter(e => String(e.created_at).slice(0, 10) === date && entradaTypes.includes(e.type)).reduce((a, e) => a + Number(e.amount || 0), 0)
    const saidas = monthEntries.filter(e => String(e.created_at).slice(0, 10) === date && saidaTypes.includes(e.type)).reduce((a, e) => a + Number(e.amount || 0), 0)
    return { date, day, entradas, saidas }
  })

  const maxBar = Math.max(1, ...days.map(d => Math.max(d.entradas, d.saidas)))

  async function pay(entry: any) {
    await supabase.from('financial_entries').update({ paid_at: new Date().toISOString() }).eq('id', entry.id)
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Saldo atual" value={money(saldoAtual)} icon={Banknote} />
        <Card title="A receber" value={money(aReceber)} icon={Receipt} />
        <Card title="A pagar" value={money(aPagar)} icon={CalendarCheck} />
        <Card title="Saldo previsto" value={money(saldoPrevisto)} icon={BarChart3} />
      </div>

      <section className="panel">
        <h3>Gráfico de Fluxo de Caixa</h3>
        <div className="mb-4 w-64">
          <label className="label">Mês</label>
          <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
        <div className="space-y-3">
          {days.map(d => (
            <div key={d.date} className="grid grid-cols-12 gap-2 items-center text-xs">
              <div className="col-span-1 text-slate-400">{d.day}</div>
              <div className="col-span-5 bg-slate-800 rounded-md h-4">
                <div className="bar-in h-4" style={{ width: `${(d.entradas / maxBar) * 100}%` }} />
              </div>
              <div className="col-span-2 text-emerald-300">{money(d.entradas)}</div>
              <div className="col-span-3 bg-slate-800 rounded-md h-4">
                <div className="bar-out h-4" style={{ width: `${(d.saidas / maxBar) * 100}%` }} />
              </div>
              <div className="col-span-1 text-red-300">{money(d.saidas)}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4">Verde = entradas. Vermelho = saídas.</p>
      </section>

      <section className="panel">
        <h3>Lançamentos financeiros</h3>
        <table className="w-full text-sm">
          <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Forma</th><th>Cliente/Fornecedor</th><th>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {monthEntries.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.created_at).toLocaleString('pt-BR')}</td>
                <td>{e.description}</td>
                <td>{e.type}</td>
                <td>{e.payment_method}</td>
                <td>{e.customers?.name || e.suppliers?.name || '-'}</td>
                <td>{money(e.amount)}</td>
                <td>{e.paid_at ? <span className="tag-green">Pago</span> : <span className="tag-yellow">Aberto</span>}</td>
                <td>{!e.paid_at && <button className="btn2" onClick={() => pay(e)}>Baixar</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function ReportsPage() {
  const [month, setMonth] = useState(currentMonth())
  const [sales, setSales] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [financial, setFinancial] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})

  async function load() {
    const user_id = await getUserId()
    setSettings(await getStoreSettings())
    const start = `${firstDayOfMonth(month)}T00:00:00`
    const end = `${lastDayOfMonth(month)}T23:59:59`

    const { data: salesData } = await supabase.from('sales').select('*, customers(name)').eq('user_id', user_id).gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false })
    const saleIds = (salesData || []).map(s => s.id)

    let saleItems: any[] = []
    if (saleIds.length) {
      const { data } = await supabase.from('sale_items').select('*, products(name, product_code, barcode)').eq('user_id', user_id).in('sale_id', saleIds)
      saleItems = data || []
    }

    const { data: productsData } = await supabase.from('products').select('*').eq('user_id', user_id).order('name')
    const { data: financialData } = await supabase.from('financial_entries').select('*, customers(name), suppliers(name)').eq('user_id', user_id).gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false })

    setSales(salesData || [])
    setItems(saleItems)
    setProducts(productsData || [])
    setFinancial(financialData || [])
  }

  useEffect(() => { load() }, [])

  const validSales = sales.filter(s => s.status !== 'cancelada')
  const total = validSales.reduce((a, s) => a + Number(s.total || 0), 0)
  const profit = validSales.reduce((a, s) => a + Number(s.profit || 0), 0)
  const ticket = validSales.length ? total / validSales.length : 0
  const productsSold = aggregateProductsSold(items).sort((a: any, b: any) => b.quantity - a.quantity)
  const lowStock = products.filter(p => Number(p.stock || 0) <= Number(p.min_stock || 0))
  const fiado = financial.filter(f => f.type === 'receber' && !f.paid_at)
  const vendedores = Object.values(validSales.reduce((acc: any, sale: any) => {
    const seller = sale.seller_name || sale.employee_name || 'Sem vendedor'
    if (!acc[seller]) acc[seller] = { vendedor: seller, quantidade: 0, total: 0, lucro: 0, ticket: 0 }
    acc[seller].quantidade += 1
    acc[seller].total += Number(sale.total || 0)
    acc[seller].lucro += Number(sale.profit || 0)
    acc[seller].ticket = acc[seller].total / acc[seller].quantidade
    return acc
  }, {})) as any[]

  const clientes = Object.values(validSales.reduce((acc: any, sale: any) => {
    const client = sale.customers?.name || 'Cliente não informado'
    if (!acc[client]) acc[client] = { cliente: client, compras: 0, total: 0, ultima_compra: '' }
    acc[client].compras += 1
    acc[client].total += Number(sale.total || 0)
    acc[client].ultima_compra = brDate(sale.created_at)
    return acc
  }, {})) as any[]

  function exportPDF() {
    const doc = new jsPDF()
    let y = 14
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(settings.store_name || 'Bazar Eletrônicos', 14, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`CNPJ: ${settings.cnpj || '-'}`, 14, 20)
    doc.text(`Tel: ${settings.phone || '-'} | ${settings.address || '-'}`, 14, 25)

    y = 42
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Relatório Gerencial Mensal', 14, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${firstDayOfMonth(month)} até ${lastDayOfMonth(month)}`, 14, y)
    y += 10

    const cards = [
      ['Faturamento', money(total)],
      ['Lucro', money(profit)],
      ['Qtd. vendas', String(validSales.length)],
      ['Ticket médio', money(ticket)]
    ]

    cards.forEach((c, i) => {
      const x = 14 + (i % 2) * 92
      const yy = y + Math.floor(i / 2) * 18
      doc.setDrawColor(220)
      doc.roundedRect(x, yy, 84, 14, 2, 2)
      doc.setFont('helvetica', 'bold')
      doc.text(c[0], x + 3, yy + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(c[1], x + 3, yy + 11)
    })
    y += 42

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Top Produtos Mais Vendidos', 14, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    productsSold.slice(0, 10).forEach((p: any, i) => {
      doc.text(`${i + 1}. ${p.product}`, 14, y)
      doc.text(`${p.quantity} un`, 120, y)
      doc.text(money(p.total), 160, y)
      y += 6
    })

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Estoque Baixo', 14, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    lowStock.slice(0, 8).forEach((p: any, i) => {
      doc.text(`${i + 1}. ${p.name}`, 14, y)
      doc.text(`Atual: ${p.stock}`, 120, y)
      doc.text(`Mínimo: ${p.min_stock}`, 150, y)
      y += 6
    })

    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Fiado em Aberto', 14, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    fiado.slice(0, 8).forEach((f: any, i) => {
      doc.text(`${i + 1}. ${f.customers?.name || 'Cliente'}`, 14, y)
      doc.text(money(f.amount), 160, y)
      y += 6
    })

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 287)
    doc.text('Sistema ERP Bazar Eletrônicos', 140, 287)

    doc.save(`Relatorio_${month}.pdf`)
  }

  function exportExcel() {
    const vendas = validSales.map(s => ({
      'Data': new Date(s.created_at).toLocaleString('pt-BR'),
      'Cliente': s.customers?.name || 'Cliente não informado',
      'Forma de Pagamento': s.payment_method || '-',
      'Status': s.status || '-',
      'Subtotal': Number(s.subtotal || 0),
      'Desconto': Number(s.discount || 0),
      'Acréscimo': Number(s.addition || 0),
      'Total da Venda': Number(s.total || 0),
      'Lucro': Number(s.profit || 0),
      'Vendedor': s.seller_name || s.employee_name || 'Sem vendedor'
    }))

    const produtos = productsSold.map((p: any) => ({
      'Produto': p.product,
      'Código': p.code || '-',
      'Quantidade Vendida': p.quantity,
      'Faturamento': Number(p.total || 0),
      'Lucro': Number(p.profit || 0)
    }))

    const estoque = lowStock.map(p => ({
      'Produto': p.name,
      'Código': p.product_code || '-',
      'Código de Barras': p.barcode || '-',
      'Estoque Atual': Number(p.stock || 0),
      'Estoque Mínimo': Number(p.min_stock || 0),
      'Valor de Venda': Number(p.sale_price || 0)
    }))

    const fiadoSheet = fiado.map(f => ({
      'Cliente': f.customers?.name || 'Cliente não informado',
      'Descrição': f.description,
      'Vencimento': f.due_date ? brDate(f.due_date) : '-',
      'Valor': Number(f.amount || 0),
      'Situação': f.paid_at ? 'Pago' : 'Em aberto'
    }))

    const vendedoresSheet = vendedores.map(v => ({
      'Vendedor': v.vendedor,
      'Quantidade de Vendas': v.quantidade,
      'Total Vendido': Number(v.total || 0),
      'Lucro': Number(v.lucro || 0),
      'Ticket Médio': Number(v.ticket || 0)
    }))

    const clientesSheet = clientes.map(c => ({
      'Cliente': c.cliente,
      'Quantidade de Compras': c.compras,
      'Total Gasto': Number(c.total || 0),
      'Última Compra': c.ultima_compra
    }))

    const resumo = [{
      'Período': `${firstDayOfMonth(month)} até ${lastDayOfMonth(month)}`,
      'Faturamento': total,
      'Lucro': profit,
      'Quantidade de Vendas': validSales.length,
      'Ticket Médio': ticket,
      'Fiado em Aberto': fiado.reduce((a, f) => a + Number(f.amount || 0), 0)
    }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), 'Resumo')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendas), 'Vendas')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(produtos), 'Produtos Vendidos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(estoque), 'Estoque Baixo')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fiadoSheet), 'Fiado')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendedoresSheet), 'Vendedores')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientesSheet), 'Clientes')

    XLSX.writeFile(wb, `Relatorio_${month}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <section className="panel">
        <h3>Relatório mensal profissional</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">Mês do relatório</label>
            <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <button className="btn self-end" onClick={load}>Atualizar</button>
          <button className="btn2 self-end flex items-center justify-center gap-2" onClick={exportPDF}><Download size={16}/> PDF profissional</button>
          <button className="btn2 self-end" onClick={exportExcel}>Excel traduzido</button>
        </div>
      </section>

      <div className="grid md:grid-cols-5 gap-4">
        <Card title="Faturamento" value={money(total)} icon={Receipt} />
        <Card title="Lucro" value={money(profit)} icon={Banknote} />
        <Card title="Qtd. vendas" value={String(validSales.length)} icon={ShoppingCart} />
        <Card title="Ticket médio" value={money(ticket)} icon={BarChart3} />
        <Card title="Fiado aberto" value={money(fiado.reduce((a, f) => a + Number(f.amount || 0), 0))} icon={CalendarCheck} />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <section className="panel">
          <h3>Produtos mais vendidos</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Produto</th><th>Qtd</th><th>Faturamento</th><th>Lucro</th></tr></thead>
            <tbody>{productsSold.slice(0, 10).map((p: any) => <tr key={p.product}><td>{p.product}</td><td>{p.quantity}</td><td>{money(p.total)}</td><td>{money(p.profit)}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Produtos menos vendidos</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Produto</th><th>Qtd</th><th>Faturamento</th></tr></thead>
            <tbody>{[...productsSold].sort((a: any,b: any) => a.quantity - b.quantity).slice(0, 10).map((p: any) => <tr key={p.product}><td>{p.product}</td><td>{p.quantity}</td><td>{money(p.total)}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Estoque baixo</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Produto</th><th>Atual</th><th>Mínimo</th><th>Preço</th></tr></thead>
            <tbody>{lowStock.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td>{p.min_stock}</td><td>{money(p.sale_price)}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Fiado</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Cliente</th><th>Descrição</th><th>Vencimento</th><th>Valor</th></tr></thead>
            <tbody>{fiado.map(f => <tr key={f.id}><td>{f.customers?.name || '-'}</td><td>{f.description}</td><td>{f.due_date ? brDate(f.due_date) : '-'}</td><td>{money(f.amount)}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function PDVPage() {
  const [cashSession, setCashSession] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [query, setQuery] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro')
  const [saleDiscount, setSaleDiscount] = useState('')
  const [addition, setAddition] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const user_id = await getUserId()
    const { data: openedCash } = await supabase.from('cash_sessions').select('*').eq('user_id', user_id).eq('status', 'aberto').maybeSingle()
    setCashSession(openedCash)
    const { data: p } = await supabase.from('products').select('*').eq('user_id', user_id).order('name')
    const { data: c } = await supabase.from('customers').select('*').eq('user_id', user_id).order('name')
    setProducts(p || [])
    setCustomers(c || [])
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products.slice(0, 8)
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.product_code || '').toLowerCase().includes(q))
  }, [query, products])

  const subtotal = cart.reduce((a, i) => a + i.quantity * i.unit_price, 0)
  const itemDiscount = cart.reduce((a, i) => a + Number(i.discount || 0), 0)
  const total = Math.max(0, subtotal - itemDiscount - Number(saleDiscount || 0) + Number(addition || 0))
  const profit = cart.reduce((a, i) => a + ((i.unit_price - Number(i.product.cost_price || 0)) * i.quantity) - i.discount, 0) - Number(saleDiscount || 0) + Number(addition || 0)

  function addProduct(product: Product) {
    if (Number(product.stock) <= 0) return setMessage('Produto sem estoque.')
    setCart(current => {
      const found = current.find(i => i.product.id === product.id)
      if (found) return current.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...current, { product, quantity: 1, unit_price: Number(product.sale_price || 0), discount: 0 }]
    })
    setQuery('')
  }

  function updateItem(index: number, data: Partial<CartItem>) {
    setCart(c => c.map((item, i) => i === index ? { ...item, ...data } : item))
  }

  async function finishSale() {
    if (!cashSession) return setMessage('Abra o caixa antes de vender.')
    if (!cart.length) return setMessage('Carrinho vazio.')
    const user_id = await getUserId()
    const seller = await getUserEmail()

    const { data: sale, error } = await supabase.from('sales').insert({
      user_id,
      customer_id: customerId || null,
      status: 'finalizada',
      payment_method: paymentMethod,
      subtotal,
      discount: itemDiscount + Number(saleDiscount || 0),
      addition: Number(addition || 0),
      total,
      profit,
      seller_name: seller,
      cash_session_id: cashSession?.id || null
    }).select().single()

    if (error || !sale) return setMessage(error?.message || 'Erro ao vender.')

    for (const item of cart) {
      await supabase.from('sale_items').insert({
        user_id,
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: item.product.cost_price,
        discount: item.discount,
        total: item.quantity * item.unit_price - item.discount,
        profit: (item.unit_price - item.product.cost_price) * item.quantity - item.discount
      })

      await supabase.from('products').update({ stock: Number(item.product.stock) - item.quantity }).eq('id', item.product.id).eq('user_id', user_id)

      await supabase.from('stock_movements').insert({
        user_id,
        product_id: item.product.id,
        movement_type: 'saida_venda',
        quantity: item.quantity * -1,
        reason: `Venda ${sale.id}`
      })
    }

    await supabase.from('financial_entries').insert({
      user_id,
      sale_id: sale.id,
      customer_id: customerId || null,
      description: `Venda ${sale.id}`,
      type: paymentMethod === 'Fiado' ? 'receber' : 'entrada',
      payment_method: paymentMethod,
      amount: total,
      due_date: paymentMethod === 'Fiado' ? today() : null,
      paid_at: paymentMethod === 'Fiado' ? null : new Date().toISOString(),
      cash_session_id: cashSession?.id || null
    })

    gerarCupom80mm({
      saleId: sale.id,
      settings: await getStoreSettings(),
      items: cart,
      subtotal,
      discount: itemDiscount + Number(saleDiscount || 0),
      addition: Number(addition || 0),
      total,
      payment: paymentMethod
    })

    setCart([])
    setSaleDiscount('')
    setAddition('')
    setCustomerId('')
    setMessage('Venda finalizada.')
    await load()
  }

  return (
    <div className="space-y-4">
      {!cashSession && <div className="panel border-yellow-500/40"><h3>Caixa fechado</h3><p className="text-yellow-300">Abra o caixa antes de usar o PDV.</p></div>}
    <div className="grid xl:grid-cols-3 gap-4">
      <section className="panel">
        <h3>Buscar produto</h3>
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18}/>
          <input className="input pl-10" placeholder="Nome, código ou código de barras" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="mt-4 space-y-2">
          {filtered.map(p => <button key={p.id} onClick={() => addProduct(p)} className="mini w-full text-left hover:border-emerald-500"><div className="flex justify-between gap-3"><div><b>{p.name}</b><p className="text-xs text-slate-500">Cód: {p.product_code || '-'} • Qtd: {p.stock}</p></div><b>{money(p.sale_price)}</b></div></button>)}
        </div>
      </section>

      <section className="panel xl:col-span-2">
        <h3>Carrinho</h3>
        <table className="w-full text-sm">
          <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Desc.</th><th>Total</th><th></th></tr></thead>
          <tbody>{cart.map((item, index) => <tr key={item.product.id}><td>{item.product.name}</td><td><input className="input w-24" type="number" value={item.quantity} onChange={e => updateItem(index, { quantity: Number(e.target.value) })}/></td><td><input className="input w-28" type="number" value={item.unit_price} onChange={e => updateItem(index, { unit_price: Number(e.target.value) })}/></td><td><input className="input w-28" type="number" value={item.discount || ''} onChange={e => updateItem(index, { discount: Number(e.target.value || 0) })}/></td><td>{money(item.quantity * item.unit_price - item.discount)}</td><td><button className="btn-danger" onClick={() => setCart(c => c.filter((_, i) => i !== index))}><Trash2 size={14}/></button></td></tr>)}</tbody>
        </table>

        <div className="mt-5 grid md:grid-cols-4 gap-3">
          <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Cliente não informado</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Dinheiro</option><option>Pix</option><option>Cartão débito</option><option>Cartão crédito</option><option>Fiado</option></select>
          <input className="input" type="number" placeholder="Desconto venda" value={saleDiscount} onChange={e => setSaleDiscount(e.target.value)}/>
          <input className="input" type="number" placeholder="Acréscimo" value={addition} onChange={e => setAddition(e.target.value)}/>
        </div>

        <div className="mt-5 grid md:grid-cols-4 gap-3">
          <div className="mini">Subtotal<br/><b>{money(subtotal)}</b></div>
          <div className="mini">Descontos<br/><b>{money(itemDiscount + Number(saleDiscount || 0))}</b></div>
          <div className="mini">Acréscimo<br/><b>{money(Number(addition || 0))}</b></div>
          <div className="mini">Total<br/><b className="text-2xl text-emerald-300">{money(total)}</b></div>
        </div>

        <button className="btn mt-5 w-full" disabled={!cart.length} onClick={finishSale}>Finalizar venda</button>
        {message && <p className="mt-4 mini">{message}</p>}
      </section>
    </div>
    </div>
  )
}

function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [form, setForm] = useState<Product>(emptyProduct)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    const user_id = await getUserId()
    const { data } = await supabase.from('products').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    if (editingId) await supabase.from('products').update(form).eq('id', editingId).eq('user_id', user_id)
    else await supabase.from('products').insert({ ...form, user_id })
    setForm(emptyProduct)
    setEditingId(null)
    await load()
  }

  async function remove(id?: string) {
    if (!id) return
    const user_id = await getUserId()
    await supabase.from('products').delete().eq('id', id).eq('user_id', user_id)
    await load()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="panel">
        <h3>Produto</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div><label className="label">Nome do produto</label><input className="input" placeholder="Ex: Fone Bluetooth X10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Código do produto</label><input className="input" placeholder="Ex: PROD-001" value={form.product_code || ''} onChange={e => setForm({ ...form, product_code: e.target.value })} /></div>
          <div><label className="label">Código de barras</label><input className="input" placeholder="Ex: 789100000001" value={form.barcode || ''} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
          <div><label className="label">Marca</label><input className="input" placeholder="Ex: JBL, Samsung, Genérico" value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
          <div><label className="label">Quantidade</label><input className="input" type="number" placeholder="Ex: 10" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value || 0) })} /></div>
          <div><label className="label">Valor pago</label><input className="input" type="number" step="0.01" placeholder="Ex: 25.00" value={form.cost_price || ''} onChange={e => setForm({ ...form, cost_price: Number(e.target.value || 0) })} /></div>
          <div><label className="label">Valor final</label><input className="input" type="number" step="0.01" placeholder="Ex: 49.90" value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: Number(e.target.value || 0) })} /></div>
          <div><label className="label">Estoque mínimo</label><input className="input" type="number" placeholder="Ex: 3" value={form.min_stock || ''} onChange={e => setForm({ ...form, min_stock: Number(e.target.value || 0) })} /></div>
        </div>
        <button className="btn mt-4"><Save size={16} className="inline mr-2"/>Salvar produto</button>
      </form>

      <section className="panel">
        <h3>Lista de produtos</h3>
        <table className="w-full text-sm">
          <thead><tr><th>Produto</th><th>Cód.</th><th>Barras</th><th>Qtd</th><th>Pago</th><th>Final</th><th>Marca</th><th></th></tr></thead>
          <tbody>{items.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.product_code}</td><td>{p.barcode}</td><td>{p.stock}</td><td>{money(p.cost_price)}</td><td>{money(p.sale_price)}</td><td>{p.brand}</td><td className="space-x-2"><button className="btn2" onClick={() => { setEditingId(p.id || null); setForm(p) }}>Editar</button><button className="btn-danger" onClick={() => remove(p.id)}>Excluir</button></td></tr>)}</tbody>
        </table>
      </section>
    </div>
  )
}

function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([])
  const [form, setForm] = useState<Customer>(emptyCustomer)

  async function load() {
    const user_id = await getUserId()
    const { data } = await supabase.from('customers').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    await supabase.from('customers').insert({ ...form, user_id })
    setForm(emptyCustomer)
    await load()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="panel">
        <h3>Cliente</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="CPF" value={form.document || ''} onChange={e => setForm({ ...form, document: e.target.value })} />
          <input className="input" placeholder="Contato" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="Endereço" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          <input className="input md:col-span-2" placeholder="Obs" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button className="btn mt-4">Salvar</button>
      </form>

      <section className="panel">
        <h3>Lista de clientes</h3>
        <table className="w-full text-sm">
          <thead><tr><th>Nome</th><th>CPF</th><th>Contato</th><th>Endereço</th><th>Obs</th></tr></thead>
          <tbody>{items.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.document}</td><td>{c.phone}</td><td>{c.address}</td><td>{c.notes}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  )
}

function SettingsPage() {
  const [form, setForm] = useState<any>({ store_name: '', cnpj: '', phone: '', address: '', logo_url: '', theme: 'dark' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const settings = await getStoreSettings()
      setForm(settings)
    }
    load()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    if (form.id) await supabase.from('store_settings').update(form).eq('id', form.id).eq('user_id', user_id)
    else {
      const { data } = await supabase.from('store_settings').insert({ ...form, user_id }).select().single()
      if (data) setForm(data)
    }
    setSaved(true)
  }

  return (
    <form onSubmit={save} className="panel">
      <h3>Configurações da loja</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <input className="input" placeholder="Nome da loja" value={form.store_name || ''} onChange={e => setForm({ ...form, store_name: e.target.value })} />
        <input className="input" placeholder="CNPJ" value={form.cnpj || ''} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
        <input className="input" placeholder="Telefone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Endereço" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
        <input className="input" placeholder="Logo URL" value={form.logo_url || ''} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
        <select className="input" value={form.theme || 'dark'} onChange={e => setForm({ ...form, theme: e.target.value })}><option value="dark">Tema escuro</option><option value="light">Tema claro</option></select>
      </div>
      <button className="btn mt-4">Salvar</button>
      {saved && <p className="mt-3 text-sm text-emerald-300">Salvo.</p>}
    </form>
  )
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Carregando...</main>
  if (!session) return <Login />

  const titles: Record<Page, string> = {
    dashboard: 'Dashboard',
    caixa: 'Caixa',
    pdv: 'PDV',
    financeiro: 'Financeiro',
    relatorios: 'Relatórios',
    produtos: 'Produtos',
    clientes: 'Clientes',
    configuracoes: 'Configurações'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar page={page} setPage={setPage} collapsed={menuCollapsed} setCollapsed={setMenuCollapsed} />
      <main className="flex-1 min-w-0">
        <Header title={titles[page]} />
        <div className="p-6">
          {page === 'dashboard' && <Dashboard />}
          {page === 'caixa' && <CashPage />}
          {page === 'pdv' && <PDVPage />}
          {page === 'financeiro' && <FinancePage />}
          {page === 'relatorios' && <ReportsPage />}
          {page === 'produtos' && <ProductsPage />}
          {page === 'clientes' && <CustomersPage />}
          {page === 'configuracoes' && <SettingsPage />}
        </div>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
