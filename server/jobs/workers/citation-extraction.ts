// Citation Extraction Worker - Enhanced citation extraction from LLM responses

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';
import { getIntegrations } from '../../integrations';

export interface CitationExtractionPayload {
  brandId: string;
  llmAnswerId?: string;
}

export async function citationExtractionWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as CitationExtractionPayload;
  const { brandId, llmAnswerId } = payload;

  console.log(`[CitationExtraction] Starting citation extraction for brand ${brandId}`);

  // Get LLM answers to process
  let answers: any[];
  if (llmAnswerId) {
    const allAnswers = await storage.getLlmAnswersByBrand(brandId, 1);
    answers = allAnswers.filter(a => a.id === llmAnswerId);
  } else {
    // Get recent answers without citations
    answers = await storage.getLlmAnswersByBrand(brandId, 50);
  }

  if (answers.length === 0) {
    console.log(`[CitationExtraction] No answers found for brand ${brandId}`);
    return {
      brandId,
      citationsExtracted: 0,
    };
  }

  const integrations = getIntegrations();
  const extractedCitations: any[] = [];

  for (const answer of answers) {
    try {
      const citations = await extractCitations(answer.rawResponse, integrations);

      // Store citations
      for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];
        
        await storage.createAnswerCitation({
          llmAnswerId: answer.id,
          url: citation.url,
          domain: citation.domain,
          position: i + 1,
          citationType: citation.type,
          title: citation.title,
        });

        extractedCitations.push({
          answerId: answer.id,
          url: citation.url,
          type: citation.type,
        });
      }

    } catch (error: any) {
      console.error(`[CitationExtraction] Error extracting citations from answer ${answer.id}:`, error.message);
    }
  }

  console.log(`[CitationExtraction] Extracted ${extractedCitations.length} citations for brand ${brandId}`);

  return {
    brandId,
    citationsExtracted: extractedCitations.length,
    answersProcessed: answers.length,
  };
}

/**
 * Extract citations from text using multiple methods
 */
async function extractCitations(text: string, _integrations: any): Promise<any[]> {
  const citations: any[] = [];

  // Method 1: Extract explicit URLs
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const urls = text.match(urlRegex) || [];

  for (const url of urls) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');

      // Get context around URL
      const urlIndex = text.indexOf(url);
      const contextStart = Math.max(0, urlIndex - 100);
      const contextEnd = Math.min(text.length, urlIndex + url.length + 100);
      const snippet = text.substring(contextStart, contextEnd).trim();

      citations.push({
        url,
        domain,
        type: 'inline',
        snippet,
        confidence: 1.0,
      });
    } catch (error) {
      // Invalid URL, skip
    }
  }

  // Method 2: Extract markdown-style links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const [, title, url] = match;
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');

      citations.push({
        url,
        domain,
        type: 'reference',
        title,
        snippet: match[0],
        confidence: 1.0,
      });
    } catch (error) {
      // Invalid URL, skip
    }
  }

  // Method 3: Extract domain mentions that might be citations
  const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/g;
  const domainMatches = text.match(domainRegex) || [];

  for (const domainMatch of domainMatches) {
    // Skip if already captured
    if (citations.some(c => c.url.includes(domainMatch))) {
      continue;
    }

    try {
      const url = domainMatch.startsWith('http') ? domainMatch : `https://${domainMatch}`;
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');

      const domainIndex = text.indexOf(domainMatch);
      const contextStart = Math.max(0, domainIndex - 50);
      const contextEnd = Math.min(text.length, domainIndex + domainMatch.length + 50);
      const snippet = text.substring(contextStart, contextEnd).trim();

      citations.push({
        url,
        domain,
        type: 'mention',
        snippet,
        confidence: 0.7,
      });
    } catch (error) {
      // Invalid URL, skip
    }
  }

  // Deduplicate by URL
  const uniqueCitations = citations.reduce((acc: any[], citation) => {
    if (!acc.some(c => c.url === citation.url)) {
      acc.push(citation);
    }
    return acc;
  }, []);

  return uniqueCitations;
}
