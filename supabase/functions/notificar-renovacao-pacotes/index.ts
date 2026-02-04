import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PacoteExpirando {
  paciente_pacote_id: string;
  paciente_id: string;
  tenant_id: string;
  paciente_nome: string;
  paciente_email: string | null;
  paciente_telefone: string;
  pacote_nome: string;
  sessoes_restantes: number;
  dias_para_expirar: number;
  renovacao_automatica: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Iniciando verificação de pacotes expirando...");

    // Buscar pacotes que estão expirando
    const { data: pacotesExpirando, error: queryError } = await supabaseClient
      .rpc('verificar_pacotes_expirando');

    if (queryError) {
      console.error("Erro ao buscar pacotes expirando:", queryError);
      throw queryError;
    }

    console.log(`Encontrados ${pacotesExpirando?.length || 0} pacotes para notificar`);

    const notificacoesEnviadas = [];
    const erros = [];

    for (const pacote of (pacotesExpirando as PacoteExpirando[]) || []) {
      try {
        let mensagem = "";

        if (pacote.renovacao_automatica) {
          mensagem = `🔄 *Renovação Automática*\n\n` +
            `Olá ${pacote.paciente_nome}!\n\n` +
            `Seu pacote "${pacote.pacote_nome}" será renovado automaticamente em ${pacote.dias_para_expirar} dias.\n\n` +
            `📋 *Detalhes:*\n` +
            `• Sessões restantes: ${pacote.sessoes_restantes}\n` +
            `• Dias para renovação: ${pacote.dias_para_expirar}\n\n` +
            `Gostaria de agendar uma sessão? Responda SIM e entraremos em contato!`;
        } else {
          mensagem = `⏰ *Pacote Expirando*\n\n` +
            `Olá ${pacote.paciente_nome}!\n\n` +
            `Seu pacote "${pacote.pacote_nome}" expira em ${pacote.dias_para_expirar} dias.\n\n` +
            `📋 *Detalhes:*\n` +
            `• Sessões restantes: ${pacote.sessoes_restantes}\n` +
            `• Dias para expiração: ${pacote.dias_para_expirar}\n\n` +
            `Deseja renovar seu pacote? Entre em contato conosco!\n` +
            `Ou responda SIM para agendar uma das sessões restantes.`;
        }

        // Log da mensagem que seria enviada
        console.log(`Notificação para ${pacote.paciente_nome}: ${mensagem.substring(0, 100)}...`);

        // Enviar via WhatsApp
        await supabaseClient.functions.invoke('enviar-whatsapp', {
          body: {
            to: pacote.paciente_telefone,
            message: mensagem,
            tipo: 'text',
            tenant_id: pacote.tenant_id
          }
        });

        // Registrar no log_mensagens (opcional, pois enviar-whatsapp já deve logar, mas mantendo para consistência se necessário)
        // Se enviar-whatsapp já loga, podemos remover isso ou manter como backup/controle local da function
        // Vou manter o insert manual por enquanto para garantir que o fluxo original seja preservado, 
        // mas idealmente enviar-whatsapp deveria cuidar disso.
        const { error: logError } = await supabaseClient
          .from('log_mensagens')
          .insert({
            paciente_id: pacote.paciente_id,
            tenant_id: pacote.tenant_id,
            destinatario: pacote.paciente_telefone,
            canal: 'whatsapp',
            template_usado: 'renovacao_pacote',
            status: 'enviado' // Assumindo enviado pois chamamos a function
          });

        if (logError) {
          console.error(`Erro ao registrar log para ${pacote.paciente_nome}:`, logError);
          erros.push({ paciente: pacote.paciente_nome, erro: logError.message });
          continue;
        }

        // Atualizar paciente_pacote para marcar notificação enviada
        const { error: updateError } = await supabaseClient
          .from('pacientes_pacotes')
          .update({
            notificacao_renovacao_enviada: true,
            ultima_notificacao: new Date().toISOString()
          })
          .eq('id', pacote.paciente_pacote_id);

        if (updateError) {
          console.error(`Erro ao atualizar paciente_pacote ${pacote.paciente_pacote_id}:`, updateError);
          erros.push({ paciente: pacote.paciente_nome, erro: updateError.message });
          continue;
        }

        notificacoesEnviadas.push({
          paciente: pacote.paciente_nome,
          pacote: pacote.pacote_nome,
          dias_restantes: pacote.dias_para_expirar
        });

      } catch (error) {
        console.error(`Erro ao processar pacote de ${pacote.paciente_nome}:`, error);
        erros.push({
          paciente: pacote.paciente_nome,
          erro: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const resultado = {
      sucesso: true,
      total_verificados: pacotesExpirando?.length || 0,
      notificacoes_enviadas: notificacoesEnviadas.length,
      detalhes: notificacoesEnviadas,
      erros: erros.length > 0 ? erros : undefined
    };

    console.log("Resultado final:", resultado);

    return new Response(
      JSON.stringify(resultado),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro geral na função:", error);
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});