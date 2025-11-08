// Goal: Expand and improve natural language queries for better search
// Helps convert user queries into better search terms

/**
 * Expand query with synonyms and related terms
 * This helps find content even when exact words don't match
 */
export function expandQuery(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const expansions: string[] = [query]; // Always include original

  // Common synonym expansions
  const synonyms: Record<string, string[]> = {
    'how to': ['tutorial', 'guide', 'instructions', 'steps'],
    'recipe': ['cooking', 'dish', 'meal', 'food'],
    'tip': ['advice', 'suggestion', 'recommendation', 'hint'],
    'problem': ['issue', 'error', 'bug', 'trouble'],
    'solution': ['fix', 'answer', 'resolve', 'workaround'],
    'best': ['top', 'greatest', 'excellent', 'recommended'],
    'learn': ['study', 'understand', 'master', 'tutorial'],
    'code': ['programming', 'script', 'implementation'],
    'image': ['photo', 'picture', 'screenshot'],
    'link': ['url', 'article', 'website', 'page'],
    'note': ['text', 'memo', 'thought'],
  };

  // Check for phrases that can be expanded
  for (const [phrase, alternatives] of Object.entries(synonyms)) {
    if (lowerQuery.includes(phrase)) {
      // Add alternatives
      alternatives.forEach(alt => {
        const expanded = query.replace(new RegExp(phrase, 'gi'), alt);
        if (expanded !== query) {
          expansions.push(expanded);
        }
      });
    }
  }

  return [...new Set(expansions)]; // Remove duplicates
}

/**
 * Extract key terms from natural language query
 * Removes stop words and extracts meaningful terms
 */
export function extractKeyTerms(query: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'their', 'if', 'up', 'out',
    'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make',
    'like', 'into', 'him', 'time', 'has', 'look', 'two', 'more', 'write',
    'go', 'see', 'number', 'no', 'way', 'could', 'people', 'my', 'than',
    'first', 'been', 'call', 'who', 'oil', 'sit', 'now', 'find', 'down',
    'day', 'did', 'get', 'come', 'made', 'may', 'part', 'over', 'new',
    'sound', 'take', 'only', 'little', 'work', 'know', 'place', 'year',
    'live', 'me', 'back', 'give', 'most', 'very', 'after', 'thing', 'our',
    'just', 'name', 'good', 'sentence', 'man', 'think', 'say', 'great',
    'where', 'help', 'through', 'much', 'before', 'line', 'right', 'too',
    'mean', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want',
    'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put',
    'end', 'does', 'another', 'well', 'large', 'must', 'big', 'even',
    'such', 'because', 'turn', 'here', 'why', 'ask', 'went', 'men',
    'read', 'need', 'land', 'different', 'home', 'us', 'move', 'try',
    'kind', 'hand', 'picture', 'again', 'change', 'off', 'play', 'spell',
    'air', 'away', 'animal', 'house', 'point', 'page', 'letter', 'mother',
    'answer', 'found', 'study', 'still', 'learn', 'should', 'america',
    'world', 'high', 'every', 'near', 'add', 'food', 'between', 'own',
    'below', 'country', 'plant', 'last', 'school', 'father', 'keep', 'tree',
    'never', 'start', 'earth', 'eye', 'light', 'thought', 'head', 'under',
    'story', 'saw', 'left', 'don\'t', 'few', 'while', 'along', 'might',
    'close', 'something', 'seem', 'next', 'hard', 'open', 'example', 'begin',
    'life', 'always', 'those', 'both', 'paper', 'together', 'got', 'group',
    'often', 'run', 'important', 'until', 'children', 'side', 'feet', 'car',
    'mile', 'night', 'walk', 'white', 'sea', 'began', 'grow', 'took', 'river',
    'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'without',
    'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face', 'watch',
    'far', 'indian', 'really', 'almost', 'let', 'above', 'girl', 'sometimes',
    'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'leave',
    'family', 'it\'s'
  ]);

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}

/**
 * Rewrite query for better semantic understanding
 * Converts questions and natural language into search-friendly format
 */
export function rewriteQuery(query: string): string {
  let rewritten = query.trim();

  // Convert questions to statements
  const questionPatterns = [
    { pattern: /^what (is|are|was|were) (.+)\?*$/i, replacement: '$2' },
    { pattern: /^how (to|do|can|does) (.+)\?*$/i, replacement: '$2 tutorial guide' },
    { pattern: /^where (is|are|can) (.+)\?*$/i, replacement: '$2 location' },
    { pattern: /^when (is|are|did|does) (.+)\?*$/i, replacement: '$2 time date' },
    { pattern: /^why (is|are|does|do) (.+)\?*$/i, replacement: '$2 explanation reason' },
    { pattern: /^who (is|are|was|were) (.+)\?*$/i, replacement: '$2 person' },
    { pattern: /^show (me )?(.+)$/i, replacement: '$2' },
    { pattern: /^find (.+)$/i, replacement: '$1' },
    { pattern: /^search (for )?(.+)$/i, replacement: '$2' },
  ];

  for (const { pattern, replacement } of questionPatterns) {
    if (pattern.test(rewritten)) {
      rewritten = rewritten.replace(pattern, replacement);
      break;
    }
  }

  // Remove question marks and common prefixes
  rewritten = rewritten
    .replace(/\?+$/, '')
    .replace(/^(please|can you|could you|i want|i need|i\'m looking for)\s+/i, '')
    .trim();

  return rewritten || query; // Fallback to original if empty
}

