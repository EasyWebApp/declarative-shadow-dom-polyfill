export interface HTMLSerializationOptions {
  serializableShadowRoots?: boolean;
  shadowRoots?: ShadowRoot[];
}

const xmlSerializer = new XMLSerializer();

export function getHTML(
  this: Element | ShadowRoot,
  { serializableShadowRoots, shadowRoots }: HTMLSerializationOptions = {}
) {
  if (!serializableShadowRoots) return (this as HTMLElement).innerHTML;

  const walker = document.createTreeWalker(this, NodeFilter.SHOW_ALL, {
      acceptNode: (node) =>
        node instanceof SVGElement
          ? NodeFilter.FILTER_SKIP
          : NodeFilter.FILTER_ACCEPT,
    }),
    markup: string[] = [];
  var currentNode: Node | null = null;

  while ((currentNode = walker.nextNode())) {
    if (currentNode instanceof CDATASection)
      markup.push(`<![CDATA[${currentNode.nodeValue}]]>`);
    else if (currentNode instanceof Text)
      markup.push(currentNode.nodeValue || "");
    else if (currentNode instanceof Comment)
      markup.push(`<!--${currentNode.nodeValue}-->`);
    else if (currentNode instanceof ShadowRoot)
      markup.push(`<template shadowrootmode="${currentNode.mode}">`);
    else if (currentNode instanceof SVGElement)
      markup.push(xmlSerializer.serializeToString(currentNode));
    else if (currentNode instanceof Element) {
      const attributes = [...currentNode.attributes].map(
        ({ name, value }) => `${name}=${JSON.parse(value)}`
      );
      markup.push(
        `<${currentNode.tagName.toLowerCase()} ${attributes.join(" ")}>`
      );
      if (currentNode instanceof HTMLElement) {
        const { shadowRoot } = currentNode.attachInternals();

        if (
          shadowRoot &&
          (!shadowRoots?.filter(Boolean)[0] || shadowRoots.includes(shadowRoot))
        )
          markup.push(getHTML.call(shadowRoot));
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

export function attachDeclarativeShadowRoots(root: HTMLElement | ShadowRoot) {
  const templates = root.querySelectorAll<HTMLTemplateElement>(
    "template[shadowrootmode]"
  );

  for (const template of templates) {
    const { parentElement, shadowRootMode: mode, content } = template;
    // @ts-ignore
    const shadowRoot = parentElement!.attachShadow({ mode });

    shadowRoot.append(content);

    template.remove();

    attachDeclarativeShadowRoots(shadowRoot);
  }
}

export function setHTMLUnsafe(this: Element | ShadowRoot, html: string) {
  this.innerHTML = html;

  attachDeclarativeShadowRoots(this as HTMLElement);
}

const domParser = new DOMParser(),
  initDocument = (document = globalThis.document) =>
    attachDeclarativeShadowRoots(document.documentElement);

export function parseHTMLUnsafe(html: string) {
  const document = domParser.parseFromString(html, "text/html");

  initDocument(document);

  return document;
}

declare global {
  interface ShadowRootSerializable {
    getHTML: typeof getHTML;
    setHTMLUnsafe: typeof setHTMLUnsafe;
  }
  interface Element extends ShadowRootSerializable {}
  interface ShadowRoot extends ShadowRootSerializable {}
}

globalThis.Element.prototype.getHTML ||= getHTML;
globalThis.Element.prototype.setHTMLUnsafe ||= setHTMLUnsafe;
globalThis.ShadowRoot.prototype.getHTML ||= getHTML;
globalThis.ShadowRoot.prototype.setHTMLUnsafe ||= setHTMLUnsafe;
globalThis.document["parseHTMLUnsafe"] ||= parseHTMLUnsafe;

new Promise<Event | void>((resolve) => {
  if (globalThis.document.readyState === "complete") resolve();
  else {
    globalThis.document.addEventListener("DOMContentLoaded", resolve);
    globalThis.window.addEventListener("load", resolve);
  }
}).then(() => initDocument());
