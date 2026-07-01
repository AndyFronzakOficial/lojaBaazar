import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import {
  ArrowRight, Banknote, BarChart3, CalendarCheck, Car, CheckCircle2, ClipboardList,
  Download, Dumbbell, FileText, GraduationCap, Home, Layers3, LogOut, Menu, Package,
  PawPrint, PenLine, Printer, Receipt, Save, Scissors, Search, Settings, ShoppingCart,
  Smartphone, Sparkles, Store, Trash2, UserRound, UtensilsCrossed, Wrench, X, Crown, CreditCard, Building2
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './styles.css'

type Page = 'inicio' | 'dashboard' | 'agenda' | 'caixa' | 'pdv' | 'ordens' | 'financeiro' | 'relatorios' | 'produtos' | 'clientes' | 'romaneios' | 'ordens_servico' | 'historico_cliente' | 'configuracoes' | 'mesas' | 'cozinha' | 'delivery' | 'veiculos' | 'checklist' | 'manutencao' | 'matriculas' | 'turmas' | 'presenca' | 'certificados' | 'pets' | 'vacinas' | 'assinaturas' | 'empresas_saas'

type SegmentId = 'loja' | 'comunicacao_visual' | 'assistencia_tecnica' | 'oficina' | 'barbearia' | 'salao_beleza' | 'pet_shop' | 'academia' | 'escola_cursos' | 'restaurante'

type SegmentDefinition = {
  id: SegmentId
  name: string
  shortName: string
  description: string
  icon: any
  accent: string
  pages: Page[]
  labels?: Partial<Record<Page, string>>
}

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

const corePages: Page[] = ['dashboard', 'caixa', 'pdv', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes']
const serviceAgendaPages: Page[] = ['dashboard', 'agenda', 'caixa', 'pdv', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes']
const restaurantPages: Page[] = ['dashboard', 'caixa', 'pdv', 'mesas', 'cozinha', 'delivery', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes']
const workshopPages: Page[] = ['dashboard', 'caixa', 'pdv', 'ordens', 'veiculos', 'checklist', 'manutencao', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes']
const educationPages: Page[] = ['dashboard', 'agenda', 'matriculas', 'turmas', 'presenca', 'certificados', 'caixa', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes']
const petShopPages: Page[] = ['dashboard', 'agenda', 'pets', 'vacinas', 'caixa', 'pdv', 'ordens', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes']

const segmentCatalog: SegmentDefinition[] = [
  {
    id: 'loja',
    name: 'Loja e Comércio',
    shortName: 'Loja',
    description: 'PDV, estoque, clientes, caixa, financeiro e relatórios.',
    icon: Store,
    accent: 'from-blue-500/25 to-cyan-500/10',
    pages: corePages
  },
  {
    id: 'comunicacao_visual',
    name: 'Comunicação Visual',
    shortName: 'Comunicação Visual',
    description: 'Orçamentos, produção, ordens, romaneios e preço por m².',
    icon: Printer,
    accent: 'from-violet-500/25 to-fuchsia-500/10',
    pages: ['dashboard', 'caixa', 'pdv', 'ordens', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'romaneios', 'configuracoes'],
    labels: { produtos: 'Materiais e Produtos' }
  },
  {
    id: 'assistencia_tecnica',
    name: 'Assistência Técnica',
    shortName: 'Assistência',
    description: 'Ordens de serviço, aparelhos, peças, garantia e histórico.',
    icon: Smartphone,
    accent: 'from-sky-500/25 to-indigo-500/10',
    pages: ['dashboard', 'caixa', 'pdv', 'ordens', 'financeiro', 'relatorios', 'produtos', 'clientes', 'historico_cliente', 'configuracoes'],
    labels: { produtos: 'Peças e Produtos' }
  },
  {
    id: 'oficina',
    name: 'Oficina Mecânica',
    shortName: 'Oficina',
    description: 'Veículos, checklist, manutenção preventiva, peças, caixa, financeiro e histórico.',
    icon: Car,
    accent: 'from-orange-500/25 to-amber-500/10',
    pages: workshopPages,
    labels: { produtos: 'Peças e Estoque', veiculos: 'Veículos', checklist: 'Checklist', manutencao: 'Manutenção Preventiva' }
  },
  {
    id: 'barbearia',
    name: 'Barbearia',
    shortName: 'Barbearia',
    description: 'Clientes, serviços, vendas, produtos, caixa e financeiro.',
    icon: Scissors,
    accent: 'from-emerald-500/25 to-teal-500/10',
    pages: serviceAgendaPages,
    labels: { produtos: 'Serviços e Produtos', agenda: 'Agenda e Barbeiros' }
  },
  {
    id: 'salao_beleza',
    name: 'Salão de Beleza',
    shortName: 'Salão',
    description: 'Atendimentos, clientes, produtos, caixa e financeiro.',
    icon: Sparkles,
    accent: 'from-pink-500/25 to-rose-500/10',
    pages: serviceAgendaPages,
    labels: { produtos: 'Serviços e Produtos', agenda: 'Agenda e Profissionais' }
  },
  {
    id: 'pet_shop',
    name: 'Pet Shop',
    shortName: 'Pet Shop',
    description: 'Tutores, pets, banho e tosa, vacinas, atendimentos, produtos, caixa e histórico.',
    icon: PawPrint,
    accent: 'from-lime-500/25 to-green-500/10',
    pages: petShopPages,
    labels: { ordens: 'Atendimentos', clientes: 'Tutores', agenda: 'Agenda Banho e Tosa', pets: 'Pets', vacinas: 'Vacinas e Saúde', produtos: 'Produtos Pet' }
  },
  {
    id: 'academia',
    name: 'Academia',
    shortName: 'Academia',
    description: 'Alunos, planos, mensalidades, vendas e financeiro.',
    icon: Dumbbell,
    accent: 'from-red-500/25 to-orange-500/10',
    pages: educationPages,
    labels: { clientes: 'Alunos', produtos: 'Planos e Produtos', agenda: 'Agenda de Aulas', matriculas: 'Matrículas e Planos', turmas: 'Turmas e Treinos', presenca: 'Presença e Check-in', certificados: 'Avaliações e Certificados' }
  },
  {
    id: 'escola_cursos',
    name: 'Escola e Cursos',
    shortName: 'Cursos',
    description: 'Alunos, cursos, mensalidades, materiais e relatórios.',
    icon: GraduationCap,
    accent: 'from-indigo-500/25 to-blue-500/10',
    pages: educationPages,
    labels: { clientes: 'Alunos', produtos: 'Cursos e Materiais', agenda: 'Agenda de Turmas', matriculas: 'Matrículas', turmas: 'Cursos e Turmas', presenca: 'Presença', certificados: 'Certificados' }
  },
  {
    id: 'restaurante',
    name: 'Restaurante e Pizzaria',
    shortName: 'Restaurante',
    description: 'Mesas, comandas, cozinha, delivery, cardápio, clientes, caixa e financeiro.',
    icon: UtensilsCrossed,
    accent: 'from-yellow-500/25 to-orange-500/10',
    pages: restaurantPages,
    labels: { produtos: 'Cardápio e Estoque', mesas: 'Mesas e Comandas', cozinha: 'Painel da Cozinha', delivery: 'Delivery' }
  }
]

function getSegment(segmentId?: string | null) {
  return segmentCatalog.find(segment => segment.id === segmentId) || null
}

function getSegmentModules(segmentId?: string | null) {
  return getSegment(segmentId)?.pages || []
}

function getStoredSegment(userId: string) {
  return (localStorage.getItem(`erp-segment-${userId}`) || '') as SegmentId | ''
}

function storeSegmentLocally(userId: string, segmentId: SegmentId) {
  localStorage.setItem(`erp-segment-${userId}`, segmentId)
}

async function saveBusinessSegment(segmentId: SegmentId) {
  const user_id = await getUserId()
  const enabled_modules = getSegmentModules(segmentId)
  storeSegmentLocally(user_id, segmentId)

  const { data: current } = await supabase
    .from('store_settings')
    .select('id')
    .eq('user_id', user_id)
    .limit(1)
    .maybeSingle()

  if (current?.id) {
    const { error } = await supabase
      .from('store_settings')
      .update({ business_segment: segmentId, enabled_modules })
      .eq('id', current.id)
      .eq('user_id', user_id)
    return error
  }

  const { error } = await supabase.from('store_settings').insert({
    user_id,
    store_name: 'Minha Empresa',
    business_segment: segmentId,
    enabled_modules
  })
  return error
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
    store_name: 'Minha Empresa',
    cnpj: '',
    phone: '',
    address: '',
    theme: 'dark'
  }).select().single()

  return created || { store_name: 'Minha Empresa', cnpj: '', phone: '', address: '' }
}


function gerarCupom80mm({ saleId, settings, items, subtotal, discount, addition, total, payment }: any) {
  const height = Math.max(120, 90 + items.length * 9)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, height] })
  let y = 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(settings.store_name || 'Minha Empresa', 40, y, { align: 'center' })
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



function openWhatsappNumber(phone: string, message: string) {
  const raw = String(phone || '').replace(/\D/g, '')
  if (!raw) {
    alert('WhatsApp não informado.')
    return
  }
  const finalPhone = raw.startsWith('55') ? raw : `55${raw}`
  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank')
}

function formatOSNumber(value: number | string | null | undefined) {
  return `OS${String(value || 0).padStart(6, '0')}`
}



async function uploadStoreLogo(file: File) {
  const user_id = await getUserId()
  const ext = file.name.split('.').pop() || 'png'
  const path = `${user_id}/logo-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}



async function gerarReciboVendaPorId(saleId: string) {
  const settings = await getStoreSettings()

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*, customers(name, phone)')
    .eq('id', saleId)
    .maybeSingle()

  if (saleError || !sale) {
    alert('Não encontrei a venda para gerar o recibo.')
    return
  }

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('*, products(name)')
    .eq('sale_id', saleId)

  const items = saleItems || []
  const height = Math.max(120, 88 + items.length * 10)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, height] })
  let y = 7

  const logo = await imageUrlToDataUrl(settings.logo_url || '')
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 24, y, 32, 18)
      y += 22
    } catch {}
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(settings.store_name || 'Minha Empresa', 40, y, { align: 'center' })
    y += 5
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  if (settings.cnpj) {
    doc.text(`CNPJ: ${settings.cnpj}`, 40, y, { align: 'center' })
    y += 4
  }

  if (settings.phone) {
    doc.text(`Tel: ${settings.phone}`, 40, y, { align: 'center' })
    y += 4
  }

  doc.text('----------------------------------------', 40, y, { align: 'center' })
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO / CUPOM NÃO FISCAL', 40, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.text(`Venda: ${String(sale.id).slice(0, 8)}`, 4, y)
  y += 4
  doc.text(`Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}`, 4, y)
  y += 4
  doc.text(`Cliente: ${sale.customers?.name || 'Não informado'}`, 4, y)
  y += 5

  doc.text('----------------------------------------', 40, y, { align: 'center' })
  y += 4

  items.forEach((item: any) => {
    const totalItem = Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0)))
    doc.setFont('helvetica', 'bold')
    doc.text(String(item.products?.name || 'Produto').slice(0, 32), 4, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.text(`${item.quantity} x ${money(item.unit_price)}`, 4, y)
    doc.text(money(totalItem), 76, y, { align: 'right' })
    y += 5
  })

  doc.text('----------------------------------------', 40, y, { align: 'center' })
  y += 4
  doc.text('Subtotal', 4, y)
  doc.text(money(sale.subtotal || 0), 76, y, { align: 'right' })
  y += 4
  doc.text('Desconto', 4, y)
  doc.text(money(sale.discount || 0), 76, y, { align: 'right' })
  y += 4
  doc.text('Acréscimo', 4, y)
  doc.text(money(sale.addition || 0), 76, y, { align: 'right' })
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL', 4, y)
  doc.text(money(sale.total || 0), 76, y, { align: 'right' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Pagamento: ${sale.payment_method || '-'}`, 4, y)
  y += 5
  doc.text('Obrigado pela preferência!', 40, y, { align: 'center' })

  doc.save(`recibo-venda-${String(sale.id).slice(0, 8)}.pdf`)
}


function Login() {
  const [email, setEmail] = useState('admin@loja.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
      <form onSubmit={signIn} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-2xl">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-2xl">ERP</div>
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold">Sistema ERP Modular</h1>
        <p className="text-slate-400 mt-2">Uma plataforma adaptada ao segmento de cada empresa.</p>
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

function SegmentHomePage({
  selectedSegment,
  onSelect,
  saving
}: {
  selectedSegment: SegmentId | ''
  onSelect: (segmentId: SegmentId) => void
  saving: boolean
}) {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-5 shadow-2xl sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              <Layers3 size={15} /> ERP MODULAR V27
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Escolha o segmento do seu sistema</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              O menu é montado automaticamente para mostrar somente os módulos que fazem sentido para o negócio.
              Você pode trocar o segmento depois nas configurações.
            </p>
          </div>

          {selectedSegment && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-400">Segmento atual</span>
              <strong className="mt-1 block text-base">{getSegment(selectedSegment)?.name}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {segmentCatalog.map(segment => {
          const Icon = segment.icon
          const active = selectedSegment === segment.id
          return (
            <article
              key={segment.id}
              className={`group relative overflow-hidden rounded-3xl border p-5 shadow-xl transition hover:-translate-y-1 hover:border-slate-600 ${
                active ? 'border-emerald-500 bg-slate-900 ring-2 ring-emerald-500/20' : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${segment.accent} opacity-70`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-emerald-300 shadow-lg">
                    <Icon size={28} />
                  </div>
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-black text-slate-950">
                      <CheckCircle2 size={14} /> Ativo
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-xl font-black text-white">{segment.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{segment.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {segment.pages.filter(page => !['configuracoes', 'historico_cliente'].includes(page)).slice(0, 4).map(page => (
                    <span key={page} className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                      {segment.labels?.[page] || ({ dashboard: 'Dashboard', agenda: 'Agenda', caixa: 'Caixa', pdv: 'PDV', mesas: 'Mesas', cozinha: 'Cozinha', delivery: 'Delivery', veiculos: 'Veículos', checklist: 'Checklist', manutencao: 'Manutenção', ordens: 'Ordens', financeiro: 'Financeiro', relatorios: 'Relatórios', produtos: 'Produtos', clientes: 'Clientes', romaneios: 'Romaneios', ordens_servico: 'Ordens', inicio: 'Início', historico_cliente: 'Histórico', configuracoes: 'Configurações' } as Record<Page, string>)[page]}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSelect(segment.id)}
                  className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-wait disabled:opacity-60 ${
                    active ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'border border-slate-700 bg-slate-950/70 text-white hover:border-emerald-500 hover:text-emerald-300'
                  }`}
                >
                  {active ? 'Acessar sistema' : 'Usar este segmento'} <ArrowRight size={17} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Sidebar({
  page,
  setPage,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  segment,
  storeName
}: {
  page: Page
  setPage: (p: Page) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  segment: SegmentDefinition | null
  storeName: string
}) {
  const allItems = [
    { id: 'inicio', label: 'Início', icon: Layers3 },
    { id: 'assinaturas', label: 'Assinaturas e Planos', icon: CreditCard },
    { id: 'empresas_saas', label: 'Multiempresa', icon: Building2 },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'agenda', label: 'Agenda e Profissionais', icon: CalendarCheck },
    { id: 'caixa', label: 'Caixa', icon: Banknote },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'mesas', label: 'Mesas e Comandas', icon: Layers3 },
    { id: 'cozinha', label: 'Painel da Cozinha', icon: UtensilsCrossed },
    { id: 'delivery', label: 'Delivery', icon: Car },
    { id: 'veiculos', label: 'Veículos', icon: Car },
    { id: 'checklist', label: 'Checklist', icon: ClipboardList },
    { id: 'manutencao', label: 'Manutenção Preventiva', icon: Wrench },
    { id: 'matriculas', label: 'Matrículas', icon: GraduationCap },
    { id: 'turmas', label: 'Turmas', icon: Layers3 },
    { id: 'presenca', label: 'Presença', icon: CheckCircle2 },
    { id: 'certificados', label: 'Certificados', icon: FileText },
    { id: 'pets', label: 'Pets', icon: PawPrint },
    { id: 'vacinas', label: 'Vacinas e Saúde', icon: CheckCircle2 },
    { id: 'ordens', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'financeiro', label: 'Financeiro', icon: CalendarCheck },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: UserRound },
    { id: 'historico_cliente', label: 'Histórico Cliente', icon: UserRound },
    { id: 'romaneios', label: 'Romaneios', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings }
  ] as const

  const allowedPages = new Set<Page>(['inicio', 'assinaturas', 'empresas_saas', ...(segment?.pages || [])])
  const items = allItems
    .filter(item => allowedPages.has(item.id as Page))
    .map(item => ({ ...item, label: segment?.labels?.[item.id as Page] || item.label }))

  async function logout() {
    setMobileOpen(false)
    await supabase.auth.signOut()
  }

  function navigate(pageId: Page) {
    setPage(pageId)
    setMobileOpen(false)
  }

  const showLabels = mobileOpen || !collapsed

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-72 -translate-x-full flex-col
          border-r border-slate-800 bg-slate-950 p-4 shadow-2xl transition-all duration-200
          ${mobileOpen ? 'translate-x-0' : ''}
          lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shadow-none
          ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        <div className="flex items-center justify-between gap-3 px-1 py-3 sm:px-2 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-slate-950">
              ERP
            </div>

            {showLabels && (
              <div className="min-w-0">
                <strong className="block truncate">{storeName || 'Sistema ERP'}</strong>
                <span className="block truncate text-xs text-slate-500">{segment?.shortName || 'Escolha um segmento'}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-900 lg:hidden"
            title="Fechar menu"
          >
            <X size={19} />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-900 lg:inline-flex"
            title={collapsed ? 'Mostrar menu' : 'Ocultar menu'}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1">
          {items.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id as Page)}
                className={`nav ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${page === item.id ? 'nav-active' : ''}`}
                title={item.label}
              >
                <Icon size={19} className="shrink-0" />
                {showLabels && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {showLabels && segment && (
          <button
            type="button"
            onClick={() => navigate('inicio')}
            className="mb-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-left text-xs text-slate-400 hover:border-emerald-500/50"
          >
            <span className="font-bold text-slate-200">Trocar segmento</span>
            <span className="mt-1 block">Módulos ativos: {segment.pages.length}</span>
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className={`nav mt-3 text-red-300 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
          title="Sair"
        >
          <LogOut size={19} className="shrink-0" />
          {showLabels && <span>Sair</span>}
        </button>
      </aside>
    </>
  )
}

function Header({ title, onOpenMenu }: { title: string; onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={21} />
      </button>

      <h2 className="min-w-0 truncate text-lg font-bold sm:text-xl">{title}</h2>
    </header>
  )
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
    bottom: [],
    serviceOrders: 0,
    serviceOrdersPending: 0
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

    const { data: financeEntries } = await supabase
      .from('financial_entries')
      .select('amount, type, paid_at')
      .eq('user_id', user_id)
      .eq('type', 'entrada')
      .not('paid_at', 'is', null)

    const paidEntries = financeEntries || []
    const todayRevenue = paidEntries
      .filter(entry => String(entry.paid_at).slice(0, 10) === today())
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

    const weekRevenue = paidEntries
      .filter(entry => String(entry.paid_at).slice(0, 10) >= dateDaysAgo(6))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

    const monthRevenue = paidEntries
      .filter(entry => String(entry.paid_at).slice(0, 7) === currentMonth())
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)

    const { data: serviceOrdersData } = await supabase
      .from('service_orders')
      .select('id, total, payment_status, paid_at, order_date')
      .eq('user_id', user_id)
      .gte('order_date', monthStart)
      .lte('order_date', lastDayOfMonth())

    const paidServiceOrders = (serviceOrdersData || []).filter(order => order.payment_status === 'pago')
    const serviceOrdersPending = (serviceOrdersData || [])
      .filter(order => order.payment_status !== 'pago')
      .reduce((sum, order) => sum + Number(order.total || 0), 0)

    let orderItems: any[] = []
    if (paidServiceOrders.length) {
      const { data: orderItemsData } = await supabase
        .from('service_order_items')
        .select('product_id, quantity, total, products(name, product_code)')
        .eq('user_id', user_id)
        .in('service_order_id', paidServiceOrders.map(order => order.id))
      orderItems = (orderItemsData || []).map(item => ({ ...item, profit: 0 }))
    }

    const ticketCount = validSales.length + paidServiceOrders.length
    const ticket = ticketCount ? monthRevenue / ticketCount : 0

    const sold = aggregateProductsSold([...items, ...orderItems])
    const top = [...sold].sort((a, b) => b.quantity - a.quantity).slice(0, 3)
    const bottom = [...sold].sort((a, b) => a.quantity - b.quantity).slice(0, 3)

    setData({
      todayRevenue,
      weekRevenue,
      monthRevenue,
      ticket,
      top,
      bottom,
      serviceOrders: (serviceOrdersData || []).length,
      serviceOrdersPending
    })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card title="Faturamento do dia" value={money(data.todayRevenue)} icon={Receipt} />
        <Card title="Últimos 7 dias" value={money(data.weekRevenue)} icon={BarChart3} />
        <Card title="Faturamento do mês" value={money(data.monthRevenue)} icon={Banknote} />
        <Card title="Ticket médio" value={money(data.ticket)} icon={ShoppingCart} />
        <Card title="Ordens no mês" value={String(data.serviceOrders)} icon={ClipboardList} />
        <Card title="Ordens a receber" value={money(data.serviceOrdersPending)} icon={CalendarCheck} />
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
              <th>Ações</th>
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
                <td>
                  {e.sale_id ? (
                    <button className="btn2" onClick={() => gerarReciboVendaPorId(e.sale_id)}>Baixar recibo</button>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<any>({
    description: '',
    type: 'entrada',
    payment_method: 'Dinheiro',
    amount: '',
    due_date: '',
    paid_at: ''
  })

  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase
      .from('financial_entries')
      .select('*, customers(name), suppliers(name)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
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

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()

    const payload: any = {
      user_id,
      description: form.description,
      type: form.type,
      payment_method: form.payment_method,
      amount: Number(form.amount || 0),
      due_date: form.due_date || null,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null
    }

    if (editingId) {
      const { error } = await supabase
        .from('financial_entries')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user_id)

      if (error) return setMessage(error.message)
      setMessage('Lançamento financeiro alterado com sucesso.')
    } else {
      const { error } = await supabase
        .from('financial_entries')
        .insert(payload)

      if (error) return setMessage(error.message)
      setMessage('Lançamento financeiro adicionado com sucesso.')
    }

    setEditingId(null)
    setForm({ description: '', type: 'entrada', payment_method: 'Dinheiro', amount: '', due_date: '', paid_at: '' })
    await load()
  }

  function edit(entry: any) {
    setEditingId(entry.id)
    setForm({
      description: entry.description || '',
      type: entry.type || 'entrada',
      payment_method: entry.payment_method || 'Dinheiro',
      amount: String(entry.amount || ''),
      due_date: entry.due_date || '',
      paid_at: entry.paid_at ? String(entry.paid_at).slice(0, 10) : ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(entry: any) {
    if (!confirm('Deseja excluir este lançamento financeiro?')) return

    const user_id = await getUserId()
    const { error } = await supabase
      .from('financial_entries')
      .delete()
      .eq('id', entry.id)
      .eq('user_id', user_id)

    if (error) return setMessage(error.message)
    setMessage('Lançamento financeiro excluído.')
    await load()
  }

  async function pay(entry: any) {
    const user_id = await getUserId()
    await supabase
      .from('financial_entries')
      .update({ paid_at: new Date().toISOString() })
      .eq('id', entry.id)
      .eq('user_id', user_id)

    await load()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ description: '', type: 'entrada', payment_method: 'Dinheiro', amount: '', due_date: '', paid_at: '' })
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Saldo atual" value={money(saldoAtual)} icon={Banknote} />
        <Card title="A receber" value={money(aReceber)} icon={Receipt} />
        <Card title="A pagar" value={money(aPagar)} icon={CalendarCheck} />
        <Card title="Saldo previsto" value={money(saldoPrevisto)} icon={BarChart3} />
      </div>

      <form onSubmit={save} className="panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3>{editingId ? 'Alterar lançamento financeiro' : 'Adicionar lançamento financeiro'}</h3>
          {editingId && <button type="button" className="btn2" onClick={cancelEdit}>Cancelar edição</button>}
        </div>

        <div className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="label">Descrição</label>
            <input className="input" placeholder="Ex: Pagamento fornecedor" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="receber">A receber</option>
              <option value="pagar">A pagar</option>
              <option value="sangria">Sangria</option>
              <option value="suprimento">Suprimento</option>
            </select>
          </div>

          <div>
            <label className="label">Forma</label>
            <select className="input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option>Dinheiro</option>
              <option>Pix</option>
              <option>Cartão débito</option>
              <option>Cartão crédito</option>
              <option>Fiado</option>
              <option>Boleto</option>
            </select>
          </div>

          <div>
            <label className="label">Valor</label>
            <input className="input" type="number" step="0.01" placeholder="Ex: 100.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>

          <div>
            <label className="label">Vencimento</label>
            <input className="input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>

          <div>
            <label className="label">Data de pagamento</label>
            <input className="input" type="date" value={form.paid_at} onChange={e => setForm({ ...form, paid_at: e.target.value })} />
          </div>
        </div>

        <button className="btn mt-4">{editingId ? 'Salvar alterações' : 'Adicionar lançamento'}</button>
        {message && <p className="mini mt-4">{message}</p>}
      </form>

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
      </section>

      <section className="panel">
        <h3>Consultar lançamentos financeiros</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Forma</th>
                <th>Cliente/Fornecedor</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.created_at).toLocaleString('pt-BR')}</td>
                  <td>{e.description}</td>
                  <td>{e.type}</td>
                  <td>{e.payment_method || '-'}</td>
                  <td>{e.customers?.name || e.suppliers?.name || '-'}</td>
                  <td>{money(e.amount)}</td>
                  <td>{e.paid_at ? <span className="tag-green">Pago</span> : <span className="tag-yellow">Aberto</span>}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    {!e.paid_at && <button className="btn2" onClick={() => pay(e)}>Baixar</button>}
                    <button className="btn2" onClick={() => edit(e)}>Alterar</button>
                    <button className="btn-danger" onClick={() => remove(e)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {!monthEntries.length && <tr><td colSpan={8} className="text-slate-500">Nenhum lançamento no mês.</td></tr>}
            </tbody>
          </table>
        </div>
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
    doc.text(settings.store_name || 'Minha Empresa', 14, 13)
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
    doc.text('Sistema ERP Modular', 140, 287)

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
  const [message, setMessage] = useState('')

  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()

    const payload = {
      ...form,
      user_id,
      cost_price: Number(form.cost_price || 0),
      sale_price: Number(form.sale_price || 0),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0)
    }

    if (editingId) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user_id)

      if (error) return setMessage(error.message)
      setMessage('Produto alterado com sucesso.')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) return setMessage(error.message)
      setMessage('Produto adicionado com sucesso.')
    }

    setForm(emptyProduct)
    setEditingId(null)
    await load()
  }

  function edit(item: Product) {
    setEditingId(item.id || null)
    setForm({
      ...emptyProduct,
      ...item,
      cost_price: Number(item.cost_price || 0),
      sale_price: Number(item.sale_price || 0),
      stock: Number(item.stock || 0),
      min_stock: Number(item.min_stock || 0)
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id?: string) {
    if (!id) return
    if (!confirm('Deseja excluir este produto?')) return

    const user_id = await getUserId()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) return setMessage(error.message)
    setMessage('Produto excluído.')
    await load()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyProduct)
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3>{editingId ? 'Alterar produto' : 'Adicionar produto'}</h3>
          {editingId && <button type="button" className="btn2" onClick={cancelEdit}>Cancelar edição</button>}
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">Nome do produto</label>
            <input className="input" placeholder="Ex: Fone Bluetooth X10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="label">Código do produto</label>
            <input className="input" placeholder="Ex: PROD-001" value={form.product_code || ''} onChange={e => setForm({ ...form, product_code: e.target.value })} />
          </div>

          <div>
            <label className="label">Código de barras</label>
            <input className="input" placeholder="Ex: 789100000001" value={form.barcode || ''} onChange={e => setForm({ ...form, barcode: e.target.value })} />
          </div>

          <div>
            <label className="label">Marca</label>
            <input className="input" placeholder="Ex: JBL, Samsung, Genérico" value={form.brand || ''} onChange={e => setForm({ ...form, brand: e.target.value })} />
          </div>

          <div>
            <label className="label">Quantidade</label>
            <input className="input" type="number" placeholder="Ex: 10" value={form.stock || ''} onChange={e => setForm({ ...form, stock: Number(e.target.value || 0) })} />
          </div>

          <div>
            <label className="label">Valor pago</label>
            <input className="input" type="number" step="0.01" placeholder="Ex: 25.00" value={form.cost_price || ''} onChange={e => setForm({ ...form, cost_price: Number(e.target.value || 0) })} />
          </div>

          <div>
            <label className="label">Valor final</label>
            <input className="input" type="number" step="0.01" placeholder="Ex: 49.90" value={form.sale_price || ''} onChange={e => setForm({ ...form, sale_price: Number(e.target.value || 0) })} />
          </div>

          <div>
            <label className="label">Estoque mínimo</label>
            <input className="input" type="number" placeholder="Ex: 3" value={form.min_stock || ''} onChange={e => setForm({ ...form, min_stock: Number(e.target.value || 0) })} />
          </div>
        </div>

        <button className="btn mt-4">{editingId ? 'Salvar alterações' : 'Adicionar produto'}</button>
        {message && <p className="mini mt-4">{message}</p>}
      </form>

      <section className="panel">
        <h3>Consultar produtos</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Barras</th>
                <th>Qtd</th>
                <th>Pago</th>
                <th>Final</th>
                <th>Marca</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.product_code || '-'}</td>
                  <td>{p.barcode || '-'}</td>
                  <td>{p.stock}</td>
                  <td>{money(p.cost_price)}</td>
                  <td>{money(p.sale_price)}</td>
                  <td>{p.brand || '-'}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="btn2" onClick={() => edit(p)}>Alterar</button>
                    <button className="btn-danger" onClick={() => remove(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={8} className="text-slate-500">Nenhum produto cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}


function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([])
  const [form, setForm] = useState<Customer>(emptyCustomer)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const payload = { ...form, user_id }

    if (editingId) {
      const { error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user_id)

      if (error) return setMessage(error.message)
      setMessage('Cliente alterado com sucesso.')
    } else {
      const { error } = await supabase.from('customers').insert(payload)
      if (error) return setMessage(error.message)
      setMessage('Cliente adicionado com sucesso.')
    }

    setForm(emptyCustomer)
    setEditingId(null)
    await load()
  }

  function edit(item: Customer) {
    setEditingId(item.id || null)
    setForm({ ...emptyCustomer, ...item })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function remove(id?: string) {
    if (!id) return
    if (!confirm('Deseja excluir este cliente?')) return

    const user_id = await getUserId()
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) return setMessage(error.message)
    setMessage('Cliente excluído.')
    await load()
  }

  function openWhatsApp(customer: Customer) {
    const raw = String(customer.phone || '').replace(/\D/g, '')
    if (!raw) return alert('Cliente sem contato/WhatsApp.')
    const phone = raw.startsWith('55') ? raw : `55${raw}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Olá ${customer.name}, tudo bem?`)}`, '_blank')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyCustomer)
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3>{editingId ? 'Alterar cliente' : 'Adicionar cliente'}</h3>
          {editingId && <button type="button" className="btn2" onClick={cancelEdit}>Cancelar edição</button>}
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="label">Nome</label>
            <input className="input" placeholder="Nome do cliente" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="label">CPF/CNPJ</label>
            <input className="input" placeholder="CPF ou CNPJ" value={form.document || ''} onChange={e => setForm({ ...form, document: e.target.value })} />
          </div>

          <div>
            <label className="label">Contato / WhatsApp</label>
            <input className="input" placeholder="(41) 99999-9999" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className="label">Endereço</label>
            <input className="input" placeholder="Endereço" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <label className="label">Observações</label>
            <input className="input" placeholder="Observações" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <button className="btn mt-4">{editingId ? 'Salvar alterações' : 'Adicionar cliente'}</button>
        {message && <p className="mini mt-4">{message}</p>}
      </form>

      <section className="panel">
        <h3>Consultar clientes</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>Contato</th>
                <th>Endereço</th>
                <th>Obs</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.document || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.address || '-'}</td>
                  <td>{c.notes || '-'}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="btn2" onClick={() => openWhatsApp(c)}>WhatsApp</button>
                    <button className="btn2" onClick={() => edit(c)}>Alterar</button>
                    <button className="btn-danger" onClick={() => remove(c.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={6} className="text-slate-500">Nenhum cliente cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}



function AgendaPage({ segment }: { segment: SegmentDefinition }) {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(today())
  const [professionalForm, setProfessionalForm] = useState<any>({ name: '', role: '', phone: '', commission_percent: 0, work_schedule: '' })
  const [appointmentForm, setAppointmentForm] = useState<any>({ customer_id: '', customer_name: '', professional_id: '', service_name: '', starts_at: `${today()}T09:00`, duration_minutes: 30, price: 0, status: 'agendado', notes: '' })

  async function loadAgenda() {
    const user_id = await getUserId()
    const { data: profs } = await supabase.from('professionals').select('*').eq('user_id', user_id).order('name')
    const { data: clients } = await supabase.from('customers').select('*').eq('user_id', user_id).order('name')
    const start = `${selectedDate}T00:00:00`
    const end = `${selectedDate}T23:59:59`
    const { data: apps } = await supabase
      .from('appointments')
      .select('*, customers(name, phone), professionals(name, role)')
      .eq('user_id', user_id)
      .gte('starts_at', start)
      .lte('starts_at', end)
      .order('starts_at')
    setProfessionals(profs || [])
    setCustomers(clients || [])
    setAppointments(apps || [])
  }

  useEffect(() => { loadAgenda() }, [selectedDate])

  async function saveProfessional(e: React.FormEvent) {
    e.preventDefault()
    if (!professionalForm.name.trim()) return alert('Informe o nome do profissional.')
    const user_id = await getUserId()
    const payload = { ...professionalForm, user_id, commission_percent: Number(professionalForm.commission_percent || 0) }
    const { error } = await supabase.from('professionals').insert(payload)
    if (error) return alert(`Erro ao salvar profissional. Execute a migração V28 no Supabase.\n\n${error.message}`)
    setProfessionalForm({ name: '', role: '', phone: '', commission_percent: 0, work_schedule: '' })
    loadAgenda()
  }

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault()
    if (!appointmentForm.service_name.trim()) return alert('Informe o serviço/aula/atendimento.')
    const user_id = await getUserId()
    const selectedCustomer = customers.find(c => c.id === appointmentForm.customer_id)
    const payload = {
      ...appointmentForm,
      user_id,
      customer_id: appointmentForm.customer_id || null,
      customer_name: selectedCustomer?.name || appointmentForm.customer_name || null,
      professional_id: appointmentForm.professional_id || null,
      duration_minutes: Number(appointmentForm.duration_minutes || 30),
      price: Number(appointmentForm.price || 0)
    }
    const { error } = await supabase.from('appointments').insert(payload)
    if (error) return alert(`Erro ao salvar agendamento. Execute a migração V28 no Supabase.\n\n${error.message}`)
    setSelectedDate(String(appointmentForm.starts_at).slice(0, 10))
    setAppointmentForm({ customer_id: '', customer_name: '', professional_id: '', service_name: '', starts_at: `${selectedDate}T09:00`, duration_minutes: 30, price: 0, status: 'agendado', notes: '' })
    loadAgenda()
  }

  async function updateAppointmentStatus(id: string, status: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    loadAgenda()
  }

  async function deleteAppointment(id: string) {
    if (!confirm('Excluir este agendamento?')) return
    const user_id = await getUserId()
    const { error } = await supabase.from('appointments').delete().eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    loadAgenda()
  }

  const totalDay = appointments.reduce((sum, app) => sum + Number(app.price || 0), 0)
  const confirmed = appointments.filter(app => app.status === 'confirmado').length
  const done = appointments.filter(app => app.status === 'concluido').length

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Agendamentos do dia" value={String(appointments.length)} icon={CalendarCheck} />
        <Card title="Confirmados" value={String(confirmed)} icon={CheckCircle2} />
        <Card title="Concluídos" value={String(done)} icon={ClipboardList} />
        <Card title="Previsão do dia" value={money(totalDay)} icon={Banknote} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black">Agenda</h3>
              <p className="text-sm text-slate-400">Controle horários, serviços, clientes e status do atendimento.</p>
            </div>
            <input className="input sm:w-52" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>

          <form onSubmit={saveAppointment} className="mb-5 grid gap-3 lg:grid-cols-4">
            <select className="input" value={appointmentForm.customer_id} onChange={e => setAppointmentForm({ ...appointmentForm, customer_id: e.target.value, customer_name: '' })}>
              <option value="">Cliente avulso</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            {!appointmentForm.customer_id && (
              <input className="input" placeholder="Nome do cliente" value={appointmentForm.customer_name} onChange={e => setAppointmentForm({ ...appointmentForm, customer_name: e.target.value })} />
            )}
            <select className="input" value={appointmentForm.professional_id} onChange={e => setAppointmentForm({ ...appointmentForm, professional_id: e.target.value })}>
              <option value="">Sem profissional</option>
              {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
            </select>
            <input className="input" placeholder="Serviço, aula ou atendimento" value={appointmentForm.service_name} onChange={e => setAppointmentForm({ ...appointmentForm, service_name: e.target.value })} />
            <input className="input" type="datetime-local" value={appointmentForm.starts_at} onChange={e => setAppointmentForm({ ...appointmentForm, starts_at: e.target.value })} />
            <input className="input" type="number" placeholder="Duração min." value={appointmentForm.duration_minutes} onChange={e => setAppointmentForm({ ...appointmentForm, duration_minutes: e.target.value })} />
            <input className="input" type="number" step="0.01" placeholder="Valor" value={appointmentForm.price} onChange={e => setAppointmentForm({ ...appointmentForm, price: e.target.value })} />
            <button className="btn" type="submit"><Save size={18} /> Agendar</button>
            <textarea className="input lg:col-span-4" placeholder="Observações" value={appointmentForm.notes} onChange={e => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} />
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="py-2">Horário</th>
                  <th>Cliente</th>
                  <th>Profissional</th>
                  <th>Serviço</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(app => (
                  <tr key={app.id} className="border-b border-slate-900">
                    <td className="py-3">{new Date(app.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{app.customers?.name || app.customer_name || '-'}</td>
                    <td>{app.professionals?.name || '-'}</td>
                    <td>{app.service_name}<span className="block text-xs text-slate-500">{app.duration_minutes || 30} min</span></td>
                    <td>{money(app.price || 0)}</td>
                    <td>
                      <select className="input py-2" value={app.status || 'agendado'} onChange={e => updateAppointmentStatus(app.id, e.target.value)}>
                        <option value="agendado">Agendado</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="em_atendimento">Em atendimento</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="text-right"><button className="btn-danger" onClick={() => deleteAppointment(app.id)}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
                {!appointments.length && <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhum agendamento para este dia.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h3 className="text-xl font-black">Profissionais</h3>
          <p className="mb-4 text-sm text-slate-400">Cadastre barbeiros, professores, tosadores, cabeleireiros, instrutores e atendentes.</p>
          <form onSubmit={saveProfessional} className="grid gap-3">
            <input className="input" placeholder="Nome do profissional" value={professionalForm.name} onChange={e => setProfessionalForm({ ...professionalForm, name: e.target.value })} />
            <input className="input" placeholder="Função / especialidade" value={professionalForm.role} onChange={e => setProfessionalForm({ ...professionalForm, role: e.target.value })} />
            <input className="input" placeholder="Telefone / WhatsApp" value={professionalForm.phone} onChange={e => setProfessionalForm({ ...professionalForm, phone: e.target.value })} />
            <input className="input" type="number" step="0.01" placeholder="Comissão %" value={professionalForm.commission_percent} onChange={e => setProfessionalForm({ ...professionalForm, commission_percent: e.target.value })} />
            <input className="input" placeholder="Horário de trabalho. Ex: Seg a Sex 09h às 18h" value={professionalForm.work_schedule} onChange={e => setProfessionalForm({ ...professionalForm, work_schedule: e.target.value })} />
            <button className="btn" type="submit"><Save size={18} /> Salvar profissional</button>
          </form>

          <div className="mt-5 space-y-2">
            {professionals.map(pro => (
              <div key={pro.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <strong>{pro.name}</strong>
                <p className="text-sm text-slate-400">{pro.role || 'Profissional'} · Comissão {Number(pro.commission_percent || 0)}%</p>
                <p className="text-xs text-slate-500">{pro.work_schedule || pro.phone || 'Sem horário informado'}</p>
              </div>
            ))}
            {!professionals.length && <p className="text-sm text-slate-500">Nenhum profissional cadastrado.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}


type RestaurantOrder = {
  id?: string
  user_id?: string
  customer_name: string
  table_number: string | null
  order_type: string
  items_description: string
  total: number
  status: string
  delivery_address: string | null
  delivery_fee: number
  payment_method: string | null
  created_at?: string
}

const emptyRestaurantOrder: RestaurantOrder = {
  customer_name: '',
  table_number: '',
  order_type: 'mesa',
  items_description: '',
  total: 0,
  status: 'novo',
  delivery_address: '',
  delivery_fee: 0,
  payment_method: ''
}

function restaurantStatusLabel(status: string) {
  return ({ novo: 'Novo', preparo: 'Em preparo', forno: 'No forno', pronto: 'Pronto', entrega: 'Saiu para entrega', entregue: 'Entregue', cancelado: 'Cancelado' } as Record<string, string>)[status] || status
}

function RestaurantTablesPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [form, setForm] = useState<RestaurantOrder>(emptyRestaurantOrder)

  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase.from('restaurant_orders').select('*').eq('user_id', user_id).in('order_type', ['mesa', 'balcao']).order('created_at', { ascending: false })
    if (!error) setOrders(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const payload = { ...form, user_id, total: Number(form.total || 0), delivery_fee: Number(form.delivery_fee || 0), order_type: form.order_type || 'mesa' }
    const { error } = await supabase.from('restaurant_orders').insert(payload)
    if (error) return alert('Execute a migração v29 no Supabase. Detalhes: ' + error.message)
    setForm(emptyRestaurantOrder)
    load()
  }

  async function updateStatus(id: string, status: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('restaurant_orders').update({ status }).eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    load()
  }

  const abertas = orders.filter(o => !['entregue', 'cancelado'].includes(o.status)).length
  const totalAberto = orders.filter(o => !['entregue', 'cancelado'].includes(o.status)).reduce((s, o) => s + Number(o.total || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Comandas abertas" value={String(abertas)} icon={Layers3} />
        <Card title="Valor em aberto" value={money(totalAberto)} icon={Receipt} />
        <Card title="Pedidos do dia" value={String(orders.length)} icon={UtensilsCrossed} />
        <Card title="Mesa/Balcão" value="Ativo" icon={CheckCircle2} />
      </div>
      <section className="card">
        <h3 className="text-xl font-black">Mesas e Comandas</h3>
        <p className="text-sm text-slate-400 mb-4">Abra comandas para salão, balcão ou retirada.</p>
        <form onSubmit={save} className="grid gap-3 lg:grid-cols-4">
          <select className="input" value={form.order_type} onChange={e => setForm({ ...form, order_type: e.target.value })}>
            <option value="mesa">Mesa</option><option value="balcao">Balcão/Retirada</option>
          </select>
          <input className="input" placeholder="Mesa nº" value={form.table_number || ''} onChange={e => setForm({ ...form, table_number: e.target.value })} />
          <input className="input" placeholder="Cliente" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
          <input className="input" type="number" step="0.01" placeholder="Total" value={form.total} onChange={e => setForm({ ...form, total: Number(e.target.value) })} />
          <textarea className="input lg:col-span-3" placeholder="Itens da comanda. Ex: Pizza grande calabresa + refrigerante" value={form.items_description} onChange={e => setForm({ ...form, items_description: e.target.value })} required />
          <button className="btn" type="submit"><Save size={18} /> Abrir comanda</button>
        </form>
      </section>
      <RestaurantOrdersTable orders={orders} updateStatus={updateStatus} />
    </div>
  )
}

function KitchenPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase.from('restaurant_orders').select('*').eq('user_id', user_id).in('status', ['novo', 'preparo', 'forno', 'pronto']).order('created_at', { ascending: true })
    if (!error) setOrders(data || [])
  }
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [])
  async function updateStatus(id: string, status: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('restaurant_orders').update({ status }).eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    load()
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Novos" value={String(orders.filter(o => o.status === 'novo').length)} icon={Receipt} />
        <Card title="Em preparo" value={String(orders.filter(o => o.status === 'preparo').length)} icon={UtensilsCrossed} />
        <Card title="No forno" value={String(orders.filter(o => o.status === 'forno').length)} icon={ClockIcon} />
        <Card title="Prontos" value={String(orders.filter(o => o.status === 'pronto').length)} icon={CheckCircle2} />
      </div>
      <section className="card">
        <h3 className="text-xl font-black">Painel da Cozinha</h3>
        <p className="text-sm text-slate-400 mb-4">Fluxo: novo → preparo → forno → pronto → entregue.</p>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map(order => (
            <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-start justify-between gap-3"><strong>#{String(order.id).slice(0, 8)}</strong><span className="badge">{restaurantStatusLabel(order.status)}</span></div>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{order.items_description}</p>
              <p className="mt-2 text-xs text-slate-500">{order.order_type === 'mesa' ? `Mesa ${order.table_number || '-'}` : order.order_type} · {order.customer_name || 'Cliente avulso'}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn2" onClick={() => updateStatus(order.id!, 'preparo')}>Preparo</button>
                <button className="btn2" onClick={() => updateStatus(order.id!, 'forno')}>Forno</button>
                <button className="btn" onClick={() => updateStatus(order.id!, 'pronto')}>Pronto</button>
                <button className="btn2" onClick={() => updateStatus(order.id!, 'entregue')}>Entregue</button>
              </div>
            </div>
          ))}
          {!orders.length && <p className="text-sm text-slate-500">Nenhum pedido pendente na cozinha.</p>}
        </div>
      </section>
    </div>
  )
}

function DeliveryPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([])
  const [form, setForm] = useState<RestaurantOrder>({ ...emptyRestaurantOrder, order_type: 'delivery' })
  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase.from('restaurant_orders').select('*').eq('user_id', user_id).eq('order_type', 'delivery').order('created_at', { ascending: false })
    if (!error) setOrders(data || [])
  }
  useEffect(() => { load() }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const payload = { ...form, user_id, order_type: 'delivery', total: Number(form.total || 0), delivery_fee: Number(form.delivery_fee || 0) }
    const { error } = await supabase.from('restaurant_orders').insert(payload)
    if (error) return alert('Execute a migração v29 no Supabase. Detalhes: ' + error.message)
    setForm({ ...emptyRestaurantOrder, order_type: 'delivery' })
    load()
  }
  async function updateStatus(id: string, status: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('restaurant_orders').update({ status }).eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    load()
  }
  const emEntrega = orders.filter(o => o.status === 'entrega').length
  const totalDelivery = orders.reduce((s, o) => s + Number(o.total || 0) + Number(o.delivery_fee || 0), 0)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Pedidos delivery" value={String(orders.length)} icon={Car} />
        <Card title="Em entrega" value={String(emEntrega)} icon={ArrowRight} />
        <Card title="Total delivery" value={money(totalDelivery)} icon={Banknote} />
        <Card title="WhatsApp" value="Manual" icon={Smartphone} />
      </div>
      <section className="card">
        <h3 className="text-xl font-black">Novo Delivery</h3>
        <form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-4">
          <input className="input" placeholder="Cliente" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
          <input className="input" placeholder="Forma de pagamento" value={form.payment_method || ''} onChange={e => setForm({ ...form, payment_method: e.target.value })} />
          <input className="input" type="number" step="0.01" placeholder="Total produtos" value={form.total} onChange={e => setForm({ ...form, total: Number(e.target.value) })} />
          <input className="input" type="number" step="0.01" placeholder="Taxa entrega" value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: Number(e.target.value) })} />
          <input className="input lg:col-span-2" placeholder="Endereço de entrega" value={form.delivery_address || ''} onChange={e => setForm({ ...form, delivery_address: e.target.value })} required />
          <textarea className="input lg:col-span-2" placeholder="Itens do pedido" value={form.items_description} onChange={e => setForm({ ...form, items_description: e.target.value })} required />
          <button className="btn lg:col-span-4" type="submit"><Save size={18} /> Criar pedido delivery</button>
        </form>
      </section>
      <RestaurantOrdersTable orders={orders} updateStatus={updateStatus} showAddress />
    </div>
  )
}

function RestaurantOrdersTable({ orders, updateStatus, showAddress = false }: { orders: RestaurantOrder[], updateStatus: (id: string, status: string) => void, showAddress?: boolean }) {
  return (
    <section className="card">
      <h3 className="text-xl font-black">Pedidos</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Pedido</th><th>Cliente</th><th>Tipo</th><th>Itens</th>{showAddress && <th>Endereço</th>}<th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map(order => <tr key={order.id} className="border-b border-slate-900"><td className="py-3">#{String(order.id).slice(0, 8)}</td><td>{order.customer_name || '-'}</td><td>{order.order_type === 'mesa' ? `Mesa ${order.table_number || '-'}` : order.order_type}</td><td className="max-w-sm truncate">{order.items_description}</td>{showAddress && <td className="max-w-xs truncate">{order.delivery_address || '-'}</td>}<td>{money(Number(order.total || 0) + Number(order.delivery_fee || 0))}</td><td><select className="input py-2" value={order.status || 'novo'} onChange={e => updateStatus(order.id!, e.target.value)}><option value="novo">Novo</option><option value="preparo">Em preparo</option><option value="forno">No forno</option><option value="pronto">Pronto</option><option value="entrega">Saiu entrega</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select></td></tr>)}
            {!orders.length && <tr><td colSpan={showAddress ? 7 : 6} className="py-8 text-center text-slate-500">Nenhum pedido criado.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const ClockIcon = CalendarCheck


type WorkshopVehicle = {
  id?: string
  user_id?: string
  customer_name: string
  plate: string
  brand: string
  model: string
  year: string
  color: string
  chassis: string
  renavam: string
  current_km: number
  fuel: string
  notes: string
  created_at?: string
}

const emptyWorkshopVehicle: WorkshopVehicle = { customer_name: '', plate: '', brand: '', model: '', year: '', color: '', chassis: '', renavam: '', current_km: 0, fuel: '', notes: '' }

function WorkshopVehiclesPage() {
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>([])
  const [form, setForm] = useState<WorkshopVehicle>(emptyWorkshopVehicle)
  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase.from('workshop_vehicles').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    if (!error) setVehicles(data || [])
  }
  useEffect(() => { load() }, [])
  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const payload = { ...form, user_id, current_km: Number(form.current_km || 0), plate: form.plate.toUpperCase() }
    const { error } = await supabase.from('workshop_vehicles').insert(payload)
    if (error) return alert('Execute a migração v30 no Supabase. Detalhes: ' + error.message)
    setForm(emptyWorkshopVehicle); load()
  }
  async function remove(id: string) { const user_id = await getUserId(); const { error } = await supabase.from('workshop_vehicles').delete().eq('id', id).eq('user_id', user_id); if (error) return alert(error.message); load() }
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title="Veículos" value={String(vehicles.length)} icon={Car} /><Card title="Clientes com frota" value={String(new Set(vehicles.map(v=>v.customer_name)).size)} icon={UserRound} /><Card title="KM médio" value={String(Math.round(vehicles.reduce((s,v)=>s+Number(v.current_km||0),0)/(vehicles.length||1)))} icon={BarChart3} /><Card title="Oficina" value="Ativa" icon={Wrench} /></div>
    <section className="card"><h3 className="text-xl font-black">Cadastro de Veículos</h3><p className="mb-4 text-sm text-slate-400">Cadastre placa, dados do veículo, KM e vínculo com o cliente.</p>
      <form onSubmit={save} className="grid gap-3 lg:grid-cols-4">
        <input className="input" placeholder="Cliente" value={form.customer_name} onChange={e=>setForm({...form, customer_name:e.target.value})} required />
        <input className="input" placeholder="Placa" value={form.plate} onChange={e=>setForm({...form, plate:e.target.value})} required />
        <input className="input" placeholder="Marca" value={form.brand} onChange={e=>setForm({...form, brand:e.target.value})} />
        <input className="input" placeholder="Modelo" value={form.model} onChange={e=>setForm({...form, model:e.target.value})} />
        <input className="input" placeholder="Ano" value={form.year} onChange={e=>setForm({...form, year:e.target.value})} />
        <input className="input" placeholder="Cor" value={form.color} onChange={e=>setForm({...form, color:e.target.value})} />
        <input className="input" type="number" placeholder="KM atual" value={form.current_km} onChange={e=>setForm({...form, current_km:Number(e.target.value)})} />
        <input className="input" placeholder="Combustível" value={form.fuel} onChange={e=>setForm({...form, fuel:e.target.value})} />
        <input className="input lg:col-span-2" placeholder="Chassi" value={form.chassis} onChange={e=>setForm({...form, chassis:e.target.value})} />
        <input className="input" placeholder="Renavam" value={form.renavam} onChange={e=>setForm({...form, renavam:e.target.value})} />
        <textarea className="input lg:col-span-3" placeholder="Observações" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
        <button className="btn" type="submit"><Save size={18}/> Salvar veículo</button>
      </form></section>
    <section className="card"><h3 className="text-xl font-black">Veículos cadastrados</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Placa</th><th>Cliente</th><th>Veículo</th><th>Ano</th><th>KM</th><th>Combustível</th><th></th></tr></thead><tbody>{vehicles.map(v=><tr key={v.id} className="border-b border-slate-900"><td className="py-3 font-bold">{v.plate}</td><td>{v.customer_name}</td><td>{v.brand} {v.model}</td><td>{v.year || '-'}</td><td>{Number(v.current_km||0).toLocaleString('pt-BR')}</td><td>{v.fuel || '-'}</td><td><button className="btn2" onClick={()=>remove(v.id!)}><Trash2 size={16}/></button></td></tr>)}{!vehicles.length && <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhum veículo cadastrado.</td></tr>}</tbody></table></div></section>
  </div>
}

function WorkshopChecklistPage() {
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({ plate: '', customer_name: '', current_km: 0, fuel_level: '', damages: '', accessories: '', diagnosis: '', services: '', parts: '', warranty: '' })
  async function load(){ const user_id=await getUserId(); const {data,error}=await supabase.from('workshop_checklists').select('*').eq('user_id',user_id).order('created_at',{ascending:false}); if(!error) setItems(data||[]) }
  useEffect(()=>{load()},[])
  async function save(e:React.FormEvent){ e.preventDefault(); const user_id=await getUserId(); const {error}=await supabase.from('workshop_checklists').insert({...form,user_id,current_km:Number(form.current_km||0),plate:form.plate.toUpperCase()}); if(error) return alert('Execute a migração v30 no Supabase. Detalhes: '+error.message); setForm({ plate: '', customer_name: '', current_km: 0, fuel_level: '', damages: '', accessories: '', diagnosis: '', services: '', parts: '', warranty: '' }); load() }
  function exportPdf(c:any){ const doc=new jsPDF(); doc.setFontSize(16); doc.text('Checklist de Entrada - Oficina',14,18); doc.setFontSize(10); doc.text(`Cliente: ${c.customer_name}`,14,32); doc.text(`Placa: ${c.plate}   KM: ${c.current_km}`,14,40); doc.text(`Combustível: ${c.fuel_level||'-'}`,14,48); doc.text(`Avarias: ${c.damages||'-'}`,14,60,{maxWidth:180}); doc.text(`Diagnóstico: ${c.diagnosis||'-'}`,14,82,{maxWidth:180}); doc.text(`Serviços: ${c.services||'-'}`,14,106,{maxWidth:180}); doc.text(`Peças: ${c.parts||'-'}`,14,130,{maxWidth:180}); doc.text(`Garantia: ${c.warranty||'-'}`,14,154,{maxWidth:180}); doc.save(`checklist-${c.plate||'oficina'}.pdf`) }
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title="Checklists" value={String(items.length)} icon={ClipboardList}/><Card title="Com garantia" value={String(items.filter(i=>i.warranty).length)} icon={CheckCircle2}/><Card title="Peças lançadas" value={String(items.filter(i=>i.parts).length)} icon={Package}/><Card title="PDF" value="Disponível" icon={Download}/></div><section className="card"><h3 className="text-xl font-black">Checklist de Entrada</h3><form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-4"><input className="input" placeholder="Cliente" value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})} required/><input className="input" placeholder="Placa" value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})} required/><input className="input" type="number" placeholder="KM" value={form.current_km} onChange={e=>setForm({...form,current_km:Number(e.target.value)})}/><input className="input" placeholder="Nível combustível" value={form.fuel_level} onChange={e=>setForm({...form,fuel_level:e.target.value})}/><textarea className="input lg:col-span-2" placeholder="Avarias / estado de entrada" value={form.damages} onChange={e=>setForm({...form,damages:e.target.value})}/><textarea className="input lg:col-span-2" placeholder="Acessórios deixados no veículo" value={form.accessories} onChange={e=>setForm({...form,accessories:e.target.value})}/><textarea className="input lg:col-span-2" placeholder="Diagnóstico" value={form.diagnosis} onChange={e=>setForm({...form,diagnosis:e.target.value})}/><textarea className="input lg:col-span-2" placeholder="Serviços executados" value={form.services} onChange={e=>setForm({...form,services:e.target.value})}/><textarea className="input lg:col-span-2" placeholder="Peças utilizadas" value={form.parts} onChange={e=>setForm({...form,parts:e.target.value})}/><textarea className="input lg:col-span-2" placeholder="Garantia / observações finais" value={form.warranty} onChange={e=>setForm({...form,warranty:e.target.value})}/><button className="btn lg:col-span-4" type="submit"><Save size={18}/> Salvar checklist</button></form></section><section className="card"><h3 className="text-xl font-black">Histórico de checklists</h3><div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map(c=><div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-3"><strong>{c.plate}</strong><span className="badge">{brDate(c.created_at)}</span></div><p className="text-sm text-slate-400">{c.customer_name} · KM {Number(c.current_km||0).toLocaleString('pt-BR')}</p><p className="mt-2 text-sm whitespace-pre-wrap">{c.diagnosis || c.services || 'Sem diagnóstico.'}</p><button className="btn2 mt-3" onClick={()=>exportPdf(c)}><Download size={16}/> PDF</button></div>)}{!items.length && <p className="text-sm text-slate-500">Nenhum checklist criado.</p>}</div></section></div>
}

function WorkshopMaintenancePage() {
  const [items,setItems]=useState<any[]>([])
  const [form,setForm]=useState({plate:'',customer_name:'',service_name:'',due_date:'',due_km:0,last_km:0,status:'pendente',notes:''})
  async function load(){ const user_id=await getUserId(); const {data,error}=await supabase.from('workshop_maintenance').select('*').eq('user_id',user_id).order('due_date',{ascending:true}); if(!error) setItems(data||[]) }
  useEffect(()=>{load()},[])
  async function save(e:React.FormEvent){ e.preventDefault(); const user_id=await getUserId(); const {error}=await supabase.from('workshop_maintenance').insert({...form,user_id,due_km:Number(form.due_km||0),last_km:Number(form.last_km||0),plate:form.plate.toUpperCase()}); if(error) return alert('Execute a migração v30 no Supabase. Detalhes: '+error.message); setForm({plate:'',customer_name:'',service_name:'',due_date:'',due_km:0,last_km:0,status:'pendente',notes:''}); load() }
  async function setStatus(id:string,status:string){ const user_id=await getUserId(); const {error}=await supabase.from('workshop_maintenance').update({status}).eq('id',id).eq('user_id',user_id); if(error) return alert(error.message); load() }
  const pend=items.filter(i=>i.status==='pendente').length, atras=items.filter(i=>i.due_date && i.due_date<today() && i.status!=='concluido').length
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title="Preventivas" value={String(items.length)} icon={Wrench}/><Card title="Pendentes" value={String(pend)} icon={ClockIcon}/><Card title="Atrasadas" value={String(atras)} icon={X}/><Card title="Concluídas" value={String(items.filter(i=>i.status==='concluido').length)} icon={CheckCircle2}/></div><section className="card"><h3 className="text-xl font-black">Manutenção Preventiva</h3><p className="mb-4 text-sm text-slate-400">Controle revisões por data ou quilometragem.</p><form onSubmit={save} className="grid gap-3 lg:grid-cols-4"><input className="input" placeholder="Cliente" value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})} required/><input className="input" placeholder="Placa" value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})} required/><input className="input" placeholder="Serviço. Ex: Troca de óleo" value={form.service_name} onChange={e=>setForm({...form,service_name:e.target.value})} required/><input className="input" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/><input className="input" type="number" placeholder="KM última revisão" value={form.last_km} onChange={e=>setForm({...form,last_km:Number(e.target.value)})}/><input className="input" type="number" placeholder="Próximo KM" value={form.due_km} onChange={e=>setForm({...form,due_km:Number(e.target.value)})}/><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="pendente">Pendente</option><option value="agendado">Agendado</option><option value="concluido">Concluído</option></select><input className="input" placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn lg:col-span-4" type="submit"><Save size={18}/> Salvar preventiva</button></form></section><section className="card"><h3 className="text-xl font-black">Próximas manutenções</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Placa</th><th>Cliente</th><th>Serviço</th><th>Data</th><th>KM</th><th>Status</th></tr></thead><tbody>{items.map(i=><tr key={i.id} className="border-b border-slate-900"><td className="py-3 font-bold">{i.plate}</td><td>{i.customer_name}</td><td>{i.service_name}</td><td>{brDate(i.due_date)}</td><td>{Number(i.due_km||0).toLocaleString('pt-BR')}</td><td><select className="input py-2" value={i.status} onChange={e=>setStatus(i.id,e.target.value)}><option value="pendente">Pendente</option><option value="agendado">Agendado</option><option value="concluido">Concluído</option></select></td></tr>)}{!items.length && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhuma preventiva cadastrada.</td></tr>}</tbody></table></div></section></div>
}


function EducationEnrollmentsPage({ segment }: { segment: SegmentDefinition }) {
  const [items, setItems] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState({ customer_id: '', student_name: '', course_name: '', plan_name: '', start_date: today(), end_date: '', monthly_fee: 0, status: 'ativo', notes: '' })
  const isGym = segment.id === 'academia'

  async function load() {
    const user_id = await getUserId()
    const { data: clients } = await supabase.from('customers').select('*').eq('user_id', user_id).order('name')
    const { data, error } = await supabase.from('student_enrollments').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    setCustomers(clients || [])
    if (!error) setItems(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const customer = customers.find(c => c.id === form.customer_id)
    const payload = {
      ...form,
      user_id,
      customer_id: form.customer_id || null,
      student_name: customer?.name || form.student_name,
      monthly_fee: Number(form.monthly_fee || 0)
    }
    if (!payload.student_name.trim()) return alert('Informe o nome do aluno.')
    const { error } = await supabase.from('student_enrollments').insert(payload)
    if (error) return alert('Execute a migração V31 no Supabase. Detalhes: ' + error.message)
    setForm({ customer_id: '', student_name: '', course_name: '', plan_name: '', start_date: today(), end_date: '', monthly_fee: 0, status: 'ativo', notes: '' })
    load()
  }

  async function setStatus(id: string, status: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('student_enrollments').update({ status }).eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    load()
  }

  function exportExcel() {
    const rows = items.map(i => ({ Aluno: i.student_name, Curso_Plano: i.course_name || i.plan_name, Inicio: i.start_date, Fim: i.end_date, Mensalidade: i.monthly_fee, Status: i.status, Observacoes: i.notes }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Matriculas')
    XLSX.writeFile(wb, 'matriculas-v31.xlsx')
  }

  const active = items.filter(i => i.status === 'ativo').length
  const monthly = items.filter(i => i.status === 'ativo').reduce((sum, i) => sum + Number(i.monthly_fee || 0), 0)
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Matrículas" value={String(items.length)} icon={GraduationCap}/>
      <Card title="Ativas" value={String(active)} icon={CheckCircle2}/>
      <Card title="Mensalidade prevista" value={money(monthly)} icon={Banknote}/>
      <Card title="Excel" value="Disponível" icon={Download}/>
    </div>
    <section className="card">
      <h3 className="text-xl font-black">{isGym ? 'Matrícula / plano do aluno' : 'Matrícula de aluno'}</h3>
      <p className="mb-4 text-sm text-slate-400">Controle alunos, planos, cursos, mensalidades e situação da matrícula.</p>
      <form onSubmit={save} className="grid gap-3 lg:grid-cols-4">
        <select className="input" value={form.customer_id} onChange={e=>setForm({...form, customer_id:e.target.value})}><option value="">Selecionar aluno já cadastrado</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input className="input" placeholder="Ou digite novo aluno" value={form.student_name} onChange={e=>setForm({...form, student_name:e.target.value})}/>
        <input className="input" placeholder={isGym ? 'Plano / modalidade' : 'Curso'} value={form.course_name} onChange={e=>setForm({...form, course_name:e.target.value})} required/>
        <input className="input" placeholder="Plano. Ex: Mensal, Trimestral" value={form.plan_name} onChange={e=>setForm({...form, plan_name:e.target.value})}/>
        <input className="input" type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})}/>
        <input className="input" type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})}/>
        <input className="input" type="number" step="0.01" placeholder="Mensalidade" value={form.monthly_fee} onChange={e=>setForm({...form, monthly_fee:Number(e.target.value)})}/>
        <select className="input" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}><option value="ativo">Ativo</option><option value="trancado">Trancado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select>
        <textarea className="input lg:col-span-4" placeholder="Observações" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/>
        <button className="btn lg:col-span-2" type="submit"><Save size={18}/> Salvar matrícula</button>
        <button className="btn2 lg:col-span-2" type="button" onClick={exportExcel}><Download size={18}/> Baixar Excel</button>
      </form>
    </section>
    <section className="card"><h3 className="text-xl font-black">Matrículas cadastradas</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Aluno</th><th>{isGym ? 'Plano' : 'Curso'}</th><th>Início</th><th>Fim</th><th>Mensalidade</th><th>Status</th></tr></thead><tbody>{items.map(i=><tr key={i.id} className="border-b border-slate-900"><td className="py-3 font-bold">{i.student_name}</td><td>{i.course_name || i.plan_name}</td><td>{brDate(i.start_date)}</td><td>{brDate(i.end_date)}</td><td>{money(i.monthly_fee)}</td><td><select className="input py-2" value={i.status} onChange={e=>setStatus(i.id,e.target.value)}><option value="ativo">Ativo</option><option value="trancado">Trancado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></td></tr>)}{!items.length && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Nenhuma matrícula cadastrada.</td></tr>}</tbody></table></div></section>
  </div>
}

function EducationClassesPage({ segment }: { segment: SegmentDefinition }) {
  const [items, setItems] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', instructor_id: '', instructor_name: '', weekday: '', start_time: '19:00', end_time: '20:00', room: '', capacity: 20, price: 0, notes: '' })
  const isGym = segment.id === 'academia'
  async function load(){ const user_id=await getUserId(); const {data:profs}=await supabase.from('professionals').select('*').eq('user_id',user_id).order('name'); const {data,error}=await supabase.from('classes_courses').select('*, professionals(name)').eq('user_id',user_id).order('created_at',{ascending:false}); setProfessionals(profs||[]); if(!error) setItems(data||[]) }
  useEffect(()=>{load()},[])
  async function save(e:React.FormEvent){ e.preventDefault(); const user_id=await getUserId(); const prof=professionals.find(p=>p.id===form.instructor_id); const {error}=await supabase.from('classes_courses').insert({...form,user_id,instructor_id:form.instructor_id||null,instructor_name:prof?.name || form.instructor_name,capacity:Number(form.capacity||0),price:Number(form.price||0)}); if(error) return alert('Execute a migração V31 no Supabase. Detalhes: '+error.message); setForm({ name: '', instructor_id: '', instructor_name: '', weekday: '', start_time: '19:00', end_time: '20:00', room: '', capacity: 20, price: 0, notes: '' }); load() }
  async function remove(id:string){ if(!confirm('Remover turma?')) return; const user_id=await getUserId(); const {error}=await supabase.from('classes_courses').delete().eq('id',id).eq('user_id',user_id); if(error) return alert(error.message); load() }
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title={isGym?'Turmas/treinos':'Cursos/turmas'} value={String(items.length)} icon={Layers3}/><Card title="Capacidade total" value={String(items.reduce((s,i)=>s+Number(i.capacity||0),0))} icon={UserRound}/><Card title="Receita por turma" value={money(items.reduce((s,i)=>s+Number(i.price||0),0))} icon={Banknote}/><Card title="Professores" value={String(professionals.length)} icon={GraduationCap}/></div><section className="card"><h3 className="text-xl font-black">{isGym?'Turmas, modalidades e treinos':'Cursos e turmas'}</h3><form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-4"><input className="input" placeholder={isGym?'Nome da turma/modalidade':'Nome do curso/turma'} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><select className="input" value={form.instructor_id} onChange={e=>setForm({...form,instructor_id:e.target.value})}><option value="">Selecionar professor/profissional</option>{professionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input className="input" placeholder="Ou digite o professor" value={form.instructor_name} onChange={e=>setForm({...form,instructor_name:e.target.value})}/><select className="input" value={form.weekday} onChange={e=>setForm({...form,weekday:e.target.value})}><option value="">Dia da semana</option><option>Segunda</option><option>Terça</option><option>Quarta</option><option>Quinta</option><option>Sexta</option><option>Sábado</option><option>Domingo</option></select><input className="input" type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/><input className="input" type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/><input className="input" placeholder="Sala / local" value={form.room} onChange={e=>setForm({...form,room:e.target.value})}/><input className="input" type="number" placeholder="Capacidade" value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})}/><input className="input" type="number" step="0.01" placeholder="Valor" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})}/><input className="input lg:col-span-3" placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn lg:col-span-4" type="submit"><Save size={18}/> Salvar turma</button></form></section><section className="card"><h3 className="text-xl font-black">Grade cadastrada</h3><div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map(i=><div key={i.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-3"><strong>{i.name}</strong><button className="text-red-300" onClick={()=>remove(i.id)}><Trash2 size={16}/></button></div><p className="text-sm text-slate-400">{i.instructor_name || i.professionals?.name || 'Professor não informado'} · {i.weekday || '-'} · {i.start_time} às {i.end_time}</p><p className="mt-2 text-sm">Local: {i.room || '-'} · Capacidade: {i.capacity || 0} · Valor: {money(i.price)}</p>{i.notes && <p className="mt-2 text-sm text-slate-400">{i.notes}</p>}</div>)}{!items.length && <p className="text-sm text-slate-500">Nenhuma turma cadastrada.</p>}</div></section></div>
}

function EducationAttendancePage({ segment }: { segment: SegmentDefinition }) {
  const [classes, setClasses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [form, setForm] = useState({ student_name: '', class_id: '', class_name: '', attendance_date: today(), status: 'presente', notes: '' })
  const isGym = segment.id === 'academia'
  async function load(){ const user_id=await getUserId(); const {data:cls}=await supabase.from('classes_courses').select('*').eq('user_id',user_id).order('name'); const {data:ens}=await supabase.from('student_enrollments').select('*').eq('user_id',user_id).order('student_name'); const {data,error}=await supabase.from('student_attendance').select('*').eq('user_id',user_id).gte('attendance_date',dateDaysAgo(30)).order('attendance_date',{ascending:false}); setClasses(cls||[]); setEnrollments(ens||[]); if(!error) setRecords(data||[]) }
  useEffect(()=>{load()},[])
  async function save(e:React.FormEvent){ e.preventDefault(); const user_id=await getUserId(); const cls=classes.find(c=>c.id===form.class_id); const {error}=await supabase.from('student_attendance').insert({...form,user_id,class_id:form.class_id||null,class_name:cls?.name || form.class_name}); if(error) return alert('Execute a migração V31 no Supabase. Detalhes: '+error.message); setForm({ student_name: '', class_id: '', class_name: '', attendance_date: today(), status: 'presente', notes: '' }); load() }
  const presentes=records.filter(r=>r.status==='presente').length, faltas=records.filter(r=>r.status==='falta').length
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title={isGym?'Check-ins 30 dias':'Presenças 30 dias'} value={String(records.length)} icon={CheckCircle2}/><Card title="Presentes" value={String(presentes)} icon={CheckCircle2}/><Card title="Faltas" value={String(faltas)} icon={X}/><Card title="Alunos ativos" value={String(enrollments.filter(e=>e.status==='ativo').length)} icon={UserRound}/></div><section className="card"><h3 className="text-xl font-black">{isGym?'Check-in / presença do aluno':'Controle de presença'}</h3><form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-4"><select className="input" value={form.student_name} onChange={e=>setForm({...form,student_name:e.target.value})}><option value="">Selecionar aluno</option>{enrollments.map(e=><option key={e.id} value={e.student_name}>{e.student_name}</option>)}</select><select className="input" value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">Selecionar turma</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input className="input" placeholder="Ou turma manual" value={form.class_name} onChange={e=>setForm({...form,class_name:e.target.value})}/><input className="input" type="date" value={form.attendance_date} onChange={e=>setForm({...form,attendance_date:e.target.value})}/><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="presente">Presente</option><option value="falta">Falta</option><option value="justificado">Justificado</option></select><input className="input lg:col-span-3" placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn lg:col-span-4" type="submit"><Save size={18}/> Registrar presença</button></form></section><section className="card"><h3 className="text-xl font-black">Últimos registros</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Data</th><th>Aluno</th><th>Turma</th><th>Status</th><th>Obs.</th></tr></thead><tbody>{records.map(r=><tr key={r.id} className="border-b border-slate-900"><td className="py-3">{brDate(r.attendance_date)}</td><td className="font-bold">{r.student_name}</td><td>{r.class_name}</td><td><span className="badge">{r.status}</span></td><td>{r.notes || '-'}</td></tr>)}{!records.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Nenhum registro de presença.</td></tr>}</tbody></table></div></section></div>
}

function EducationCertificatesPage({ segment }: { segment: SegmentDefinition }) {
  const [items, setItems] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [form, setForm] = useState({ student_name: '', course_name: '', issue_date: today(), workload_hours: 0, grade: '', status: 'emitido', notes: '' })
  const isGym = segment.id === 'academia'
  async function load(){ const user_id=await getUserId(); const {data:ens}=await supabase.from('student_enrollments').select('*').eq('user_id',user_id).order('student_name'); const {data,error}=await supabase.from('student_certificates').select('*').eq('user_id',user_id).order('created_at',{ascending:false}); setEnrollments(ens||[]); if(!error) setItems(data||[]) }
  useEffect(()=>{load()},[])
  async function save(e:React.FormEvent){ e.preventDefault(); const user_id=await getUserId(); const {error}=await supabase.from('student_certificates').insert({...form,user_id,workload_hours:Number(form.workload_hours||0)}); if(error) return alert('Execute a migração V31 no Supabase. Detalhes: '+error.message); setForm({ student_name: '', course_name: '', issue_date: today(), workload_hours: 0, grade: '', status: 'emitido', notes: '' }); load() }
  function pdf(c:any){ const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}); doc.setFont('helvetica','bold'); doc.setFontSize(26); doc.text(isGym?'AVALIAÇÃO / CERTIFICADO':'CERTIFICADO',148,38,{align:'center'}); doc.setFont('helvetica','normal'); doc.setFontSize(14); doc.text(`Certificamos que ${c.student_name}`,148,70,{align:'center'}); doc.text(`${isGym?'concluiu/realizou':'concluiu'} ${c.course_name}`,148,85,{align:'center'}); doc.text(`Carga horária: ${c.workload_hours || 0}h   Nota/Avaliação: ${c.grade || '-'}`,148,100,{align:'center'}); doc.text(`Emitido em ${brDate(c.issue_date)}`,148,118,{align:'center'}); if(c.notes) doc.text(String(c.notes),148,136,{align:'center',maxWidth:230}); doc.line(95,168,200,168); doc.text('Assinatura responsável',148,177,{align:'center'}); doc.save(`certificado-${c.student_name||'aluno'}.pdf`) }
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title={isGym?'Avaliações':'Certificados'} value={String(items.length)} icon={FileText}/><Card title="Emitidos" value={String(items.filter(i=>i.status==='emitido').length)} icon={CheckCircle2}/><Card title="Alunos" value={String(enrollments.length)} icon={UserRound}/><Card title="PDF" value="Disponível" icon={Download}/></div><section className="card"><h3 className="text-xl font-black">{isGym?'Avaliações físicas e certificados':'Emissão de certificados'}</h3><form onSubmit={save} className="mt-4 grid gap-3 lg:grid-cols-4"><select className="input" value={form.student_name} onChange={e=>{ const en=enrollments.find(x=>x.student_name===e.target.value); setForm({...form,student_name:e.target.value,course_name:en?.course_name || form.course_name}) }}><option value="">Selecionar aluno</option>{enrollments.map(e=><option key={e.id} value={e.student_name}>{e.student_name}</option>)}</select><input className="input" placeholder={isGym?'Avaliação / modalidade':'Curso'} value={form.course_name} onChange={e=>setForm({...form,course_name:e.target.value})} required/><input className="input" type="date" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})}/><input className="input" type="number" placeholder="Carga horária" value={form.workload_hours} onChange={e=>setForm({...form,workload_hours:Number(e.target.value)})}/><input className="input" placeholder={isGym?'Resultado / avaliação':'Nota'} value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})}/><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="emitido">Emitido</option><option value="rascunho">Rascunho</option><option value="cancelado">Cancelado</option></select><input className="input lg:col-span-2" placeholder="Observações" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn lg:col-span-4" type="submit"><Save size={18}/> Salvar</button></form></section><section className="card"><h3 className="text-xl font-black">Documentos emitidos</h3><div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map(i=><div key={i.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-3"><strong>{i.student_name}</strong><span className="badge">{i.status}</span></div><p className="text-sm text-slate-400">{i.course_name} · {brDate(i.issue_date)} · {i.workload_hours || 0}h</p><button className="btn2 mt-3" onClick={()=>pdf(i)}><Download size={16}/> Baixar PDF</button></div>)}{!items.length && <p className="text-sm text-slate-500">Nenhum documento cadastrado.</p>}</div></section></div>
}


type PetRecord = {
  id?: string
  user_id?: string
  tutor_name: string
  pet_name: string
  species: string
  breed: string
  size: string
  weight: number
  birth_date: string
  color: string
  temperament: string
  allergies: string
  notes: string
  created_at?: string
}

const emptyPetRecord: PetRecord = {
  tutor_name: '', pet_name: '', species: 'Cachorro', breed: '', size: '', weight: 0, birth_date: '', color: '', temperament: '', allergies: '', notes: ''
}

function PetShopPetsPage() {
  const [pets, setPets] = useState<PetRecord[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<PetRecord>(emptyPetRecord)

  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase.from('pet_records').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    const { data: tutors } = await supabase.from('customers').select('*').eq('user_id', user_id).order('name')
    if (!error) setPets(data || [])
    setCustomers(tutors || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const payload = { ...form, user_id, weight: Number(form.weight || 0) }
    const { error } = await supabase.from('pet_records').insert(payload)
    if (error) return alert('Execute a migração V32 no Supabase. Detalhes: ' + error.message)
    setForm(emptyPetRecord)
    load()
  }

  async function remove(id: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('pet_records').delete().eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    load()
  }

  function pdf(pet: PetRecord) {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Ficha do Pet', 14, 18)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Tutor: ${pet.tutor_name}`, 14, 34)
    doc.text(`Pet: ${pet.pet_name}   Espécie: ${pet.species}`, 14, 44)
    doc.text(`Raça: ${pet.breed || '-'}   Porte: ${pet.size || '-'}   Peso: ${pet.weight || 0} kg`, 14, 54)
    doc.text(`Nascimento: ${pet.birth_date ? brDate(pet.birth_date) : '-'}   Cor: ${pet.color || '-'}`, 14, 64)
    doc.text(`Temperamento: ${pet.temperament || '-'}`, 14, 78, { maxWidth: 180 })
    doc.text(`Alergias/cuidados: ${pet.allergies || '-'}`, 14, 98, { maxWidth: 180 })
    doc.text(`Observações: ${pet.notes || '-'}`, 14, 122, { maxWidth: 180 })
    doc.save(`ficha-pet-${pet.pet_name || 'pet'}.pdf`)
  }

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Pets cadastrados" value={String(pets.length)} icon={PawPrint} />
      <Card title="Tutores" value={String(new Set(pets.map(p => p.tutor_name)).size)} icon={UserRound} />
      <Card title="Cães" value={String(pets.filter(p => p.species.toLowerCase().includes('cachorro')).length)} icon={PawPrint} />
      <Card title="Fichas PDF" value="Ativo" icon={Download} />
    </div>

    <section className="card">
      <h3 className="text-xl font-black">Cadastro de Pets</h3>
      <p className="mb-4 text-sm text-slate-400">Controle tutor, raça, porte, peso, cuidados, alergias e observações do animal.</p>
      <form onSubmit={save} className="grid gap-3 lg:grid-cols-4">
        <select className="input" value={form.tutor_name} onChange={e => setForm({ ...form, tutor_name: e.target.value })}>
          <option value="">Selecionar tutor</option>
          {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input className="input" placeholder="Ou digitar tutor" value={form.tutor_name} onChange={e => setForm({ ...form, tutor_name: e.target.value })} required />
        <input className="input" placeholder="Nome do pet" value={form.pet_name} onChange={e => setForm({ ...form, pet_name: e.target.value })} required />
        <select className="input" value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}>
          <option>Cachorro</option><option>Gato</option><option>Ave</option><option>Outro</option>
        </select>
        <input className="input" placeholder="Raça" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
        <select className="input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
          <option value="">Porte</option><option>Pequeno</option><option>Médio</option><option>Grande</option><option>Gigante</option>
        </select>
        <input className="input" type="number" step="0.01" placeholder="Peso kg" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} />
        <input className="input" type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
        <input className="input" placeholder="Cor" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
        <input className="input" placeholder="Temperamento" value={form.temperament} onChange={e => setForm({ ...form, temperament: e.target.value })} />
        <textarea className="input lg:col-span-2" placeholder="Alergias / cuidados especiais" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} />
        <textarea className="input lg:col-span-3" placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button className="btn" type="submit"><Save size={18} /> Salvar pet</button>
      </form>
    </section>

    <section className="card">
      <h3 className="text-xl font-black">Pets cadastrados</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Pet</th><th>Tutor</th><th>Espécie</th><th>Raça</th><th>Porte</th><th>Peso</th><th>Ações</th></tr></thead>
          <tbody>
            {pets.map(p => <tr key={p.id} className="border-b border-slate-900"><td className="py-3 font-bold">{p.pet_name}</td><td>{p.tutor_name}</td><td>{p.species}</td><td>{p.breed || '-'}</td><td>{p.size || '-'}</td><td>{p.weight || 0} kg</td><td className="space-x-2 whitespace-nowrap"><button className="btn2" onClick={() => pdf(p)}><Download size={16} /></button><button className="btn2" onClick={() => remove(p.id!)}><Trash2 size={16} /></button></td></tr>)}
            {!pets.length && <tr><td colSpan={7} className="py-8 text-center text-slate-500">Nenhum pet cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </div>
}

function PetShopHealthPage() {
  const [pets, setPets] = useState<PetRecord[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [form, setForm] = useState({ pet_id: '', pet_name: '', tutor_name: '', record_type: 'vacina', title: '', record_date: today(), next_date: '', professional: '', price: 0, notes: '' })

  async function load() {
    const user_id = await getUserId()
    const { data: petData } = await supabase.from('pet_records').select('*').eq('user_id', user_id).order('pet_name')
    const { data, error } = await supabase.from('pet_health_records').select('*').eq('user_id', user_id).order('record_date', { ascending: false })
    setPets(petData || [])
    if (!error) setRecords(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const pet = pets.find(p => p.id === form.pet_id)
    const payload = { ...form, user_id, pet_id: form.pet_id || null, pet_name: pet?.pet_name || form.pet_name, tutor_name: pet?.tutor_name || form.tutor_name, price: Number(form.price || 0) }
    const { error } = await supabase.from('pet_health_records').insert(payload)
    if (error) return alert('Execute a migração V32 no Supabase. Detalhes: ' + error.message)
    setForm({ pet_id: '', pet_name: '', tutor_name: '', record_type: 'vacina', title: '', record_date: today(), next_date: '', professional: '', price: 0, notes: '' })
    load()
  }

  function pdf(r: any) {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Registro Pet Shop', 14, 18)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    doc.text(`Tipo: ${r.record_type}   Data: ${brDate(r.record_date)}`, 14, 34)
    doc.text(`Pet: ${r.pet_name}   Tutor: ${r.tutor_name || '-'}`, 14, 44)
    doc.text(`Descrição: ${r.title || '-'}`, 14, 56, { maxWidth: 180 })
    doc.text(`Próxima data: ${r.next_date ? brDate(r.next_date) : '-'}`, 14, 78)
    doc.text(`Profissional: ${r.professional || '-'}`, 14, 90)
    doc.text(`Valor: ${money(r.price || 0)}`, 14, 102)
    doc.text(`Observações: ${r.notes || '-'}`, 14, 116, { maxWidth: 180 })
    doc.save(`registro-pet-${r.pet_name || 'pet'}.pdf`)
  }

  const dueSoon = records.filter(r => r.next_date && r.next_date <= dateDaysAgo(-30)).length
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card title="Registros" value={String(records.length)} icon={ClipboardList} />
      <Card title="Vacinas" value={String(records.filter(r => r.record_type === 'vacina').length)} icon={CheckCircle2} />
      <Card title="Retornos próximos" value={String(dueSoon)} icon={CalendarCheck} />
      <Card title="Total lançado" value={money(records.reduce((s, r) => s + Number(r.price || 0), 0))} icon={Banknote} />
    </div>

    <section className="card">
      <h3 className="text-xl font-black">Vacinas, saúde e retornos</h3>
      <p className="mb-4 text-sm text-slate-400">Registre vacinas, vermífugos, banho e tosa, consultas, retornos e cuidados especiais.</p>
      <form onSubmit={save} className="grid gap-3 lg:grid-cols-4">
        <select className="input" value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })}>
          <option value="">Selecionar pet</option>
          {pets.map(p => <option key={p.id} value={p.id}>{p.pet_name} - {p.tutor_name}</option>)}
        </select>
        <input className="input" placeholder="Pet manual" value={form.pet_name} onChange={e => setForm({ ...form, pet_name: e.target.value })} />
        <input className="input" placeholder="Tutor manual" value={form.tutor_name} onChange={e => setForm({ ...form, tutor_name: e.target.value })} />
        <select className="input" value={form.record_type} onChange={e => setForm({ ...form, record_type: e.target.value })}>
          <option value="vacina">Vacina</option><option value="vermifugo">Vermífugo</option><option value="banho_tosa">Banho e tosa</option><option value="consulta">Consulta</option><option value="retorno">Retorno</option><option value="outro">Outro</option>
        </select>
        <input className="input lg:col-span-2" placeholder="Descrição / procedimento" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <input className="input" type="date" value={form.record_date} onChange={e => setForm({ ...form, record_date: e.target.value })} />
        <input className="input" type="date" value={form.next_date} onChange={e => setForm({ ...form, next_date: e.target.value })} />
        <input className="input" placeholder="Profissional" value={form.professional} onChange={e => setForm({ ...form, professional: e.target.value })} />
        <input className="input" type="number" step="0.01" placeholder="Valor" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input lg:col-span-2" placeholder="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button className="btn lg:col-span-4" type="submit"><Save size={18} /> Salvar registro</button>
      </form>
    </section>

    <section className="card">
      <h3 className="text-xl font-black">Histórico de saúde e atendimentos</h3>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {records.map(r => <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-3"><strong>{r.pet_name || 'Pet'}</strong><span className="badge">{r.record_type}</span></div><p className="text-sm text-slate-400">Tutor: {r.tutor_name || '-'} · {brDate(r.record_date)} · Retorno: {r.next_date ? brDate(r.next_date) : '-'}</p><p className="mt-2 text-sm">{r.title || '-'}</p>{r.notes && <p className="mt-2 text-sm text-slate-400">{r.notes}</p>}<button className="btn2 mt-3" onClick={() => pdf(r)}><Download size={16}/> PDF</button></div>)}
        {!records.length && <p className="text-sm text-slate-500">Nenhum registro cadastrado.</p>}
      </div>
    </section>
  </div>
}


type SaasPlan = {
  id?: string
  user_id?: string
  name: string
  monthly_price: number
  max_users: number
  max_companies: number
  storage_gb: number
  modules: string
  trial_days: number
  active: boolean
}

type SaasCompany = {
  id?: string
  user_id?: string
  company_name: string
  responsible_name: string
  email: string
  phone: string
  document: string
  segment: string
  status: string
  plan_name: string
  trial_ends_at: string
  subscription_ends_at: string
  created_at?: string
}

const defaultPlans: SaasPlan[] = [
  { name: 'Básico', monthly_price: 79, max_users: 2, max_companies: 1, storage_gb: 2, modules: 'PDV, clientes, produtos, caixa e relatórios', trial_days: 7, active: true },
  { name: 'Profissional', monthly_price: 149, max_users: 5, max_companies: 1, storage_gb: 10, modules: 'Todos os módulos do segmento, financeiro, PDF/Excel e Google Drive', trial_days: 15, active: true },
  { name: 'Premium', monthly_price: 249, max_users: 15, max_companies: 3, storage_gb: 30, modules: 'Multiempresa, portal do cliente, módulos avançados e suporte prioritário', trial_days: 30, active: true }
]

const emptySaasCompany: SaasCompany = {
  company_name: '', responsible_name: '', email: '', phone: '', document: '', segment: 'loja', status: 'trial', plan_name: 'Profissional', trial_ends_at: '', subscription_ends_at: ''
}

function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function SaasSubscriptionsPage() {
  const [plans, setPlans] = useState<SaasPlan[]>([])
  const [companies, setCompanies] = useState<SaasCompany[]>([])
  const [saved, setSaved] = useState(false)

  async function load() {
    const user_id = await getUserId()
    const { data: planData, error: planError } = await supabase.from('saas_plans').select('*').eq('user_id', user_id).order('monthly_price')
    const { data: companyData } = await supabase.from('saas_companies').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    if (!planError && planData?.length) setPlans(planData)
    else setPlans(defaultPlans)
    setCompanies(companyData || [])
  }

  useEffect(() => { load() }, [])

  async function saveDefaultPlans() {
    const user_id = await getUserId()
    const payload = defaultPlans.map(plan => ({ ...plan, user_id }))
    const { error } = await supabase.from('saas_plans').insert(payload)
    if (error) return alert('Execute a migração supabase/v33_saas_multiempresa_migration.sql no Supabase. Detalhes: ' + error.message)
    setSaved(true)
    load()
  }

  const active = companies.filter(c => ['active', 'trial'].includes(c.status)).length
  const overdue = companies.filter(c => c.status === 'overdue' || c.status === 'suspended').length
  const mrr = companies.filter(c => c.status === 'active').reduce((sum, c) => sum + Number(plans.find(p => p.name === c.plan_name)?.monthly_price || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="MRR previsto" value={money(mrr)} icon={Banknote} />
        <Card title="Empresas ativas/teste" value={String(active)} icon={Building2} />
        <Card title="Inadimplentes" value={String(overdue)} icon={CreditCard} />
        <Card title="Planos" value={String(plans.length)} icon={Crown} />
      </div>

      <section className="card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black">Planos de assinatura</h3>
            <p className="text-sm text-slate-400">Use estes planos para vender o sistema por mensalidade.</p>
          </div>
          <button className="btn" type="button" onClick={saveDefaultPlans}><Save size={18} /> Gravar planos padrão</button>
        </div>
        {saved && <p className="mt-3 text-sm text-emerald-300">Planos gravados no banco.</p>}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {plans.map(plan => (
            <article key={plan.id || plan.name} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h4 className="text-lg font-black text-white">{plan.name}</h4>
                <span className="badge">{plan.trial_days} dias teste</span>
              </div>
              <p className="text-3xl font-black text-emerald-300">{money(plan.monthly_price)}<span className="text-sm text-slate-500">/mês</span></p>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Usuários: <strong>{plan.max_users}</strong></p>
                <p>Empresas: <strong>{plan.max_companies}</strong></p>
                <p>Armazenamento: <strong>{plan.storage_gb}GB</strong></p>
                <p className="text-slate-400">{plan.modules}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function SaasCompaniesPage() {
  const [companies, setCompanies] = useState<SaasCompany[]>([])
  const [form, setForm] = useState<SaasCompany>({ ...emptySaasCompany, trial_ends_at: addDaysIso(15), subscription_ends_at: addDaysIso(30) })

  async function load() {
    const user_id = await getUserId()
    const { data, error } = await supabase.from('saas_companies').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
    if (!error) setCompanies(data || [])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const { error } = await supabase.from('saas_companies').insert({ ...form, user_id })
    if (error) return alert('Execute a migração supabase/v33_saas_multiempresa_migration.sql no Supabase. Detalhes: ' + error.message)
    setForm({ ...emptySaasCompany, trial_ends_at: addDaysIso(15), subscription_ends_at: addDaysIso(30) })
    load()
  }

  async function updateStatus(id: string, status: string) {
    const user_id = await getUserId()
    const { error } = await supabase.from('saas_companies').update({ status }).eq('id', id).eq('user_id', user_id)
    if (error) return alert(error.message)
    load()
  }

  function exportExcel() {
    const rows = companies.map(c => ({ Empresa: c.company_name, Responsavel: c.responsible_name, Email: c.email, Telefone: c.phone, Segmento: c.segment, Plano: c.plan_name, Status: c.status, Teste_ate: c.trial_ends_at, Assinatura_ate: c.subscription_ends_at }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas SaaS')
    XLSX.writeFile(wb, 'empresas-saas.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total empresas" value={String(companies.length)} icon={Building2} />
        <Card title="Em teste" value={String(companies.filter(c => c.status === 'trial').length)} icon={Sparkles} />
        <Card title="Ativas" value={String(companies.filter(c => c.status === 'active').length)} icon={CheckCircle2} />
        <Card title="Suspensas" value={String(companies.filter(c => ['suspended', 'overdue'].includes(c.status)).length)} icon={CreditCard} />
      </div>

      <section className="card">
        <h3 className="text-xl font-black">Cadastrar empresa SaaS</h3>
        <p className="mb-4 text-sm text-slate-400">Controle clientes que assinam seu sistema, plano, vencimento e status da conta.</p>
        <form onSubmit={save} className="grid gap-3 lg:grid-cols-4">
          <input className="input" placeholder="Nome da empresa" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required />
          <input className="input" placeholder="Responsável" value={form.responsible_name} onChange={e => setForm({ ...form, responsible_name: e.target.value })} />
          <input className="input" placeholder="E-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="WhatsApp" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="CNPJ/CPF" value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} />
          <select className="input" value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })}>{segmentCatalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className="input" value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })}><option>Básico</option><option>Profissional</option><option>Premium</option><option>Enterprise</option></select>
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="trial">Em teste</option><option value="active">Ativa</option><option value="overdue">Atrasada</option><option value="suspended">Suspensa</option><option value="cancelled">Cancelada</option></select>
          <label className="text-sm text-slate-400">Teste até<input className="input mt-1" type="date" value={form.trial_ends_at} onChange={e => setForm({ ...form, trial_ends_at: e.target.value })} /></label>
          <label className="text-sm text-slate-400">Assinatura até<input className="input mt-1" type="date" value={form.subscription_ends_at} onChange={e => setForm({ ...form, subscription_ends_at: e.target.value })} /></label>
          <button className="btn lg:col-span-2" type="submit"><Save size={18} /> Cadastrar empresa</button>
        </form>
      </section>

      <section className="card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-xl font-black">Empresas cadastradas</h3>
          <button className="btn2" type="button" onClick={exportExcel}><Download size={18} /> Excel</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="text-left text-slate-400"><tr className="border-b border-slate-800"><th className="py-2">Empresa</th><th>Responsável</th><th>Contato</th><th>Segmento</th><th>Plano</th><th>Teste até</th><th>Vencimento</th><th>Status</th></tr></thead>
            <tbody>
              {companies.map(c => <tr key={c.id} className="border-b border-slate-900"><td className="py-3 font-bold text-white">{c.company_name}</td><td>{c.responsible_name || '-'}</td><td>{c.email || c.phone || '-'}</td><td>{getSegment(c.segment)?.shortName || c.segment}</td><td>{c.plan_name}</td><td>{brDate(c.trial_ends_at)}</td><td>{brDate(c.subscription_ends_at)}</td><td><select className="input py-2" value={c.status} onChange={e => updateStatus(c.id!, e.target.value)}><option value="trial">Em teste</option><option value="active">Ativa</option><option value="overdue">Atrasada</option><option value="suspended">Suspensa</option><option value="cancelled">Cancelada</option></select></td></tr>)}
              {!companies.length && <tr><td colSpan={8} className="py-8 text-center text-slate-500">Nenhuma empresa SaaS cadastrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SettingsPage({ currentSegment, onSegmentChange }: { currentSegment: SegmentId | '', onSegmentChange: (segmentId: SegmentId) => Promise<void> }) {
  const [form, setForm] = useState<any>({ store_name: '', cnpj: '', phone: '', address: '', logo_url: '', theme: 'dark', business_segment: currentSegment })
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function load() {
      const settings = await getStoreSettings()
      setForm({ ...settings, business_segment: settings?.business_segment || currentSegment })
    }
    load()
  }, [currentSegment])

  async function handleLogoUpload(file?: File) {
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      alert('A logo pode ter no máximo 50MB.')
      return
    }

    setUploading(true)
    try {
      const url = await uploadStoreLogo(file)
      setForm({ ...form, logo_url: url })
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar logo.')
    }
    setUploading(false)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()

    if (form.id) {
      await supabase.from('store_settings').update(form).eq('id', form.id).eq('user_id', user_id)
    } else {
      const { data } = await supabase.from('store_settings').insert({ ...form, user_id }).select().single()
      if (data) setForm(data)
    }

    if (form.business_segment && form.business_segment !== currentSegment) {
      await onSegmentChange(form.business_segment as SegmentId)
    }

    setSaved(true)
  }

  return (
    <form onSubmit={save} className="panel">
      <h3>Configurações da empresa</h3>

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <label className="label">Segmento da empresa</label>
        <p className="mb-3 text-sm text-slate-400">O segmento define quais módulos aparecem no menu lateral.</p>
        <select
          className="input"
          value={form.business_segment || ''}
          onChange={e => setForm({ ...form, business_segment: e.target.value })}
        >
          <option value="">Selecione um segmento</option>
          {segmentCatalog.map(segment => <option key={segment.id} value={segment.id}>{segment.name}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input className="input" placeholder="Nome da loja" value={form.store_name || ''} onChange={e => setForm({ ...form, store_name: e.target.value })} />
        <input className="input" placeholder="CNPJ" value={form.cnpj || ''} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
        <input className="input" placeholder="Telefone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Endereço" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />

        <div className="md:col-span-2">
          <label className="label">Logo da empresa</label>
          <p className="text-sm text-slate-400 mb-2">
            Envie a logo da loja. O arquivo pode ter até 50MB. Esta imagem será usada nos PDFs gerados pelo sistema, como romaneio e ordem de serviço.
          </p>
          <input className="input" type="file" accept="image/*" onChange={e => handleLogoUpload(e.target.files?.[0])} />
          {uploading && <p className="text-sm text-emerald-300 mt-2">Enviando logo...</p>}
          {form.logo_url && (
            <div className="mt-3 flex items-center gap-4">
              <img src={form.logo_url} alt="Logo" className="h-20 rounded-xl border border-slate-700 bg-white p-2" />
              <input className="input" value={form.logo_url || ''} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
            </div>
          )}
        </div>

        <select className="input" value={form.theme || 'dark'} onChange={e => setForm({ ...form, theme: e.target.value })}>
          <option value="dark">Tema escuro</option>
          <option value="light">Tema claro</option>
        </select>
      </div>

      <button className="btn mt-4">Salvar</button>
      {saved && <p className="mt-3 text-sm text-emerald-300">Salvo.</p>}
    </form>
  )
}

function CustomerHistoryPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [financial, setFinancial] = useState<any[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [warranties, setWarranties] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function loadCustomers() {
    const user_id = await getUserId()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user_id)
      .order('name')

    setCustomers(data || [])
  }

  useEffect(() => { loadCustomers() }, [])

  async function loadHistory(customerId: string) {
    setSelectedCustomerId(customerId)
    setLoading(true)

    const user_id = await getUserId()
    const selected = customers.find(c => c.id === customerId) || null
    setCustomer(selected)

    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', user_id)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    const saleIds = (salesData || []).map((s: any) => s.id)

    let itemsData: any[] = []
    if (saleIds.length) {
      const { data } = await supabase
        .from('sale_items')
        .select('*, products(name, product_code, barcode)')
        .eq('user_id', user_id)
        .in('sale_id', saleIds)

      itemsData = data || []
    }

    setSales(salesData || [])
    setSaleItems(itemsData)

    // Ordens de serviço da V19. Tenta consultar service_orders; se a tabela não existir ainda, ignora sem quebrar a tela.
    try {
      const { data } = await supabase
        .from('service_orders')
        .select('*')
        .eq('user_id', user_id)
        .or(`customer_id.eq.${customerId},customer_name.ilike.%${selected?.name || ''}%`)
        .order('created_at', { ascending: false })
      setOrders(data || [])
    } catch {
      setOrders([])
    }

    const { data: finData } = await supabase
      .from('financial_entries')
      .select('*')
      .eq('user_id', user_id)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    setFinancial(finData || [])

    try {
      const { data } = await supabase
        .from('customer_returns')
        .select('*')
        .eq('user_id', user_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      setReturns(data || [])
    } catch {
      setReturns([])
    }

    try {
      const { data } = await supabase
        .from('warranties')
        .select('*, products(name)')
        .eq('user_id', user_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      setWarranties(data || [])
    } catch {
      setWarranties([])
    }

    try {
      const { data } = await supabase
        .from('product_reservations')
        .select('*, products(name)')
        .eq('user_id', user_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      setReservations(data || [])
    } catch {
      setReservations([])
    }

    setLoading(false)
  }

  const validSales = sales.filter(s => s.status !== 'cancelada')
  const totalSpent = validSales.reduce((acc, s) => acc + Number(s.total || 0), 0)
  const totalProfit = validSales.reduce((acc, s) => acc + Number(s.profit || 0), 0)
  const pendingDebt = financial
    .filter(f => (f.type === 'receber' || f.type === 'fiado') && !f.paid_at)
    .reduce((acc, f) => acc + Number(f.amount || 0), 0)

  const paidTotal = financial
    .filter(f => f.paid_at)
    .reduce((acc, f) => acc + Number(f.amount || 0), 0)

  const lastPurchase = validSales.length
    ? validSales.map(s => s.created_at).sort().reverse()[0]
    : ''

  function openWhatsApp() {
    if (!customer?.phone) {
      alert('Cliente sem WhatsApp/contato cadastrado.')
      return
    }

    const phone = String(customer.phone).replace(/\D/g, '')
    const finalPhone = phone.startsWith('55') ? phone : `55${phone}`
    const msg = `Olá ${customer.name}, tudo bem? Aqui é da loja.`
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function renderSaleItems(saleId: string) {
    const items = saleItems.filter(i => i.sale_id === saleId)
    if (!items.length) return <span className="text-slate-500">Sem itens vinculados.</span>

    return (
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="text-xs text-slate-400">
            {item.products?.name || 'Produto'} — {item.quantity}x {money(item.unit_price)} = {money(item.total)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="panel">
        <h3>Buscar cliente</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <select
            className="input md:col-span-2"
            value={selectedCustomerId}
            onChange={e => loadHistory(e.target.value)}
          >
            <option value="">Selecione um cliente</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `- ${c.phone}` : ''}
              </option>
            ))}
          </select>

          <button className="btn2" onClick={loadCustomers}>Atualizar clientes</button>
        </div>
      </section>

      {loading && <section className="panel">Carregando histórico...</section>}

      {customer && !loading && (
        <>
          <section className="panel">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="mb-1">{customer.name}</h3>
                <p className="text-sm text-slate-400">CPF/CNPJ: {customer.document || '-'}</p>
                <p className="text-sm text-slate-400">Contato: {customer.phone || '-'}</p>
                <p className="text-sm text-slate-400">Endereço: {customer.address || '-'}</p>
                <p className="text-sm text-slate-400">Obs: {customer.notes || '-'}</p>
              </div>

              <button className="btn" onClick={openWhatsApp}>
                Enviar WhatsApp
              </button>
            </div>
          </section>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="card"><p className="text-slate-400">Total gasto</p><strong className="text-2xl">{money(totalSpent)}</strong></div>
            <div className="card"><p className="text-slate-400">Compras</p><strong className="text-2xl">{validSales.length}</strong></div>
            <div className="card"><p className="text-slate-400">Fiado aberto</p><strong className="text-2xl">{money(pendingDebt)}</strong></div>
            <div className="card"><p className="text-slate-400">Pagamentos</p><strong className="text-2xl">{money(paidTotal)}</strong></div>
            <div className="card"><p className="text-slate-400">Última compra</p><strong className="text-xl">{lastPurchase ? brDate(lastPurchase) : '-'}</strong></div>
          </div>

          <section className="panel">
            <h3>Todas as compras</h3>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Lucro</th>
                </tr>
              </thead>
              <tbody>
                {validSales.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.created_at).toLocaleString('pt-BR')}</td>
                    <td>{s.payment_method || '-'}</td>
                    <td>{s.status || '-'}</td>
                    <td>{renderSaleItems(s.id)}</td>
                    <td>{money(s.total)}</td>
                    <td>{money(s.profit)}</td>
                  </tr>
                ))}
                {!validSales.length && <tr><td colSpan={6} className="text-slate-500">Nenhuma compra encontrada.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h3>Ordens de serviço</h3>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição/Produto</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Entregue</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.created_at ? new Date(o.created_at).toLocaleString('pt-BR') : '-'}</td>
                    <td>{o.product_name || o.description || o.service_description || '-'}</td>
                    <td>{money(o.total || o.total_amount || 0)}</td>
                    <td>{o.is_paid || o.paid ? <span className="tag-green">Pago</span> : <span className="tag-yellow">Pendente</span>}</td>
                    <td>{o.is_delivered || o.delivered ? <span className="tag-green">Entregue</span> : <span className="tag-yellow">Pendente</span>}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={5} className="text-slate-500">Nenhuma ordem encontrada.</td></tr>}
              </tbody>
            </table>
          </section>

          <div className="grid xl:grid-cols-2 gap-4">
            <section className="panel">
              <h3>Fiado / contas a receber</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {financial.filter(f => f.type === 'receber' || f.type === 'fiado').map(f => (
                    <tr key={f.id}>
                      <td>{new Date(f.created_at).toLocaleString('pt-BR')}</td>
                      <td>{f.description}</td>
                      <td>{f.due_date ? brDate(f.due_date) : '-'}</td>
                      <td>{money(f.amount)}</td>
                      <td>{f.paid_at ? <span className="tag-green">Pago</span> : <span className="tag-yellow">Aberto</span>}</td>
                    </tr>
                  ))}
                  {!financial.filter(f => f.type === 'receber' || f.type === 'fiado').length && <tr><td colSpan={5} className="text-slate-500">Nenhum fiado encontrado.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h3>Pagamentos</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Forma</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {financial.filter(f => f.paid_at).map(f => (
                    <tr key={f.id}>
                      <td>{new Date(f.paid_at).toLocaleString('pt-BR')}</td>
                      <td>{f.description}</td>
                      <td>{f.payment_method || '-'}</td>
                      <td>{money(f.amount)}</td>
                    </tr>
                  ))}
                  {!financial.filter(f => f.paid_at).length && <tr><td colSpan={4} className="text-slate-500">Nenhum pagamento encontrado.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h3>Produtos reservados</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Status</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id}>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '-'}</td>
                      <td>{r.products?.name || r.product_name || '-'}</td>
                      <td>{r.quantity || '-'}</td>
                      <td>{r.status || '-'}</td>
                      <td>{r.notes || '-'}</td>
                    </tr>
                  ))}
                  {!reservations.length && <tr><td colSpan={5} className="text-slate-500">Nenhuma reserva encontrada.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h3>Trocas e devoluções</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Motivo</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(r => (
                    <tr key={r.id}>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '-'}</td>
                      <td>{r.product_name || '-'}</td>
                      <td>{r.reason || '-'}</td>
                      <td>{money(r.amount || 0)}</td>
                      <td>{r.status || '-'}</td>
                    </tr>
                  ))}
                  {!returns.length && <tr><td colSpan={5} className="text-slate-500">Nenhuma troca/devolução encontrada.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="panel xl:col-span-2">
              <h3>Garantias</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Nº série/IMEI</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Status</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {warranties.map(w => (
                    <tr key={w.id}>
                      <td>{w.products?.name || w.product_name || '-'}</td>
                      <td>{w.serial_number || w.imei || '-'}</td>
                      <td>{w.start_date ? brDate(w.start_date) : '-'}</td>
                      <td>{w.end_date ? brDate(w.end_date) : '-'}</td>
                      <td>{w.status || '-'}</td>
                      <td>{w.notes || '-'}</td>
                    </tr>
                  ))}
                  {!warranties.length && <tr><td colSpan={6} className="text-slate-500">Nenhuma garantia encontrada.</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}

      {!customer && !loading && (
        <section className="panel">
          <p className="text-slate-400">Selecione um cliente para visualizar o histórico completo.</p>
        </section>
      )}
    </div>
  )
}


function ServiceOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [message, setMessage] = useState('')

  const emptyForm = {
    customer_id: '', customer_name: '', instagram: '', whatsapp: '', device: '',
    reported_defect: '', visual_condition: '', requested_service: '',
    technician: '', priority: 'Normal', estimated_deadline: '',
    estimated_value: '', final_value: '', paid_entry: '',
    payment_method: 'Pix', service_status: 'Recebido',
    internal_notes: '',
    assistance_terms: 'Estou ciente que a assistência técnica não se responsabiliza por dados pessoais que possam ser perdidos durante o reparo. Autorizo o serviço descrito acima.',
    customer_signature: '', product_id: '', product_name: ''
  }

  const [form, setForm] = useState<any>(emptyForm)

  async function load() {
    const user_id = await getUserId()
    const { data: cs } = await supabase.from('customers').select('*').eq('user_id', user_id).order('name')
    const { data: ps } = await supabase.from('products').select('*').eq('user_id', user_id).order('name')
    const { data: os } = await supabase.from('service_orders').select('*, customers(name, phone)').eq('user_id', user_id).order('created_at', { ascending: false })
    setCustomers(cs || [])
    setProducts(ps || [])
    setOrders(os || [])
  }

  useEffect(() => { load() }, [])

  const filteredOrders = orders.filter(o => {
    const q = search.trim().toLowerCase()
    const okSearch = !q || String(o.os_number || '').includes(q) || String(o.customer_name || o.customers?.name || '').toLowerCase().includes(q) || String(o.device || '').toLowerCase().includes(q) || String(o.service_status || '').toLowerCase().includes(q)
    const okStatus = statusFilter === 'todos' || o.service_status === statusFilter
    return okSearch && okStatus
  })

  function fillCustomer(customerId: string) {
    const c = customers.find(x => x.id === customerId)
    setForm({ ...form, customer_id: customerId, customer_name: c?.name || '', whatsapp: c?.phone || form.whatsapp })
  }

  function fillProduct(productId: string) {
    const p = products.find(x => x.id === productId)
    setForm({ ...form, product_id: productId, product_name: p?.name || '', device: p?.name || form.device, estimated_value: form.estimated_value || String(p?.sale_price || ''), final_value: form.final_value || String(p?.sale_price || '') })
  }

  const finalValue = Number(form.final_value || 0)
  const paidEntry = Number(form.paid_entry || 0)
  const remaining = Math.max(0, finalValue - paidEntry)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()
    const payload: any = {
      user_id,
      customer_id: form.customer_id || null,
      customer_name: form.customer_name,
      instagram: form.instagram,
      whatsapp: form.whatsapp,
      device: form.device,
      reported_defect: form.reported_defect,
      visual_condition: form.visual_condition,
      requested_service: form.requested_service,
      technician: form.technician,
      priority: form.priority,
      estimated_deadline: form.estimated_deadline || null,
      estimated_value: Number(form.estimated_value || 0),
      final_value: Number(form.final_value || 0),
      paid_entry: Number(form.paid_entry || 0),
      remaining_balance: remaining,
      payment_method: form.payment_method,
      service_status: form.service_status,
      internal_notes: form.internal_notes,
      assistance_terms: form.assistance_terms,
      customer_signature: form.customer_signature,
      photos: '',
      product_id: form.product_id || null,
      product_name: form.product_name || form.device,
      updated_at: new Date().toISOString()
    }

    let saved: any = null
    if (editingId) {
      const { data, error } = await supabase.from('service_orders').update(payload).eq('id', editingId).eq('user_id', user_id).select().single()
      if (error) return setMessage(error.message)
      saved = data
    } else {
      const { data, error } = await supabase.from('service_orders').insert(payload).select().single()
      if (error) return setMessage(error.message)
      saved = data
    }

    await supabase.from('financial_entries').delete().eq('user_id', user_id).eq('service_order_id', saved.id)

    if (paidEntry > 0) {
      await supabase.from('financial_entries').insert({
        user_id, customer_id: form.customer_id || null, service_order_id: saved.id,
        description: `Entrada da ${formatOSNumber(saved.os_number)}`,
        type: 'entrada', payment_method: form.payment_method, amount: paidEntry,
        paid_at: new Date().toISOString()
      })
    }

    if (remaining > 0) {
      await supabase.from('financial_entries').insert({
        user_id, customer_id: form.customer_id || null, service_order_id: saved.id,
        description: `Saldo restante da ${formatOSNumber(saved.os_number)}`,
        type: 'receber', payment_method: form.payment_method, amount: remaining,
        due_date: form.estimated_deadline || null, paid_at: null
      })
    }

    setEditingId(null)
    setForm(emptyForm)
    setMessage(editingId ? 'Ordem de serviço atualizada.' : 'Ordem de serviço criada.')
    await load()
  }

  function editOrder(order: any) {
    setEditingId(order.id)
    setForm({
      customer_id: order.customer_id || '', customer_name: order.customer_name || order.customers?.name || '',
      instagram: order.instagram || '', whatsapp: order.whatsapp || order.customers?.phone || '',
      device: order.device || '', reported_defect: order.reported_defect || '',
      visual_condition: order.visual_condition || '', requested_service: order.requested_service || '',
      technician: order.technician || '', priority: order.priority || 'Normal',
      estimated_deadline: order.estimated_deadline || '', estimated_value: String(order.estimated_value || ''),
      final_value: String(order.final_value || ''), paid_entry: String(order.paid_entry || ''),
      payment_method: order.payment_method || 'Pix', service_status: order.service_status || 'Recebido',
      internal_notes: order.internal_notes || '', assistance_terms: order.assistance_terms || emptyForm.assistance_terms,
      customer_signature: order.customer_signature || '',
      product_id: order.product_id || '', product_name: order.product_name || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteOrder(order: any) {
    if (!confirm(`Excluir ${formatOSNumber(order.os_number)}?`)) return
    const user_id = await getUserId()
    await supabase.from('financial_entries').delete().eq('user_id', user_id).eq('service_order_id', order.id)
    await supabase.from('service_orders').delete().eq('id', order.id).eq('user_id', user_id)
    await load()
  }

  async function markPaid(order: any) {
    const user_id = await getUserId()
    await supabase.from('service_orders').update({ paid_entry: Number(order.final_value || 0), remaining_balance: 0 }).eq('id', order.id).eq('user_id', user_id)
    await supabase.from('financial_entries').update({ paid_at: new Date().toISOString(), type: 'entrada' }).eq('user_id', user_id).eq('service_order_id', order.id)
    await load()
  }

  async function generatePDF(order: any) {
    const settings = await getStoreSettings()
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 12
    const contentW = pageW - margin * 2
    const navy: [number, number, number] = [15, 23, 42]
    const green: [number, number, number] = [16, 185, 129]
    const light: [number, number, number] = [241, 245, 249]
    const border: [number, number, number] = [203, 213, 225]
    const muted: [number, number, number] = [71, 85, 105]

    function safe(value: any) {
      const normalized = String(value ?? '').trim()
      return normalized || '-'
    }

    function lines(value: any, width: number, maxLines = 2) {
      const result = doc.splitTextToSize(safe(value), width) as string[]
      if (result.length <= maxLines) return result
      const clipped = result.slice(0, maxLines)
      const last = clipped[maxLines - 1]
      clipped[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 3))}...`
      return clipped
    }

    function labelValue(
      label: string,
      value: any,
      x: number,
      y: number,
      width: number,
      maxLines = 1
    ) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...muted)
      doc.text(label.toUpperCase(), x, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...navy)
      doc.text(lines(value, width, maxLines), x, y + 4)
    }

    function sectionTitle(title: string, y: number) {
      doc.setFillColor(...navy)
      doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(title, margin + 4, y + 5.4)
    }

    // Cabeçalho profissional.
    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 36, 'F')

    const logo = await imageUrlToDataUrl(settings.logo_url || '')
    let brandX = margin
    if (logo) {
      try {
        const format = logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        doc.addImage(logo, format, margin, 7, 28, 21)
        brandX = 44
      } catch {}
    }

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(settings.store_name || 'HOMEshop Assistência Técnica', brandX, 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(`CNPJ: ${safe(settings.cnpj)}`, brandX, 19)
    doc.text(`Contato: ${safe(settings.phone || order.whatsapp)}`, brandX, 24)
    doc.text(`Endereço: ${safe(settings.address)}`.slice(0, 78), brandX, 29)

    doc.setFillColor(...green)
    doc.roundedRect(pageW - 65, 7, 53, 22, 2, 2, 'F')
    doc.setTextColor(...navy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('ORDEM DE SERVIÇO', pageW - 38.5, 14, { align: 'center' })
    doc.setFontSize(15)
    doc.text(formatOSNumber(order.os_number), pageW - 38.5, 23, { align: 'center' })

    // Identificação.
    let y = 42
    doc.setDrawColor(...border)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, y, contentW, 31, 2, 2, 'FD')
    labelValue('Cliente', order.customer_name || order.customers?.name, margin + 5, y + 7, 78)
    labelValue('WhatsApp', order.whatsapp || order.customers?.phone, 105, y + 7, 42)
    labelValue('Instagram', order.instagram, 153, y + 7, 40)
    labelValue('Entrada', new Date(order.created_at).toLocaleString('pt-BR'), margin + 5, y + 21, 62)
    labelValue('Técnico responsável', order.technician, 82, y + 21, 48)
    labelValue('Prioridade', order.priority, 136, y + 21, 27)
    labelValue('Status', order.service_status, 168, y + 21, 27)

    // Aparelho e diagnóstico.
    y = 78
    sectionTitle('APARELHO, DIAGNÓSTICO E SERVIÇO', y)
    y += 11
    doc.setFillColor(...light)
    doc.setDrawColor(...border)
    doc.roundedRect(margin, y, contentW, 54, 2, 2, 'FD')

    labelValue('Aparelho', order.device || order.product_name, margin + 5, y + 8, 78, 2)
    labelValue('Prazo estimado', order.estimated_deadline ? brDate(order.estimated_deadline) : '-', 126, y + 8, 66)
    labelValue('Defeito relatado pelo cliente', order.reported_defect, margin + 5, y + 23, 175, 2)
    labelValue('Condição visual', order.visual_condition, margin + 5, y + 38, 83, 2)
    labelValue('Serviço solicitado', order.requested_service, 105, y + 38, 87, 2)

    // Financeiro.
    y = 147
    sectionTitle('RESUMO FINANCEIRO', y)
    y += 11
    doc.setDrawColor(...border)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margin, y, contentW, 34, 2, 2, 'FD')

    const boxW = 35
    const boxY = y + 5
    const financial = [
      ['Estimado', money(order.estimated_value || 0)],
      ['Valor final', money(order.final_value || 0)],
      ['Entrada paga', money(order.paid_entry || 0)],
      ['Saldo restante', money(order.remaining_balance || 0)]
    ]

    financial.forEach((item, index) => {
      const x = margin + 5 + index * (boxW + 2)
      doc.setFillColor(index === 3 ? 236 : 248, index === 3 ? 253 : 250, index === 3 ? 245 : 252)
      doc.roundedRect(x, boxY, boxW, 21, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...muted)
      doc.text(item[0].toUpperCase(), x + 3, boxY + 6)
      doc.setFontSize(10)
      doc.setTextColor(...navy)
      doc.text(item[1], x + 3, boxY + 15)
    })

    labelValue('Forma de pagamento', order.payment_method, 163, y + 9, 30)
    labelValue('PIX', '41-98464-8144', 163, y + 21, 30)

    // Termos e observações, compactos para permanecer em uma página.
    y = 196
    sectionTitle('TERMOS E OBSERVAÇÕES', y)
    y += 11
    doc.setDrawColor(...border)
    doc.setFillColor(...light)
    doc.roundedRect(margin, y, contentW, 42, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...muted)
    doc.text('TERMOS DA ASSISTÊNCIA', margin + 5, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...navy)
    doc.text(lines(order.assistance_terms, 176, 5), margin + 5, y + 12)

    const internalNotes = safe(order.internal_notes)
    if (internalNotes !== '-') {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...muted)
      doc.text('OBSERVAÇÕES', margin + 5, y + 33)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...navy)
      doc.text(lines(internalNotes, 176, 2), margin + 5, y + 38)
    }

    // Assinaturas.
    y = 245
    doc.setDrawColor(...border)
    doc.line(margin + 8, y + 18, 92, y + 18)
    doc.line(118, y + 18, pageW - margin - 8, y + 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...navy)
    const signature = safe(order.customer_signature)
    if (signature !== '-') {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(11)
      doc.text(signature.slice(0, 36), 54, y + 14, { align: 'center' })
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text('Assinatura do cliente', 54, y + 23, { align: 'center' })
    doc.text('Responsável pela assistência', 154, y + 23, { align: 'center' })

    doc.setFontSize(7)
    doc.setTextColor(...muted)
    doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, margin, pageH - 8)
    doc.text('Documento de controle interno — não fiscal', pageW - margin, pageH - 8, { align: 'right' })

    doc.save(`${formatOSNumber(order.os_number)}.pdf`)
  }

  function sendWhatsapp(order: any) {
    const msg = `Olá ${order.customer_name || ''}, segue sua Ordem de Serviço ${formatOSNumber(order.os_number)}.\n\nAparelho: ${order.device || '-'}\nServiço: ${order.requested_service || '-'}\nStatus: ${order.service_status || '-'}\nValor final: ${money(order.final_value || 0)}\nEntrada paga: ${money(order.paid_entry || 0)}\nSaldo restante: ${money(order.remaining_balance || 0)}\n\nPix: 41-98464-8144\nAbquella Carmo de Lima\nBanco Itaú`
    openWhatsappNumber(order.whatsapp, msg)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3>{editingId ? 'Alterar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h3>
          {editingId && <button type="button" className="btn2" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancelar edição</button>}
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div><label className="label">Cliente cadastrado</label><select className="input" value={form.customer_id} onChange={e => fillCustomer(e.target.value)}><option value="">Selecione ou preencha manual</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Nome do cliente</label><input className="input" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required /></div>
          <div><label className="label">Instagram</label><input className="input" placeholder="@cliente" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
          <div><label className="label">WhatsApp</label><input className="input" placeholder="(41) 99999-9999" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>

          <div><label className="label">Produto/aparelho cadastrado</label><select className="input" value={form.product_id} onChange={e => fillProduct(e.target.value)}><option value="">Selecione se existir</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} - {money(p.sale_price || 0)}</option>)}</select></div>
          <div><label className="label">Aparelho</label><input className="input" placeholder="Ex: iPhone 11, Samsung A32" value={form.device} onChange={e => setForm({ ...form, device: e.target.value })} required /></div>
          <div><label className="label">Técnico responsável</label><input className="input" placeholder="Nome do técnico" value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} /></div>
          <div><label className="label">Prioridade</label><select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select></div>

          <div className="md:col-span-2"><label className="label">Defeito relatado pelo cliente</label><input className="input" placeholder="Ex: tela trincada, não carrega, não liga" value={form.reported_defect} onChange={e => setForm({ ...form, reported_defect: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Condição visual do aparelho</label><input className="input" placeholder="Ex: riscos, tampa quebrada, sem marcas" value={form.visual_condition} onChange={e => setForm({ ...form, visual_condition: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Serviço solicitado</label><input className="input" placeholder="Ex: troca de tela, troca de bateria" value={form.requested_service} onChange={e => setForm({ ...form, requested_service: e.target.value })} /></div>
          <div><label className="label">Prazo estimado</label><input className="input" type="date" value={form.estimated_deadline} onChange={e => setForm({ ...form, estimated_deadline: e.target.value })} /></div>
          <div><label className="label">Status do serviço</label><select className="input" value={form.service_status} onChange={e => setForm({ ...form, service_status: e.target.value })}><option>Recebido</option><option>Em análise</option><option>Aguardando peça</option><option>Em manutenção</option><option>Pronto</option><option>Entregue</option><option>Cancelado</option></select></div>

          <div><label className="label">Valor estimado</label><input className="input" type="number" step="0.01" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} /></div>
          <div><label className="label">Valor final</label><input className="input" type="number" step="0.01" value={form.final_value} onChange={e => setForm({ ...form, final_value: e.target.value })} /></div>
          <div><label className="label">Entrada paga</label><input className="input" type="number" step="0.01" value={form.paid_entry} onChange={e => setForm({ ...form, paid_entry: e.target.value })} /></div>
          <div><label className="label">Saldo restante</label><input className="input" value={money(remaining)} disabled /></div>
          <div><label className="label">Forma de pagamento</label><select className="input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}><option>Pix</option><option>Dinheiro</option><option>Cartão débito</option><option>Cartão crédito</option><option>Fiado</option></select></div>

          <div className="md:col-span-2"><label className="label">Observações internas</label><textarea className="input min-h-[90px]" value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })} /></div>
          <div className="md:col-span-3"><label className="label">Termos da assistência</label><textarea className="input min-h-[110px]" value={form.assistance_terms} onChange={e => setForm({ ...form, assistance_terms: e.target.value })} /></div>
          <div><label className="label">Assinatura do cliente</label><textarea className="input min-h-[110px]" placeholder="Digite o nome ou assinatura manual" value={form.customer_signature} onChange={e => setForm({ ...form, customer_signature: e.target.value })} /></div>
        </div>

        <button className="btn mt-4">{editingId ? 'Salvar alterações' : 'Criar ordem de serviço'}</button>
        {message && <p className="mini mt-4">{message}</p>}
      </form>

      <section className="panel">
        <h3>Consultar ordens de serviço</h3>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <input className="input md:col-span-2" placeholder="Buscar por OS, cliente, aparelho ou status" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="todos">Todos os status</option><option>Recebido</option><option>Em análise</option><option>Aguardando peça</option><option>Em manutenção</option><option>Pronto</option><option>Entregue</option><option>Cancelado</option></select>
          <button className="btn2" onClick={load}>Atualizar</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr><th>OS</th><th>Entrada</th><th>Cliente</th><th>Aparelho</th><th>Técnico</th><th>Prioridade</th><th>Status</th><th>Final</th><th>Saldo</th><th>Ações</th></tr></thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id}>
                  <td>{formatOSNumber(o.os_number)}</td><td>{new Date(o.created_at).toLocaleString('pt-BR')}</td><td>{o.customer_name || o.customers?.name || '-'}</td><td>{o.device}</td><td>{o.technician || '-'}</td><td>{o.priority}</td><td>{o.service_status}</td><td>{money(o.final_value || 0)}</td><td>{money(o.remaining_balance || 0)}</td>
                  <td className="space-x-2 whitespace-nowrap"><button className="btn2" onClick={() => generatePDF(o)}>PDF</button><button className="btn2" onClick={() => sendWhatsapp(o)}>WhatsApp</button><button className="btn2" onClick={() => editOrder(o)}>Alterar</button>{Number(o.remaining_balance || 0) > 0 && <button className="btn2" onClick={() => markPaid(o)}>Pago</button>}<button className="btn-danger" onClick={() => deleteOrder(o)}>Excluir</button></td>
                </tr>
              ))}
              {!filteredOrders.length && <tr><td colSpan={10} className="text-slate-500">Nenhuma ordem encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}


type RomaneioItem = {
  product_id: string
  description: string
  quantity: number
  unit_price: number
}

function RomaneiosPage({ setPageFromRomaneio }: { setPageFromRomaneio?: (p: Page) => void }) {
  const [romaneios, setRomaneios] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const emptyForm = {
    customer_id: '',
    customer_name: '',
    instagram: '',
    whatsapp: '',
    purchase_date: today(),
    payment_status: 'Pendente',
    delivery_status: 'Pendente',
    payment_method: 'Pix',
    notes: ''
  }

  const [form, setForm] = useState<any>(emptyForm)
  const [items, setItems] = useState<RomaneioItem[]>([{ product_id: '', description: '', quantity: 1, unit_price: 0 }])

  async function load() {
    const user_id = await getUserId()

    const { data: cs } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user_id)
      .order('name')
    setCustomers(cs || [])

    const { data: ps } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user_id)
      .order('name')
    setProducts(ps || [])

    const { data: rs, error } = await supabase
      .from('romaneios')
      .select('*, customers(name, phone)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) setMessage(error.message)
    setRomaneios(rs || [])
  }

  useEffect(() => { load() }, [])

  const total = items.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)

  function selectCustomer(customerId: string) {
    const c: any = customers.find(x => x.id === customerId)
    setForm({
      ...form,
      customer_id: customerId,
      customer_name: c?.name || '',
      instagram: c?.instagram || c?.notes?.match(/@[\w._-]+/)?.[0] || form.instagram,
      whatsapp: c?.phone || form.whatsapp
    })
  }

  async function createQuickCustomer() {
    if (!form.customer_name) {
      alert('Digite o nome do cliente antes de cadastrar.')
      return
    }

    const user_id = await getUserId()
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id,
        name: form.customer_name,
        phone: form.whatsapp,
        notes: form.instagram ? `Instagram: ${form.instagram}` : ''
      })
      .select()
      .single()

    if (error) return setMessage(error.message)

    setForm({ ...form, customer_id: data.id })
    await load()
    setMessage('Cliente cadastrado e selecionado.')
  }

  function updateItem(index: number, data: Partial<RomaneioItem>) {
    setItems(current => current.map((item, i) => i === index ? { ...item, ...data } : item))
  }

  function selectProduct(index: number, productId: string) {
    const p = products.find(x => x.id === productId)
    updateItem(index, {
      product_id: productId,
      description: p?.name || '',
      unit_price: Number(p?.sale_price || 0)
    })
  }

  function addItem() {
    setItems(current => [...current, { product_id: '', description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    setItems(current => current.length === 1 ? current : current.filter((_, i) => i !== index))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const user_id = await getUserId()

    const payload = {
      user_id,
      customer_id: form.customer_id || null,
      customer_name: form.customer_name,
      instagram: form.instagram,
      whatsapp: form.whatsapp,
      purchase_date: form.purchase_date || today(),
      payment_status: form.payment_status,
      delivery_status: form.delivery_status,
      payment_method: form.payment_method,
      notes: form.notes,
      total,
      items
    }

    let saved: any = null

    if (editingId) {
      const { data, error } = await supabase
        .from('romaneios')
        .update(payload)
        .eq('id', editingId)
        .eq('user_id', user_id)
        .select()
        .single()

      if (error) return setMessage(error.message)
      saved = data
    } else {
      const { data, error } = await supabase
        .from('romaneios')
        .insert(payload)
        .select()
        .single()

      if (error) return setMessage(error.message)
      saved = data
    }

    await supabase
      .from('financial_entries')
      .delete()
      .eq('user_id', user_id)
      .eq('romaneio_id', saved.id)

    await supabase.from('financial_entries').insert({
      user_id,
      customer_id: form.customer_id || null,
      romaneio_id: saved.id,
      description: `Romaneio ${saved.romaneio_number ? String(saved.romaneio_number).padStart(6, '0') : saved.id.slice(0, 8)}`,
      type: form.payment_status === 'Pago' ? 'entrada' : 'receber',
      payment_method: form.payment_method,
      amount: total,
      due_date: form.payment_status === 'Pago' ? null : form.purchase_date,
      paid_at: form.payment_status === 'Pago' ? new Date().toISOString() : null
    })

    setEditingId(null)
    setForm(emptyForm)
    setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }])
    setMessage(editingId ? 'Romaneio alterado com sucesso.' : 'Romaneio criado com sucesso.')
    await load()
  }

  function editRomaneio(r: any) {
    setEditingId(r.id)
    setForm({
      customer_id: r.customer_id || '',
      customer_name: r.customer_name || r.customers?.name || '',
      instagram: r.instagram || '',
      whatsapp: r.whatsapp || r.customers?.phone || '',
      purchase_date: r.purchase_date || today(),
      payment_status: r.payment_status || 'Pendente',
      delivery_status: r.delivery_status || 'Pendente',
      payment_method: r.payment_method || 'Pix',
      notes: r.notes || ''
    })
    setItems(Array.isArray(r.items) && r.items.length ? r.items : [{ product_id: '', description: '', quantity: 1, unit_price: 0 }])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteRomaneio(r: any) {
    if (!confirm('Deseja excluir este romaneio?')) return
    const user_id = await getUserId()

    await supabase.from('financial_entries').delete().eq('user_id', user_id).eq('romaneio_id', r.id)

    const { error } = await supabase
      .from('romaneios')
      .delete()
      .eq('id', r.id)
      .eq('user_id', user_id)

    if (error) return setMessage(error.message)
    setMessage('Romaneio excluído.')
    await load()
  }

  async function generatePDF(r: any) {
    const settings = await getStoreSettings()
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 12
    const contentW = pageW - margin * 2
    const navy: [number, number, number] = [15, 23, 42]
    const green: [number, number, number] = [16, 185, 129]
    const light: [number, number, number] = [241, 245, 249]
    const border: [number, number, number] = [203, 213, 225]
    const muted: [number, number, number] = [71, 85, 105]

    function safe(value: any) {
      const text = String(value ?? '').trim()
      return text || '-'
    }

    function clip(value: any, width: number, maxLines = 1) {
      const result = doc.splitTextToSize(safe(value), width) as string[]
      if (result.length <= maxLines) return result
      const output = result.slice(0, maxLines)
      output[maxLines - 1] = `${output[maxLines - 1].slice(0, -3)}...`
      return output
    }

    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 37, 'F')

    const logo = await imageUrlToDataUrl(settings.logo_url || '')
    let brandX = margin
    if (logo) {
      try {
        const format = logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        doc.addImage(logo, format, margin, 7, 29, 22)
        brandX = 45
      } catch {}
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text(settings.store_name || 'HOMEshop', brandX, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(`CNPJ: ${safe(settings.cnpj)}`, brandX, 20)
    doc.text(`Contato: ${safe(settings.phone)}`, brandX, 25)
    doc.text(`Endereço: ${safe(settings.address)}`.slice(0, 78), brandX, 30)

    doc.setFillColor(...green)
    doc.roundedRect(pageW - 61, 8, 49, 21, 2, 2, 'F')
    doc.setTextColor(...navy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('ROMANEIO', pageW - 36.5, 16, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`#${String(r.id || '').slice(0, 8).toUpperCase()}`, pageW - 36.5, 23, { align: 'center' })

    let y = 43
    doc.setDrawColor(...border)
    doc.setFillColor(...light)
    doc.roundedRect(margin, y, contentW, 28, 2, 2, 'FD')

    const customerName = r.customer_name || r.customers?.name || '-'
    const info = [
      ['CLIENTE', customerName, margin + 5, y + 7, 77],
      ['CONTATO', r.whatsapp, 104, y + 7, 42],
      ['INSTAGRAM', r.instagram, 151, y + 7, 42],
      ['DATA', brDate(r.purchase_date || r.created_at), margin + 5, y + 19, 50],
      ['PAGAMENTO', r.payment_method || 'Pix', 74, y + 19, 48],
      ['ENTREGA', r.delivery_status || 'Pendente', 128, y + 19, 65]
    ]

    info.forEach(([label, value, x, yy, width]: any) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.8)
      doc.setTextColor(...muted)
      doc.text(label, x, yy)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...navy)
      doc.text(clip(value, width, 1), x, yy + 4)
    })

    y = 78
    const tableX = margin
    const tableW = contentW
    const headerH = 9
    const rowH = 9
    const maxRows = 14
    const colQty = 18
    const colDesc = 91
    const colUnit = 36
    const colTotal = tableW - colQty - colDesc - colUnit
    const x1 = tableX + colQty
    const x2 = x1 + colDesc
    const x3 = x2 + colUnit
    const x4 = tableX + tableW

    doc.setFillColor(...navy)
    doc.roundedRect(tableX, y, tableW, headerH, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('QTD', tableX + colQty / 2, y + 6, { align: 'center' })
    doc.text('DESCRIÇÃO DO PRODUTO / SERVIÇO', x1 + 4, y + 6)
    doc.text('V. UNITÁRIO', x2 + colUnit / 2, y + 6, { align: 'center' })
    doc.text('TOTAL', x3 + colTotal / 2, y + 6, { align: 'center' })

    y += headerH
    const pdfItems = Array.isArray(r.items) ? r.items.slice(0, maxRows) : []

    for (let i = 0; i < maxRows; i++) {
      const item = pdfItems[i]
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
      doc.rect(tableX, y, tableW, rowH, 'F')
      doc.setDrawColor(...border)
      doc.rect(tableX, y, tableW, rowH)
      doc.line(x1, y, x1, y + rowH)
      doc.line(x2, y, x2, y + rowH)
      doc.line(x3, y, x3, y + rowH)

      if (item) {
        const quantity = Number(item.quantity || 0)
        const unit = Number(item.unit_price || 0)
        const total = quantity * unit

        doc.setTextColor(...navy)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(String(quantity), tableX + colQty / 2, y + 5.8, { align: 'center' })
        doc.text(clip(item.description, colDesc - 8, 1), x1 + 4, y + 5.8)
        doc.text(money(unit), x3 - 3, y + 5.8, { align: 'right' })
        doc.text(money(total), x4 - 3, y + 5.8, { align: 'right' })
      }
      y += rowH
    }

    // Rodapé de pagamento e total.
    y += 7
    doc.setFillColor(...light)
    doc.setDrawColor(...border)
    doc.roundedRect(margin, y, 105, 39, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...muted)
    doc.text('PAGAMENTO VIA PIX', margin + 5, y + 8)
    doc.setFontSize(11)
    doc.setTextColor(...navy)
    doc.text('41-98464-8144', margin + 5, y + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Abquella Carmo de Lima', margin + 5, y + 23)
    doc.text('Banco Itaú', margin + 5, y + 29)

    const statusPago = r.payment_status === 'Pago' ? 'PAGO' : 'PENDENTE'
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...muted)
    doc.text(`STATUS: ${statusPago}`, margin + 62, y + 16)
    doc.text(`ENTREGA: ${safe(r.delivery_status)}`, margin + 62, y + 24)

    doc.setFillColor(...green)
    doc.roundedRect(124, y, pageW - margin - 124, 39, 2, 2, 'F')
    doc.setTextColor(...navy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('VALOR TOTAL', 129, y + 10)
    doc.setFontSize(19)
    doc.text(money(r.total || 0), pageW - margin - 5, y + 25, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...muted)
    doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, margin, pageH - 8)
    doc.text('Romaneio de controle interno — não fiscal', pageW - margin, pageH - 8, { align: 'right' })

    doc.save(`romaneio-${customerName}-${String(r.id || '').slice(0, 6)}.pdf`)
  }

  function sendWhatsapp(r: any) {
    const itemList = Array.isArray(r.items)
      ? r.items.map((i: any) => `• ${i.quantity}x ${i.description} - ${money(Number(i.quantity || 0) * Number(i.unit_price || 0))}`).join('\n')
      : ''

    const msg =
      `Olá ${r.customer_name || ''}, segue seu romaneio:\n\n` +
      `${itemList}\n\n` +
      `Total: ${money(r.total || 0)}\n` +
      `Pix: 41-98464-8144\n` +
      `Abquella Carmo de Lima\n` +
      `Banco Itaú`

    openWhatsappNumber(r.whatsapp, msg)
  }

  function goHistory(customerId: string | null) {
    if (!customerId) return
    localStorage.setItem('selected_customer_history_id', customerId)
    setPageFromRomaneio?.('historico_cliente')
  }

  const filtered = romaneios.filter(r => {
    const q = search.trim().toLowerCase()
    return !q ||
      String(r.customer_name || r.customers?.name || '').toLowerCase().includes(q) ||
      String(r.instagram || '').toLowerCase().includes(q) ||
      String(r.whatsapp || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3>{editingId ? 'Alterar romaneio' : 'Novo romaneio'}</h3>
          {editingId && <button type="button" className="btn2" onClick={() => { setEditingId(null); setForm(emptyForm); setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]) }}>Cancelar edição</button>}
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">Cliente cadastrado</label>
            <select className="input" value={form.customer_id} onChange={e => selectCustomer(e.target.value)}>
              <option value="">Selecione ou cadastre na hora</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Nome do cliente</label>
            <input className="input" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
          </div>

          <div>
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@cliente" />
          </div>

          <div>
            <label className="label">Contato / WhatsApp</label>
            <input className="input" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="(41) 99999-9999" />
          </div>

          <div>
            <label className="label">Data da compra</label>
            <input className="input" type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
          </div>

          <div>
            <label className="label">Pagamento</label>
            <select className="input" value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })}>
              <option>Pendente</option>
              <option>Pago</option>
            </select>
          </div>

          <div>
            <label className="label">Entrega</label>
            <select className="input" value={form.delivery_status} onChange={e => setForm({ ...form, delivery_status: e.target.value })}>
              <option>Pendente</option>
              <option>Entregue</option>
            </select>
          </div>

          <div>
            <label className="label">Forma</label>
            <select className="input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Cartão débito</option>
              <option>Cartão crédito</option>
              <option>Fiado</option>
            </select>
          </div>
        </div>

        {!form.customer_id && form.customer_name && (
          <button type="button" className="btn2 mt-3" onClick={createQuickCustomer}>
            Cadastrar cliente agora
          </button>
        )}

        <section className="mt-5">
          <h3>Produtos do romaneio</h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid md:grid-cols-6 gap-3 mini">
                <div>
                  <label className="label">Produto cadastrado</label>
                  <select className="input" value={item.product_id} onChange={e => selectProduct(index, e.target.value)}>
                    <option value="">Selecionar</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - {money(p.sale_price || 0)}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Descrição do produto</label>
                  <input className="input" value={item.description} onChange={e => updateItem(index, { description: e.target.value })} required />
                </div>

                <div>
                  <label className="label">Quantidade</label>
                  <input className="input" type="number" value={item.quantity || ''} onChange={e => updateItem(index, { quantity: Number(e.target.value || 0) })} required />
                </div>

                <div>
                  <label className="label">V. Unit</label>
                  <input className="input" type="number" step="0.01" value={item.unit_price || ''} onChange={e => updateItem(index, { unit_price: Number(e.target.value || 0) })} required />
                </div>

                <div>
                  <label className="label">Total</label>
                  <div className="input">{money(Number(item.quantity || 0) * Number(item.unit_price || 0))}</div>
                </div>

                <div>
                  <button type="button" className="btn-danger" onClick={() => removeItem(index)}>Remover</button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn2 mt-3" onClick={addItem}>Adicionar mais produto</button>
        </section>

        <div className="grid md:grid-cols-3 gap-4 mt-5">
          <div className="mini">
            <p className="text-slate-400">Pix</p>
            <strong>41-98464-8144</strong>
            <p>Abquella Carmo de Lima</p>
            <p>Banco Itaú</p>
          </div>

          <div className="mini">
            <p className="text-slate-400">Total</p>
            <strong className="text-2xl">{money(total)}</strong>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[95px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <button className="btn mt-4">{editingId ? 'Salvar alterações' : 'Criar romaneio'}</button>
        {message && <p className="mini mt-4">{message}</p>}
      </form>

      <section className="panel">
        <h3>Romaneios criados</h3>
        <input className="input mb-4" placeholder="Buscar por nome, Instagram ou contato" value={search} onChange={e => setSearch(e.target.value)} />

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Instagram</th>
                <th>Contato</th>
                <th>Produto</th>
                <th>Data cadastro</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <button className="text-emerald-300 hover:underline" onClick={() => goHistory(r.customer_id)}>
                      {r.customer_name || r.customers?.name || '-'}
                    </button>
                  </td>
                  <td>{r.instagram || '-'}</td>
                  <td>{r.whatsapp || '-'}</td>
                  <td>{Array.isArray(r.items) ? r.items.map((i: any) => i.description).join(', ') : '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                  <td>{money(r.total || 0)}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button className="btn2" onClick={() => generatePDF(r)}>PDF</button>
                    <button className="btn2" onClick={() => sendWhatsapp(r)}>WhatsApp</button>
                    <button className="btn2" onClick={() => editRomaneio(r)}>Alterar</button>
                    <button className="btn-danger" onClick={() => deleteRomaneio(r)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="text-slate-500">Nenhum romaneio criado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [page, setPage] = useState<Page>('inicio')
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [segmentId, setSegmentId] = useState<SegmentId | ''>('')
  const [storeName, setStoreName] = useState('Sistema ERP')
  const [savingSegment, setSavingSegment] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      if (!currentSession) {
        setSegmentId('')
        setPage('inicio')
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return

    async function loadBusinessProfile() {
      const settings = await getStoreSettings()
      const databaseSegment = getSegment(settings?.business_segment)?.id || ''
      const localSegment = getStoredSegment(session.user.id)
      const resolvedSegment = databaseSegment || localSegment

      setSegmentId(resolvedSegment)
      setStoreName(settings?.store_name || 'Sistema ERP')
    }

    loadBusinessProfile()
  }, [session?.user?.id])

  async function chooseSegment(nextSegment: SegmentId) {
    setSavingSegment(true)
    const error = await saveBusinessSegment(nextSegment)
    setSegmentId(nextSegment)
    setPage('dashboard')
    setMobileMenuOpen(false)
    setSavingSegment(false)

    if (error) {
      alert(`O segmento foi salvo neste dispositivo, mas não foi possível gravar no banco. Execute o arquivo supabase/v27_sistema_modular_migration.sql no Supabase.\n\nDetalhes: ${error.message}`)
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Carregando...</main>
  if (!session) return <Login />

  const segment = getSegment(segmentId)
  const titles: Record<Page, string> = {
    inicio: 'Início',
    dashboard: 'Dashboard',
    agenda: 'Agenda e Profissionais',
    caixa: 'Caixa',
    pdv: 'PDV',
    ordens: 'Ordens de Serviço',
    financeiro: 'Financeiro',
    relatorios: 'Relatórios',
    produtos: 'Produtos',
    clientes: 'Clientes',
    romaneios: 'Romaneios',
    ordens_servico: 'Ordens de Serviço',
    historico_cliente: 'Histórico do Cliente',
    configuracoes: 'Configurações',
    mesas: 'Mesas e Comandas',
    cozinha: 'Painel da Cozinha',
    delivery: 'Delivery',
    veiculos: 'Veículos',
    checklist: 'Checklist',
    manutencao: 'Manutenção Preventiva',
    matriculas: 'Matrículas',
    turmas: 'Turmas',
    presenca: 'Presença',
    certificados: 'Certificados',
    pets: 'Pets',
    vacinas: 'Vacinas e Saúde',
    assinaturas: 'Assinaturas e Planos',
    empresas_saas: 'Multiempresa'
  }
  const currentTitle = segment?.labels?.[page] || titles[page]

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100">
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={menuCollapsed}
        setCollapsed={setMenuCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        segment={segment}
        storeName={storeName}
      />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Header title={currentTitle} onOpenMenu={() => setMobileMenuOpen(true)} />
        <div className="w-full max-w-full p-3 sm:p-4 lg:p-6">
          {(page === 'inicio' || !segment) && (
            <SegmentHomePage selectedSegment={segmentId} onSelect={chooseSegment} saving={savingSegment} />
          )}
          {page === 'assinaturas' && <SaasSubscriptionsPage />}
          {page === 'empresas_saas' && <SaasCompaniesPage />}
          {segment && page === 'dashboard' && <Dashboard />}
          {segment && page === 'agenda' && <AgendaPage segment={segment} />}
          {segment && page === 'caixa' && <CashPage />}
          {segment && page === 'pdv' && <PDVPage />}
          {segment && page === 'mesas' && <RestaurantTablesPage />}
          {segment && page === 'cozinha' && <KitchenPage />}
          {segment && page === 'delivery' && <DeliveryPage />}
          {segment && page === 'veiculos' && <WorkshopVehiclesPage />}
          {segment && page === 'checklist' && <WorkshopChecklistPage />}
          {segment && page === 'manutencao' && <WorkshopMaintenancePage />}
          {segment && page === 'matriculas' && <EducationEnrollmentsPage segment={segment} />}
          {segment && page === 'turmas' && <EducationClassesPage segment={segment} />}
          {segment && page === 'presenca' && <EducationAttendancePage segment={segment} />}
          {segment && page === 'certificados' && <EducationCertificatesPage segment={segment} />}
          {segment && page === 'pets' && <PetShopPetsPage />}
          {segment && page === 'vacinas' && <PetShopHealthPage />}
          {segment && page === 'ordens' && <ServiceOrdersPage />}
          {segment && page === 'financeiro' && <FinancePage />}
          {segment && page === 'relatorios' && <ReportsPage />}
          {segment && page === 'produtos' && <ProductsPage />}
          {segment && page === 'clientes' && <CustomersPage />}
          {segment && page === 'romaneios' && <RomaneiosPage setPageFromRomaneio={setPage} />}
          {segment && page === 'ordens_servico' && <ServiceOrdersPage />}
          {segment && page === 'historico_cliente' && <CustomerHistoryPage />}
          {segment && page === 'configuracoes' && (
            <SettingsPage
              currentSegment={segmentId}
              onSegmentChange={chooseSegment}
            />
          )}
        </div>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
