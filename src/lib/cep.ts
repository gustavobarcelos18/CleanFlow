export interface AddressData {
    logradouro: string;
    bairro: string;
    localidade: string; // cidade
    uf: string;
    erro?: boolean;
}

export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (data.erro) return null;
        return data;
    } catch (error) {
        console.error("Error fetching CEP:", error);
        return null;
    }
}
