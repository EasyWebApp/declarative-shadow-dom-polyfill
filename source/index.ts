export interface HTMLSerializationOptions {
  serializableShadowRoots?: boolean;
  shadowRoots?: ShadowRoot[];
}

const xmlSerializer = new XMLSerializer(),
  { attachShadow } = HTMLElement.prototype,
  shadowDOMs = new WeakMap<Element, ShadowRoot>();

HTMLElement.prototype.attachShadow = function (options: ShadowRootInit) {
  const shadowRoot = attachShadow.call(this, options);

  shadowDOMs.set(this, shadowRoot);

  return shadowRoot;
};

export function* findShadowRoots(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: Element) =>
      node instanceof HTMLElement
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
  });
  var currentNode: HTMLElement | null = null;

  while ((currentNode = walker.nextNode() as HTMLElement)) {
    const shadowRoot = shadowDOMs.get(currentNode);

    if (shadowRoot) {
      yield shadowRoot;
      yield* findShadowRoots(shadowRoot);
    }
  }
}

export function* generateHTML(
  root: Node,
  { serializableShadowRoots, shadowRoots }: HTMLSerializationOptions = {}
) {
  shadowRoots = shadowRoots?.filter(Boolean) || [];

  if (!serializableShadowRoots || !shadowRoots[0]) {
    yield (root as HTMLElement).innerHTML;
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
    acceptNode: (node) =>
      node === root || node instanceof SVGElement
        ? NodeFilter.FILTER_SKIP
        : NodeFilter.FILTER_ACCEPT
  });
  var currentNode: Node | null = null;

  while ((currentNode = walker.nextNode())) {
    if (currentNode instanceof CDATASection)
      yield `<![CDATA[${currentNode.nodeValue}]]>`;
    else if (currentNode instanceof Text) yield currentNode.nodeValue || "";
    else if (currentNode instanceof Comment)
      yield `<!--${currentNode.nodeValue}-->`;
    else if (currentNode instanceof SVGElement)
      yield xmlSerializer.serializeToString(currentNode);
    else if (currentNode instanceof Element) {
      const tagName = currentNode.tagName.toLowerCase(),
        attributes = [...currentNode.attributes].map(
          ({ name, value }) => `${name}=${JSON.parse(value)}`
        ),
        shadowRoot = shadowDOMs.get(currentNode);

      yield `<${[tagName, ...attributes].join(" ")}>`;

      if (shadowRoots.includes(shadowRoot)) {
        const shadowRootHTML = [
          ...generateHTML(shadowRoot, { serializableShadowRoots, shadowRoots })
        ].join("");

        yield `<template shadowrootmode="${shadowRoot.mode}">${shadowRootHTML}</template>`;
      }
      if (!currentNode.childNodes[0]) yield `</${tagName}>`;
    }
    const { nextSibling, parentElement } = currentNode;

    if (!nextSibling && parentElement && parentElement !== root)
      yield `</${parentElement.tagName.toLowerCase()}>`;
  }
}

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getHTML}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/getHTML}
 */
export function getHTML(
  this: Element | ShadowRoot,
  options: HTMLSerializationOptions = {}
) {
  return [...generateHTML(this, options)].join("");
}

export function attachDeclarativeShadowRoots(root: HTMLElement | ShadowRoot) {
  const templates = root.querySelectorAll<HTMLTemplateElement>(
    "template[shadowrootmode]"
  );

  for (const template of templates) {
    const { parentElement, content } = template;

    const shadowRoot = parentElement!.attachShadow({
      // @ts-ignore
      mode: template.getAttribute("shadowrootmode")
    });

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
  }
  interface Element extends ShadowRootSerializable {}
  interface ShadowRoot extends ShadowRootSerializable {}
}

Element.prototype.getHTML ||= getHTML;
Element.prototype.setHTMLUnsafe ||= setHTMLUnsafe;
ShadowRoot.prototype.getHTML ||= getHTML;
ShadowRoot.prototype.setHTMLUnsafe ||= setHTMLUnsafe;
Document.parseHTMLUnsafe ||= parseHTMLUnsafe;

new Promise<Event | void>((resolve) => {
  if (document.readyState === "complete") resolve();
  else {
    document.addEventListener("DOMContentLoaded", resolve);
    window.addEventListener("load", resolve);
  }
}).then(() => initDocument());
