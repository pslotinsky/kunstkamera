import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

/** Preserve authored image references while showing other inline HTML literally. */
export function remarkLiteralHtml() {
  return (tree: Root) => {
    visit(tree, 'html', (node, index, parent) => {
      if (parent && index !== undefined) {
        const image = /^<img\s+([^>]+)>$/.exec(node.value);
        const src = image?.[1]?.match(/\bsrc="([^"]+)"/)?.[1];
        if (src) {
          const alt = image?.[1]?.match(/\balt="([^"]*)"/)?.[1] ?? '';
          const width = image?.[1]?.match(/\bwidth="(\d+)"/)?.[1];
          parent.children[index] = {
            type: 'image',
            url: src,
            alt,
            data: width ? { hProperties: { width } } : undefined,
          };
        } else {
          parent.children[index] = { type: 'text', value: node.value };
        }
      }
    });
  };
}
