import {
  createAdminClient,
  getMercadoPagoResource,
  parseJsonBody,
  reconcilePaymentByResource,
  sendJson,
  verifyWebhookSignature
} from '../../server/payment-service.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido.' })

  try {
    const body = parseJsonBody(req)
    const type = String(req.query?.type || body.type || '').toLowerCase()
    const dataId = String(req.query?.['data.id'] || req.query?.data_id || body.data?.id || '')
    if (!dataId) return sendJson(res, 200, { received: true, ignored: 'missing_data_id' })

    verifyWebhookSignature(req, dataId)

    const providerType = type.includes('payment') ? 'payment' : 'order'
    const resource = await getMercadoPagoResource({ type: providerType, id: dataId })
    const admin = createAdminClient()
    const result = await reconcilePaymentByResource({ admin, resource, providerType })

    return sendJson(res, 200, { received: true, ...result })
  } catch (error) {
    console.error('mercadopago-webhook', error)
    return sendJson(res, error.statusCode || 500, { error: error.message || 'Erro ao processar webhook.' })
  }
}
