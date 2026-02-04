import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Shield, Lock, Eye, FileText } from "lucide-react";
const Privacy = () => {
  return <div className="min-h-screen bg-background">
    <LandingHeader />

    <main className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-success/10">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Política de Privacidade
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Seus dados e dos seus pacientes são protegidos com os mais altos padrões de segurança.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none">
            {/* LGPD Compliance */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground m-0">
                  Conformidade com a LGPD
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                O CleanFlow está em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                Tratamos dados pessoais de forma transparente, segura e respeitando todos os direitos dos titulares.
              </p>
            </div>

            {/* Data Collection */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground m-0">
                  Dados Coletados
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Coletamos apenas os dados necessários para o funcionamento do sistema:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Dados de cadastro: nome, e-mail, telefone</li>
                <li>Dados de pacientes: informações necessárias para agendamento</li>
                <li>Dados de uso: logs de acesso e atividades no sistema</li>
                <li>Dados de pagamento: processados por meio do Stripe (não armazenamos dados de cartão)</li>
              </ul>
            </div>

            {/* Data Usage */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground m-0">
                  Como Usamos Seus Dados
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Seus dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Enviar confirmações e lembretes de consultas</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Comunicar atualizações importantes do sistema</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground m-0">
                  Segurança dos Dados
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Criptografia de dados em trânsito (SSL/TLS)</li>
                <li>Criptografia de dados em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Backups regulares e seguros</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Proteção contra senhas vazadas</li>
              </ul>
            </div>

            {/* User Rights */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Seus Direitos
              </h2>
              <p className="text-muted-foreground mb-4">
                Conforme a LGPD, você tem direito a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                <li>Solicitar a portabilidade de dados</li>
                <li>Revogar o consentimento</li>
              </ul>
            </div>

            {/* Cookies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Cookies
              </h2>
              <p className="text-muted-foreground mb-4">Utilizamos cookies para melhorar sua experiência. Você pode gerenciar sua preferência sobre cookies através do banner exibido na primeira visita ao site.</p>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Retenção de Dados
              </h2>
              <p className="text-muted-foreground mb-4">
                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta política,
                exceto quando um período maior for exigido por lei.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Contato
              </h2>
              <p className="text-muted-foreground mb-4">
                Para exercer seus direitos ou tirar dúvidas sobre nossa política de privacidade,
                entre em contato conosco através da página de contato ou pelo e-mail:
                <a href="mailto:privacidade@cleanflow.com.br" className="text-primary hover:underline ml-1">
                  privacidade@cleanflow.com.br
                </a>
              </p>
            </div>

            {/* Updates */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Atualizações
              </h2>
              <p className="text-muted-foreground">
                Esta política pode ser atualizada periodicamente. A versão mais recente estará sempre
                disponível nesta página.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Última atualização: 01 de outubro de 2025
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <LandingFooter />
  </div>;
};
export default Privacy;