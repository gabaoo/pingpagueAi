import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendWhatsAppMessage(phone: string, message: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  const evolutionInstanceId = Deno.env.get('EVOLUTION_INSTANCE_ID');

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) {
    console.error('Evolution API credentials not configured');
    throw new Error('Evolution API credentials not configured');
  }

  // Clean phone number (remove non-numeric characters)
  const cleanPhone = phone.replace(/\D/g, '');

  const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionApiKey,
    },
    body: JSON.stringify({
      number: `55${cleanPhone}`,
      text: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send WhatsApp message:', errorText);
    throw new Error(`Failed to send WhatsApp message: ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { charge_id, notification_type } = await req.json();
    console.log('Processing notification:', { charge_id, notification_type });

    // Get charge details
    const { data: charge, error: chargeError } = await supabase
      .from('charges')
      .select(`
        *,
        clients (
          name,
          phone
        )
      `)
      .eq('id', charge_id)
      .single();

    if (chargeError || !charge) {
      throw new Error(`Charge not found: ${chargeError?.message}`);
    }

    // Get user profile with PIX key
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, pix_key')
      .eq('id', charge.user_id)
      .single();

    const userName = profile?.full_name || 'o(a) prestador(a)';
    const pixKey = profile?.pix_key || '';
    const clientName = charge.clients.name.split(' ')[0]; // First name
    const amount = charge.amount.toFixed(2).replace('.', ',');

    let message = '';
    let notificationType = '';

    if (notification_type === 'reception') {
      // New charge created message
      message = `Olá, aqui é da PingPague, plataforma responsável por automatizar as cobranças do(a) ${userName}. Foi registrada uma cobrança no valor de R$ ${amount} em seu nome. Fique tranquilo(a), próximo à data de vencimento lhe enviaremos um lembrete automático.`;
      notificationType = 'reception';
    } else if (notification_type === 'overdue') {
      // Overdue charge message
      const dueDate = new Date(charge.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      message = `Olá ${clientName}! Sua cobrança de R$ ${amount} está vencida desde ${dueDate}. Por favor, regularize seu pagamento.`;
      if (pixKey) {
        message += ` Chave PIX para pagamento: ${pixKey}`;
      }
      notificationType = 'overdue';
    }

    // Send WhatsApp message
    let status = 'sent';
    try {
      await sendWhatsAppMessage(charge.clients.phone, message);
      console.log('WhatsApp message sent successfully');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      status = 'failed';
    }

    // Register notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: charge.user_id,
        client_id: charge.client_id,
        charge_id: charge.id,
        notification_type: notificationType,
        channel: 'whatsapp',
        status: status,
        message_content: message,
      });

    if (notificationError) {
      console.error('Error saving notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        status: status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
