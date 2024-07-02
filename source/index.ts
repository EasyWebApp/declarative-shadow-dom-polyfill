function getHTML(this: Element | DocumentFragment) {
  const walker = document.createTreeWalker(this),
    markup: string[] = [];
  var currentNode: Node | null = null;

  while ((currentNode = walker.nextNode())) {
    if (currentNode instanceof Text) markup.push(currentNode.nodeValue || "");
    else if (currentNode instanceof Comment)
      markup.push(`<!--${currentNode.nodeValue}-->`);
    else if (currentNode instanceof ShadowRoot)
      markup.push(`<template shadowrootmode="${currentNode.mode}">`);
    else if (currentNode instanceof Element) {
      const attributes = [...currentNode.attributes].map(
        ({ name, value }) => `${name}=${JSON.parse(value)}`
      );
      markup.push(
        `<${currentNode.tagName.toLowerCase()} ${attributes.join(" ")}>`
      );
      if (currentNode instanceof HTMLElement) {
        const { shadowRoot } = currentNode.attachInternals();

        if (shadowRoot) markup.push(getHTML.call(shadowRoot));
      }
    }
    const { parentNode } = currentNode;

    if (
      !currentNode.nextSibling &&
      parentNode &&
      (parentNode === this || this.contains(parentNode))
    )
      if (parentNode instanceof ShadowRoot) markup.push("</template>");
      else if (parentNode instanceof Element)
        markup.push(`</${parentNode.tagName.toLowerCase()}>`);
  }

  return markup.join("");
}

globalThis.Element.prototype["getHTML"] ||= getHTML;
globalThis.DocumentFragment.prototype["getHTML"] ||= getHTML;
