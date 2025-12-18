import { GoogleGenAI, Type } from "@google/genai";
import { BusinessContact, SearchParams } from "../types";

const parseJSONResponse = (text: string): BusinessContact[] => {
  try {
    const jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/);
    
    if (jsonMatch) {
      let jsonStr = (jsonMatch[1] || jsonMatch[0]).trim();
      // Limpeza de caracteres que costumam quebrar o JSON em LLMs
      jsonStr = jsonStr.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
      
      const parsed = JSON.parse(jsonStr);
      
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          nome: item.nome || item.name || "Empresa sem nome",
          telefone: item.telefone || "Não disponível",
          whatsapp: !!item.whatsapp,
          email: item.email || "Não disponível",
          website: item.website || "Não disponível",
          instagram: item.instagram || "Não disponível",
          facebook: item.facebook || "Não disponível",
          linkedin: item.linkedin || "Não disponível",
          endereco: item.endereco || "Não disponível",
          link_maps: item.link_maps || "Não disponível",
          rating: typeof item.rating === 'number' ? item.rating : 0,
          reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
          web_summary: item.web_summary || ""
        }));
      }
    }
    return [];
  } catch (e) {
    console.error("Erro ao processar resposta do Gemini:", e);
    return [];
  }
};

export const searchBusinesses = async (params: SearchParams): Promise<BusinessContact[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key não configurada no ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // gemini-2.5-flash-preview é necessário para ferramentas de Google Maps Grounding
  const modelName = 'gemini-2.5-flash-preview'; 

  const excludeNames = params.excludeNames?.length 
    ? `Não inclua estas empresas: ${params.excludeNames.join(', ')}.` 
    : '';

  const prompt = `
    Aja como um Agente de Prospecção Especialista.
    OBJETIVO: Encontrar leads B2B reais para o nicho "${params.niche}" em "${params.location}".
    RAIO ESTIMADO: ${params.radius || '5km'}.
    ${excludeNames}

    INSTRUÇÕES:
    1. Use a ferramenta 'googleMaps' para pesquisar estabelecimentos reais.
    2. Use a ferramenta 'googleSearch' para enriquecer os dados (emails, redes sociais) se não estiverem no Maps.
    3. Retorne OBRIGATORIAMENTE um array JSON com os campos: nome, telefone, whatsapp (booleano), email, website, instagram, facebook, linkedin, endereco, link_maps, rating, reviewCount.
    
    Formate como um bloco de código JSON: \`\`\`json [ ... ] \`\`\`
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      temperature: 0.1, // Temperatura baixa para maior precisão nos dados
    },
  });

  return parseJSONResponse(response.text || "");
};