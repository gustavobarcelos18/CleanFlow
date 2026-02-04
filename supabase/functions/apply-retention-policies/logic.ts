import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function applyPolicies(supabase: SupabaseClient, logger: any) {
    await logger.info('Iniciando aplicação de políticas de retenção', 'retention', {});

    // Buscar políticas ativas
    const { data: policies, error: policiesError } = await supabase
        .from('retention_policies_detailed')
        .select('*')
        .eq('active', true);

    if (policiesError) throw policiesError;

    const results = [];

    for (const policy of policies || []) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - policy.retention_months);

        let deletedCount = 0;

        try {
            switch (policy.target_table) {
                case 'log_mensagens': {
                    const { count, error: deleteError } = await supabase
                        .from('log_mensagens')
                        .delete({ count: 'exact' })
                        .lt('created_at', cutoffDate.toISOString())
                        .in('status', policy.apply_to_status || ['enviado', 'falhou']);

                    if (deleteError) throw deleteError;
                    if (count !== null) deletedCount = count;
                    break;
                }

                case 'message_audit': {
                    const { count, error: deleteError } = await supabase
                        .from('message_audit')
                        .delete({ count: 'exact' })
                        .lt('timestamp', cutoffDate.toISOString());

                    if (deleteError) throw deleteError;
                    if (count !== null) deletedCount = count;
                    break;
                }

                case 'system_logs': {
                    const { count, error: deleteError } = await supabase
                        .from('system_logs')
                        .delete({ count: 'exact' })
                        .lt('created_at', cutoffDate.toISOString())
                        .not('level', 'in', '(error,critical)');

                    if (deleteError) throw deleteError;
                    if (count !== null) deletedCount = count;
                    break;
                }

                case 'auditoria_admin': {
                    const { count, error: deleteError } = await supabase
                        .from('auditoria_admin')
                        .delete({ count: 'exact' })
                        .lt('created_at', cutoffDate.toISOString());

                    if (deleteError) throw deleteError;
                    if (count !== null) deletedCount = count;
                    break;
                }
            }

            // Atualizar última aplicação
            await supabase
                .from('retention_policies_detailed')
                .update({ last_applied_at: new Date().toISOString() })
                .eq('id', policy.id);

            results.push({
                policy: policy.policy_name,
                table: policy.target_table,
                deleted: deletedCount,
                cutoff_date: cutoffDate.toISOString()
            });

            await logger.info(
                `Política aplicada: ${policy.policy_name}`,
                'retention',
                { policy_id: policy.id, deleted: deletedCount }
            );
        } catch (error) {
            await logger.error(
                `Erro ao aplicar política ${policy.policy_name}`,
                'retention',
                { error, policy_id: policy.id }
            );

            results.push({
                policy: policy.policy_name,
                table: policy.target_table,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }

    // 2. Aplicar configurações por Tenant
    const { data: tenantSettings, error: settingsError } = await supabase
        .from('tenant_retention_settings')
        .select('*');

    if (!settingsError && tenantSettings) {
        for (const setting of tenantSettings) {
            try {
                // Logs do Sistema
                if (setting.retencao_logs_dias) {
                    const cutoffLogs = new Date();
                    cutoffLogs.setDate(cutoffLogs.getDate() - setting.retencao_logs_dias);

                    const { count: countSys, error: errSys } = await supabase
                        .from('system_logs')
                        .delete({ count: 'exact' })
                        .eq('tenant_id', setting.tenant_id)
                        .lt('created_at', cutoffLogs.toISOString());

                    if (!errSys && countSys !== null) {
                        results.push({ tenant: setting.tenant_id, table: 'system_logs', deleted: countSys, type: 'tenant' });
                    }
                }

                // Mensagens
                if (setting.retencao_mensagens_dias) {
                    const cutoffMsgs = new Date();
                    cutoffMsgs.setDate(cutoffMsgs.getDate() - setting.retencao_mensagens_dias);

                    const { count: countMsgs, error: errMsgs } = await supabase
                        .from('log_mensagens')
                        .delete({ count: 'exact' })
                        .eq('tenant_id', setting.tenant_id)
                        .lt('created_at', cutoffMsgs.toISOString());

                    if (!errMsgs && countMsgs !== null) {
                        results.push({ tenant: setting.tenant_id, table: 'log_mensagens', deleted: countMsgs, type: 'tenant' });
                    }
                }

            } catch (err) {
                await logger.error(`Erro retention tenant ${setting.tenant_id}`, 'retention', { error: err });
            }
        }
    }

    return results;
}
