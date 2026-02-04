-- Migration para cadastrar especialidades automaticamente por área
-- 20251207192000_seed_especialidades.sql

-- Função para cadastrar especialidades de uma área para um tenant
CREATE OR REPLACE FUNCTION seed_especialidades_por_area(
    p_tenant_id UUID,
    p_area TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Medicina
    IF p_area = 'medicina' THEN
        INSERT INTO especialidades (tenant_id, nome, codigo_cfm, ativo)
        SELECT p_tenant_id, nome, codigo, true
        FROM (VALUES
            ('Acupuntura', '001'),
            ('Alergia e Imunologia', '002'),
            ('Anestesiologia', '003'),
            ('Angiologia', '004'),
            ('Cardiologia', '005'),
            ('Cirurgia Cardiovascular', '006'),
            ('Cirurgia da Mão', '007'),
            ('Cirurgia de Cabeça e Pescoço', '008'),
            ('Cirurgia do Aparelho Digestivo', '009'),
            ('Cirurgia Geral', '010'),
            ('Cirurgia Oncológica', '011'),
            ('Cirurgia Pediátrica', '012'),
            ('Cirurgia Plástica', '013'),
            ('Cirurgia Torácica', '014'),
            ('Cirurgia Vascular', '015'),
            ('Clínica Médica', '016'),
            ('Coloproctologia', '017'),
            ('Dermatologia', '018'),
            ('Endocrinologia e Metabologia', '019'),
            ('Endoscopia', '020'),
            ('Gastroenterologia', '021'),
            ('Genética Médica', '022'),
            ('Geriatria', '023'),
            ('Ginecologia e Obstetrícia', '024'),
            ('Hematologia e Hemoterapia', '025'),
            ('Homeopatia', '026'),
            ('Infectologia', '027'),
            ('Mastologia', '028'),
            ('Medicina de Emergência', '029'),
            ('Medicina de Família e Comunidade', '030'),
            ('Medicina do Trabalho', '031'),
            ('Medicina de Tráfego', '032'),
            ('Medicina Esportiva', '033'),
            ('Medicina Física e Reabilitação', '034'),
            ('Medicina Intensiva', '035'),
            ('Medicina Legal e Perícia Médica', '036'),
            ('Medicina Nuclear', '037'),
            ('Medicina Preventiva e Social', '038'),
            ('Nefrologia', '039'),
            ('Neurocirurgia', '040'),
            ('Neurologia', '041'),
            ('Nutrologia', '042'),
            ('Oftalmologia', '043'),
            ('Oncologia Clínica', '044'),
            ('Ortopedia e Traumatologia', '045'),
            ('Otorrinolaringologia', '046'),
            ('Patologia', '047'),
            ('Patologia Clínica/Medicina Laboratorial', '048'),
            ('Pediatria', '049'),
            ('Pneumologia', '050'),
            ('Psiquiatria', '051'),
            ('Radiologia e Diagnóstico por Imagem', '052'),
            ('Radioterapia', '053'),
            ('Reumatologia', '054'),
            ('Urologia', '055')
        ) AS especialidades(nome, codigo)
        ON CONFLICT DO NOTHING;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Odontologia
    ELSIF p_area = 'odontologia' THEN
        INSERT INTO especialidades (tenant_id, nome, codigo_cfm, ativo)
        SELECT p_tenant_id, nome, codigo, true
        FROM (VALUES
            ('Cirurgia e Traumatologia Bucomaxilofacial', 'O01'),
            ('Dentística', 'O02'),
            ('Disfunção Temporomandibular e Dor Orofacial', 'O03'),
            ('Endodontia', 'O04'),
            ('Estomatologia', 'O05'),
            ('Harmonização Orofacial', 'O06'),
            ('Implantodontia', 'O07'),
            ('Odontologia do Trabalho', 'O08'),
            ('Odontologia para Pacientes com Necessidades Especiais', 'O09'),
            ('Odontogeriatria', 'O10'),
            ('Odontopediatria', 'O11'),
            ('Ortodontia', 'O12'),
            ('Ortopedia Funcional dos Maxilares', 'O13'),
            ('Patologia Oral e Maxilofacial', 'O14'),
            ('Periodontia', 'O15'),
            ('Prótese Bucomaxilofacial', 'O16'),
            ('Prótese Dentária', 'O17'),
            ('Radiologia Odontológica e Imaginologia', 'O18'),
            ('Saúde Coletiva', 'O19')
        ) AS especialidades(nome, codigo)
        ON CONFLICT DO NOTHING;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Direito
    ELSIF p_area = 'direito' THEN
        INSERT INTO especialidades (tenant_id, nome, codigo_cfm, ativo)
        SELECT p_tenant_id, nome, codigo, true
        FROM (VALUES
            ('Direito Civil', 'D01'),
            ('Direito Penal', 'D02'),
            ('Direito do Trabalho', 'D03'),
            ('Direito Tributário', 'D04'),
            ('Direito Empresarial', 'D05'),
            ('Direito Administrativo', 'D06'),
            ('Direito Constitucional', 'D07'),
            ('Direito do Consumidor', 'D08'),
            ('Direito Ambiental', 'D09'),
            ('Direito Previdenciário', 'D10'),
            ('Direito de Família', 'D11'),
            ('Direito Imobiliário', 'D12'),
            ('Direito Digital', 'D13'),
            ('Direito Eleitoral', 'D14'),
            ('Direito Internacional', 'D15'),
            ('Direito Bancário', 'D16'),
            ('Direito Contratual', 'D17'),
            ('Direito Sucessório', 'D18')
        ) AS especialidades(nome, codigo)
        ON CONFLICT DO NOTHING;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Psicologia
    ELSIF p_area = 'psicologia' THEN
        INSERT INTO especialidades (tenant_id, nome, codigo_cfm, ativo)
        SELECT p_tenant_id, nome, codigo, true
        FROM (VALUES
            ('Psicologia Clínica', 'P01'),
            ('Psicologia Organizacional', 'P02'),
            ('Psicologia Escolar', 'P03'),
            ('Psicologia Social', 'P04'),
            ('Neuropsicologia', 'P05'),
            ('Psicologia do Esporte', 'P06'),
            ('Psicologia Jurídica', 'P07'),
            ('Psicologia Hospitalar', 'P08'),
            ('Psicopedagogia', 'P09'),
            ('Terapia Cognitivo-Comportamental', 'P10'),
            ('Psicanálise', 'P11'),
            ('Terapia Familiar', 'P12')
        ) AS especialidades(nome, codigo)
        ON CONFLICT DO NOTHING;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Estética
    ELSIF p_area = 'estetica' THEN
        INSERT INTO especialidades (tenant_id, nome, codigo_cfm, ativo)
        SELECT p_tenant_id, nome, codigo, true
        FROM (VALUES
            ('Estética Facial', 'E01'),
            ('Estética Corporal', 'E02'),
            ('Depilação', 'E03'),
            ('Micropigmentação', 'E04'),
            ('Design de Sobrancelhas', 'E05'),
            ('Massoterapia', 'E06'),
            ('Drenagem Linfática', 'E07'),
            ('Peeling', 'E08'),
            ('Limpeza de Pele', 'E09'),
            ('Tratamento Capilar', 'E10')
        ) AS especialidades(nome, codigo)
        ON CONFLICT DO NOTHING;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION seed_especialidades_por_area IS 'Cadastra automaticamente especialidades de uma área para um tenant';
