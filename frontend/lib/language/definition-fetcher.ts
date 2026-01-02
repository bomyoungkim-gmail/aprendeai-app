/**
 * Definition Fetcher for LANGUAGE Mode
 * 
 * Domain logic (pure) - no framework dependencies
 * Following MelhoresPraticas.txt: domain logic in lib/
 * 
 * G6.1 Refinement: API priority (Wiktionary → Google → Oxford)
 */

export interface Definition {
  word: string;
  definitions: string[];
  examples?: string[];
  pronunciation?: string;
  partOfSpeech?: string;
  source: 'wiktionary' | 'google' | 'oxford';
}

export class DefinitionFetcher {
  /**
   * Fetch definition with fallback chain
   * Priority: Wiktionary (free) → Google (free with limits) → Oxford (paid)
   */
  async fetchDefinition(word: string, targetLang: string = 'pt'): Promise<Definition> {
    // Try Wiktionary first (free, open)
    try {
      return await this.fetchFromWiktionary(word, targetLang);
    } catch (error) {
      console.warn('Wiktionary failed, trying Google');
    }

    // Fallback to Google Dictionary
    try {
      return await this.fetchFromGoogle(word, targetLang);
    } catch (error) {
      console.warn('Google failed, trying Oxford');
    }

    // Last resort: Oxford (requires API key)
    return await this.fetchFromOxford(word, targetLang);
  }

  /**
   * Wiktionary API (free, multilingual)
   */
  private async fetchFromWiktionary(word: string, lang: string): Promise<Definition> {
    const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Wiktionary API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Wiktionary response
    const definitions: string[] = [];
    if (data[lang]) {
      data[lang].forEach((entry: any) => {
        entry.definitions.forEach((def: any) => {
          definitions.push(def.definition);
        });
      });
    }

    return {
      word,
      definitions,
      source: 'wiktionary'
    };
  }

  /**
   * Google Dictionary API (free with limits)
   */
  private async fetchFromGoogle(word: string, lang: string): Promise<Definition> {
    // Note: Google Dictionary API is deprecated, using placeholder
    // In production, would use alternative like Free Dictionary API
    throw new Error('Google Dictionary API not available');
  }

  /**
   * Oxford API (paid, premium quality)
   */
  private async fetchFromOxford(word: string, lang: string): Promise<Definition> {
    // Requires API key from environment
    const apiKey = process.env.OXFORD_API_KEY;
    if (!apiKey) {
      throw new Error('Oxford API key not configured');
    }

    const url = `https://od-api.oxforddictionaries.com/api/v2/entries/${lang}/${encodeURIComponent(word)}`;
    
    const response = await fetch(url, {
      headers: {
        'app_id': process.env.OXFORD_APP_ID || '',
        'app_key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Oxford API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Oxford response
    const definitions: string[] = [];
    const examples: string[] = [];
    
    data.results?.[0]?.lexicalEntries?.forEach((entry: any) => {
      entry.entries?.forEach((e: any) => {
        e.senses?.forEach((sense: any) => {
          if (sense.definitions) {
            definitions.push(...sense.definitions);
          }
          if (sense.examples) {
            examples.push(...sense.examples.map((ex: any) => ex.text));
          }
        });
      });
    });

    return {
      word,
      definitions,
      examples,
      partOfSpeech: data.results?.[0]?.lexicalEntries?.[0]?.lexicalCategory?.text,
      source: 'oxford'
    };
  }
}
