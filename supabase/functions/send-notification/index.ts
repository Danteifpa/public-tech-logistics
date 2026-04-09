import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, data, tecnico } = await req.json()
    const targetEmail = "semadvpn2025@gmail.com"

    console.log(`[send-notification] Processando notificação do tipo: ${type}`);

    // Aqui você integraria com Resend ou SMTP do Supabase
    // Por enquanto, registramos o log detalhado que será enviado
    const summary = `
      TIPO: ${type.toUpperCase()}
      REALIZADO POR: ${tecnico}
      DATA/HORA: ${new Date().toLocaleString('pt-BR')}
      DETALHES: ${JSON.stringify(data)}
    `;

    console.log(`[send-notification] Resumo para ${targetEmail}:`, summary);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("[send-notification] Erro:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})