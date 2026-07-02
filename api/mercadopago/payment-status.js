import {
  getMercadoPagoResource,
  normalizeProviderStatus,
  parseJsonBody,
  reconcilePaymentByResource,
  requireUser,
  sendJson
} from '../../server/payment-service.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido.' })

  try {
    const { user, admin } = await requireUser(req)
    const body = parseJsonBody(req)
    const paymentId = String(body.payment_id || '')
    if (!paymentId) return sendJson(res, 400, { error: 'Pagamento não informado.' })

    const { data: paymentRow, error } = await admin
      .from('segment_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!paymentRow) return sendJson(res, 404, { error: 'Pagamento não encontrado.' })

    if (paymentRow.status === 'approved') {
      const { data: subscription } = await admin
        .from('segment_subscriptions')
        .select('valid_until,status')
        .eq('user_id', user.id)
        .eq('segment', paymentRow.segment)
        .maybeSingle()
      return sendJson(res, 200, { active: true, payment: paymentRow, valid_until: subscription?.valid_until || null })
    }

    if (!paymentRow.provider_order_id) {
      return sendJson(res, 200, { active: false, payment: paymentRow })
    }

    const resource = await getMercadoPagoResource({ type: 'order', id: paymentRow.provider_order_id })
    const normalized = normalizeProviderStatus(resource)
    await reconcilePaymentByResource({ admin, resource, providerType: 'order' })

    const { data: refreshed, error: refreshError } = await admin
      .from('segment_payments')
      .select('*')
      .eq('id', paymentId)
      .single()
    if (refreshError) throw refreshError

    const active = normalized === 'approved' || refreshed.status === 'approved'
    let validUntil = null
    if (active) {
      const { data: subscription } = await admin
        .from('segment_subscriptions')
        .select('valid_until')
        .eq('user_id', user.id)
        .eq('segment', refreshed.segment)
        .maybeSingle()
      validUntil = subscription?.valid_until || null
    }

    return sendJson(res, 200, { active, payment: refreshed, valid_until: validUntil })
  } catch (error) {
    console.error('payment-status', error)
    return sendJson(res, error.statusCode || 500, { error: error.message || 'Erro ao consultar pagamento.' })
  }
}
