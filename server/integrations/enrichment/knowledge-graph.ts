// Google Knowledge Graph API integration

export interface KnowledgeGraphEntity {
  id: string;
  name: string;
  description?: string;
  detailedDescription?: {
    articleBody: string;
    url: string;
    license: string;
  };
  image?: {
    contentUrl: string;
    url: string;
  };
  types?: string[];
  url?: string;
}

export class KnowledgeGraphClient {
  private apiKey: string;
  private baseURL: string = 'https://kgsearch.googleapis.com/v1/entities:search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchEntities(query: string, types?: string[], limit: number = 10): Promise<KnowledgeGraphEntity[]> {
    try {
      const params = new URLSearchParams({
        query,
        key: this.apiKey,
        limit: limit.toString(),
      });

      if (types && types.length > 0) {
        params.append('types', types.join(','));
      }

      const response = await fetch(`${this.baseURL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Knowledge Graph API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.itemListElement || []).map((item: any) => ({
        id: item.result['@id'],
        name: item.result.name,
        description: item.result.description,
        detailedDescription: item.result.detailedDescription,
        image: item.result.image,
        types: item.result['@type'],
        url: item.result.url,
      }));
    } catch (error: any) {
      console.error(`Knowledge Graph search failed for "${query}":`, error.message);
      throw error;
    }
  }

  async getBrandEntity(brandName: string): Promise<KnowledgeGraphEntity | null> {
    const entities = await this.searchEntities(brandName, ['Organization', 'Corporation', 'Brand'], 1);
    return entities.length > 0 ? entities[0] : null;
  }
}
