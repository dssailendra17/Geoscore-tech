// Wikidata API integration for structured data

export interface WikidataEntity {
  id: string;
  label: string;
  description?: string;
  aliases?: string[];
  claims?: Record<string, any>;
  sitelinks?: Record<string, { title: string; url: string }>;
}

export class WikidataClient {
  private baseURL: string = 'https://www.wikidata.org/w/api.php';

  async searchEntities(query: string, limit: number = 10): Promise<WikidataEntity[]> {
    try {
      const params = new URLSearchParams({
        action: 'wbsearchentities',
        search: query,
        language: 'en',
        limit: limit.toString(),
        format: 'json',
        origin: '*',
      });

      const response = await fetch(`${this.baseURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Wikidata API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.search || []).map((item: any) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        aliases: item.aliases,
      }));
    } catch (error: any) {
      console.error(`Wikidata search failed for "${query}":`, error.message);
      throw error;
    }
  }

  async getEntity(entityId: string): Promise<WikidataEntity | null> {
    try {
      const params = new URLSearchParams({
        action: 'wbgetentities',
        ids: entityId,
        languages: 'en',
        format: 'json',
        origin: '*',
      });

      const response = await fetch(`${this.baseURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Wikidata API error: ${response.statusText}`);
      }

      const data = await response.json();
      const entity = data.entities[entityId];

      if (!entity || entity.missing) {
        return null;
      }

      return {
        id: entity.id,
        label: entity.labels?.en?.value,
        description: entity.descriptions?.en?.value,
        aliases: entity.aliases?.en?.map((a: any) => a.value),
        claims: entity.claims,
        sitelinks: entity.sitelinks,
      };
    } catch (error: any) {
      console.error(`Wikidata entity fetch failed for ${entityId}:`, error.message);
      throw error;
    }
  }

  async getBrandEntity(brandName: string): Promise<WikidataEntity | null> {
    const entities = await this.searchEntities(brandName, 1);
    if (entities.length === 0) return null;
    
    return await this.getEntity(entities[0].id);
  }
}
