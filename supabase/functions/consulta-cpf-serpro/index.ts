import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  cpf: string;
}

serve(async (req) => {
  // 1. Manuseio de CORS (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Validação de Autenticação (Apenas usuários logados podem consultar)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Cabeçalho de autorização ausente");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Não autorizado");

    // 3. Extração do CPF do corpo da requisição
    const { cpf } = (await req.json()) as RequestBody;
    if (!cpf) throw new Error("CPF é obrigatório");

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) throw new Error("CPF deve ter 11 dígitos");

    // 4. Configurações SERPRO (Secrets)
    const CLIENT_ID = Deno.env.get("SERPRO_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("SERPRO_CLIENT_SECRET");
    const AUTHORIZED_CPF = Deno.env.get("SERPRO_AUTHORIZED_CPF");

    if (!CLIENT_ID || !CLIENT_SECRET || !AUTHORIZED_CPF) {
      console.error("Configurações SERPRO ausentes no servidor");
      throw new Error("Serviço de consulta não configurado no servidor");
    }

    // 5. Obter Token OAuth2 do SERPRO
    console.log("Obtendo token SERPRO...");
    const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const tokenResponse = await fetch(
      "https://apigateway.conectagov.estaleiro.serpro.gov.br/oauth2/jwt-token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Erro ao obter token SERPRO:", errorText);
      throw new Error("Falha na autenticação com o provedor de dados");
    }

    const { access_token } = await tokenResponse.json();

    // 6. Consultar CPF no SERPRO (CPF Light / Dados Cadastrais)
    console.log(`Consultando CPF ${cleanCpf}...`);
    const consultaResponse = await fetch(
      "https://apigateway.conectagov.estaleiro.serpro.gov.br/api-cpf-light/v2/consulta/cpf",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "x-cpf-usuario": AUTHORIZED_CPF,
        },
        body: JSON.stringify({
          listaCpf: [cleanCpf],
        }),
      },
    );

    const result = await consultaResponse.json();

    if (!consultaResponse.ok) {
      console.error("Erro na consulta SERPRO:", result);
      throw new Error(
        result.error?.message || "Erro ao consultar CPF na Receita Federal",
      );
    }

    // O retorno do SERPRO é uma lista (pois enviamos listaCpf)
    const dadosPessoa = result[0];

    if (!dadosPessoa || dadosPessoa.codigoErro) {
      throw new Error(
        dadosPessoa?.mensagemErro || "CPF não encontrado ou erro na consulta",
      );
    }

    // 7. Retornar dados formatados para o frontend
    // O SERPRO retorna AAAAMMDD para dataNascimento e Nome em Maiúsculo
    return new Response(
      JSON.stringify({
        sucesso: true,
        dados: {
          nome: dadosPessoa.nome,
          dataNascimento: dadosPessoa.dataNascimento, // Formato AAAAMMDD
          situacao:
            dadosPessoa.situacao?.descricao ||
            dadosPessoa.descSituacaoCadastral,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Erro na Edge Function consulta-cpf-serpro:", error);
    return new Response(
      JSON.stringify({
        sucesso: false,
        erro: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
