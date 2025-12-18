import { GoogleGenAI } from "@google/genai";
import { BusinessContact, SearchParams } from "../types";

const parseJSONResponse = (text: string): BusinessContact[] => {
  try {
    const jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/);
    
    if (jsonMatch) {
      const jsonStr = (jsonMatch[1] || jsonMatch[0]).trim();
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

export const searchBusinesses = async (params: SearchParams, latLng?: { latitude: number; longitude: number }): Promise<BusinessContact[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key ausente.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  const excludeStr = params.excludeNames?.length 
    ? `Não inclua estas empresas no resultado final: ${params.excludeNames.join(', ')}.` 
    : '';

  const prompt = `
    Aja como um Robô de Prospecção Avançado.
    Sua missão é localizar contatos públicos de empresas para o nicho "${params.niche}" próximo a "${params.location}".
    Raio de busca: ${params.radius || '5km'}.
    ${excludeStr}

    INSTRUÇÕES:
    1. Use a ferramenta 'googleMaps' para obter dados reais de localização, telefone e avaliações.
    2. Use a ferramenta 'googleSearch' para encontrar emails e redes sociais (Instagram, Facebook, LinkedIn) nos sites dessas empresas.
    3. Retorne OBRIGATORIAMENTE um array JSON dentro de um bloco de código Markdown.
    
    Campos por objeto: nome, telefone, whatsapp (boolean), email, website, instagram, facebook, linkedin, endereco, link_maps, rating, reviewCount.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: latLng ? {
        retrievalConfig: {
          latLng: latLng
        }
      } : undefined,
      temperature: 0.1,
    },
  });

  return parseJSONResponse(response.text || "");
};