// Brand Enrichment Worker - Enriches brand context from external sources

import type { QueuedJob } from '../queue';
import { storage } from '../../storage';
import { getIntegrations } from '../../integrations';

export interface BrandEnrichmentPayload {
  brandId: string;
  sources?: Array<'brandDev' | 'knowledgeGraph' | 'wikidata'>;
}

export async function brandEnrichmentWorker(job: QueuedJob): Promise<any> {
  const payload = job.payload as BrandEnrichmentPayload;
  const { brandId, sources = ['brandDev', 'knowledgeGraph', 'wikidata'] } = payload;

  console.log(`[BrandEnrichment] Starting enrichment for brand ${brandId}`);

  // Get brand
  const brand = await storage.getBrand(brandId);
  if (!brand) {
    throw new Error(`Brand ${brandId} not found`);
  }

  // Check if enrichment is needed using entity resolution
  const { needsEnrichment, registerDomain } = await import('../../services/entity-resolution');
  const enrichmentCheck = await needsEnrichment(brandId);

  if (!enrichmentCheck.needs) {
    console.log(`[BrandEnrichment] Skipping enrichment for brand ${brandId}: ${enrichmentCheck.reason}`);
    console.log(`[BrandEnrichment] Last enriched: ${enrichmentCheck.lastEnriched}`);
    
    // Return existing context
    const context = await storage.getBrandContext(brandId);
    return {
      brandId,
      skipped: true,
      reason: enrichmentCheck.reason,
      lastEnriched: enrichmentCheck.lastEnriched,
      completenessScore: context?.completenessScore || 0,
    };
  }

  console.log(`[BrandEnrichment] Enrichment needed: ${enrichmentCheck.reason}`);

  // Get or create brand context
  let context = await storage.getBrandContext(brandId);
  if (!context) {
    context = await storage.createBrandContext({
      brandId,
      brandIdentity: {
        officialName: brand.name,
        variations: [brand.name],
      },
      dataQualityScore: 0,
      completenessScore: 0,
    });
  }

  const integrations = getIntegrations();
  const enrichmentData: any = {
    brandIdentity: context.brandIdentity || {},
    industryContext: context.industryContext || {},
    productServices: context.productServices || {},
  };

  // Enrich from brand.dev
  if (sources.includes('brandDev') && integrations.brandDev) {
    try {
      console.log(`[BrandEnrichment] Fetching from brand.dev for ${brand.domain}`);
      const brandDevData = await integrations.brandDev.getBrandInfo(brand.domain);
      
      if (brandDevData) {
        enrichmentData.brandIdentity = {
          ...enrichmentData.brandIdentity,
          officialName: brandDevData.name || enrichmentData.brandIdentity.officialName,
          variations: [
            ...(enrichmentData.brandIdentity.variations || []),
            brandDevData.name,
          ].filter((v, i, a) => a.indexOf(v) === i), // Unique values
        };

        if (brandDevData.description) {
          enrichmentData.brandIdentity.mission = brandDevData.description;
        }

        if (brandDevData.logo) {
          enrichmentData.brandIdentity.logo = brandDevData.logo;
        }

        if (brandDevData.colors) {
          enrichmentData.brandIdentity.colors = brandDevData.colors;
        }
      }
    } catch (error: any) {
      console.error(`[BrandEnrichment] brand.dev error:`, error.message);
    }
  }

  // Enrich from Knowledge Graph
  if (sources.includes('knowledgeGraph') && integrations.knowledgeGraph) {
    try {
      console.log(`[BrandEnrichment] Fetching from Knowledge Graph for ${brand.name}`);
      const kgEntity = await integrations.knowledgeGraph.getBrandEntity(brand.name);
      
      if (kgEntity) {
        if (kgEntity.description) {
          enrichmentData.brandIdentity.taglines = [
            ...(enrichmentData.brandIdentity.taglines || []),
            kgEntity.description,
          ];
        }

        if (kgEntity.detailedDescription) {
          enrichmentData.brandIdentity.description = kgEntity.detailedDescription.articleBody;
        }

        if (kgEntity.types) {
          enrichmentData.industryContext = {
            ...enrichmentData.industryContext,
            types: kgEntity.types,
          };
        }
      }
    } catch (error: any) {
      console.error(`[BrandEnrichment] Knowledge Graph error:`, error.message);
    }
  }

  // Enrich from Wikidata
  if (sources.includes('wikidata')) {
    try {
      console.log(`[BrandEnrichment] Fetching from Wikidata for ${brand.name}`);
      const wikidataEntity = await integrations.wikidata.getBrandEntity(brand.name);
      
      if (wikidataEntity) {
        if (wikidataEntity.description) {
          enrichmentData.brandIdentity.description = 
            enrichmentData.brandIdentity.description || wikidataEntity.description;
        }

        if (wikidataEntity.aliases) {
          enrichmentData.brandIdentity.variations = [
            ...(enrichmentData.brandIdentity.variations || []),
            ...wikidataEntity.aliases,
          ].filter((v, i, a) => a.indexOf(v) === i);
        }
      }
    } catch (error: any) {
      console.error(`[BrandEnrichment] Wikidata error:`, error.message);
    }
  }

  // Calculate completeness score
  const fields = [
    enrichmentData.brandIdentity.officialName,
    enrichmentData.brandIdentity.description,
    enrichmentData.brandIdentity.logo,
    enrichmentData.brandIdentity.variations?.length > 1,
    enrichmentData.industryContext.types?.length > 0,
  ];
  const completenessScore = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  // Update brand context
  await storage.updateBrandContext(context.id, {
    brandIdentity: enrichmentData.brandIdentity,
    industryContext: enrichmentData.industryContext,
    productServices: enrichmentData.productServices,
    completenessScore,
    dataQualityScore: completenessScore, // Simplified - should be more sophisticated
    lastEnriched: new Date(),
  });

  // Register domain in entity resolution registry
  await registerDomain(brand.domain, brandId);

  console.log(`[BrandEnrichment] Completed enrichment for brand ${brandId} (${completenessScore}% complete)`);

  return {
    brandId,
    completenessScore,
    sourcesUsed: sources,
    fieldsEnriched: fields.filter(Boolean).length,
  };
}
