interface SlateTextNode {
  text: string;
}

interface SlateElementNode {
  children: SlateNode[];
}

type SlateNode = SlateTextNode | SlateElementNode;

export interface SlateRange {
  anchor: SlatePoint;
  focus: SlatePoint;
}

interface SlatePoint {
  offset: number;
  path: number[];
}

export interface SlateEditor {
  children: SlateNode[];
  delete: () => void;
  select: (range: SlateRange) => void;
}

function isTextNode(node: SlateNode): node is SlateTextNode {
  return 'text' in node;
}

function getPoint(nodes: SlateNode[], fromEnd: boolean, path: number[] = []): SlatePoint | null {
  const index = fromEnd ? nodes.length - 1 : 0;
  const node = nodes[index];
  if (!node) {
    return null;
  }

  const nextPath = [...path, index];
  if (isTextNode(node)) {
    return { offset: fromEnd ? node.text.length : 0, path: nextPath };
  }

  return getPoint(node.children, fromEnd, nextPath);
}

export function getSlateRange(children: SlateNode[]): SlateRange | null {
  const anchor = getPoint(children, false);
  const focus = getPoint(children, true);
  return anchor && focus ? { anchor, focus } : null;
}

export function clearSlateEditor(editor: SlateEditor): boolean {
  const range = getSlateRange(editor.children);
  if (!range) {
    return false;
  }

  try {
    editor.select(range);
    editor.delete();
    return true;
  } catch {
    return false;
  }
}
