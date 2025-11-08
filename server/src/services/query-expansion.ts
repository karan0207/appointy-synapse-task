// Goal: Expand and improve natural language queries for better search
// Helps convert user queries into better search terms

/**
 * Expand query with synonyms and related terms
 * This helps find content even when exact words don't match
 */
export function expandQuery(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const expansions: string[] = [query]; // Always include original

  // Common synonym expansions for better search coverage
  const synonyms: Record<string, string[]> = {
    // Learning and guides
    'how to': ['tutorial', 'guide', 'instructions', 'steps'],
    'learn': ['study', 'understand', 'master', 'tutorial'],

    // Content types
    'recipe': ['cooking', 'dish', 'meal', 'food'],
    'tip': ['advice', 'suggestion', 'recommendation', 'hint'],
    'problem': ['issue', 'error', 'bug', 'trouble'],
    'solution': ['fix', 'answer', 'resolve', 'workaround'],
    'code': ['programming', 'script', 'implementation'],

    // Quality descriptors
    'best': ['top', 'greatest', 'excellent', 'recommended'],
    'good': ['quality', 'excellent', 'great'],

    // Media types - important for filtering
    'image': ['photo', 'picture', 'screenshot', 'pic'],
    'photo': ['image', 'picture', 'photograph'],
    'picture': ['image', 'photo', 'pic'],
    'screenshot': ['image', 'capture', 'screen'],

    // Content types
    'link': ['url', 'article', 'website', 'page'],
    'article': ['post', 'blog', 'content', 'writing'],
    'note': ['text', 'memo', 'thought', 'idea'],
    'file': ['document', 'doc', 'attachment'],

    // Animals - common image subjects
    'dog': ['puppy', 'canine', 'pet'],
    'cat': ['kitten', 'feline', 'pet'],
    'animal': ['creature', 'wildlife', 'pet'],
    'bird': ['avian', 'fowl'],
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
  // Stop words - common words with little search value
  // NOTE: Do NOT include content-type words (image, photo, note, link, etc.)
  // as they are used for filtering and should be preserved
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'their', 'if', 'up', 'out',
    'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make',
    'like', 'into', 'him', 'time', 'has', 'look', 'two', 'more', 'write',
    'go', 'see', 'number', 'no', 'way', 'could', 'people', 'my', 'than',
    'first', 'been', 'call', 'who', 'oil', 'sit', 'now', 'down',
    'day', 'did', 'get', 'come', 'made', 'may', 'part', 'over', 'new',
    'sound', 'take', 'only', 'little', 'work', 'know', 'place', 'year',
    'live', 'me', 'back', 'give', 'most', 'very', 'after', 'thing', 'our',
    'just', 'name', 'good', 'sentence', 'man', 'think', 'say', 'great',
    'where', 'through', 'much', 'before', 'line', 'right', 'too',
    'mean', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want',
    'also', 'around', 'form', 'three', 'small', 'set', 'put',
    'end', 'does', 'another', 'well', 'large', 'must', 'big', 'even',
    'such', 'because', 'turn', 'here', 'why', 'ask', 'went', 'men',
    'read', 'need', 'land', 'different', 'home', 'us', 'move', 'try',
    'kind', 'hand', 'again', 'change', 'off', 'play', 'spell',
    'air', 'away', 'house', 'point', 'page', 'letter', 'mother',
    'answer', 'found', 'still', 'should', 'america',
    'world', 'high', 'every', 'near', 'add', 'between', 'own',
    'below', 'country', 'last', 'school', 'father', 'keep',
    'never', 'start', 'earth', 'eye', 'light', 'head', 'under',
    'story', 'saw', 'left', 'don\'t', 'few', 'while', 'along', 'might',
    'close', 'something', 'seem', 'next', 'hard', 'open', 'example', 'begin',
    'life', 'always', 'those', 'both', 'paper', 'together', 'got', 'group',
    'often', 'run', 'important', 'until', 'children', 'side', 'feet', 'car',
    'mile', 'night', 'walk', 'white', 'sea', 'began', 'grow', 'took', 'river',
    'four', 'carry', 'state', 'once', 'hear', 'stop', 'without',
    'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face', 'watch',
    'far', 'indian', 'really', 'almost', 'let', 'above', 'girl', 'sometimes',
    'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'leave',
    'family', 'it\'s'
  ]);

  // Split by spaces and punctuation, but keep multi-word phrases together
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates

  // Also check for common multi-word phrases (like "machine learning", "artificial intelligence")
  // These should be kept together for better matching
  const phrases: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Common technical phrases that should be preserved
  const technicalPhrases = [
    'machine learning', 'artificial intelligence', 'deep learning',
    'neural network', 'data science', 'web development',
    'software engineering', 'cloud computing', 'cyber security'
  ];
  
  for (const phrase of technicalPhrases) {
    if (lowerQuery.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  // Combine individual words and phrases
  return [...phrases, ...words];
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

