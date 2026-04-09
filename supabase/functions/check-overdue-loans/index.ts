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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("[check-overdue-loans] Iniciando verificação diária de cautelas...");

    // Busca itens emprestados há mais de 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: overdueItems, error } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('status', 'Emprestado')
      .lt('data_emprestimo', thirtyDaysAgo.toISOString());

    if (error) throw error;

    if (overdueItems && overdueItems.length > 0) {
      console.log(`[check-overdue-loans] Encontrados ${overdueItems.length} itens com prazo vencido.`);
      
      const alertMessage = overdueItems.map(item => 
        `TAG: ${item.tag} | Responsável: ${item.responsavel_nome} | Setor: ${item.local_atual} | Data Empréstimo: ${item.data_emprestimo}`
      ).join('\n');

      // Log de Alerta Crítico
      console.warn("[check-overdue-loans] ⚠️ ALERTA: Equipamento com Cautela Vencida\n" + alertMessage);
      
      // Nota: Para envio de e-mail real, você precisaria configurar o Resend ou SMTP no Supabase.
    } else {
      console.log("[check-overdue-loans] Nenhuma cautela vencida encontrada hoje.");
    }

    return new Response(JSON.stringify({ success: true, count: overdueItems?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[check-overdue-loans] Erro na execução:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})