export const sanitizeHTML = (html: string): string => {
  if (!html) return '';

  // Decode escaped HTML tags if present (e.g. &lt;i&gt; -> <i>, &lt;b&gt; -> <b>, &lt;span -> <span)
  let raw = html;
  if (/&lt;\/?(b|i|em|strong|span|div|p|br)[^&gt;]*&gt;/i.test(raw)) {
    raw = raw.replace(/&lt;(\/?[a-z0-9]+(?:\s+[^&gt;]*)?)&gt;/gi, '<$1>');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  const allowedTags = ['B', 'I', 'EM', 'STRONG', 'SPAN', 'DIV', 'P', 'BR'];

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      if (!allowedTags.includes(tagName)) {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) fragment.appendChild(el.firstChild);
        el.parentNode?.replaceChild(fragment, el);
        return;
      }

      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i];
        if (attr.name !== 'style') {
          el.removeAttribute(attr.name);
        } else {
          // Parse and sanitize typography style declarations
          const styleRules = attr.value.split(';').map(r => r.trim()).filter(Boolean);
          const safeRules: string[] = [];
          for (const rule of styleRules) {
            const [prop, val] = rule.split(':').map(s => s.trim().toLowerCase());
            if (prop === 'font-weight' && /^(400|700|800|900|bold|normal|bolder)$/.test(val)) {
              safeRules.push(`font-weight: ${val}`);
            } else if (prop === 'font-style' && /^(italic|normal|oblique)$/.test(val)) {
              safeRules.push(`font-style: ${val}`);
            } else if (prop === 'text-decoration' && /^(underline|none)$/.test(val)) {
              safeRules.push(`text-decoration: ${val}`);
            }
          }
          if (safeRules.length > 0) {
            el.setAttribute('style', safeRules.join('; '));
          } else {
            el.removeAttribute('style');
          }
        }
      }
    }
  };

  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const nodes: Node[] = [];
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
