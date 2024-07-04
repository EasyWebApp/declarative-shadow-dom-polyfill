# Declarative Shadow DOM polyfill

Web standard polyfill for [Declarative Shadow DOM][1]

[![NPM Dependency](https://img.shields.io/librariesio/github/EasyWebApp/declarative-shadow-dom-polyfill.svg)][2]
[![CI & CD](https://github.com/EasyWebApp/declarative-shadow-dom-polyfill/actions/workflows/main.yml/badge.svg)][3]
[![](https://data.jsdelivr.com/v1/package/npm/declarative-shadow-dom-polyfill/badge?style=rounded)][4]

[![NPM](https://nodei.co/npm/declarative-shadow-dom-polyfill.png?downloads=true&downloadRank=true&stars=true)][5]

## Knowledge

1. [Proposal specification][2]
2. [API documentation][3]

## Usage

Any one of these methods shown below is available.

### 1. CDN

```html
<head>
  <script src="https://polyfill.web-cell.dev/feature/DeclarativeShadowDOM.js"></script>
</head>
```

### 2. Polyfill import

```javascript
import "declarative-shadow-dom-polyfill";

const markup = `
<my-tag>
    <template shadowrootmode="open">
        <p>Hello, Declarative Shadow DOM!</p>
    <template/>
</my-tag>`;

document.body.setHTMLUnsafe(markup);

console.assert(markup === document.body.getHTML(), "Shadow DOM serialization");

const newDocument = Document.parseHTMLUnsafe(markup);

console.assert(markup === newDocument.body.getHTML(), "Shadow DOM parsing");
```

### 3. Ponyfill import

```javascript
import {
  getHTML,
  setHTMLUnsafe,
  parseHTMLUnsafe,
} from "declarative-shadow-dom-polyfill";

const markup = `
<my-tag>
    <template shadowrootmode="open">
        <p>Hello, Declarative Shadow DOM!</p>
    <template/>
</my-tag>`;

setHTMLUnsafe.call(document.body, markup);

console.assert(
  markup === getHTML.call(document.body),
  "Shadow DOM serialization"
);
const newDocument = parseHTMLUnsafe(markup);

console.assert(markup === getHTML.call(newDocument.body), "Shadow DOM parsing");
```

### 4. Node.js & Bun

#### `global.js`

Either `jsdom`, `happy-dom` or `linkedom` is available DOM implementation.

```javascript
import { Window } from "happy-dom";

const window = new Window(),
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
```

#### `index.js`

```javascript
import "./global";
import "declarative-shadow-dom-polyfill";

console.log(document.body.getHTML());
```

[1]: https://developer.chrome.com/docs/css-ui/declarative-shadow-dom
[2]: https://libraries.io/npm/declarative-shadow-dom-polyfill
[3]: https://github.com/EasyWebApp/declarative-shadow-dom-polyfill/actions/workflows/main.yml
[4]: https://www.jsdelivr.com/package/npm/declarative-shadow-dom-polyfill
[5]: https://nodei.co/npm/declarative-shadow-dom-polyfill/
[6]: https://github.com/mfreed7/declarative-shadow-dom
[7]: https://web-cell.dev/declarative-shadow-dom-polyfill/
