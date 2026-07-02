import { createClient } from '@supabase/supabase-js'
import mpSdk from 'mercadopago'

const { MercadoPagoConfig, Order, Payment, WebhookSignatureValidator } = mpSdk

export const SEGMENT_PRICE = 59.90
export const SEGMENT_DAYS = 30
export const PIX_EXPIRATION_MINUTES = 30

export const VALID_SEGMENTS = new Set([
  'loja',
  'comunicacao_visual',
  'assistencia_tecnica',
  'oficina',
  'barbearia',
  'salao_beleza',
  'pet_shop',
  'academia',
  'escola_cursos',
  'restaurante'
])

export function getServerConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!supabaseUrl) throw new Error('SUPABASE_URL não configurada na Vercel.')
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.')
  if (!mercadoPagoAccessToken) throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado na Vercel.')

  return { supabaseUrl, serviceRoleKey, mercadoPagoAccessToken }
}

export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getServerConfig()
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export function createMercadoPagoClients() {
  const { mercadoPagoAccessToken } = getServerConfig()
  const config = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken })
  return {
    order: new Order(config),
    payment: new Payment(config)
  }
}

export function parseJsonBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  return req.body
}

export function sendJson(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.end(JSON.stringify(payload))
}

export async function requireUser(req) {
  const authHeader = String(req.headers.authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) throw Object.assign(new Error('Não autorizado.'), { statusCode: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw Object.assign(new Error('Sessão inválida ou expirada.'), { statusCode: 401 })
  return { user: data.user, admin }
}

export function getPaymentTransaction(orderData) {
  return orderData?.transactions?.payments?.[0] || null
}

export function extractQrData(orderData) {
  const transaction = getPaymentTransaction(orderData)
  const method = transaction?.payment_method || {}
  return {
    providerOrderId: orderData?.id || null,
    providerPaymentId: transaction?.id || transaction?.reference_id || null,
    qrCode: method?.qr_code || null,
    qrCodeBase64: method?.qr_code_base64 || method?.qr_code_based64 || null,
    ticketUrl: method?.ticket_url || null,
    providerStatus: orderData?.status || transaction?.status || 'pending',
    providerStatusDetail: orderData?.status_detail || transaction?.status_detail || null
  }
}

export function normalizeProviderStatus(resource) {
  const status = String(resource?.status || '').toLowerCase()
  const detail = String(resource?.status_detail || '').toLowerCase()
  const transaction = getPaymentTransaction(resource)
  const transactionStatus = String(transaction?.status || '').toLowerCase()
  const transactionDetail = String(transaction?.status_detail || '').toLowerCase()

  if (
    status === 'processed' || status === 'approved' || status === 'paid' ||
    transactionStatus === 'processed' || transactionStatus === 'approved' ||
    detail === 'accredited' || transactionDetail === 'accredited'
  ) return 'approved'

  if (['canceled', 'cancelled', 'expired', 'failed', 'rejected', 'refunded', 'charged_back'].includes(status)) {
    return status === 'cancelled' ? 'canceled' : status
  }

  if (['canceled', 'cancelled', 'expired', 'failed', 'rejected', 'refunded', 'charged_back'].includes(transactionStatus)) {
    return transactionStatus === 'cancelled' ? 'canceled' : transactionStatus
  }

  if (status === 'processing' || transactionStatus === 'processing') return 'processing'
  return 'pending'
}

export async function createPixOrder({ externalReference, payerEmail }) {
  const { order } = createMercadoPagoClients()
  const amount = SEGMENT_PRICE.toFixed(2)
  return order.create({
    body: {
      type: 'online',
      total_amount: amount,
      external_reference: externalReference,
      processing_mode: 'automatic',
      description: `Assinatura ERP por segmento - ${SEGMENT_DAYS} dias`,
      transactions: {
        payments: [
          {
            amount,
            payment_method: { id: 'pix', type: 'bank_transfer' },
            expiration_time: `PT${PIX_EXPIRATION_MINUTES}M`
          }
        ]
      },
      payer: { email: payerEmail }
    },
    requestOptions: {
      idempotencyKey: externalReference,
      timeout: 15000
    }
  })
}

export async function getMercadoPagoResource({ type, id }) {
  const { order, payment } = createMercadoPagoClients()
  if (type === 'payment') return payment.get({ id: String(id) })
  return order.get({ id: String(id) })
}

export async function confirmApprovedPayment(admin, paymentId, resource, providerType = 'order') {
  const transaction = getPaymentTransaction(resource)
  const paidAt = resource?.date_approved || resource?.date_last_updated || new Date().toISOString()
  const { data, error } = await admin.rpc('confirm_segment_payment', {
    p_payment_id: paymentId,
    p_provider_status: 'approved',
    p_provider_order_id: providerType === 'order' ? String(resource?.id || '') : null,
    p_provider_payment_id: providerType === 'payment' ? String(resource?.id || '') : String(transaction?.id || transaction?.reference_id || ''),
    p_paid_at: paidAt
  })
  if (error) throw error
  return data
}

export async function updatePendingPayment(admin, paymentId, resource, providerType = 'order') {
  const normalized = normalizeProviderStatus(resource)
  const transaction = getPaymentTransaction(resource)
  const qr = providerType === 'order' ? extractQrData(resource) : null
  const updates = {
    status: normalized,
    provider_status: String(resource?.status || transaction?.status || normalized),
    provider_status_detail: String(resource?.status_detail || transaction?.status_detail || ''),
    updated_at: new Date().toISOString(),
    ...(qr?.qrCode ? { qr_code: qr.qrCode } : {}),
    ...(qr?.qrCodeBase64 ? { qr_code_base64: qr.qrCodeBase64 } : {}),
    ...(qr?.ticketUrl ? { ticket_url: qr.ticketUrl } : {})
  }
  if (providerType === 'order') updates.provider_order_id = String(resource?.id || '')
  if (providerType === 'payment') updates.provider_payment_id = String(resource?.id || '')
  else if (transaction?.id || transaction?.reference_id) updates.provider_payment_id = String(transaction.id || transaction.reference_id)

  const { error } = await admin.from('segment_payments').update(updates).eq('id', paymentId)
  if (error) throw error
  return normalized
}

export function verifyWebhookSignature(req, dataId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  const allowUnsigned = String(process.env.MERCADO_PAGO_ALLOW_UNSIGNED_WEBHOOKS || '').toLowerCase() === 'true'
  if (!secret) {
    if (allowUnsigned) return
    throw Object.assign(new Error('MERCADO_PAGO_WEBHOOK_SECRET não configurado.'), { statusCode: 500 })
  }

  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']
  if ((!xSignature || !xRequestId) && allowUnsigned) return

  WebhookSignatureValidator.validate({
    xSignature,
    xRequestId,
    dataId: String(dataId || ''),
    secret
  })
}

export async function reconcilePaymentByResource({ admin, resource, providerType }) {
  const externalReference = String(resource?.external_reference || '')
  if (!externalReference) return { ignored: true, reason: 'missing_external_reference' }

  const { data: paymentRow, error } = await admin
    .from('segment_payments')
    .select('id,status,user_id,segment')
    .eq('id', externalReference)
    .maybeSingle()

  if (error) throw error
  if (!paymentRow) return { ignored: true, reason: 'unknown_external_reference' }

  const normalized = normalizeProviderStatus(resource)
  if (normalized === 'approved') {
    const activation = await confirmApprovedPayment(admin, paymentRow.id, resource, providerType)
    return { ignored: false, normalized, activation }
  }

  await updatePendingPayment(admin, paymentRow.id, resource, providerType)

  if (['refunded', 'charged_back'].includes(normalized)) {
    await admin
      .from('segment_subscriptions')
      .update({ status: 'cancelled', valid_until: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('last_payment_id', paymentRow.id)
  }

  return { ignored: false, normalized }
}
