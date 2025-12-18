
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY não configurada no ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";

  const excludeStr = params.excludeNames?.length 
    ? `Ignore estas empresas já capturadas: ${params.excludeNames.join(', ')}.` 
    : '';

  const prompt = `
    Aja como um Agente de Prospecção Digital Avançado.
    Sua missão é localizar contatos públicos reais para o nicho "${params.niche}" em "${params.location}".
    Raio de busca: ${params.radius || '5km'}.
    ${excludeStr}

    REGRAS:
    1. Utilize a ferramenta 'googleMaps' para obter endereços, telefones e ratings.
    2. Utilize a ferramenta 'googleSearch' para enriquecer os resultados com emails e links de redes sociais.
    3. Retorne OBRIGATORIAMENTE um array JSON dentro de um bloco de código markdown.
    
    Campos do JSON: nome, telefone, whatsapp (booleano), email, website, instagram, facebook, linkedin, endereco, link_maps, rating, reviewCount.
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

  const rawText = response.text || "";
  const contacts = parseJSONResponse(rawText);

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && contacts.length > 0) {
    contacts.forEach(contact => {
      const match = chunks.find((chunk: any) => {
        const mapsTitle = chunk.maps?.title?.toLowerCase();
        const webTitle = chunk.web?.title?.toLowerCase();
        const contactName = contact.nome.toLowerCase();
        return (mapsTitle && contactName.includes(mapsTitle)) || 
               (webTitle && contactName.includes(webTitle));
      });

      if (match) {
        if (match.maps && match.maps.uri) contact.link_maps = match.maps.uri;
        if (match.web && match.web.uri && !contact.website) contact.website = match.web.uri;
      }
    });
  }

  return contacts;
};
