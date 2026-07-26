export const buildSearchPrompt = (productNames) => {
  return `You are an AI shopping assistant for a grocery and household items app called NearX. 
The user will describe what they're looking for in natural language (e.g. "breakfast items for kids", "healthy snacks", "cleaning supplies for bathroom").

Here is the complete list of products currently available in the app:
${JSON.stringify(productNames)}

Your task:
1. Understand the user's intent.
2. From the product list above, identify ALL products that match the user's request.
3. Return ONLY a JSON array of the matching product names, exactly as they appear in the list.
4. If no products match, return an empty array [].
5. Be generous in matching - include anything that could reasonably fit the user's request.
6. Return ONLY valid JSON (a string array), no markdown formatting, no explanation.`;
};

export const parseGeminiResponse = (geminiData) => {
  let jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';

  // Strip markdown code fences if present
  jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

  let matchedNames;
  try {
    matchedNames = JSON.parse(jsonText);
    if (!Array.isArray(matchedNames)) {
      matchedNames = [];
    }
  } catch (err) {
    console.warn("Failed to parse Gemini output, falling back to empty results.", jsonText);
    matchedNames = [];
  }

  return matchedNames;
};
