export interface HTMLSerializationOptions {
  serializableShadowRoots?: boolean;
  shadowRoots?: ShadowRoot[];
}

const xmlSerializer = new XMLSerializer();
/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getHTML}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/getHTML}
 */
export function getHTML(
  this: Element | ShadowRoot,
  { serializableShadowRoots, shadowRoots }: HTMLSerializationOptions = {},
) {
  shadowRoots = shadowRoots?.filter(Boolean) || [];

  if (!serializableShadowRoots || !shadowRoots[0])
    return (this as HTMLElement).innerHTML;

  if (this instanceof HTMLElement) {
    const { shadowRoot } = this.attachInternals();

    return shadowRoots.includes(shadowRoot)
      ? `<template shadowrootmode="${shadowRoot.mode}">${getHTML.call(
          shadowRoot,
          { serializableShadowRoots, shadowRoot },
        )}</template>`
      : this.innerHTML;
  }

  const walker = document.createTreeWalker(this, NodeFilter.SHOW_ALL, {
      acceptNode: (node) =>
        node === this || node instanceof SVGElement
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
    else if (currentNode instanceof SVGElement)
      markup.push(xmlSerializer.serializeToString(currentNode));
    else if (currentNode instanceof Element) {
      const tagName = currentNode.tagName.toLowerCase(),
        attributes = [...currentNode.attributes].map(
          ({ name, value }) => `${name}=${JSON.parse(value)}`,
        );
      markup.push(
        `<${tagName} ${attributes.join(" ")}>${getHTML.call(currentNode, {
          serializableShadowRoots,
          shadowRoots,
        })}</${tagName}>`,
      );
    }
  }
  return markup.join("");
}

export function attachDeclarativeShadowRoots(root: HTMLElement | ShadowRoot) {
  const templates = root.querySelectorAll<HTMLTemplateElement>(
    "template[shadowrootmode]",
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
/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/setHTMLUnsafe}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/setHTMLUnsafe}
 */
export function setHTMLUnsafe(this: Element | ShadowRoot, html: string) {
  this.innerHTML = html;

  attachDeclarativeShadowRoots(this as HTMLElement);
}

const domParser = new DOMParser(),
  initDocument = ({ documentElement } = document) =>
    attachDeclarativeShadowRoots(documentElement);
/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/parseHTMLUnsafe_static}
 */
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

Element.prototype.getHTML ||= getHTML;
Element.prototype.setHTMLUnsafe ||= setHTMLUnsafe;
ShadowRoot.prototype.getHTML ||= getHTML;
ShadowRoot.prototype.setHTMLUnsafe ||= setHTMLUnsafe;
Document["parseHTMLUnsafe"] ||= parseHTMLUnsafe;

new Promise<Event | void>((resolve) => {
  if (document.readyState === "complete") resolve();
  else {
    document.addEventListener("DOMContentLoaded", resolve);
    window.addEventListener("load", resolve);
  }
}).then(() => initDocument());
