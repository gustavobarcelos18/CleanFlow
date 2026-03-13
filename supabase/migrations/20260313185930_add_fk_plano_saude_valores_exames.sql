ALTER TABLE "public"."plano_saude_valores"
ADD CONSTRAINT "plano_saude_valores_exame_procedimento_id_fkey"
FOREIGN KEY ("exame_procedimento_id") REFERENCES "public"."exames"("id") ON DELETE SET NULL;
