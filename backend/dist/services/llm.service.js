"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const groq_1 = require("./groq");
const logger_1 = require("../utils/logger");
class LLMService {
    /**
     * General structured JSON generation using Groq.
     */
    static async getStructuredJSON(systemPrompt, userPrompt, fallback) {
        try {
            const response = await groq_1.groq.chat.completions.create({
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                temperature: 0.1,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from LLM');
            }
            return JSON.parse(content);
        }
        catch (error) {
            logger_1.logger.error(`[LLMService] Error generating structured JSON: ${error.message}`);
            return fallback;
        }
    }
    /**
     * Extracts Business Intelligence structure from company raw description.
     */
    static async extractBusinessIntelligence(companyName, description) {
        const systemPrompt = `
      You are an expert equity research analyst. Extract structural business information from the raw description of ${companyName}.
      Respond ONLY with a valid JSON object matching this structure:
      {
        "businessSummary": "string",
        "businessModel": "string",
        "competitiveAdvantages": "string",
        "keyProducts": "string",
        "keyServices": "string",
        "keyCustomers": "string",
        "majorSubsidiaries": "string",
        "jointVentures": "string",
        "geographicPresence": "string",
        "industryPosition": "string",
        "marketLeadershipNotes": "string"
      }
      If a field is not available or mentioned in the text, use null for it. Do not invent any facts.
    `.trim();
        const userPrompt = `
      Company Name: ${companyName}
      Raw Text:
      ${description}
    `.trim();
        const fallback = {
            businessSummary: null,
            businessModel: null,
            competitiveAdvantages: null,
            keyProducts: null,
            keyServices: null,
            keyCustomers: null,
            majorSubsidiaries: null,
            jointVentures: null,
            geographicPresence: null,
            industryPosition: null,
            marketLeadershipNotes: null,
        };
        return this.getStructuredJSON(systemPrompt, userPrompt, fallback);
    }
    /**
     * Extracts Business Segments list from raw description.
     */
    static async extractBusinessSegments(companyName, description, year) {
        const systemPrompt = `
      You are an expert equity research analyst. Extract the business segments of ${companyName} for the year ${year}.
      Respond ONLY with a valid JSON object matching this structure:
      {
        "segments": [
          {
            "segmentName": "string",
            "revenueContribution": number_or_null,
            "profitContribution": number_or_null,
            "segmentDescription": "string"
          }
        ]
      }
      Do not invent any numbers. If revenue/profit contributions in percent are not stated, use null.
    `.trim();
        const userPrompt = `
      Company Name: ${companyName}
      Raw Text:
      ${description}
    `.trim();
        const fallback = { segments: [] };
        const result = await this.getStructuredJSON(systemPrompt, userPrompt, fallback);
        return result.segments.map(seg => ({ ...seg, year }));
    }
    /**
     * Extracts Growth Drivers from company description, pros, and announcements.
     */
    static async extractGrowthDrivers(companyName, text) {
        const systemPrompt = `
      You are an expert equity research analyst. Extract key growth drivers for ${companyName}.
      Examples: capacity expansions, new products, order wins, capex, new plant.
      Respond ONLY with a valid JSON object matching this structure:
      {
        "drivers": [
          {
            "driverType": "string",
            "description": "string",
            "importanceScore": number_1_to_10_or_null,
            "source": "string"
          }
        ]
      }
      Be brief but specific. Support with numbers from the text if available.
    `.trim();
        const userPrompt = `
      Company Name: ${companyName}
      Raw Text:
      ${text}
    `.trim();
        const fallback = { drivers: [] };
        const result = await this.getStructuredJSON(systemPrompt, userPrompt, fallback);
        return result.drivers.map(d => ({
            driverType: d.driverType,
            description: d.description,
            importanceScore: 5,
            source: 'Screener/Announcements'
        }));
    }
    /**
     * Extracts Company Risks from company description, cons, and text.
     */
    static async extractRisks(companyName, text) {
        const systemPrompt = `
      You are an expert equity research analyst. Extract risks faced by ${companyName}.
      Examples: High debt, commodity exposure, customer concentration, regulatory risk.
      Respond ONLY with a valid JSON object matching this structure:
      {
        "risks": [
          {
            "riskType": "string",
            "description": "string",
            "severity": "High" | "Medium" | "Low"
          }
        ]
      }
    `.trim();
        const userPrompt = `
      Company Name: ${companyName}
      Raw Text:
      ${text}
    `.trim();
        const fallback = { risks: [] };
        const result = await this.getStructuredJSON(systemPrompt, userPrompt, fallback);
        return result.risks;
    }
    /**
     * Extracts Order Book details if applicable.
     */
    static async extractOrderBook(companyName, text, year) {
        const systemPrompt = `
      You are an expert equity research analyst. Extract order book details for ${companyName} for the year ${year}.
      Respond ONLY with a valid JSON object matching this structure:
      {
        "orderBookValue": number_in_crores_or_null,
        "orderInflows": number_in_crores_or_null,
        "bookToBillRatio": number_or_null,
        "comments": "string"
      }
      If order book data is not mentioned or not relevant (e.g. for IT, banking, etc.), return all fields as null.
    `.trim();
        const userPrompt = `
      Company Name: ${companyName}
      Raw Text:
      ${text}
    `.trim();
        const fallback = {
            orderBookValue: null,
            orderInflows: null,
            bookToBillRatio: null,
            comments: null,
        };
        const result = await this.getStructuredJSON(systemPrompt, userPrompt, fallback);
        return { ...result, year };
    }
    /**
     * Extracts Management Commentary summary.
     */
    static async extractManagementCommentary(companyName, text, period) {
        const systemPrompt = `
      You are an expert equity research analyst. Summarize management comments, presentation key highlights, or guidance for ${companyName} for period ${period}.
      Respond ONLY with a valid JSON object matching this structure:
      {
        "commentaries": [
          {
            "commentaryType": "Annual Report" | "Quarterly Results" | "Investor Presentation" | "Conference Call" | "Chairman Message" | "Management Guidance",
            "summary": "string",
            "source": "string"
          }
        ]
      }
      Keep summaries dense, informative, and focused on growth, margins, and guidance.
    `.trim();
        const userPrompt = `
      Company Name: ${companyName}
      Period: ${period}
      Raw Text:
      ${text}
    `.trim();
        const fallback = { commentaries: [] };
        const result = await this.getStructuredJSON(systemPrompt, userPrompt, fallback);
        return result.commentaries.map(comm => ({ ...comm, period }));
    }
}
exports.LLMService = LLMService;
