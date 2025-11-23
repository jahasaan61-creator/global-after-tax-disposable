import { GoogleGenAI, Type } from "@google/genai";

export const queryGemini = async (prompt: string, country: string, location?: { latitude: number; longitude: number }): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const tools: any[] = [
      { googleSearch: {} },
      { googleMaps: {} }
    ];

    const config: any = { tools };

    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      };
    }
    
    // We strictly prompt for verifiable sources to ensure precision.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert Global Mobility Assistant specializing in Taxes and Cost of Living for: ${country}.
      
      User Question: ${prompt}
      
      STRICT RULES:
      1. USE the Google Search tool to verify 2024/2025 tax rates, thresholds, deductions, and current Cost of Living data (Numbeo, ECA, Mercer).
      2. USE the Google Maps tool to find locations if the user asks.
      3. DO NOT hallucinate numbers. If uncertain, state that you cannot verify.
      4. Answer concisely with verifiable numeric data.
      5. If asked for a "percentage difference" in cost of living, provide a single estimated number based on search results.
      `,
      config: config,
    });

    // Extract text and grounding info
    let text = response.text || "";
    
    // Append citations if available from grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
        const uniqueLinks = new Map<string, string>();
        const mapLinks = new Map<string, string>();

        chunks.forEach((c: any) => {
            if (c.web?.uri && c.web?.title) {
                uniqueLinks.set(c.web.uri, c.web.title);
            }
            if (c.maps?.uri && c.maps?.title) {
                mapLinks.set(c.maps.uri, c.maps.title);
            }
        });

        if (uniqueLinks.size > 0) {
            text += `\n\n**Verified Sources:**\n`;
            uniqueLinks.forEach((title, uri) => {
                text += `- [${title}](${uri})\n`;
            });
        }

        if (mapLinks.size > 0) {
            text += `\n\n**Relevant Locations:**\n`;
            mapLinks.forEach((title, uri) => {
                text += `- [${title}](${uri})\n`;
            });
        }
    }

    return text || "I couldn't verify that information. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error verifying the data. Please check your connection and try again.";
  }
};

export const getTaxReport = async (
  country: string,
  gross: number,
  net: number,
  deductions: { name: string; amount: number }[],
  currency: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are a friendly local tax expert for ${country}.
      Analyze this salary breakdown:
      - Gross Annual Income: ${currency} ${gross.toLocaleString()}
      - Net Annual Income: ${currency} ${net.toLocaleString()}
      - Deductions:
      ${deductions.map(d => `  - ${d.name}: ${currency} ${d.amount.toLocaleString()}`).join('\n')}

      Please provide a concise, easy-to-understand summary (around 150 words).
      1. Explain clearly where the biggest chunk of money is going.
      2. Mention if the effective tax rate (${((1 - net/gross)*100).toFixed(1)}%) seems standard for this income level in ${country}.
      3. Provide one actionable tip or insight regarding these specific deductions.
      
      Formatting rules:
      - Use **bold** for key terms and numbers.
      - Use bullet points for lists.
      - Keep it professional but encouraging.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("AI Report Error:", error);
    return "Sorry, I couldn't generate the tax report at this time. Please check your API key or connection.";
  }
};

export const estimateLivingCosts = async (
  country: string,
  region: string | undefined,
  currency: string,
  profile: {
    income: number;
    maritalStatus: string;
    age: number;
  }
): Promise<{ rent: number; groceries: number; utilities: number; transport: number; insurance: number } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const location = region ? `${region}, ${country}` : country;
    
    // Construct a profile-based prompt
    const prompt = `
      Estimate realistic monthly living costs in ${location} (${currency}) for a person with this profile:
      - Status: ${profile.maritalStatus}
      - Age: ${profile.age}
      - Annual Income Level: ${currency} ${profile.income}
      
      Instructions:
      1. Tailor the 'Rent' based on the income level. If high income, assume a nice apartment in a good area. If low income, assume budget accommodation.
      2. If 'Married', increase Groceries and Utilities for a 2-person household.
      3. Provide realistic estimates for:
         - Rent (Housing)
         - Groceries (Food/Household items)
         - Utilities (Electricity, Water, Internet, Phone)
         - Transport (Public transit or fuel/maintenance avg)
         - Insurance (Health/Life supplement if common in ${country})
      
      Return ONLY raw numbers in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rent: { type: Type.NUMBER },
            groceries: { type: Type.NUMBER },
            utilities: { type: Type.NUMBER },
            transport: { type: Type.NUMBER },
            insurance: { type: Type.NUMBER },
          },
          required: ["rent", "groceries", "utilities", "transport", "insurance"],
        },
      },
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Cost Estimation Error:", error);
    return null;
  }
};
