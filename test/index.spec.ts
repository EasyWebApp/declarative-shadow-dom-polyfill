import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

import "./global";
import "../source";

const innerHTML = `<p>Hello, Declarative Shadow DOM!</p>`;
const shadowHTML = `
    <template shadowrootmode="open">
        ${innerHTML}
    </template>`;
const outerHTML = `
    <my-tag>
        ${shadowHTML}
    </my-tag>`;

describe("Document.parseHTMLUnsafe()", () => {
  it("should parse a Declarative Shadow DOM string into a Document", () => {
    const { body } = Document["parseHTMLUnsafe"](outerHTML);

    const outerElements = body.querySelectorAll("*");

    strictEqual(outerElements.length, 1);
    strictEqual(outerElements[0].tagName.toLowerCase(), "my-tag");
    strictEqual(outerElements[0].shadowRoot.innerHTML.trim(), innerHTML);
  });
});

describe(".setHTMLUnsafe()", () => {
  it("should create a Shadow DOM tree with an HTML string", () => {
    document.body.setHTMLUnsafe(outerHTML);

    const outerElements = document.body.querySelectorAll("*");

    strictEqual(outerElements.length, 1);
    strictEqual(outerElements[0].tagName.toLowerCase(), "my-tag");
    strictEqual(outerElements[0].shadowRoot.innerHTML.trim(), innerHTML);
  });
});

describe(".getHTML()", () => {
  it("should return `.innerHTML` value with no parameter", () => {
    const { body } = document;
    const myTag = body.firstElementChild;
    const { shadowRoot } = myTag;

    strictEqual(body.innerHTML, body.getHTML());
    strictEqual(myTag.innerHTML, myTag.getHTML());
    strictEqual(shadowRoot.innerHTML, shadowRoot.getHTML());
  });

  it("should return `.innerHTML` value with invalid parameters", () => {
    strictEqual(
      document.body.innerHTML,
      document.body.getHTML({ serializableShadowRoots: true }),
    );

    const missMatchedShadowRoot = document
      .createElement("div")
      .attachShadow({ mode: "open" });

    strictEqual(
      document.body.innerHTML,
      document.body.getHTML({
        serializableShadowRoots: true,
        shadowRoots: [missMatchedShadowRoot],
      }),
    );
  });

  it("should generate a Declarative Shadow DOM string with valid parameters", () => {
    const serializedHTML = document.body.getHTML({
      serializableShadowRoots: true,
      shadowRoots: [document.querySelector("my-tag").shadowRoot],
    });

    strictEqual(
      serializedHTML.replace(/\s/g, ""),
      outerHTML.replace(/\s/g, ""),
    );
  });
});
