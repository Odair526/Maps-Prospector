// Updated model to gemini-2.5-flash as googleMaps tool is only supported in Gemini 2.5 series models
import { GoogleGenAI } from "@google/genai";
import { BusinessContact, SearchParams } from "../types";

const parseJSONResponse = (text: string): BusinessContact[] => {
  try {
    // Tenta encontrar o bloco de JSON na resposta
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

  // Use the correct initialization with named parameter
  const ai = new GoogleGenAI({ apiKey });
  
  // Maps grounding is only supported in Gemini 2.5 series models.
  // Switching to 'gemini-2.5-flash' to support the googleMaps tool correctly.
  const modelName = 'gemini-2.5-flash';

  const excludeStr = params.excludeNames?.length 
    ? `Ignore terminantemente estas empresas que já temos no banco: ${params.excludeNames.join(', ')}.` 
    : '';

  const deepSearchInstructions = params.fastMode 
    ? `Objetivo: Retorne rapidamente 5-8 leads principais.`
    : `Objetivo: REALIZAR VARREDURA EXAUSTIVA. Você deve encontrar o máximo de empresas possível (alvo: 20-30 leads). 
       Não se limite aos primeiros resultados. Use o Google Search para encontrar e-mails e redes sociais de cada empresa encontrada no Maps. 
       Se necessário, faça múltiplas pesquisas internas para cobrir diferentes sub-áreas de "${params.location}".`;

  const prompt = `
    Aja como um Agente de Prospecção Digital de Elite especializado em B2B.
    Localize contatos públicos para o nicho "${params.niche}" (${params.type || ''}) em "${params.location}".
    Raio de busca: ${params.radius || '5km'}.
    ${excludeStr}

    ${deepSearchInstructions}

    REGRAS CRÍTICAS:
    1. Utilize 'googleMaps' para identificar os estabelecimentos, coordenadas e reputação.
    2. Utilize 'googleSearch' para enriquecer os dados. É OBRIGATÓRIO tentar encontrar E-mail e Instagram.
    3. Verifique se o número é de celular para marcar o campo 'whatsapp' como true.
    4. Formato de Saída: Retorne APENAS um array JSON dentro de um bloco de código markdown.
    
    Campos do JSON por objeto: 
    - nome, telefone, whatsapp (boolean), email, website, instagram, facebook, linkedin, endereco, link_maps, rating, reviewCount.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      // tools: googleMaps may be used with googleSearch
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: latLng ? {
        retrievalConfig: {
          latLng: latLng
        }
      } : undefined,
      temperature: params.fastMode ? 0.1 : 0.3,
    },
  });

  // Extract text property directly as per guidelines
  const rawText = response.text || "";
  const contacts = parseJSONResponse(rawText);

  // Enriquecimento de links via metadados de grounding se disponíveis
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
        if (match.web && match.web.uri && (!contact.website || contact.website === "Não disponível")) {
          contact.website = match.web.uri;
        }
      }
    });
  }

  return contacts;
};