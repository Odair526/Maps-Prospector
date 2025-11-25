
import { GoogleGenAI } from "@google/genai";
import { BusinessContact, SearchParams } from "../types";

const parseJSONResponse = (text: string): BusinessContact[] => {
  try {
    // Attempt to find a JSON array block in the markdown
    // Matches ```json [...], ``` [...] or just [...]
    const jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/) || text.match(/(\[[\s\S]*?\])/);
    
    if (jsonMatch) {
      let jsonStr = jsonMatch[1] || jsonMatch[0];
      // Clean up any potential trailing commas or weird markdown artifacts if necessary
      jsonStr = jsonStr.replace(/,\s*\]/g, ']').trim();
      
      // SANITIZATION: Fix common Python-to-JSON format errors from LLMs (None, True, False)
      jsonStr = jsonStr
        .replace(/:\s*None\b/g, ': null')
        .replace(/:\s*True\b/g, ': true')
        .replace(/:\s*False\b/g, ': false');
      
      const parsed = JSON.parse(jsonStr);
      
      // Strict validation to ensure we have an array of objects with at least a name
      if (Array.isArray(parsed)) {
        return parsed.filter(item => 
          item && 
          typeof item === 'object' && 
          (typeof item.nome === 'string' || typeof item.name === 'string') // Allow 'name' alias just in case
        ).map((item: any) => ({
          nome: item.nome || item.name || "Empresa sem nome",
          telefone: item.telefone || "Não disponível no Maps",
          whatsapp: !!item.whatsapp,
          email: item.email || "Não disponível no Maps",
          website: item.website || "Não disponível no Maps",
          instagram: item.instagram || "Não disponível no Maps",
          facebook: item.facebook || "Não disponível no Maps",
          linkedin: item.linkedin || "Não disponível no Maps",
          endereco: item.endereco || "Não disponível no Maps",
          link_maps: item.link_maps || "Não disponível no Maps",
          rating: typeof item.rating === 'number' ? item.rating : 0,
          reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
          web_summary: item.web_summary || ""
        }));
      }
    }
    return [];
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response", e instanceof Error ? e.message : String(e));
    return [];
  }
};

// Helper for exponential backoff retry
async function fetchWithRetry(
  fn: () => Promise<any>, 
  retries = 3, 
  delay = 1000
): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const isServerSideError = error?.status === 500 || error?.status === 503 || error?.code === 500;
    
    if (retries > 0 && isServerSideError) {
      console.warn(`Gemini API 500 error encountered. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Internal function to perform a single fetch step
const fetchBatch = async (ai: GoogleGenAI, params: SearchParams, currentExclusions: string[], remainingGoal: number): Promise<BusinessContact[]> => {
  
  // Leverage Gemini's large context window to pass a large exclusion list
  // UPDATED: Explicit instruction to expand radius significantly when "Load More" is active (exclusion list > 0)
  const excludeInstruction = currentExclusions.length > 0
    ? `LISTA DE EXCLUSÃO (Empresas já encontradas): ${JSON.stringify(currentExclusions.slice(-1000))}.
    
    DIRETIVA DE EXPANSÃO (LOAD MORE):
    1. O usuário clicou em "Buscar Mais". Você DEVE AMPLIAR O RAIO DE BUSCA AGORA.
    2. Se a busca original foi de 5km, expanda para 10km, 15km ou busque em CIDADES VIZINHAS.
    3. Ignore empresas repetidas. Foque em encontrar NOVOS resultados em áreas periféricas.
    4. Mantenha o nicho "${params.niche}", mas explore novas coordenadas geográficas próximas.`
    : "";

  const whatsappInstruction = params.whatsappOnly
    ? "FILTRO OBRIGATÓRIO (WhatsApp): Retorne APENAS empresas que possuam número de celular/móvel (indicativo de WhatsApp). IGNORE telefones fixos."
    : "";

  // Deep Search Logic
  const deepSearchTargets = [];
  if (params.deepSearchWeb) deepSearchTargets.push("Website");
  if (params.deepSearchInstagram) deepSearchTargets.push("Instagram");
  if (params.deepSearchFacebook) deepSearchTargets.push("Facebook");
  if (params.deepSearchLinkedin) deepSearchTargets.push("LinkedIn");

  // Speed vs Deep Optimization
  const deepSearchBlock = deepSearchTargets.length > 0
    ? `### MODO PROSPECÇÃO PROFUNDA (ALTA PRECISÃO) ###
       O usuário EXIGE dados precisos de: ${deepSearchTargets.join(', ')}.
       
       ESTRATÉGIA DE BUSCA OBRIGATÓRIA (Use a tool 'googleSearch' para CADA empresa encontrada):
       1. Para Website: Busque "Nome da Empresa + Cidade + official website".
       2. Para Instagram: Busque "site:instagram.com Nome da Empresa + Cidade".
       3. Para Facebook: Busque "site:facebook.com Nome da Empresa + Cidade".
       4. Para LinkedIn: Busque "site:linkedin.com/company Nome da Empresa".

       CRITÉRIO DE VALIDAÇÃO:
       - Extraia o URL exato dos resultados da busca (ex: instagram.com/usuario).
       - Não invente URLs. Se a busca não retornar um resultado claro, use "Não disponível no Maps".
       - Use as informações encontradas nos sites/redes sociais para enriquecer o campo 'web_summary' com detalhes sobre o negócio.
       `
    : `### MODO VELOCIDADE (PADRÃO) ###
       NÃO realize buscas extras no Google Search para encontrar redes sociais (Instagram, Facebook, LinkedIn).
       Use APENAS os dados já retornados pela tool 'googleMaps' (que pode incluir o Website).
       Se o link não vier diretamente do Maps, preencha IMEDIATAMENTE com "Não disponível no Maps". O foco é velocidade total.`;

  // Adjust model based on mode
  const modelName = params.fastMode ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash';
  
  const complexityInstruction = params.fastMode 
    ? "MODO RÁPIDO: Priorize velocidade. Seja conciso." 
    : "MODO PADRÃO: Traga detalhes ricos.";

  // Geographic Strategy Logic
  const geoStrategyBlock = `
    ### ESTRATÉGIA GEOGRÁFICA INTELIGENTE ###
    Localização Solicitada: "${params.location}"
    Raio Solicitado: "${params.radius || 'Não definido'}"

    VOCÊ DEVE ANALISAR O ESCOPO DA LOCALIZAÇÃO:
    1. ESCOPO NACIONAL (Ex: "Brasil"): 
       - IGNORE raios pequenos (como 5km).
       - Realize uma busca ampla focada nas principais capitais e polos econômicos do país.
       - Traga resultados diversificados geograficamente.
    
    2. ESCOPO ESTADUAL (Ex: "São Paulo", "Minas Gerais", "Bahia"):
       - IGNORE raios pequenos.
       - Busque nas principais cidades e polos industriais DENTRO deste estado.
    
    3. ESCOPO LOCAL (Ex: Cidade específica ou Bairro):
       - Respeite estritamente o raio definido (${params.radius || "5km"}) INICIALMENTE.
       - SE houver "LISTA DE EXCLUSÃO", ignore o raio estrito e expanda para as bordas da cidade/bairro.
  `;

  const prompt = `
    Atue como um Agente de Prospecção Especialista em Data Mining.
    ${complexityInstruction}
    
    Objetivo: Encontrar empresas do nicho "${params.niche}" do tipo "${params.type}".
    
    ${geoStrategyBlock}

    - META DESTA RODADA: Encontrar ${remainingGoal} NOVOS contatos qualificados.
    ${whatsappInstruction}
    ${excludeInstruction}
    
    ${deepSearchBlock}
    
    Instruções Principais:
    1. Use a tool 'googleMaps' para buscar dados base das empresas seguindo a ESTRATÉGIA GEOGRÁFICA definida acima.
    2. Identifique se o telefone listado é um celular (comum no Brasil para WhatsApp). Defina "whatsapp": true se parecer um celular.
    3. Extraia: Nome, Telefone, Email, Endereço completo e Link do Maps.
    4. Extraia também a AVALIAÇÃO (Nota de 1 a 5) e o NÚMERO DE AVALIAÇÕES (Review Count) do Google Maps.
    5. Gere um resumo detalhado no campo "web_summary" (Resultados da Web) combinando o que achou no Maps e nas buscas profundas (se ativas).
    
    IMPORTANTE: Responda APENAS com um array JSON válido. Use "null" para valores nulos, não use "None".
    
    Formato do JSON esperado:
    [
      {
        "nome": "Nome da Empresa",
        "telefone": "(XX) 9XXXX-XXXX",
        "whatsapp": true,
        "email": "contato@empresa.com",
        "website": "https://www.empresa.com.br",
        "instagram": "https://instagram.com/perfil",
        "facebook": "https://facebook.com/pagina",
        "linkedin": "https://linkedin.com/company/pagina",
        "endereco": "Rua Exemplo, 123, Bairro, Cidade - UF",
        "link_maps": "https://maps.google.com/...",
        "rating": 4.5,
        "reviewCount": 120,
        "web_summary": "Empresa especializada em X com foco em Y. Possui forte presença no Instagram."
      }
    ]
  `;

  const makeRequest = async () => {
    return await ai.models.generateContent({
      model: modelName, 
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        systemInstruction: "Você é um robô assistente de prospecção. Retorne apenas JSON.",
        temperature: 0.7, 
      },
    });
  };

  try {
    const response = await fetchWithRetry(makeRequest);
    const text = response.text || "";
    return parseJSONResponse(text);
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    console.error("Error in fetchBatch after retries:", errorMsg);
    return []; 
  }
};

export const searchBusinesses = async (params: SearchParams): Promise<BusinessContact[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let allContacts: BusinessContact[] = [];
  let excludeList: string[] = params.excludeNames ? [...params.excludeNames] : [];
  
  // Adjust goal based on Deep Search: Deep search is slower, so we fetch slightly fewer but higher quality if filters are on.
  // If no filters, we aim for volume (50).
  const isDeepSearch = params.deepSearchInstagram || params.deepSearchFacebook || params.deepSearchLinkedin || params.deepSearchWeb;
  const TARGET_MIN = isDeepSearch ? 30 : 50; 
  
  const MAX_ATTEMPTS = 3; 
  let attempts = 0;

  while (allContacts.length < TARGET_MIN && attempts < MAX_ATTEMPTS) {
    const needed = TARGET_MIN - allContacts.length;
    // Request a bit more than needed to account for duplicates/filtering
    const requestCount = Math.max(10, needed + 5);

    try {
      const newBatch = await fetchBatch(ai, params, excludeList, requestCount);
      
      if (newBatch.length === 0) break;

      const uniqueNewContacts = newBatch.filter(c => !excludeList.includes(c.nome));
      if (uniqueNewContacts.length === 0) break;
      
      // If Deep Search is active, sort by "completeness" (how many social links were found)
      if (isDeepSearch) {
         sortContacts(uniqueNewContacts);
      }

      allContacts = [...allContacts, ...uniqueNewContacts];
      const newNames = uniqueNewContacts.map(c => c.nome);
      excludeList = [...excludeList, ...newNames];
      attempts++;

      // If we are getting good results, give the API a breather
      if (allContacts.length < TARGET_MIN) {
        await new Promise(r => setTimeout(r, 1500));
      }

    } catch (error) {
      console.error("Error in search iteration:", error instanceof Error ? error.message : String(error));
      break; 
    }
  }

  return allContacts;
};

// Helper to sort contacts by data quality/completeness
const sortContacts = (contacts: BusinessContact[]) => {
  contacts.sort((a, b) => {
    const scoreA = (a.instagram !== "Não disponível no Maps" ? 1 : 0) + 
                   (a.facebook !== "Não disponível no Maps" ? 1 : 0) + 
                   (a.linkedin !== "Não disponível no Maps" ? 1 : 0) +
                   (a.website !== "Não disponível no Maps" ? 1 : 0);
                   
    const scoreB = (b.instagram !== "Não disponível no Maps" ? 1 : 0) + 
                   (b.facebook !== "Não disponível no Maps" ? 1 : 0) + 
                   (b.linkedin !== "Não disponível no Maps" ? 1 : 0) +
                   (b.website !== "Não disponível no Maps" ? 1 : 0);
    
    return scoreB - scoreA; // Descending order
  });
};
