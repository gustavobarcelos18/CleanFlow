// Serviço para buscar códigos CFM de especialidades médicas

interface EspecialidadeCFM {
    codigo: string;
    nome: string;
    area: string;
}

// Base de dados de especialidades médicas com códigos CFM
export const especialidadesMedicas: EspecialidadeCFM[] = [
    { codigo: "001", nome: "Acupuntura", area: "medicina" },
    { codigo: "002", nome: "Alergia e Imunologia", area: "medicina" },
    { codigo: "003", nome: "Anestesiologia", area: "medicina" },
    { codigo: "004", nome: "Angiologia", area: "medicina" },
    { codigo: "005", nome: "Cardiologia", area: "medicina" },
    { codigo: "006", nome: "Cirurgia Cardiovascular", area: "medicina" },
    { codigo: "007", nome: "Cirurgia da Mão", area: "medicina" },
    { codigo: "008", nome: "Cirurgia de Cabeça e Pescoço", area: "medicina" },
    { codigo: "009", nome: "Cirurgia do Aparelho Digestivo", area: "medicina" },
    { codigo: "010", nome: "Cirurgia Geral", area: "medicina" },
    { codigo: "011", nome: "Cirurgia Oncológica", area: "medicina" },
    { codigo: "012", nome: "Cirurgia Pediátrica", area: "medicina" },
    { codigo: "013", nome: "Cirurgia Plástica", area: "medicina" },
    { codigo: "014", nome: "Cirurgia Torácica", area: "medicina" },
    { codigo: "015", nome: "Cirurgia Vascular", area: "medicina" },
    { codigo: "016", nome: "Clínica Médica", area: "medicina" },
    { codigo: "017", nome: "Coloproctologia", area: "medicina" },
    { codigo: "018", nome: "Dermatologia", area: "medicina" },
    { codigo: "019", nome: "Endocrinologia e Metabologia", area: "medicina" },
    { codigo: "020", nome: "Endoscopia", area: "medicina" },
    { codigo: "021", nome: "Gastroenterologia", area: "medicina" },
    { codigo: "022", nome: "Genética Médica", area: "medicina" },
    { codigo: "023", nome: "Geriatria", area: "medicina" },
    { codigo: "024", nome: "Ginecologia e Obstetrícia", area: "medicina" },
    { codigo: "025", nome: "Hematologia e Hemoterapia", area: "medicina" },
    { codigo: "026", nome: "Homeopatia", area: "medicina" },
    { codigo: "027", nome: "Infectologia", area: "medicina" },
    { codigo: "028", nome: "Mastologia", area: "medicina" },
    { codigo: "029", nome: "Medicina de Emergência", area: "medicina" },
    { codigo: "030", nome: "Medicina de Família e Comunidade", area: "medicina" },
    { codigo: "031", nome: "Medicina do Trabalho", area: "medicina" },
    { codigo: "032", nome: "Medicina de Tráfego", area: "medicina" },
    { codigo: "033", nome: "Medicina Esportiva", area: "medicina" },
    { codigo: "034", nome: "Medicina Física e Reabilitação", area: "medicina" },
    { codigo: "035", nome: "Medicina Intensiva", area: "medicina" },
    { codigo: "036", nome: "Medicina Legal e Perícia Médica", area: "medicina" },
    { codigo: "037", nome: "Medicina Nuclear", area: "medicina" },
    { codigo: "038", nome: "Medicina Preventiva e Social", area: "medicina" },
    { codigo: "039", nome: "Nefrologia", area: "medicina" },
    { codigo: "040", nome: "Neurocirurgia", area: "medicina" },
    { codigo: "041", nome: "Neurologia", area: "medicina" },
    { codigo: "042", nome: "Nutrologia", area: "medicina" },
    { codigo: "043", nome: "Oftalmologia", area: "medicina" },
    { codigo: "044", nome: "Oncologia Clínica", area: "medicina" },
    { codigo: "045", nome: "Ortopedia e Traumatologia", area: "medicina" },
    { codigo: "046", nome: "Otorrinolaringologia", area: "medicina" },
    { codigo: "047", nome: "Patologia", area: "medicina" },
    { codigo: "048", nome: "Patologia Clínica/Medicina Laboratorial", area: "medicina" },
    { codigo: "049", nome: "Pediatria", area: "medicina" },
    { codigo: "050", nome: "Pneumologia", area: "medicina" },
    { codigo: "051", nome: "Psiquiatria", area: "medicina" },
    { codigo: "052", nome: "Radiologia e Diagnóstico por Imagem", area: "medicina" },
    { codigo: "053", nome: "Radioterapia", area: "medicina" },
    { codigo: "054", nome: "Reumatologia", area: "medicina" },
    { codigo: "055", nome: "Urologia", area: "medicina" },
];

// Especialidades de Odontologia
export const especialidadesOdontologia: EspecialidadeCFM[] = [
    { codigo: "O01", nome: "Cirurgia e Traumatologia Bucomaxilofacial", area: "odontologia" },
    { codigo: "O02", nome: "Dentística", area: "odontologia" },
    { codigo: "O03", nome: "Disfunção Temporomandibular e Dor Orofacial", area: "odontologia" },
    { codigo: "O04", nome: "Endodontia", area: "odontologia" },
    { codigo: "O05", nome: "Estomatologia", area: "odontologia" },
    { codigo: "O06", nome: "Harmonização Orofacial", area: "odontologia" },
    { codigo: "O07", nome: "Implantodontia", area: "odontologia" },
    { codigo: "O08", nome: "Odontologia do Trabalho", area: "odontologia" },
    { codigo: "O09", nome: "Odontologia para Pacientes com Necessidades Especiais", area: "odontologia" },
    { codigo: "O10", nome: "Odontogeriatria", area: "odontologia" },
    { codigo: "O11", nome: "Odontopediatria", area: "odontologia" },
    { codigo: "O12", nome: "Ortodontia", area: "odontologia" },
    { codigo: "O13", nome: "Ortopedia Funcional dos Maxilares", area: "odontologia" },
    { codigo: "O14", nome: "Patologia Oral e Maxilofacial", area: "odontologia" },
    { codigo: "O15", nome: "Periodontia", area: "odontologia" },
    { codigo: "O16", nome: "Prótese Bucomaxilofacial", area: "odontologia" },
    { codigo: "O17", nome: "Prótese Dentária", area: "odontologia" },
    { codigo: "O18", nome: "Radiologia Odontológica e Imaginologia", area: "odontologia" },
    { codigo: "O19", nome: "Saúde Coletiva", area: "odontologia" },
];

// Áreas do Direito
export const areasDireito: EspecialidadeCFM[] = [
    { codigo: "D01", nome: "Direito Civil", area: "direito" },
    { codigo: "D02", nome: "Direito Penal", area: "direito" },
    { codigo: "D03", nome: "Direito do Trabalho", area: "direito" },
    { codigo: "D04", nome: "Direito Tributário", area: "direito" },
    { codigo: "D05", nome: "Direito Empresarial", area: "direito" },
    { codigo: "D06", nome: "Direito Administrativo", area: "direito" },
    { codigo: "D07", nome: "Direito Constitucional", area: "direito" },
    { codigo: "D08", nome: "Direito do Consumidor", area: "direito" },
    { codigo: "D09", nome: "Direito Ambiental", area: "direito" },
    { codigo: "D10", nome: "Direito Previdenciário", area: "direito" },
    { codigo: "D11", nome: "Direito de Família", area: "direito" },
    { codigo: "D12", nome: "Direito Imobiliário", area: "direito" },
    { codigo: "D13", nome: "Direito Digital", area: "direito" },
    { codigo: "D14", nome: "Direito Eleitoral", area: "direito" },
    { codigo: "D15", nome: "Direito Internacional", area: "direito" },
    { codigo: "D16", nome: "Direito Bancário", area: "direito" },
    { codigo: "D17", nome: "Direito Contratual", area: "direito" },
    { codigo: "D18", nome: "Direito Sucessório", area: "direito" },
];

// Áreas de Psicologia
export const areasPsicologia: EspecialidadeCFM[] = [
    { codigo: "P01", nome: "Psicologia Clínica", area: "psicologia" },
    { codigo: "P02", nome: "Psicologia Organizacional", area: "psicologia" },
    { codigo: "P03", nome: "Psicologia Escolar", area: "psicologia" },
    { codigo: "P04", nome: "Psicologia Social", area: "psicologia" },
    { codigo: "P05", nome: "Neuropsicologia", area: "psicologia" },
    { codigo: "P06", nome: "Psicologia do Esporte", area: "psicologia" },
    { codigo: "P07", nome: "Psicologia Jurídica", area: "psicologia" },
    { codigo: "P08", nome: "Psicologia Hospitalar", area: "psicologia" },
    { codigo: "P09", nome: "Psicopedagogia", area: "psicologia" },
    { codigo: "P10", nome: "Terapia Cognitivo-Comportamental", area: "psicologia" },
    { codigo: "P11", nome: "Psicanálise", area: "psicologia" },
    { codigo: "P12", nome: "Terapia Familiar", area: "psicologia" },
];

// Áreas de Estética
export const areasEstetica: EspecialidadeCFM[] = [
    { codigo: "E01", nome: "Estética Facial", area: "estetica" },
    { codigo: "E02", nome: "Estética Corporal", area: "estetica" },
    { codigo: "E03", nome: "Depilação", area: "estetica" },
    { codigo: "E04", nome: "Micropigmentação", area: "estetica" },
    { codigo: "E05", nome: "Design de Sobrancelhas", area: "estetica" },
    { codigo: "E06", nome: "Massoterapia", area: "estetica" },
    { codigo: "E07", nome: "Drenagem Linfática", area: "estetica" },
    { codigo: "E08", nome: "Peeling", area: "estetica" },
    { codigo: "E09", nome: "Limpeza de Pele", area: "estetica" },
    { codigo: "E10", nome: "Tratamento Capilar", area: "estetica" },
];

export class EspecialidadeService {
    /**
     * Busca código CFM por nome de especialidade
     */
    static buscarCodigoCFM(nomeEspecialidade: string): string | null {
        const nome = nomeEspecialidade.toLowerCase().trim();

        // Buscar em todas as bases
        const todasEspecialidades = [
            ...especialidadesMedicas,
            ...especialidadesOdontologia,
            ...areasDireito,
            ...areasPsicologia,
            ...areasEstetica
        ];

        const encontrada = todasEspecialidades.find(esp =>
            esp.nome.toLowerCase().includes(nome) ||
            nome.includes(esp.nome.toLowerCase())
        );

        return encontrada?.codigo || null;
    }

    /**
     * Busca especialidades por área
     */
    static buscarPorArea(area: string): EspecialidadeCFM[] {
        switch (area.toLowerCase()) {
            case 'medicina':
                return especialidadesMedicas;
            case 'odontologia':
                return especialidadesOdontologia;
            case 'direito':
                return areasDireito;
            case 'psicologia':
                return areasPsicologia;
            case 'estetica':
                return areasEstetica;
            default:
                return [];
        }
    }

    /**
     * Busca sugestões de especialidades
     */
    static buscarSugestoes(termo: string, area?: string): EspecialidadeCFM[] {
        const termoLower = termo.toLowerCase();

        const especialidades = area
            ? this.buscarPorArea(area)
            : [
                ...especialidadesMedicas,
                ...especialidadesOdontologia,
                ...areasDireito,
                ...areasPsicologia,
                ...areasEstetica
            ];

        return especialidades.filter(esp =>
            esp.nome.toLowerCase().includes(termoLower)
        ).slice(0, 10);
    }

    /**
     * Retorna todas as especialidades de uma área
     */
    static obterTodasEspecialidades(area: string): EspecialidadeCFM[] {
        return this.buscarPorArea(area);
    }
}
