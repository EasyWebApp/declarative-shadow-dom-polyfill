import { JSDOM } from "jsdom";

const { window } = new JSDOM(),
  RequiredAPI = [
    "Text",
    "Comment",
    "CDATASection",
    "Element",
    "HTMLElement",
    "SVGElement",
    "ShadowRoot",
    "Document",
    "NodeFilter",
    "XMLSerializer",
    "DOMParser",
    "window",
    "document",
  ];

for (const key of RequiredAPI) Reflect.set(globalThis, key, window[key]);
