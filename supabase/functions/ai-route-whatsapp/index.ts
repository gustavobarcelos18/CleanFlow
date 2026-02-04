import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteResult {
  tenant_id: string | null;
  departamento_id: string | null;
  confidence: number;
  reasoning: string;
  suggested_response?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { conversation_id, customer_phone, message, phone_number_id } = await req.json();

    console.log(`[AI-ROUTE] Processing message from ${customer_phone}: ${message.substring(0, 50)}...`);

    // Buscar histórico de contexto da conversa
    const { data: existingConversation } = await supabase
      .from('whatsapp_shared_conversations')
      .select('*, tenant:tenants(nome, id)')
      .eq('id', conversation_id)
      .single();

    // Se já identificado, retornar tenant existente
    if (existingConversation?.tenant_id && existingConversation.status === 'identified') {
      return new Response(JSON.stringify({
        tenant_id: existingConversation.tenant_id,
        departamento_id: existingConversation.departamento_id,
        confidence: 1.0,
        reasoning: 'Conversa já identificada anteriormente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar contexto de mensagens anteriores
    const { data: contextMessages } = await supabase
      .from('whatsapp_ai_context')
      .select('mensagem, direcao')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Buscar todos os tenants ativos para comparação
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, nome, whatsapp_phone_id, whatsapp_business_account_id')
      .eq('ativo', true);

    // Buscar pacientes que podem ter este telefone
    const { data: patients } = await supabase
      .from('pacientes')
      .select('id, nome, tenant_id, telefone')
      .or(`telefone.ilike.%${customer_phone.slice(-9)}%`);

    // Construir contexto para IA
    const conversationContext = contextMessages?.map(m =>
      `${m.direcao === 'incoming' ? 'Cliente' : 'Sistema'}: ${m.mensagem}`
    ).join('\n') || '';

    const tenantsInfo = tenants?.map(t =>
      `- ${t.nome} (ID: ${t.id})`
    ).join('\n') || 'Nenhum tenant encontrado';

    const patientsInfo = patients?.map(p =>
      `- Paciente: ${p.nome}, Tenant: ${p.tenant_id}`
    ).join('\n') || 'Nenhum paciente encontrado com este telefone';

    // Chamar IA para identificar
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const aiPrompt = `Você é um assistente de roteamento para o CleanFlow, um sistema de gestão de clínicas.
    
Analise a mensagem do cliente e o contexto para identificar qual clínica/empresa (tenant) o cliente está tentando contatar.

CONTEXTO DA CONVERSA:
${conversationContext}

NOVA MENSAGEM DO CLIENTE:
${message}

TELEFONE DO CLIENTE: ${customer_phone}

CLÍNICAS/EMPRESAS DISPONÍVEIS:
${tenantsInfo}

PACIENTES ENCONTRADOS COM TELEFONE SIMILAR:
${patientsInfo}

INSTRUÇÕES:
1. Analise pistas na mensagem (nome da clínica, médico, serviço específico)
2. Verifique se o telefone corresponde a algum paciente cadastrado
3. Se não houver certeza suficiente, retorne null para tenant_id

Responda APENAS com um JSON no formato:
{
  "tenant_id": "uuid-do-tenant ou null",
  "confidence": 0.0 a 1.0,
  "reasoning": "explicação da decisão",
  "suggested_response": "resposta sugerida se não identificado, perguntando qual clínica"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um assistente de roteamento inteligente. Responda apenas com JSON válido." },
          { role: "user", content: aiPrompt }
        ],
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      console.error('[AI-ROUTE] AI API error:', await aiResponse.text());
      throw new Error('Falha na API de IA');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '{}';

    console.log('[AI-ROUTE] AI response:', aiContent);

    // Parse da resposta da IA
    let result: RouteResult;
    try {
      // Limpar possíveis marcadores de código
      const cleanJson = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanJson);
    } catch (e) {
      console.error('[AI-ROUTE] Failed to parse AI response:', e);
      result = {
        tenant_id: null,
        departamento_id: null,
        confidence: 0,
        reasoning: 'Não foi possível identificar a clínica',
        suggested_response: 'Olá! Bem-vindo ao ClinFlow. Por favor, informe o nome da clínica ou consultório que você deseja contatar.'
      };
    }

    // Salvar contexto da IA
    await supabase.from('whatsapp_ai_context').insert({
      conversation_id,
      mensagem: message,
      direcao: 'incoming',
      ai_response: result
    });

    // Se identificou com confiança suficiente, atualizar conversa
    if (result.tenant_id && result.confidence >= 0.7) {
      await supabase.rpc('identify_tenant_from_context', {
        p_conversation_id: conversation_id,
        p_tenant_id: result.tenant_id,
        p_confidence: result.confidence,
        p_reasoning: result.reasoning
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI-ROUTE] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno',
      tenant_id: null,
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
