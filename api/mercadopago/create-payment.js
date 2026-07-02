import {
  SEGMENT_PRICE,
  PIX_EXPIRATION_MINUTES,
  VALID_SEGMENTS,
  createPixOrder,
  extractQrData,
  getMercadoPagoResource,
  parseJsonBody,
  requireUser,
  sendJson
} from '../../server/payment-service.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido.' })

  try {
    const { user, admin } = await requireUser(req)
    const body = parseJsonBody(req)
    const segment = String(body.segment || '')
    const force = Boolean(body.force)

    if (!VALID_SEGMENTS.has(segment)) return sendJson(res, 400, { error: 'Segmento inválido.' })
    if (!user.email) return sendJson(res, 400, { error: 'O usuário precisa ter um e-mail cadastrado.' })

    const { data: subscription, error: subscriptionError } = await admin
      .from('segment_subscriptions')
      .select('status,valid_until')
      .eq('user_id', user.id)
      .eq('segment', segment)
      .maybeSingle()

    if (subscriptionError) throw subscriptionError
    if (subscription?.status === 'active' && subscription.valid_until && new Date(subscription.valid_until).getTime() > Date.now()) {
      return sendJson(res, 200, { active: true, valid_until: subscription.valid_until })
    }

    if (!force) {
      const { data: existing, error: existingError } = await admin
        .from('segment_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('segment', segment)
        .in('status', ['pending', 'processing'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingError) throw existingError
      if (existing?.qr_code) return sendJson(res, 200, { active: false, payment: existing })
    }

    const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000).toISOString()
    const { data: paymentRow, error: insertError } = await admin
      .from('segment_payments')
      .insert({
        user_id: user.id,
        segment,
        amount: SEGMENT_PRICE,
        status: 'pending',
        provider: 'mercado_pago',
        expires_at: expiresAt,
        payer_email: user.email
      })
      .select('*')
      .single()

    if (insertError) throw insertError

    try {
      let order = await createPixOrder({ externalReference: paymentRow.id, payerEmail: user.email })
      let qr = extractQrData(order)

      for (let attempt = 0; attempt < 3 && order?.id && !qr.qrCode; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 700))
        order = await getMercadoPagoResource({ type: 'order', id: order.id })
        qr = extractQrData(order)
      }
      const normalizedStatus = qr.providerStatus === 'processing' ? 'processing' : 'pending'
      const { data: updated, error: updateError } = await admin
        .from('segment_payments')
        .update({
          status: normalizedStatus,
          provider_order_id: qr.providerOrderId,
          provider_payment_id: qr.providerPaymentId,
          provider_status: qr.providerStatus,
          provider_status_detail: qr.providerStatusDetail,
          qr_code: qr.qrCode,
          qr_code_base64: qr.qrCodeBase64,
          ticket_url: qr.ticketUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRow.id)
        .select('*')
        .single()

      if (updateError) throw updateError
      return sendJson(res, 200, { active: false, payment: updated })
    } catch (mercadoPagoError) {
      await admin.from('segment_payments').update({
        status: 'failed',
        provider_status_detail: String(mercadoPagoError?.message || 'Falha ao criar order'),
        updated_at: new Date().toISOString()
      }).eq('id', paymentRow.id)
      throw mercadoPagoError
    }
  } catch (error) {
    console.error('create-payment', error)
    return sendJson(res, error.statusCode || 500, { error: error.message || 'Erro interno ao gerar pagamento.' })
  }
}
