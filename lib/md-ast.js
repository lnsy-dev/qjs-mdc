/**
 * @fileoverview Markdown to JSON AST parser.
 *
 * Converts a markdown string into a structured JSON tree where headings
 * create nested sections containing their subsequent content as children.
 *
 * Exported API:
 *   parseToAST(markdownContent) → document node
 */

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Phase 1: Tokenize lines into flat token array
// ---------------------------------------------------------------------------

function tokenize(content) {
  const lines = content.split('\n');
  const tokens = [];
  let inFence = false;
  let fenceLang = '';
  let fenceLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle fenced code blocks
    if (!inFence && /^```/.test(line)) {
      inFence = true;
      fenceLang = line.replace(/^```/, '').trim();
      fenceLines = [];
      continue;
    }

    if (inFence) {
      if (/^```/.test(line)) {
        // Close fence — emit a single codeBlock token
        tokens.push({ type: 'codeBlock', language: fenceLang, code: fenceLines.join('\n') });
        inFence = false;
        fenceLang = '';
        fenceLines = [];
      } else {
        fenceLines.push(line);
      }
      continue;
    }

    // Footnote definitions: [^id]: text
    const footnoteMatch = line.match(/^\[\^([^\]]+)\]:\s*(.*)/);
    if (footnoteMatch) {
      tokens.push({ type: 'footnotedef', id: footnoteMatch[1], text: footnoteMatch[2] });
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      tokens.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    // Task list items (must be checked before generic list items)
    const taskCheckedMatch = line.match(/^[-*+]\s+\[x\]\s+(.*)/i);
    if (taskCheckedMatch) {
      tokens.push({ type: 'listitem', text: taskCheckedMatch[1], task: true, checked: true, ordered: false });
      continue;
    }

    const taskUncheckedMatch = line.match(/^[-*+]\s+\[\s\]\s+(.*)/);
    if (taskUncheckedMatch) {
      tokens.push({ type: 'listitem', text: taskUncheckedMatch[1], task: true, checked: false, ordered: false });
      continue;
    }

    // Unordered list items
    const ulMatch = line.match(/^[-*+]\s+(.*)/);
    if (ulMatch) {
      tokens.push({ type: 'listitem', text: ulMatch[1], task: false, ordered: false });
      continue;
    }

    // Ordered list items
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      tokens.push({ type: 'listitem', text: olMatch[1], task: false, ordered: true });
      continue;
    }

    // Blockquotes
    const bqMatch = line.match(/^>\s?(.*)/);
    if (bqMatch) {
      tokens.push({ type: 'blockquote', text: bqMatch[1] });
      continue;
    }

    // Horizontal rules
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      tokens.push({ type: 'hr' });
      continue;
    }

    // Blank lines
    if (!line.trim()) {
      tokens.push({ type: 'blank' });
      continue;
    }

    // Anything else is a text line (part of a paragraph)
    tokens.push({ type: 'text_line', text: line });
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Phase 2: Post-passes on the flat token array
// ---------------------------------------------------------------------------

/**
 * Extract footnote definition tokens into a separate array.
 * Returns { bodyTokens, footnotes }.
 */
function extractFootnotes(tokens) {
  const footnotes = [];
  const bodyTokens = [];

  for (const token of tokens) {
    if (token.type === 'footnotedef') {
      // Try to parse id as a number, fall back to string
      const numId = Number(token.id);
      footnotes.push({
        id: Number.isInteger(numId) ? numId : token.id,
        text: token.text
      });
    } else {
      bodyTokens.push(token);
    }
  }

  // Sort footnotes by id
  footnotes.sort((a, b) => {
    if (typeof a.id === 'number' && typeof b.id === 'number') return a.id - b.id;
    return String(a.id).localeCompare(String(b.id));
  });

  return { bodyTokens, footnotes };
}

/**
 * Collapse adjacent text_line tokens (separated only by blanks within the same
 * paragraph) into paragraph tokens.
 */
function collapseTextLines(tokens) {
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    if (tokens[i].type === 'text_line') {
      const parts = [tokens[i].text];
      i++;
      // Consume further text_line tokens (but stop at blank lines)
      while (i < tokens.length && tokens[i].type === 'text_line') {
        parts.push(tokens[i].text);
        i++;
      }
      result.push({ type: 'paragraph', text: parts.join(' ') });
    } else {
      result.push(tokens[i]);
      i++;
    }
  }

  return result;
}

/**
 * Collapse adjacent listitem tokens into list tokens.
 */
function collapseListItems(tokens) {
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    if (tokens[i].type === 'listitem') {
      const ordered = tokens[i].ordered;
      const items = [];

      while (i < tokens.length && tokens[i].type === 'listitem') {
        const t = tokens[i];
        const item = { type: 'listItem', text: t.text };
        if (t.task) {
          item.task = true;
          item.checked = t.checked;
        }
        items.push(item);
        i++;
      }

      result.push({ type: 'list', ordered, items });
    } else {
      result.push(tokens[i]);
      i++;
    }
  }

  return result;
}

/**
 * Remove blank tokens — they have served as structural delimiters.
 */
function removeBlanks(tokens) {
  return tokens.filter(t => t.type !== 'blank');
}

function postProcess(tokens) {
  const { bodyTokens, footnotes } = extractFootnotes(tokens);
  const collapsed = collapseTextLines(bodyTokens);
  const listed = collapseListItems(collapsed);
  const cleaned = removeBlanks(listed);
  return { tokens: cleaned, footnotes };
}

// ---------------------------------------------------------------------------
// Phase 3: Tree building
// ---------------------------------------------------------------------------

function tokenToNode(token) {
  switch (token.type) {
    case 'paragraph':
      return { type: 'paragraph', text: token.text };
    case 'list':
      return { type: 'list', ordered: token.ordered, items: token.items };
    case 'codeBlock':
      return { type: 'codeBlock', language: token.language, code: token.code };
    case 'blockquote':
      return { type: 'blockquote', text: token.text };
    case 'hr':
      return { type: 'hr' };
    default:
      return { type: token.type };
  }
}

function buildTree(tokens) {
  const root = { type: 'document', children: [] };
  // Stack holds { node, level } pairs; root has level 0
  const stack = [{ node: root, level: 0 }];

  for (const token of tokens) {
    if (token.type === 'heading') {
      const headingNode = {
        type: 'heading',
        level: token.level,
        id: slugify(token.text),
        text: token.text,
        children: []
      };

      // Pop stack entries whose level is >= this heading's level
      while (stack.length > 1 && stack[stack.length - 1].level >= token.level) {
        stack.pop();
      }

      // Attach to current stack top
      stack[stack.length - 1].node.children.push(headingNode);
      stack.push({ node: headingNode, level: token.level });
    } else {
      // Non-heading: child of current stack top
      stack[stack.length - 1].node.children.push(tokenToNode(token));
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a markdown string into a JSON AST document.
 *
 * @param {string} markdownContent - Raw markdown content (frontmatter already stripped)
 * @returns {Object} document node with children and footnotes arrays
 */
export function parseToAST(markdownContent) {
  const rawTokens = tokenize(markdownContent || '');
  const { tokens, footnotes } = postProcess(rawTokens);
  const document = buildTree(tokens);
  document.footnotes = footnotes;
  return document;
}
