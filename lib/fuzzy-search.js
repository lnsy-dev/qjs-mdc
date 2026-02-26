// Minimal fuzzy search implementation
class FuzzySearch {
  constructor(items, options) {
    this.items = items;
    this.keys = options.keys || [];
  }
  
  search(query) {
    if (!query) return this.items.map((item, i) => ({ item, refIndex: i }));
    
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      let score = 0;
      
      for (const key of this.keys) {
        const value = String(item[key] || '').toLowerCase();
        if (value.includes(lowerQuery)) {
          score += 10;
          if (value.startsWith(lowerQuery)) score += 5;
        }
      }
      
      if (score > 0) {
        results.push({ item, refIndex: i, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
}
