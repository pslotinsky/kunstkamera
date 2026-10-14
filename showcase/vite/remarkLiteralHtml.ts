import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

/** Existing Markdown uses angle brackets as literal placeholders, not embedded HTML. */
export function remarkLiteralHtml() {
  return (tree: Root) => {
    visit(tree, 'html', (node, index, parent) => {
      if (parent && index !== undefined) {
        parent.children[index] = { type: 'text', value: node.value };
      }
    });
  };
}
