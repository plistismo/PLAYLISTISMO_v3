// Allowed inline style declarations (normalized: no spaces, lowercase)
const ALLOWED_STYLE_VALUES = new Set([
  'font-weight:400',
  'font-weight:400;',
  'font-weight:700',
  'font-weight:700;',
  'font-weight:bold',
  'font-weight:bold;',
  'font-style:italic',
  'font-style:italic;',
  'font-weight:400;font-style:italic;',
  'font-style:italic;font-weight:400;',
]);

export const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allowedTags = ['B', 'I', 'EM', 'STRONG', 'SPAN', 'DIV', 'P', 'BR'];
  const allowedAttributes = ['style'];
  
  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (!allowedTags.includes(el.tagName)) {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) fragment.appendChild(el.firstChild);
        el.parentNode?.replaceChild(fragment, el);
        return;
      }
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i];
        if (!allowedAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        } else if (attr.name === 'style') {
          const styleVal = attr.value.replace(/\s/g, '').toLowerCase();
          if (!ALLOWED_STYLE_VALUES.has(styleVal)) {
            el.removeAttribute('style');
          }
        }
      }
    }
  };

  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    nodes.push(currentNode);
  }
  for (let i = nodes.length - 1; i >= 0; i--) {
    sanitizeNode(nodes[i]);
  }
  return doc.body.innerHTML;
};

export const decodeHTMLEntities = (text: string): string => {
  if (!text) return '';
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};
