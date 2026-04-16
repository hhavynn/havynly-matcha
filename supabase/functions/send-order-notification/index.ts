interface OrderRecord {
  id: string
  customer_name: string
  menu_item_id: string
  notes: string | null
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: OrderRecord
  old_record: OrderRecord | null
  schema: string
}

const corsHeaders = {
  'Content-Type': 'application/json',
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function fetchDrinkName(
  supabaseUrl: string,
  serviceRoleKey: string,
  menuItemId: string
) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/menu_items?id=eq.${menuItemId}&select=name&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to load drink name: ${response.status}`)
  }

  const data = (await response.json()) as Array<{ name: string }>
  return data[0]?.name ?? 'Unknown drink'
}

async function sendEmail(
  resendApiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  text: string
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend request failed: ${response.status} ${errorText}`)
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const notificationEmail = Deno.env.get('ORDER_NOTIFICATION_TO_EMAIL')
  const fromEmail = Deno.env.get('ORDER_NOTIFICATION_FROM_EMAIL')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (
    !resendApiKey ||
    !notificationEmail ||
    !fromEmail ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return new Response(
      JSON.stringify({ error: 'Missing required function secrets.' }),
      { status: 500, headers: corsHeaders }
    )
  }

  let payload: WebhookPayload

  try {
    payload = (await request.json()) as WebhookPayload
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload.' }),
      { status: 400, headers: corsHeaders }
    )
  }

  if (payload.table !== 'orders' || payload.type !== 'INSERT' || !payload.record) {
    return new Response(
      JSON.stringify({ ok: true, skipped: true }),
      { status: 200, headers: corsHeaders }
    )
  }

  try {
    const order = payload.record
    const drinkName = await fetchDrinkName(
      supabaseUrl,
      serviceRoleKey,
      order.menu_item_id
    )
    const subject = `New Havynly Matcha Order from ${order.customer_name}`
    const bodyLines = [
      'A new order was placed.',
      '',
      `Customer: ${order.customer_name}`,
      `Drink: ${drinkName}`,
      `Notes: ${order.notes?.trim() || 'None'}`,
      `Placed: ${formatTimestamp(order.created_at)}`,
      `Order ID: ${order.id}`,
    ]

    await sendEmail(
      resendApiKey,
      fromEmail,
      notificationEmail,
      subject,
      bodyLines.join('\n')
    )

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('send-order-notification failed:', message)

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
