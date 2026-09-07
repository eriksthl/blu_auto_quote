(() => {
  "use strict";

  const V972_VERSION = "9.7.3";
  const V972_CHS = "CHS";
  const V972_AGENT_SUPPLIER_KEY = "agent:CHS";
  const V972_HIDDEN_FORWARDING = "__CHS_FORWARDING_BUYING__";
  const V972_HIDDEN_CUSTOMS = "__CHS_CUSTOM_EXPORT_BUYING__";
  const V972_LOCATION_FALLBACKS = new Map([
    ["turku", "FITKU"],
    ["abo turku", "FITKU"],
    ["huittinen", "FIHUN"],
    ["vaasa", "FIVAA"],
    ["vasa", "FIVAA"],
    ["rauma", "FIRAU"],
    ["raumo", "FIRAU"],
    ["rajama", "FIRJM"],
    ["rajamaki", "FIRJM"],
    ["hameenlinna", "FIHMY"],
    ["tavastehus", "FIHMY"],
    ["helsinki", "FIHEL"],
    ["helsingfors helsinki", "FIHEL"],
    ["tampere", "FITMP"],
    ["tammerfors tampere", "FITMP"],
    ["hisings backa", "SEHBA"],
    ["boras", "SEBOS"],
    ["goteborg", "SEGOT"],
    ["gothenburg", "SEGOT"],
    ["jebel ali", "AEJEA"],
    ["ho chi minh city", "VNSGN"],
    ["ho chi minh", "VNSGN"]
  ]);
  const V972_LOCATION_FALLBACK_NAMES = new Map([
    ["FITKU", "Abo (Turku)"],
    ["FIHUN", "Huittinen"],
    ["FIVAA", "Vaasa (Vasa)"],
    ["FIRAU", "Rauma (Raumo)"],
    ["FIRJM", "Rajamaki"],
    ["FIHMY", "Hameenlinna (Tavastehus)"],
    ["FIHEL", "Helsingfors (Helsinki)"],
    ["FITMP", "Tammerfors (Tampere)"],
    ["SEHBA", "Hisings Backa"],
    ["SEBOS", "Boras"],
    ["SEGOT", "Goteborg"],
    ["AEJEA", "Jebel Ali"],
    ["AEFJR", "Fujairah"],
    ["PKKHI", "Karachi"],
    ["INNSA", "Nhava Sheva"],
    ["COCTG", "Cartagena"],
    ["USBOS", "Boston"],
    ["VNHPH", "Haiphong"],
    ["VNSGN", "Ho Chi Minh City"]
  ]);

  const v972Original = {
    setAdvancedMode: setAdvancedModeV920,
    activateMode,
    appendLocationDisplayEditor: appendLocationDisplayEditorV964,
    buildSubject,
    remarksText,
    lclRemarksText,
    lclSubject,
    generateAhk,
    generateLclAhk,
    lclSupplierConfig,
    lclQuoteProfile: lclQuoteProfileV960,
    newLclState,
    calculateLclExport: calculateLclExportV960,
    lclCreateCharges,
    syncLclUi: syncLclV960Ui,
    renderLclExtraCosts,
    applyParsedShipco: applyParsedShipcoQuoteV960,
    resetLclForm
  };

  function v972EscapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function v972Round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function v972Plain(value, digits = 2) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return String(v972Round(number, digits)).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }

  function v972ParseAmount(value) {
    let text = String(value ?? "").trim().replace(/\s+/g, "");
    if (!text) return NaN;
    const negative = /^-/.test(text);
    text = text.replace(/[^0-9.,-]/g, "").replace(/^-/, "");
    if (!text) return NaN;
    const comma = text.lastIndexOf(",");
    const dot = text.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? "," : ".";
      const thousands = decimal === "," ? /\./g : /,/g;
      text = text.replace(thousands, "").replace(decimal, ".");
    } else if (comma >= 0) {
      const decimals = text.length - comma - 1;
      text = decimals === 3 && /^\d{1,3}(?:,\d{3})+$/.test(text)
        ? text.replace(/,/g, "")
        : text.replace(/,/g, ".");
    } else if (dot >= 0) {
      const decimals = text.length - dot - 1;
      if (decimals === 3 && /^\d{1,3}(?:\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
    }
    const parsed = Number(text);
    return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : NaN;
  }

  function v972ParseDecimalMeasure(value) {
    let text = String(value ?? "").trim().replace(/\s+/g, "").replace(/[^0-9.,-]/g, "");
    if (!text) return NaN;
    const comma = text.lastIndexOf(",");
    const dot = text.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? "," : ".";
      text = text.replace(decimal === "," ? /\./g : /,/g, "").replace(decimal, ".");
    } else if (comma >= 0) text = text.replace(/,/g, ".");
    const valueNumber = Number(text);
    return Number.isFinite(valueNumber) ? valueNumber : NaN;
  }

  function v972DayFirstDate(value) {
    const match = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/.exec(String(value || ""));
    if (!match) return "";
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }

  function v972Normal(value) {
    return normaliseSearch(String(value || "")).replace(/[^a-z0-9]+/g, " ").trim();
  }

  function v972SetSupplierStatus(message, kind = "") {
    const status = document.getElementById("supplierPdfStatusV972");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("status-error", kind === "error");
    status.classList.toggle("status-warning", kind === "warning");
  }

  function v972SyncPaymentAgentUi() {
    const advanced = document.body.classList.contains("advanced-mode-enabled");
    const title = document.querySelector(".payment-agent-panel .payment-agent-title");
    if (title) title.textContent = advanced ? "Payment & agent" : "Payment";
  }

  setAdvancedModeV920 = function(enabled) {
    const result = v972Original.setAdvancedMode(enabled);
    v972SyncPaymentAgentUi();
    return result;
  };

  activateMode = function(mode) {
    const result = v972Original.activateMode(mode);
    v972SyncPaymentAgentUi();
    v972SyncChsLclUi();
    return result;
  };

  appendLocationDisplayEditorV964 = function(host, scope, key, suffix = "") {
    const wrap = v972Original.appendLocationDisplayEditor(host, scope, key, suffix);
    const caption = wrap?.querySelector(".v964-location-name-caption");
    const input = wrap?.querySelector("input[data-v964-location-scope]");
    if (caption) caption.textContent = "Custom location name";
    if (input) input.title = "Used in subject, subtitle, remarks and Incoterm location. The UN/LOCODE remains unchanged.";
    return wrap;
  };

  function v972RefreshLocationEditorWording() {
    document.querySelectorAll(".v964-location-name-caption").forEach((caption) => { caption.textContent = "Custom location name"; });
    document.querySelectorAll(".v964-location-name-editor input").forEach((input) => {
      input.title = "Used in subject, subtitle, remarks and Incoterm location. The UN/LOCODE remains unchanged.";
    });
  }

  function v972InstallUi() {
    if (!document.getElementById("v972Styles")) {
      const style = document.createElement("style");
      style.id = "v972Styles";
      style.textContent = `
        #resetForm { grid-column:1 / -1 !important; width:100%; }
        body:not(.advanced-mode-enabled) .payment-agent-row { grid-template-columns:minmax(0, 1fr); }
        body:not(.advanced-mode-enabled) .agent-supplier-cell { display:none !important; }
        .quote-file-import #supplierPdfStatusV972 { min-width:170px; color:#555; font:11px/1.25 Consolas, monospace; }
        .quote-file-import #supplierPdfStatusV972.status-error { color:#a00000; }
        .quote-file-import #supplierPdfStatusV972.status-warning { color:#8a5a00; }
        body.v972-pdf-dragging main { outline:3px dashed #555; outline-offset:5px; }
        .v972-chs-hidden-row { display:none !important; }
        @media (max-width:700px) {
          #resetForm { grid-column:1 / -1 !important; }
          .quote-file-import #supplierPdfStatusV972 { width:100%; }
        }
      `;
      document.head.append(style);
    }

    const supplier = document.getElementById("lclSupplier");
    if (supplier && ![...supplier.options].some((option) => option.value === V972_CHS)) {
      const option = document.createElement("option");
      option.value = V972_CHS;
      option.textContent = "CHS";
      supplier.append(option);
    }

    // v9.7.3: supplier PDFs are loaded from the contextual CHS/Shipco controls.


    if (document.body.dataset.v972DropBound !== "true") {
      document.body.dataset.v972DropBound = "true";
      let dragDepth = 0;
      document.addEventListener("dragenter", (event) => {
        if (![...(event.dataTransfer?.items || [])].some((item) => item.kind === "file")) return;
        dragDepth += 1;
        document.body.classList.add("v972-pdf-dragging");
      });
      document.addEventListener("dragleave", () => {
        dragDepth = Math.max(0, dragDepth - 1);
        if (!dragDepth) document.body.classList.remove("v972-pdf-dragging");
      });
      document.addEventListener("dragover", (event) => {
        if ([...(event.dataTransfer?.items || [])].some((item) => item.kind === "file")) event.preventDefault();
      });
      document.addEventListener("drop", async (event) => {
        dragDepth = 0;
        document.body.classList.remove("v972-pdf-dragging");
        const file = [...(event.dataTransfer?.files || [])].find((candidate) => /\.pdf$/i.test(candidate.name) || candidate.type === "application/pdf");
        if (!file) return;
        event.preventDefault();
        await v972ReadSupplierPdf(file);
      });
    }

    document.getElementById("advancedMode")?.addEventListener("change", () => queueMicrotask(v972SyncPaymentAgentUi));
    v972RefreshLocationEditorWording();
    v972SyncPaymentAgentUi();
  }

  // ---------- PDF text extraction ----------

  function v972PdfLiteralBytes(raw) {
    const bytes = [];
    const value = String(raw || "");
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index) & 0xff;
      if (code !== 0x5c) {
        bytes.push(code);
        continue;
      }
      if (index + 1 >= value.length) break;
      let next = value[index + 1];
      if (next === "\r" || next === "\n") {
        index += 1;
        if (next === "\r" && value[index + 1] === "\n") index += 1;
        continue;
      }
      const escapes = { n: 0x0a, r: 0x0d, t: 0x09, b: 0x08, f: 0x0c, "(": 0x28, ")": 0x29, "\\": 0x5c };
      if (Object.prototype.hasOwnProperty.call(escapes, next)) {
        bytes.push(escapes[next]);
        index += 1;
        continue;
      }
      if (/[0-7]/.test(next)) {
        let octal = next;
        let offset = 2;
        while (offset <= 3 && index + offset < value.length && /[0-7]/.test(value[index + offset])) {
          octal += value[index + offset];
          offset += 1;
        }
        bytes.push(parseInt(octal, 8) & 0xff);
        index += octal.length;
        continue;
      }
      bytes.push(next.charCodeAt(0) & 0xff);
      index += 1;
    }
    return bytes;
  }

  function v972DecodePdfBytes(bytes, cmap) {
    const data = Array.from(bytes || []);
    if (!data.length) return "";
    if (cmap?.size) {
      const candidates = [1, 2, 3, 4].filter((width) => data.length >= width).map((width) => {
        let mappedBytes = 0;
        let mappedItems = 0;
        let unknown = 0;
        let output = "";
        for (let index = 0; index < data.length;) {
          const remaining = data.length - index;
          const size = Math.min(width, remaining);
          let code = 0;
          for (let offset = 0; offset < size; offset += 1) code = (code << 8) | data[index + offset];
          const mapped = size === width ? cmap.get(code) : undefined;
          if (mapped != null) {
            output += mapped;
            mappedBytes += size;
            mappedItems += 1;
          } else {
            unknown += size;
            if (width === 1 && data[index] >= 0x20 && data[index] <= 0x7e) output += String.fromCharCode(data[index]);
          }
          index += size;
        }
        const score = mappedBytes / data.length + mappedItems * 1e-5 - unknown * 1e-7;
        return { width, output, score, mappedBytes };
      }).sort((left, right) => right.score - left.score || right.width - left.width);
      if (candidates[0]?.mappedBytes) return candidates[0].output;
    }
    const evenZero = data.filter((byte, index) => index % 2 === 0 && byte === 0).length;
    if (data.length >= 4 && evenZero >= Math.floor(data.length / 4)) {
      let value = "";
      for (let index = 0; index + 1 < data.length; index += 2) value += String.fromCharCode((data[index] << 8) | data[index + 1]);
      return value;
    }
    return new TextDecoder("latin1").decode(Uint8Array.from(data));
  }

  function v972PdfStringTokens(block) {
    const tokens = [];
    const source = String(block || "");
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] === "(" ) {
        const start = ++index;
        let depth = 1;
        let raw = "";
        for (; index < source.length; index += 1) {
          const char = source[index];
          if (char === "\\") {
            raw += char;
            if (index + 1 < source.length) raw += source[++index];
            continue;
          }
          if (char === "(") depth += 1;
          if (char === ")") {
            depth -= 1;
            if (!depth) break;
          }
          raw += char;
        }
        tokens.push({ type: "literal", value: raw, start });
      } else if (source[index] === "<" && source[index + 1] !== "<") {
        const end = source.indexOf(">", index + 1);
        if (end > index) {
          const hex = source.slice(index + 1, end).replace(/\s+/g, "");
          if (/^[0-9A-Fa-f]+$/.test(hex)) tokens.push({ type: "hex", value: hex, start: index });
          index = end;
        }
      }
    }
    return tokens;
  }

  function v972DecodePdfToken(token, cmap) {
    if (token.type === "literal") return v972DecodePdfBytes(v972PdfLiteralBytes(token.value), cmap);
    let hex = token.value;
    if (hex.length % 2) hex += "0";
    const bytes = [];
    for (let index = 0; index + 1 < hex.length; index += 2) bytes.push(parseInt(hex.slice(index, index + 2), 16));
    return v972DecodePdfBytes(bytes, cmap);
  }

  function v972ParentObject(page, objects) {
    const parentId = Number(/\/Parent\s+(\d+)\s+0\s+R/.exec(page?.body || "")?.[1]);
    return parentId ? objects.get(parentId) : null;
  }

  function v972BalancedDictionary(source, startIndex) {
    const text = String(source || "");
    const start = text.indexOf("<<", Math.max(0, startIndex || 0));
    if (start < 0) return "";
    let depth = 0;
    let literalDepth = 0;
    let escaped = false;
    for (let index = start; index < text.length - 1; index += 1) {
      const char = text[index];
      if (literalDepth) {
        if (escaped) { escaped = false; continue; }
        if (char === "\\") { escaped = true; continue; }
        if (char === "(") literalDepth += 1;
        else if (char === ")") literalDepth -= 1;
        continue;
      }
      if (char === "(") { literalDepth = 1; continue; }
      if (char === "<" && text[index + 1] === "<") { depth += 1; index += 1; continue; }
      if (char === ">" && text[index + 1] === ">") {
        depth -= 1;
        index += 1;
        if (!depth) return text.slice(start + 2, index - 1);
      }
    }
    return "";
  }

  function v972ResourceBody(page, objects) {
    let current = page;
    for (let depth = 0; current && depth < 6; depth += 1) {
      const body = current.body || "";
      const resourceRef = /\/Resources\s+(\d+)\s+0\s+R/.exec(body);
      if (resourceRef) return objects.get(Number(resourceRef[1]))?.body || "";
      const direct = /\/Resources\s*<</.exec(body);
      if (direct) return v972BalancedDictionary(body, direct.index + direct[0].length - 2) || body;
      current = v972ParentObject(current, objects);
    }
    return page?.body || "";
  }

  function v972FontRefs(resourceBody, objects) {
    const source = String(resourceBody || "");
    let fontBody = "";
    const fontRef = /\/Font\s+(\d+)\s+0\s+R/.exec(source);
    if (fontRef) fontBody = objects.get(Number(fontRef[1]))?.body || "";
    if (!fontBody) {
      const direct = /\/Font\s*<</.exec(source);
      if (direct) fontBody = v972BalancedDictionary(source, direct.index + direct[0].length - 2);
    }
    if (!fontBody) fontBody = source;
    return new Map([...fontBody.matchAll(/\/(F[A-Za-z0-9_.-]*)\s+(\d+)\s+\d+\s+R/g)].map((match) => [match[1], Number(match[2])]));
  }

  function v972ContentObjects(page, objects) {
    const body = String(page?.body || "");
    const ids = [];
    const array = /\/Contents\s*\[([\s\S]*?)\]/.exec(body);
    if (array) ids.push(...[...array[1].matchAll(/(\d+)\s+\d+\s+R/g)].map((match) => Number(match[1])));
    else {
      const ref = /\/Contents\s+(\d+)\s+\d+\s+R/.exec(body);
      if (ref) ids.push(Number(ref[1]));
    }
    const streams = [];
    const visited = new Set();
    const resolve = (id, depth = 0) => {
      if (!id || depth > 6 || visited.has(id)) return;
      visited.add(id);
      const object = objects.get(id);
      if (!object) return;
      if (object.streamBytes) { streams.push(object); return; }
      const nested = [...String(object.body || "").matchAll(/(\d+)\s+\d+\s+R/g)].map((match) => Number(match[1]));
      nested.forEach((nestedId) => resolve(nestedId, depth + 1));
    };
    ids.forEach((id) => resolve(id));
    return streams;
  }

  function v972MatrixMultiply(left, right) {
    return [
      left[0] * right[0] + left[2] * right[1],
      left[1] * right[0] + left[3] * right[1],
      left[0] * right[2] + left[2] * right[3],
      left[1] * right[2] + left[3] * right[3],
      left[0] * right[4] + left[2] * right[5] + left[4],
      left[1] * right[4] + left[3] * right[5] + left[5]
    ];
  }

  function v972PdfContentTokens(source) {
    const text = String(source || "");
    const tokens = [];
    const isWhite = (char) => /[\x00\x09\x0A\x0C\x0D\x20]/.test(char || "");
    const isDelimiter = (char) => !char || isWhite(char) || /[()<>\[\]{}/%]/.test(char);
    for (let index = 0; index < text.length;) {
      const char = text[index];
      if (isWhite(char)) { index += 1; continue; }
      if (char === "%") {
        while (index < text.length && text[index] !== "\n" && text[index] !== "\r") index += 1;
        continue;
      }
      if (char === "/") {
        const start = ++index;
        while (index < text.length && !isDelimiter(text[index])) index += 1;
        tokens.push({ kind: "name", value: text.slice(start, index) });
        continue;
      }
      if (char === "(") {
        index += 1;
        let depth = 1;
        let raw = "";
        while (index < text.length && depth) {
          const current = text[index++];
          if (current === "\\") {
            raw += current;
            if (index < text.length) raw += text[index++];
            continue;
          }
          if (current === "(") depth += 1;
          else if (current === ")") {
            depth -= 1;
            if (!depth) break;
          }
          raw += current;
        }
        tokens.push({ kind: "string", type: "literal", value: raw });
        continue;
      }
      if (char === "<" && text[index + 1] !== "<") {
        const end = text.indexOf(">", index + 1);
        if (end < 0) break;
        const hex = text.slice(index + 1, end).replace(/\s+/g, "");
        tokens.push({ kind: "string", type: "hex", value: hex });
        index = end + 1;
        continue;
      }
      if ((char === "<" && text[index + 1] === "<") || (char === ">" && text[index + 1] === ">")) {
        tokens.push({ kind: "word", value: text.slice(index, index + 2) });
        index += 2;
        continue;
      }
      if (char === "[" || char === "]") {
        tokens.push({ kind: "bracket", value: char });
        index += 1;
        continue;
      }
      const start = index;
      while (index < text.length && !isDelimiter(text[index])) index += 1;
      const word = text.slice(start, index);
      if (!word) { index += 1; continue; }
      const number = Number(word);
      tokens.push(Number.isFinite(number) && /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(word)
        ? { kind: "number", value: number }
        : { kind: "word", value: word });
    }
    return tokens;
  }

  function v972ExtractContentFragments(content, pageFontMaps, sequenceStart = 0) {
    const tokens = v972PdfContentTokens(content);
    const identity = () => [1, 0, 0, 1, 0, 0];
    let ctm = identity();
    const graphicsStack = [];
    let inText = false;
    let textMatrix = identity();
    let lineMatrix = identity();
    let leading = 0;
    let fontName = "";
    const operands = [];
    const fragments = [];
    let sequence = sequenceStart;
    const numericTail = (count) => operands.slice(-count).map((value) => Number(value));
    const moveLine = (tx, ty) => {
      lineMatrix = v972MatrixMultiply(lineMatrix, [1, 0, 0, 1, Number(tx) || 0, Number(ty) || 0]);
      textMatrix = [...lineMatrix];
    };
    const show = (value) => {
      if (!inText || !value) return;
      const cmap = pageFontMaps.get(fontName) || new Map();
      const strings = Array.isArray(value) ? value.filter((item) => item?.kind === "string") : [value];
      const text = strings.map((token) => v972DecodePdfToken(token, cmap)).join("").replace(/\u0000/g, "");
      if (!text.trim()) return;
      const matrix = v972MatrixMultiply(ctm, textMatrix);
      fragments.push({ x: matrix[4], y: matrix[5], text, sequence: sequence++ });
    };
    const execute = (operator) => {
      if (operator === "q") graphicsStack.push([...ctm]);
      else if (operator === "Q") ctm = graphicsStack.pop() || identity();
      else if (operator === "cm") {
        const matrix = numericTail(6);
        if (matrix.length === 6 && matrix.every(Number.isFinite)) ctm = v972MatrixMultiply(ctm, matrix);
      } else if (operator === "BT") {
        inText = true; textMatrix = identity(); lineMatrix = identity(); leading = 0;
      } else if (operator === "ET") inText = false;
      else if (operator === "Tf") {
        const name = operands.at(-2);
        if (name?.kind === "name") fontName = name.value;
      } else if (operator === "Tm") {
        const matrix = numericTail(6);
        if (matrix.length === 6 && matrix.every(Number.isFinite)) { textMatrix = matrix; lineMatrix = [...matrix]; }
      } else if (operator === "Td" || operator === "TD") {
        const [tx, ty] = numericTail(2);
        if (operator === "TD" && Number.isFinite(ty)) leading = -ty;
        moveLine(tx, ty);
      } else if (operator === "TL") {
        const [value] = numericTail(1); if (Number.isFinite(value)) leading = value;
      } else if (operator === "T*") moveLine(0, -leading);
      else if (operator === "Tj") show(operands.at(-1));
      else if (operator === "TJ") show(operands.at(-1));
      else if (operator === "'") { moveLine(0, -leading); show(operands.at(-1)); }
      else if (operator === '"') { moveLine(0, -leading); show(operands.at(-1)); }
      operands.length = 0;
    };

    for (const token of tokens) {
      if (token.kind === "bracket" && token.value === "[") { operands.push({ kind: "array-start" }); continue; }
      if (token.kind === "bracket" && token.value === "]") {
        const values = [];
        while (operands.length && operands.at(-1)?.kind !== "array-start") values.unshift(operands.pop());
        if (operands.at(-1)?.kind === "array-start") operands.pop();
        operands.push(values);
        continue;
      }
      if (token.kind === "number") { operands.push(token.value); continue; }
      if (token.kind === "name" || token.kind === "string") { operands.push(token); continue; }
      if (token.kind === "word") execute(token.value);
    }
    return fragments;
  }

  async function extractSupplierPdfTextV972(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const objects = parsePdfObjectsV960(bytes);
    if (!objects.size) throw new Error("Could not read the PDF object structure.");
    const fontMapCache = new Map();
    const pageObjects = [...objects.values()].filter((object) => /\/Type\s*\/Page\b/.test(object.body)).sort((left, right) => left.id - right.id);
    if (!pageObjects.length) throw new Error("The PDF contains no readable pages.");
    const pages = [];
    let sequence = 0;

    for (const page of pageObjects) {
      const fontRefs = v972FontRefs(v972ResourceBody(page, objects), objects);
      const pageFontMaps = new Map();
      for (const [fontName, fontId] of fontRefs) {
        if (!fontMapCache.has(fontId)) {
          const font = objects.get(fontId);
          const cmapId = Number(/\/ToUnicode\s+(\d+)\s+\d+\s+R/.exec(font?.body || "")?.[1]);
          const cmapObject = objects.get(cmapId);
          const cmapText = cmapObject ? new TextDecoder("latin1").decode(await decodedPdfObjectStreamV960(cmapObject)) : "";
          fontMapCache.set(fontId, cmapText ? parsePdfCMapV960(cmapText) : new Map());
        }
        pageFontMaps.set(fontName, fontMapCache.get(fontId));
      }

      const fragments = [];
      for (const object of v972ContentObjects(page, objects)) {
        const content = new TextDecoder("latin1").decode(await decodedPdfObjectStreamV960(object));
        const extracted = v972ExtractContentFragments(content, pageFontMaps, sequence);
        if (extracted.length) sequence = extracted.at(-1).sequence + 1;
        fragments.push(...extracted);
      }

      const lines = [];
      fragments.sort((left, right) => right.y - left.y || left.x - right.x || left.sequence - right.sequence).forEach((fragment) => {
        let line = lines.find((candidate) => Math.abs(candidate.y - fragment.y) < 1.25);
        if (!line) { line = { y: fragment.y, fragments: [] }; lines.push(line); }
        line.fragments.push(fragment);
      });
      lines.sort((left, right) => right.y - left.y);
      pages.push(lines.map((line) => line.fragments.sort((left, right) => left.x - right.x || left.sequence - right.sequence).reduce((value, fragment) => {
        const clean = fragment.text.replace(/\s+/g, " ").trim();
        if (!clean) return value;
        return value ? value + (/\s$/.test(value) || /^\s/.test(clean) ? "" : " ") + clean : clean;
      }, "")).filter(Boolean).join("\n"));
    }

    const text = pages.join("\n\f\n").replace(/[\uE000-\uF8FF]/g, "");
    if (!/\b(?:Shipco|Wisor|CHS Air|Quote\s*#)\b/i.test(text)) throw new Error("Could not extract a supported supplier quotation from this PDF.");
    return text;
  }

  extractShipcoPdfTextV960 = extractSupplierPdfTextV972;

  // ---------- Shipco parser fixes ----------

  const V972_SHIPCO_CHARGES = [
    "Pick-up", "Pickup", "Fuel Surcharge", "Inland Freight", "SOLAS Admin Fee", "Documentation",
    "Terminal Handling Charge", "AES Filing Fee", "MPCI Admin Fee", "Ocean Freight", "Non Stacking Fee",
    "War Risk Surcharge", "Emergency Bunker Adjustment Factor", "Emission Trading System Surcharge"
  ];

  const V972_SHIPCO_ALIASES = {
    "Pick-up": ["Pick-up", "Pick up"],
    "Pickup": ["Pickup"],
    "Emergency Bunker Adjustment Factor": ["Emergency Bunker Adjustment Factor", "Emergency Bunker Adjustment"],
    "Emission Trading System Surcharge": ["Emission Trading System Surcharge", "Emission Trading System"]
  };

  function v972ShipcoPatterns(name) {
    return (V972_SHIPCO_ALIASES[name] || [name]).map((alias) => new RegExp(`^${v972EscapeRegExp(alias)}\\b`, "i"));
  }

  function v972ShipcoChargeLine(lines, name) {
    const patterns = v972ShipcoPatterns(name);
    const amountPattern = /\b(?:SEK|USD|EUR)\s*[\d.,]+/i;
    let index = lines.findIndex((line) => patterns.some((pattern) => pattern.test(line.trim())) && amountPattern.test(line));
    if (index < 0) index = lines.findIndex((line) => patterns.some((pattern) => pattern.test(line.trim())));
    if (index < 0) return "";
    let value = lines[index].trim();
    for (let offset = 1; offset <= 4 && index + offset < lines.length; offset += 1) {
      if ((value.match(/\b(?:SEK|USD|EUR)\s*[\d.,]+/gi) || []).length >= 2) break;
      const next = lines[index + offset].trim();
      const another = V972_SHIPCO_CHARGES.some((candidate) => v972ShipcoPatterns(candidate).some((pattern) => pattern.test(next)) && amountPattern.test(next));
      if (another || /^(?:Origin|Ocean|Pickup).*Charges$/i.test(next)) break;
      value += ` ${next}`;
    }
    return value;
  }

  function v972ParseShipcoCharge(lines, name) {
    const line = v972ShipcoChargeLine(lines, name);
    if (!line) return null;
    const amounts = [...line.matchAll(/\b(SEK|USD|EUR)\s*([\d.,]+)/gi)]
      .map((match) => ({ currency: upper(match[1]), value: v972ParseAmount(match[2]) }))
      .filter((amount) => Number.isFinite(amount.value));
    if (!amounts.length) return null;
    const total = amounts.at(-1);
    const rate = amounts[0];
    return { total: v972Plain(total.value), currency: total.currency, rate: v972Plain(rate.value) };
  }

  function v972CombineSameCurrency(...charges) {
    const present = charges.filter(Boolean);
    if (!present.length) return null;
    const currency = present[0].currency;
    if (present.some((charge) => charge.currency !== currency)) throw new Error("Supplier charges use different currencies and cannot be combined automatically.");
    return { total: v972Plain(present.reduce((sum, charge) => sum + v972ParseAmount(charge.total), 0)), currency, rate: "" };
  }

  parseShipcoQuoteV960 = function(text, source = "pasted Shipco quote") {
    const cleaned = stripShipcoMarkupV960(text);
    if (!/Shipco/i.test(cleaned) || !/Ocean Freight/i.test(cleaned)) throw new Error("The supplied text does not look like a Shipco LCL quote.");
    const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);
    const flat = lines.join(" ").replace(/(\d{1,4})\s*-\s*([A-Za-z]{3})\s*-\s*(\d{1,4})/g, "$1-$2-$3").replace(/\s+/g, " ");
    const validRange = /Valid From\s*\/\s*To[\s\S]{0,100}?(\d{1,4}-[A-Za-z]{3}-\d{1,4})\s+to\s+(\d{1,4}-[A-Za-z]{3}-\d{1,4})/i.exec(flat);
    const fallbackExpiry = /\b(\d{1,4}-[A-Za-z]{3}-\d{1,4})\s+to\s+(\d{1,4}-[A-Za-z]{3}-\d{1,4})\b/i.exec(flat);
    const validTo = parseEnglishDateV960(validRange?.[2] || fallbackExpiry?.[2] || fallbackExpiry?.[1] || "");
    const routingStart = flat.search(/\bRouting\s*DOOR\b/i);
    const routeFlat = routingStart >= 0 ? flat.slice(routingStart) : flat;
    const place = /Place of Receipt\s+(?:DOOR\s+)?(.+?)(?=\s+Port of Loading|\s+Port of Discharge|\s+Destination\b)/i.exec(routeFlat)?.[1] || "";
    const collection = (/(?:DOOR\s+)?(.+?)(?:,\s*[A-Z. ]+)?\s+TO\s+CFS\b/i.exec(place)?.[1] || place.split(/\s+TO\s+CFS\s+/i)[0] || "")
      .replace(/^DOOR\s+/i, "").replace(/,\s*SWEDEN\b.*$/i, "").replace(/,\s*\d{3}\s*\d{2}$/i, "").trim();
    const destinationMatch = /Destination\s+(.+?)(?=\s+Terms\b|\s+Cargo Details\b|\s+Rates\b)/i.exec(routeFlat);
    const routingDestination = /\bTO\s+CFS\s+(.+?)(?=\s+Place of Receipt\b|\s+Port of Loading\b|\s+Terms\b)/i.exec(routeFlat);
    const pod = String(destinationMatch?.[1] || routingDestination?.[1] || "").replace(/\s+/g, " ").trim();
    const cargo = /Cargo\s*Details\s*Total\s*(\d+)\s+([\d.,]+)\s*KGS[\s\S]{0,120}?([\d.,]+)\s*CBM/i.exec(routeFlat);
    const costs = cloneLclCosts();
    const rateStart = cleaned.search(/Charge Name[^\n]*(?:PP\s*\/\s*CC|PP\/CC)/i);
    const rateTail = rateStart >= 0 ? cleaned.slice(rateStart) : cleaned;
    const rateEndMatch = /Indicated Rate of Exchange/i.exec(rateTail);
    const chargeText = rateTail.slice(0, rateEndMatch?.index ?? rateTail.length);
    const chargeLines = chargeText.split("\n").map((line) => line.trim()).filter(Boolean);
    const charges = Object.fromEntries(V972_SHIPCO_CHARGES.map((name) => [name, v972ParseShipcoCharge(chargeLines, name)]));
    const trucking = charges["Pick-up"] || charges.Pickup || v972CombineSameCurrency(charges["Fuel Surcharge"], charges["Inland Freight"]);
    const ocean = v972CombineSameCurrency(charges["Ocean Freight"], charges["Non Stacking Fee"]);
    if (!ocean || !trucking || !charges["Terminal Handling Charge"]) throw new Error("The Shipco quote is missing Ocean Freight, pickup charges, or Terminal Handling Charge.");
    costs.trucking = { ...costs.trucking, ...trucking };
    costs.ocean = { ...costs.ocean, ...ocean };
    costs.fuel = { ...costs.fuel, ...(charges["Emergency Bunker Adjustment Factor"] || { total: "0", currency: ocean.currency }) };
    costs.eu = { ...costs.eu, ...(charges["Emission Trading System Surcharge"] || { total: "0", currency: ocean.currency }) };
    if (charges["War Risk Surcharge"]) costs.war = { ...costs.war, ...charges["War Risk Surcharge"] };
    costs.terminal = { ...costs.terminal, ...charges["Terminal Handling Charge"] };
    ["port", "handling", "isps", "customs"].forEach((key) => { costs[key] = { ...costs[key], total: "0", currency: "SEK", rate: "" }; });
    const extras = [];
    const addExtra = (name, options) => {
      const charge = charges[name];
      if (!charge) return;
      extras.push({ name: options.name || upper(name), total: charge.total, currency: charge.currency, originCharge: true, ...options });
    };
    addExtra("SOLAS Admin Fee", { name: "SOLAS ADMIN FEE", outputType: "other", outputDescription: "SOLAS ADMIN FEE", netSelling: true });
    addExtra("Documentation", { name: "DOCUMENTATION FEE", outputType: "other", outputDescription: "DOCUMENTATION FEE", fixedSellingUsd: 40 });
    addExtra("AES Filing Fee", { name: "AES FILING", outputType: "aes filing", outputDescription: "", netSelling: true });
    addExtra("MPCI Admin Fee", { name: "MPCI ADMIN FEE", outputType: "other", outputDescription: "MPCI ADMIN FEE", netSelling: true });
    if (!pod || !cargo?.[1] || !cargo?.[2] || !cargo?.[3]) throw new Error("The Shipco quote is missing route or cargo data.");
    const sailingStart = lines.findIndex((line) => /^Sailing Schedule$/i.test(line));
    const sailingLines = sailingStart >= 0 ? lines.slice(sailingStart + 1) : lines;
    const transit = sailingLines.map((line) => /\s(\d{1,3})\s+(\d{1,3})$/.exec(line)).find(Boolean);
    return {
      validTo, pod, collection, pallets: cargo[1], weight: v972Plain(v972ParseAmount(cargo[2]), 3), volume: v972Plain(v972ParseDecimalMeasure(cargo[3]), 3),
      transitDays: transit?.[2] || transit?.[1] || "", imoDetails: "", directNonStack: /Non\s*Stackable\s+Yes/i.test(flat),
      costs, includeWar: Boolean(charges["War Risk Surcharge"]), extraCharges: extras, source, profile: "SHIPCO"
    };
  };

  applyParsedShipcoQuoteV960 = function(parsed) {
    const collectionCode = v972EnsureLocation(v972CodeForName(parsed.collection, "SE"), parsed.collection);
    const podCode = v972EnsureLocation(v972CodeForName(parsed.pod), parsed.pod);
    v972EnsureLocation("SEGOT", "Goteborg");
    const result = v972Original.applyParsedShipco(parsed);
    state.lcl.directNonStack = Boolean(parsed.directNonStack);
    state.lcl.validTo = parsed.validTo || "";
    state.lcl.pallets = String(parsed.pallets || "");
    state.lcl.weight = String(parsed.weight || "");
    state.lcl.volume = String(parsed.volume || "");
    state.lcl.transitDays = String(parsed.transitDays || "");
    if (collectionCode) v972SetLclLocation(collectionCode, v972CodeName(collectionCode, parsed.collection), "collection", parsed.collection);
    v972SetLclLocation("SEGOT", v972CodeName("SEGOT", "Goteborg"), "pol", "GOTHENBURG");
    if (podCode) v972SetLclLocation(podCode, v972CodeName(podCode, parsed.pod), "pod", parsed.pod);
    v972SyncLclLocationCombos();
    if (document.getElementById("lclStackable")) document.getElementById("lclStackable").value = parsed.directNonStack ? "NON STACKABLE" : "STACKABLE";
    if (parsed.transitDays && document.getElementById("lclTransitDays")) document.getElementById("lclTransitDays").value = parsed.transitDays;
    if (typeof syncLclPhysicalRouteV920 === "function") syncLclPhysicalRouteV920();
    if (typeof syncLocationDisplayInputsV964 === "function") syncLocationDisplayInputsV964();
    updateLclCalculation();
    return result;
  };

  // ---------- CHS parser ----------

  function v972CleanChsText(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .replace(/[\uE000-\uF8FF]/g, "")
      .replace(/\u00ad/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  function v972CarrierCode(value) {
    const normal = v972Normal(value).replace(/\s+/g, " ");
    const aliases = {
      yml: "YANG MING", yangming: "YANG MING", "yang ming": "YANG MING",
      hapaglloyd: "HAPAG-LLOYD", "hapag lloyd": "HAPAG-LLOYD", hlcu: "HAPAG-LLOYD",
      cma: "CMA CGM", cmacgm: "CMA CGM", "cma cgm": "CMA CGM",
      maersk: "MAERSK", oocl: "OOCL", one: "ONE", cosco: "COSCO", evergreen: "EVERGREEN", hmm: "HMM", msc: "MSC"
    };
    const compact = normal.replace(/\s+/g, "");
    const candidate = aliases[normal] || aliases[compact] || upper(value).replace(/\s+/g, " ");
    return CARRIER_CONFIG[candidate] ? candidate : "MSC";
  }

  function v972EquipmentType(size, suffix = "") {
    const feet = String(size || "20");
    const code = upper(suffix).replace(/[^A-Z]/g, "");
    if (code.includes("HC")) return `${feet}'HC`;
    if (code.includes("RE")) return `${feet}'RE`;
    if (code.includes("OT")) return `${feet}'OT (IN-GAUGE)`;
    return `${feet}'DV`;
  }

  function v972ParseChsEquipment(text) {
    const feeIndex = text.search(/^Fee\s+Units/m);
    const header = feeIndex >= 0 ? text.slice(0, feeIndex) : text;
    const equipment = [];
    for (const match of header.matchAll(/\b(\d+)\s*X\s*(20|40)\s*(?:['’]|\/)?\s*(DC|DV|HC|RE|OT)?\b/gi)) {
      const quantity = Math.max(1, Math.trunc(v972ParseAmount(match[1])));
      const type = v972EquipmentType(match[2], match[3] || "");
      const existing = equipment.find((item) => item.type === type);
      if (existing) existing.quantity += quantity;
      else equipment.push({ quantity, type });
    }
    return equipment.length ? equipment : [{ quantity: 1, type: "20'DV" }];
  }

  function v972CodeName(code, fallback = "") {
    const wanted = upper(code);
    return String(state.locations?.get(wanted) || fallback || "").trim();
  }

  function v972EnsureLocation(code, fallbackName = "") {
    const wanted = upper(code);
    if (!/^[A-Z]{2}[A-Z0-9]{3}$/.test(wanted)) return "";
    const canonical = V972_LOCATION_FALLBACK_NAMES.get(wanted) || String(fallbackName || "").trim();
    if (canonical && state.locations instanceof Map && !state.locations.has(wanted)) state.locations.set(wanted, canonical);
    return wanted;
  }

  function v972CodeForName(name, countryHint = "") {
    const clean = String(name || "").trim();
    if (!clean) return "";
    const direct = upper(findLocationCodeByName(clean) || "");
    if (direct && (!countryHint || direct.startsWith(upper(countryHint)))) return direct;
    const wanted = v972Normal(clean);
    const country = upper(countryHint);
    for (const [code, locationName] of state.locations || []) {
      if (country && !code.startsWith(country)) continue;
      if (v972Normal(locationName) === wanted) return code;
    }
    const fallback = V972_LOCATION_FALLBACKS.get(wanted) || "";
    if (fallback && (!country || fallback.startsWith(country))) return fallback;
    return direct;
  }

  function v972PickupLocation(routeBlock) {
    const dataStart = routeBlock.indexOf("\n");
    const data = dataStart >= 0 ? routeBlock.slice(dataStart + 1) : routeBlock;
    const firstCode = /\b[A-Z]{2}[A-Z0-9]{3}\b/.exec(data);
    const raw = (firstCode ? data.slice(0, firstCode.index) : data)
      .replace(/\b(?:Pickup|POL|POD|Via)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[,;\-\s]+|[,;\-\s]+$/g, "");
    const originalTokens = raw.split(/[,;]+/).map((token) => token.trim()).filter(Boolean);
    const countryFirst = /^Finland\b/i.test(raw);
    const candidates = originalTokens.map((token) => token
      .replace(/^\d+\s+/, "")
      .replace(/\b\d{4,6}\b/g, "")
      .replace(/\bFinland\b/gi, "")
      .trim())
      .filter((token) => token && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(token) && !/^\d/.test(token));
    const candidate = (countryFirst ? candidates.at(-1) : candidates[0]) || "";
    const code = v972CodeForName(candidate, "FI");
    return { code, name: v972CodeName(code, candidate) || candidate, displayName: candidate, raw };
  }

  function v972ParseChsRoute(text) {
    const routeHeader = /^.*\bPOL\b.*\bPOD\b.*$/mi.exec(text);
    const feeIndex = text.search(/^Fee\s+Units/m);
    const start = routeHeader?.index ?? 0;
    const block = text.slice(start, feeIndex >= 0 ? feeIndex : text.length);
    const codes = [...block.matchAll(/\b([A-Z]{2}[A-Z0-9]{3})\b/g)].map((match) => ({ code: match[1], index: match.index }));
    if (codes.length < 2) throw new Error("The CHS quote route could not be extracted.");
    const polCode = codes[0].code;
    const podCode = codes.at(-1).code;
    const nameAfter = (code, fallback) => {
      const match = new RegExp(`${v972EscapeRegExp(code)}\\s*,\\s*([^,\\n]+)`, "i").exec(block);
      const displayName = String(match?.[1] || fallback || "").trim();
      return { name: v972CodeName(code, displayName), displayName };
    };
    const pol = nameAfter(polCode, "POL");
    const pod = nameAfter(podCode, "POD");
    return {
      pickup: v972PickupLocation(block),
      polCode, polName: pol.name, polDisplayName: pol.displayName,
      podCode, podName: pod.name, podDisplayName: pod.displayName
    };
  }

  function v972ChsSection(line) {
    const clean = String(line || "").trim();
    const currencyCount = (clean.match(/\b(?:EUR|USD|SEK|NOK|DKK)\b/gi) || []).length;
    if (!clean || clean.includes("•") || currencyCount >= 2) return "";
    if (/^Pickup(?:\s+Truck)?$/i.test(clean)) return "pickup";
    if (/^Origin Charges\b/i.test(clean)) return "origin";
    if (/^Ocean Freight\b|^Ocean$/i.test(clean)) return "ocean";
    return "";
  }

  function v972ParseChsFees(text) {
    const start = text.search(/^Fee\s+Units/m);
    const tail = start >= 0 ? text.slice(start) : text;
    const end = tail.search(/^\s*Estimated total\b/im);
    const body = end >= 0 ? tail.slice(0, end) : tail;
    const lines = body.split("\n");
    const fees = [];
    let section = "other";
    let current = null;
    let pending = [];
    const flush = () => {
      if (!current) return;
      const amounts = [...current.text.matchAll(/(-?\d[\d\s.,]*)\s*(EUR|USD|SEK|NOK|DKK)\b/gi)]
        .map((match) => ({ value: v972ParseAmount(match[1]), currency: upper(match[2]) }))
        .filter((item) => Number.isFinite(item.value));
      if (amounts.length >= 2) {
        const eur = [...amounts].reverse().find((item) => item.currency === "EUR");
        const total = eur || amounts.at(-1);
        const description = current.text.split("•")[0].replace(/\s+/g, " ").trim();
        const basis = current.text.includes("•") ? current.text.split("•").slice(1).join(" • ").replace(/\s+/g, " ").trim() : "";
        fees.push({ section: current.section, description, basis, totalEur: total.value, sourceCurrency: total.currency, text: current.text });
      }
      current = null;
    };
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const nextSection = v972ChsSection(line);
      if (nextSection) {
        flush(); pending = []; section = nextSection; continue;
      }
      if (!line || /^Fee\b/i.test(line)) continue;
      if (/^(?:Shipment details|Powered by|Disclaimer)/i.test(line)) { flush(); break; }
      const currencyCount = (line.match(/\b(?:EUR|USD|SEK|NOK|DKK)\b/gi) || []).length;
      if (currencyCount >= 2) {
        flush();
        current = { section, text: [...pending, line].join(" ") };
        pending = [];
      } else if (current) current.text += ` ${line}`;
      else if (!/^(?:Pickup Truck|Origin Charges|Ocean Freight).*$/i.test(line)) pending.push(line);
    }
    flush();
    return fees;
  }

  function v972ChsFeeCategory(fee) {
    const name = v972Normal(fee.description);
    if (/\b(?:admin|handling) fee\b/.test(name)) return "forwarding";
    if (/\b(?:documentation|b l telex release|bill of lading)\b/.test(name)) return "documentation";
    if (/\bexport customs(?: clearance)?\b/.test(name)) return "customs";
    if (/\b(?:origin thc|terminal handling)\b/.test(name)) return "origin";
    if (/\b(?:seal fee|harbour charge|harbor charge|mrn fee|weighing|security fee)\b/.test(name)) return "ocean";
    if (fee.section === "pickup") return "pickup";
    if (fee.section === "ocean") return "ocean";
    if (fee.section === "origin") return "extraOrigin";
    return "other";
  }

  function v972ExpectedChsTotal(text) {
    const match = /Estimated total[^\n]*?([\d.,]+)\s*EUR/i.exec(text);
    return match ? v972ParseAmount(match[1]) : NaN;
  }

  function v972SumFees(fees, category) {
    return fees.filter((fee) => v972ChsFeeCategory(fee) === category).reduce((sum, fee) => sum + fee.totalEur, 0);
  }

  function v972EquipmentMatchesFee(equipment, fee) {
    const text = v972Normal(`${fee.description} ${fee.basis}`);
    const has20 = /(?:^| )20(?: |$)/.test(text);
    const has40 = /(?:^| )40(?: |$)|40hc|40 hc/.test(text);
    if (has20 && !has40) return equipment.type.startsWith("20'");
    if (has40 && !has20) return equipment.type.startsWith("40'");
    return true;
  }

  function v972AllocateFees(fees, equipment) {
    const totals = Array(equipment.length).fill(0);
    fees.forEach((fee) => {
      let indices = equipment.map((item, index) => v972EquipmentMatchesFee(item, fee) ? index : -1).filter((index) => index >= 0);
      if (!indices.length) indices = equipment.map((_, index) => index);
      const perTeu = /\bper teu\b/i.test(`${fee.description} ${fee.basis}`);
      const weights = indices.map((index) => {
        const item = equipment[index];
        const teu = item.type.startsWith("40'") ? 2 : 1;
        return Math.max(1, item.quantity) * (perTeu ? teu : 1);
      });
      const denominator = weights.reduce((sum, weight) => sum + weight, 0) || 1;
      indices.forEach((index, offset) => { totals[index] += fee.totalEur * weights[offset] / denominator; });
    });
    return totals;
  }

  function parseChsQuoteV972(text, source = "CHS PDF") {
    const cleaned = v972CleanChsText(text);
    if (!/Quote\s*#/i.test(cleaned) || !/(?:Wisor|CHS Air|Origin Charges|Ocean Freight)/i.test(cleaned)) throw new Error("The supplied PDF does not look like a CHS quotation.");
    const flat = cleaned.replace(/\s+/g, " ");
    const quoteNumber = /Quote\s*#\s*([^\n]+)/i.exec(cleaned)?.[1]?.trim() || "";
    const validity = /Issued\s+(\d{1,2}[/.]\d{1,2}[/.]\d{4})\s*\(\s*Valid\s+(\d{1,2}[/.]\d{1,2}[/.]\d{4})\s*-\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4})\s*\)/i.exec(flat);
    const incoterm = upper(/Incoterms\s*:\s*([A-Z]{3})/i.exec(flat)?.[1] || "EXW");
    const direction = upper(/Direction\s*:\s*(EXPORT|IMPORT)/i.exec(flat)?.[1] || "EXPORT");
    const shipmentType = upper(/Shipment\s*Type\s*:\s*(FCL|LCL)/i.exec(flat)?.[1] || "");
    const carrierText = /Carrier\s*:\s*(.+?)(?=\s+Load\s*:|\s+Pickup\s+POL|\s+POL\s+(?:Via\s+)?POD)/i.exec(flat)?.[1]?.trim() || "";
    const transitRange = /Transit\s*Time\s*:\s*~?\s*(\d+)(?:\s*-\s*(\d+))?\s*days/i.exec(flat);
    const freeDays = /Free\s*Days\s*\(POD\)\s*:\s*(\d+)/i.exec(flat)?.[1] || "";
    const paymentDays = /Terms\s+of\s+payment\s*:\s*(\d+)\s*days/i.exec(flat)?.[1] || "";
    const route = v972ParseChsRoute(cleaned);
    const fees = v972ParseChsFees(cleaned);
    if (!fees.length) throw new Error("No CHS charge rows could be extracted from the PDF.");
    const expectedTotal = v972ExpectedChsTotal(cleaned);
    const equipment = shipmentType === "FCL" ? v972ParseChsEquipment(cleaned) : [];
    const stackableMatch = /Load\s*:\s*(Stackable|Unstackable)\s*:\s*(\d+)\s*(?:Pallet|Package|Piece)/i.exec(flat);
    const volume = /Volume\s*:\s*([\d.,]+)\s*CBM/i.exec(flat)?.[1] || /TOTAL\s+([\d.,]+)\s*CBM/i.exec(flat)?.[1] || "";
    const weight = /Weight\s*:\s*([\d.,]+)\s*kg/i.exec(flat)?.[1] || /TOTAL[^\n]*?([\d.,]+)\s*kg/i.exec(flat)?.[1] || "";
    const customer = /Quote\s*#[^\n]*\n\s*([^\n]+)/i.exec(cleaned)?.[1]?.trim() || "";
    return {
      source, quoteNumber, customer, validFrom: v972DayFirstDate(validity?.[2] || ""), validTo: v972DayFirstDate(validity?.[3] || ""),
      incoterm, direction, shipmentType, carrierText, carrier: v972CarrierCode(carrierText),
      transitDays: transitRange?.[2] || transitRange?.[1] || "", transitRange: transitRange ? transitRange[0] : "", freeDays, paymentDays,
      route, equipment, fees, expectedTotal,
      pallets: stackableMatch?.[2] || "1", stackable: upper(stackableMatch?.[1] || "STACKABLE") === "UNSTACKABLE" ? "NON STACKABLE" : "STACKABLE",
      volume: v972Plain(v972ParseDecimalMeasure(volume), 3), weight: v972Plain(v972ParseAmount(weight), 3)
    };
  }

  function v972BalanceChsMapping(parsed, mapped) {
    if (!Number.isFinite(parsed.expectedTotal)) return { ...mapped, difference: 0 };
    const subtotal = Object.values(mapped).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    const difference = v972Round(parsed.expectedTotal - subtotal, 2);
    if (Math.abs(difference) >= 0.005) mapped.ocean = v972Round((mapped.ocean || 0) + difference, 2);
    return { ...mapped, difference };
  }

  function v972BuildFclChsModel(parsed) {
    const byCategory = (category) => parsed.fees.filter((fee) => v972ChsFeeCategory(fee) === category);
    const otherOrigin = [...byCategory("extraOrigin"), ...byCategory("other")];
    let mapping = {
      pickup: v972SumFees(parsed.fees, "pickup"),
      ocean: v972SumFees(parsed.fees, "ocean"),
      origin: v972SumFees(parsed.fees, "origin") + otherOrigin.reduce((sum, fee) => sum + fee.totalEur, 0),
      forwarding: v972SumFees(parsed.fees, "forwarding"),
      documentation: v972SumFees(parsed.fees, "documentation"),
      customs: v972SumFees(parsed.fees, "customs")
    };
    mapping = v972BalanceChsMapping(parsed, mapping);
    const oceanFees = [...byCategory("ocean")];
    if (mapping.difference && oceanFees.length) oceanFees.push({ description: "BALANCING", basis: "", totalEur: mapping.difference, section: "ocean" });
    const pickupFees = byCategory("pickup");
    const originFees = [...byCategory("origin"), ...otherOrigin];
    const oceanAlloc = v972AllocateFees(oceanFees, parsed.equipment);
    const pickupAlloc = v972AllocateFees(pickupFees, parsed.equipment);
    const originAlloc = v972AllocateFees(originFees, parsed.equipment);
    return {
      mapping,
      equipment: parsed.equipment.map((item, index) => ({
        ...item,
        detailRow: 1,
        carrier: parsed.carrier,
        freightAmount: v972Plain(oceanAlloc[index] / Math.max(1, item.quantity)),
        freightCurrency: "EUR",
        precarriageAmount: v972Plain(pickupAlloc[index] / Math.max(1, item.quantity)),
        precarriageCurrency: "EUR",
        includeOriginCharges: originAlloc[index] > 0.005,
        originAmount: v972Plain(originAlloc[index] / Math.max(1, item.quantity)),
        originCurrency: "EUR",
        includeStuff: false,
        freightCollect: false
      }))
    };
  }

  function v972SetDirectionAndMode(direction, mode) {
    const wantedDirection = upper(direction) === "IMPORT" ? "import" : "export";
    if (state.direction !== wantedDirection) activateDirectionV910(wantedDirection, true);
    activateMode(mode);
  }

  function v972ApplyChsFcl(parsed) {
    if (upper(parsed.direction) !== "EXPORT") throw new Error("CHS FCL import quotations are not supported by this version.");
    const model = v972BuildFclChsModel(parsed);
    v972SetDirectionAndMode(parsed.direction, "fcl");
    const data = exportFormData();
    const pickup = parsed.route.pickup;
    v972EnsureLocation(pickup.code, pickup.name || pickup.displayName);
    v972EnsureLocation(parsed.route.polCode, parsed.route.polName);
    v972EnsureLocation(parsed.route.podCode, parsed.route.podName);
    const pickupName = v972CodeName(pickup.code, pickup.name || pickup.displayName);
    const polName = v972CodeName(parsed.route.polCode, parsed.route.polName);
    const podName = v972CodeName(parsed.route.podCode, parsed.route.podName);
    const route = newRoute({
      incoterm: parsed.incoterm,
      includeOnCarriage: true,
      collectionCity: pickupName,
      collectionName: pickupName,
      collectionCode: pickup.code || "",
      collectionCountry: pickup.code?.slice(0, 2) || "FI",
      collectionDisplayName: pickup.displayName || pickup.name || "",
      polName,
      polCode: parsed.route.polCode,
      polCountry: parsed.route.polCode.slice(0, 2),
      polDisplayName: parsed.route.polDisplayName || parsed.route.polName,
      podName,
      podCode: parsed.route.podCode,
      podCountry: parsed.route.podCode.slice(0, 2),
      podDisplayName: parsed.route.podDisplayName || parsed.route.podName,
      transitDays: parsed.transitDays,
      freeDaysMode: parsed.freeDays ? "custom" : "standard",
      freeDays: parsed.freeDays || "7",
      freeDaysType: "detention",
      equipment: model.equipment,
      calculationRows: [
        { detailRow: 1, type: "liner fee", buyingRate: v972Plain(model.mapping.documentation), buyingCurrency: "EUR", supplierKey: V972_AGENT_SUPPLIER_KEY },
        { detailRow: 1, type: "forwarding fee", buyingRate: v972Plain(model.mapping.forwarding), buyingCurrency: "EUR", supplierKey: V972_AGENT_SUPPLIER_KEY },
        { detailRow: 1, type: "custom export", buyingRate: v972Plain(model.mapping.customs), buyingCurrency: "EUR", supplierKey: V972_AGENT_SUPPLIER_KEY }
      ]
    });
    data.appVersion = V972_VERSION;
    data.mode = "FCL";
    data.direction = "export";
    data.validTo = parsed.validTo || data.validTo;
    if (parsed.paymentDays) data.paymentDays = parsed.paymentDays;
    data.useAgent = true;
    data.agent = V972_CHS;
    data.routes = [route];
    data.activeRouteIndex = 0;
    data.advancedMode = true;
    applyImportedData(data);
    document.getElementById("useAgent").checked = true;
    document.getElementById("agent").value = V972_CHS;
    toggleAgent();
    setAdvancedModeV920(true);
    loadActiveRouteIntoForm();
    renderEquipment();
    updateAllPreviews();
    const subtotal = Object.entries(model.mapping).filter(([key]) => key !== "difference").reduce((sum, [, value]) => sum + value, 0);
    return { mappedTotal: subtotal, expectedTotal: parsed.expectedTotal, warning: Math.abs(model.mapping.difference || 0) > 0.01 ? `An unmatched difference of ${v972Plain(model.mapping.difference)} EUR was included in Ocean freight.` : "" };
  }

  function v972LclExtra(name, amount, options = {}) {
    if (!(amount > 0.005)) return null;
    return { name, total: v972Plain(amount), currency: "EUR", originCharge: true, ...options };
  }

  function v972BuildLclChsModel(parsed) {
    let mapping = {
      pickup: v972SumFees(parsed.fees, "pickup"),
      ocean: v972SumFees(parsed.fees, "ocean"),
      terminal: v972SumFees(parsed.fees, "origin"),
      forwarding: v972SumFees(parsed.fees, "forwarding"),
      documentation: v972SumFees(parsed.fees, "documentation"),
      customs: v972SumFees(parsed.fees, "customs"),
      other: v972SumFees(parsed.fees, "extraOrigin") + v972SumFees(parsed.fees, "other")
    };
    mapping = v972BalanceChsMapping(parsed, mapping);
    const extras = [
      v972LclExtra(V972_HIDDEN_FORWARDING, mapping.forwarding, { outputType: "other", outputDescription: V972_HIDDEN_FORWARDING, fixedSellingUsd: 0, v972MergeInto: "forwarding" }),
      v972LclExtra(V972_HIDDEN_CUSTOMS, mapping.customs, { outputType: "other", outputDescription: V972_HIDDEN_CUSTOMS, fixedSellingUsd: 0, v972MergeInto: "customExport" }),
      v972LclExtra("DOCUMENTATION FEE", mapping.documentation, { outputType: "other", outputDescription: "DOCUMENTATION FEE", fixedSellingUsd: 40 }),
      v972LclExtra("OTHER CHS ORIGIN CHARGES", mapping.other, { outputType: "other", outputDescription: "OTHER CHS ORIGIN CHARGES", netSelling: true })
    ].filter(Boolean);
    const knownExtras = parsed.fees.filter((fee) => v972ChsFeeCategory(fee) === "extraOrigin");
    if (knownExtras.length && mapping.other > 0.005) {
      const other = extras.find((charge) => charge.name === "OTHER CHS ORIGIN CHARGES");
      if (other) {
        const label = knownExtras.map((fee) => upper(fee.description)).join(" + ");
        other.name = label;
        other.outputDescription = label;
      }
    }
    return { mapping, extras };
  }

  function v972SetLclLocation(code, name, key, displayName = "") {
    const upperCode = upper(code || "");
    const canonical = v972CodeName(upperCode, name);
    const custom = String(displayName || name || canonical || "").trim();
    state.lcl[`${key}Code`] = upperCode;
    state.lcl[`${key}Name`] = canonical;
    state.lcl[`${key}City`] = canonical;
    state.lcl[`${key}DisplayName`] = custom;
    const cap = key[0].toUpperCase() + key.slice(1);
    const codeInput = document.getElementById(`lcl${cap}Code`);
    const nameInput = document.getElementById(`lcl${cap}Name`);
    if (codeInput) codeInput.value = upperCode;
    if (nameInput) nameInput.value = canonical;
  }

  function v972SyncLclLocationCombos() {
    if (!state.lcl || !(state.locations instanceof Map) || !state.locations.size) return;
    const allCodes = [...state.locations.keys()];
    const syncCombo = (combo, code, optionsFactory) => {
      if (!combo || !code || !state.locations.has(code)) return;
      if (!Array.isArray(combo.options) || combo.options.length !== allCodes.length) combo.setOptions(optionsFactory(), code);
      else if (combo.value !== code) {
        const option = combo.options.find((item) => item.value === code);
        if (option) combo.choose(option, false);
      }
      combo.setDisabled(false);
    };
    const collectionCode = upper(state.lcl.collectionCode || document.getElementById("lclCollectionCode")?.value || "");
    if (typeof lclCollectionCombo !== "undefined") syncCombo(lclCollectionCombo, collectionCode, () => locationOptions(allCodes, false));
    const podCode = upper(state.lcl.podCode || document.getElementById("lclPodCode")?.value || "");
    if (typeof lclPodCombo !== "undefined") syncCombo(lclPodCombo, podCode, () => locationOptions(allCodes));
    const polCode = upper(state.lcl.polCode || document.getElementById("lclPolCode")?.value || "");
    if (typeof lclPolComboV910 !== "undefined") syncCombo(lclPolComboV910, polCode, () => locationOptions(allCodes));
  }

  function v972ApplyChsLcl(parsed) {
    if (upper(parsed.direction) !== "EXPORT") throw new Error("CHS LCL import quotations are not supported by this version.");
    const model = v972BuildLclChsModel(parsed);
    v972SetDirectionAndMode(parsed.direction, "lcl");
    const data = exportLclData();
    const pickup = parsed.route.pickup;
    v972EnsureLocation(pickup.code, pickup.name || pickup.displayName);
    v972EnsureLocation(parsed.route.polCode, parsed.route.polName);
    v972EnsureLocation(parsed.route.podCode, parsed.route.podName);
    const pickupName = v972CodeName(pickup.code, pickup.name || pickup.displayName);
    const polName = v972CodeName(parsed.route.polCode, parsed.route.polName);
    const podName = v972CodeName(parsed.route.podCode, parsed.route.podName);
    const costs = cloneLclCosts(data.costs || {});
    costs.trucking = { total: v972Plain(model.mapping.pickup), currency: "EUR", rate: "" };
    costs.ocean = { total: v972Plain(model.mapping.ocean), currency: "EUR", rate: "" };
    costs.fuel = { total: "0", currency: "EUR", rate: "" };
    costs.eu = { total: "0", currency: "EUR", rate: "" };
    costs.war = { total: "0", currency: "EUR", rate: "" };
    costs.terminal = { total: v972Plain(model.mapping.terminal), currency: "EUR", rate: "" };
    ["port", "handling", "isps", "customs"].forEach((key) => { costs[key] = { total: "0", currency: "EUR", rate: "" }; });
    data.appVersion = V972_VERSION;
    data.mode = "LCL";
    data.direction = "export";
    data.validTo = parsed.validTo || data.validTo;
    if (parsed.paymentDays) data.paymentDays = parsed.paymentDays;
    data.incoterm = parsed.incoterm;
    data.supplier = V972_CHS;
    data.quoteProfile = V972_CHS;
    data.pallets = parsed.pallets || "1";
    data.weight = parsed.weight;
    data.volume = parsed.volume;
    data.stackable = parsed.stackable;
    data.transitDays = parsed.transitDays;
    data.includeWar = false;
    data.costs = costs;
    data.extraCharges = model.extras;
    data.quoteLoaded = true;
    data.quoteLabel = `${parsed.source} #${parsed.quoteNumber}`;
    data.collectionCity = pickupName;
    data.collectionName = pickupName;
    data.collectionCode = pickup.code || "";
    data.collectionDisplayName = pickup.displayName || pickup.name || pickupName;
    data.polName = polName;
    data.polCode = parsed.route.polCode;
    data.polDisplayName = parsed.route.polDisplayName || parsed.route.polName || polName;
    data.podName = podName;
    data.podCode = parsed.route.podCode;
    data.podDisplayName = parsed.route.podDisplayName || parsed.route.podName || podName;
    data.advancedMode = true;
    applyImportedLclData(data);
    state.lcl.quoteProfile = V972_CHS;
    state.lcl.quoteLoaded = true;
    state.lcl.quoteLabel = data.quoteLabel;
    state.lcl.extraCharges = model.extras.map((charge) => ({ ...charge }));
    document.getElementById("lclSupplier").value = V972_CHS;
    document.getElementById("lclStackable").value = parsed.stackable;
    v972SetLclLocation(pickup.code, pickupName, "collection", pickup.displayName || pickup.name);
    v972SetLclLocation(parsed.route.polCode, polName, "pol", parsed.route.polDisplayName || parsed.route.polName);
    v972SetLclLocation(parsed.route.podCode, podName, "pod", parsed.route.podDisplayName || parsed.route.podName);
    v972SyncLclLocationCombos();
    renderLclExtraCosts();
    setLclCosts(costs);
    setAdvancedModeV920(true);
    syncLocationDisplayInputsV964();
    v972SyncChsLclUi();
    updateLclCalculation();
    const loaded = document.getElementById("lclQuoteLoaded");
    loaded?.classList.remove("hidden");
    document.getElementById("lclPasteWrap")?.classList.add("hidden");
    if (document.getElementById("lclQuoteLoadedTitle")) document.getElementById("lclQuoteLoadedTitle").textContent = `CHS quote #${parsed.quoteNumber}`;
    if (document.getElementById("lclQuoteLoadedInfo")) document.getElementById("lclQuoteLoadedInfo").textContent = `${upper(pickup.displayName || pickup.name || "COLLECTION")} → ${upper(parsed.route.polDisplayName || parsed.route.polName)} → ${upper(parsed.route.podDisplayName || parsed.route.podName)} · ${parsed.pallets} pallets · ${parsed.weight} kg · ${parsed.volume} cbm`;
    const subtotal = Object.entries(model.mapping).filter(([key]) => key !== "difference").reduce((sum, [, value]) => sum + value, 0);
    return { mappedTotal: subtotal, expectedTotal: parsed.expectedTotal, warning: Math.abs(model.mapping.difference || 0) > 0.01 ? `An unmatched difference of ${v972Plain(model.mapping.difference)} EUR was included in Ocean freight.` : "" };
  }

  async function v972ReadSupplierPdf(file) {
    if (window.BLU_AUTO_QUOTE_V973?.readSupplierPdf) {
      return window.BLU_AUTO_QUOTE_V973.readSupplierPdf(file, "AUTO");
    }
    try {
      v972SetSupplierStatus(`Reading ${file.name}...`);
      const text = await extractSupplierPdfTextV972(await file.arrayBuffer());
      let result;
      let label;
      if (/Shipco/i.test(text) && /LCL QUOTATION/i.test(text)) {
        v972SetDirectionAndMode("EXPORT", "lcl");
        const parsed = parseShipcoQuoteV960(text, `Shipco PDF ${file.name}`);
        applyParsedShipcoQuoteV960(parsed);
        label = `Shipco LCL · ${parsed.pallets} pcs · ${parsed.weight} kg · ${parsed.volume} cbm`;
      } else {
        const parsed = parseChsQuoteV972(text, file.name);
        result = parsed.shipmentType === "FCL" ? v972ApplyChsFcl(parsed) : v972ApplyChsLcl(parsed);
        const total = Number.isFinite(result.expectedTotal) ? `${v972Plain(result.expectedTotal)} EUR` : "total read";
        label = `CHS ${parsed.shipmentType} #${parsed.quoteNumber} · ${total}`;
        if (result.warning) label += ` · ${result.warning}`;
      }
      v972SetSupplierStatus(label, result?.warning ? "warning" : "");
      const lclMessage = document.getElementById("lclParseMessage");
      if (state.activeMode === "lcl" && lclMessage) {
        lclMessage.textContent = `${label}. Supplier buying rates imported successfully.`;
        lclMessage.classList.remove("status-error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read the supplier PDF.";
      v972SetSupplierStatus(message, "error");
      const lclMessage = document.getElementById("lclParseMessage");
      if (state.activeMode === "lcl" && lclMessage) {
        lclMessage.textContent = message;
        lclMessage.classList.add("status-error");
      }
    }
  }

  // ---------- CHS LCL profile and buying rows ----------

  lclSupplierConfig = function() {
    if (upper(document.getElementById("lclSupplier")?.value || state.lcl?.quoteProfile) === V972_CHS) return { display: "CHS", supplier: "chs", supplierArrow: 0 };
    return v972Original.lclSupplierConfig();
  };

  lclQuoteProfileV960 = function() {
    const raw = upper(document.getElementById("lclSupplier")?.value || state.lcl?.quoteProfile || "NORDICON");
    return raw === V972_CHS ? V972_CHS : v972Original.lclQuoteProfile();
  };

  newLclState = function(overrides = {}) {
    const result = v972Original.newLclState(overrides);
    if (upper(overrides?.quoteProfile || overrides?.supplier) === V972_CHS) result.quoteProfile = V972_CHS;
    return result;
  };

  calculateLclExportV960 = function() {
    if (lclQuoteProfileV960() !== V972_CHS) return v972Original.calculateLclExport();
    const select = document.getElementById("lclSupplier");
    const oldValue = select?.value;
    const oldProfile = state.lcl?.quoteProfile;
    if (select) select.value = "SHIPCO";
    if (state.lcl) state.lcl.quoteProfile = "SHIPCO";
    try {
      const calc = v972Original.calculateLclExport();
      if (calc) calc.profile = V972_CHS;
      return calc;
    } finally {
      if (select) select.value = oldValue || V972_CHS;
      if (state.lcl) state.lcl.quoteProfile = oldProfile || V972_CHS;
    }
  };

  lclCreateCharges = function(calc) {
    const charges = v972Original.lclCreateCharges(calc);
    if (calc?.profile !== V972_CHS) return charges;
    const merge = (sentinel, type) => {
      const index = charges.findIndex((charge) => upper(charge.description) === upper(sentinel));
      if (index < 0) return;
      const hidden = charges[index];
      const target = charges.find((charge) => normaliseSearch(charge.type) === normaliseSearch(type));
      if (target) {
        target.buyRate = hidden.buyRate;
        target.buyCurrency = hidden.buyCurrency;
        target.supplier = "chs";
        target.supplierArrow = 0;
      }
      charges.splice(index, 1);
    };
    merge(V972_HIDDEN_FORWARDING, "forwarding fee");
    merge(V972_HIDDEN_CUSTOMS, "custom export");
    return charges.filter((charge) => {
      const type = normaliseSearch(charge.type);
      if (["fuel", "eu", "war"].includes(type) && Math.abs(v972ParseAmount(charge.buyRate)) < 0.0001 && Math.abs(v972ParseAmount(charge.sellingRate)) < 0.0001) return false;
      return true;
    });
  };

  function v972SyncChsLclUi() {
    if (!state.lcl) return;
    const chs = lclQuoteProfileV960() === V972_CHS && !isImportMode();
    if (chs) v972SyncLclLocationCombos();
    const hiddenKeys = new Set(["fuel", "eu", "war", "port", "handling", "isps", "customs"]);
    document.querySelectorAll(".lcl-cost-table tbody:first-of-type tr").forEach((row) => {
      const key = row.querySelector("[data-lcl-charge]")?.dataset.lclCharge;
      row.classList.toggle("v972-chs-hidden-row", chs && hiddenKeys.has(key));
    });
    const fixed = document.querySelector("#lclFixedPolField .fixed-value");
    if (fixed) {
      const code = upper(state.lcl?.polCode || "SEGOT");
      const name = state.lcl?.polName || v972CodeName(code, "GOTHENBURG");
      fixed.textContent = chs ? `${code} - ${upper(name)}` : "SEGOT - GOTHENBURG";
    }
    if (document.getElementById("lclQuotePaste")) document.getElementById("lclQuotePaste").placeholder = chs ? "Paste the complete CHS quote here" : document.getElementById("lclQuotePaste").placeholder;
  }

  syncLclV960Ui = function() {
    const result = v972Original.syncLclUi();
    v972SyncChsLclUi();
    return result;
  };

  renderLclExtraCosts = function() {
    const result = v972Original.renderLclExtraCosts();
    if (lclQuoteProfileV960() === V972_CHS) {
      document.querySelectorAll("#lclExtraCostsBody .lcl-extra-row").forEach((row) => {
        const index = Number(row.querySelector("[data-lcl-extra-index]")?.dataset.lclExtraIndex);
        const charge = state.lcl.extraCharges?.[index];
        if (charge?.v972MergeInto) row.classList.add("hidden");
      });
    }
    return result;
  };

  resetLclForm = function(confirmReset = true) {
    const result = v972Original.resetLclForm(confirmReset);
    v972SyncChsLclUi();
    return result;
  };

  // ---------- Freight Collect subject/subtitle ----------

  function v972FclDetailSubject(route, group) {
    const subject = quoteText("fcl.subject", { EQUIPMENT: equipmentGroupSummary(group.equipment), ROUTE: routePath(route) });
    return fclDetailFreightCollectV960(route, group.detailRow) ? `${subject} (FREIGHT COLLECT)` : subject;
  }

  buildSubject = function() {
    const base = v972Original.buildSubject();
    if (isImportMode()) return base;
    const details = (state.routes || []).flatMap((route) => groupRouteEquipment(route).map((group) => ({ route, group, collect: fclDetailFreightCollectV960(route, group.detailRow) })));
    if (!details.some((detail) => detail.collect)) return base;
    if (details.every((detail) => detail.collect)) return /\(FREIGHT COLLECT\)$/i.test(base) ? base : `${base} (FREIGHT COLLECT)`;
    return details.map(({ route, group }) => v972FclDetailSubject(route, group)).join(" / ");
  };

  function v972LocationPairsForFcl(route) {
    const values = [
      { key: "collection", code: route?.collectionCode, canonical: routeCollection(route), display: route?.collectionDisplayName },
      { key: "pol", code: route?.polCode, canonical: routePol(route), display: route?.polDisplayName },
      { key: "pod", code: route?.podCode, canonical: routeSubjectPod(route), display: route?.podDisplayName },
      { key: "delivery", code: route?.deliveryCode, canonical: typeof routeDelivery === "function" ? routeDelivery(route) : route?.deliveryName, display: route?.deliveryDisplayName }
    ];
    return values.map((item) => {
      const display = normalisedLocationName(item.display || v972CodeName(item.code, item.canonical) || item.canonical);
      return { canonical: normalisedLocationName(item.canonical || ""), display };
    }).filter((item) => item.canonical && item.display && item.canonical !== item.display).sort((left, right) => right.canonical.length - left.canonical.length);
  }

  function v972LocationPairsForLcl() {
    const pairs = [];
    for (const key of ["collection", "pol", "pod", "delivery"]) {
      const context = locationContextV964("lcl", key);
      if (!context) continue;
      const canonical = normalisedLocationName(context.canonical || "");
      const display = normalisedLocationName(context.target?.[context.field] || context.canonical || "");
      if (canonical && display && canonical !== display) pairs.push({ canonical, display });
    }
    return pairs.sort((left, right) => right.canonical.length - left.canonical.length);
  }

  function v972ReplaceLocations(text, pairs) {
    let output = String(text || "");
    (pairs || []).forEach(({ canonical, display }) => {
      output = output.replace(new RegExp(v972EscapeRegExp(canonical), "gi"), display);
    });
    return output;
  }

  remarksText = function(route = activeRoute(), carrierCode = "MSC", hasIncludedStuff = false) {
    return v972ReplaceLocations(v972Original.remarksText(route, carrierCode, hasIncludedStuff), v972LocationPairsForFcl(route));
  };

  lclRemarksText = function() {
    return v972ReplaceLocations(v972Original.lclRemarksText(), v972LocationPairsForLcl());
  };

  lclSubject = function() {
    let subject;
    if (!isImportMode() && lclQuoteProfileV960() === V972_CHS) {
      const collection = locationContextV964("lcl", "collection");
      const pol = locationContextV964("lcl", "pol");
      const pod = locationContextV964("lcl", "pod");
      const delivery = locationContextV964("lcl", "delivery");
      const name = (context, fallback) => normalisedLocationName(context?.target?.[context.field] || context?.canonical || fallback);
      const points = [];
      if (!lclIsFob()) points.push(name(collection, "COLLECTION"));
      points.push(name(pol, "GOTHENBURG"), name(pod, "POD"));
      if (typeof lclDeliverySelectedV963 === "function" && lclDeliverySelectedV963()) points.push(name(delivery, "DELIVERY"));
      subject = `LCL - ${points.join(" - ")} - ${document.getElementById("lclStackable")?.value || "STACKABLE"}`;
    } else subject = v972Original.lclSubject();
    if (lclFreightCollectV960() && !/\(FREIGHT COLLECT\)$/i.test(subject)) subject += " (FREIGHT COLLECT)";
    return subject;
  };

  function v972ReplaceNthAhkMapValue(script, key, index, value) {
    let seen = 0;
    const pattern = new RegExp(`("${v972EscapeRegExp(key)}",\\s*)("(?:[^"]|"")*")`, "g");
    return String(script).replace(pattern, (match, prefix) => {
      if (seen++ !== index) return match;
      return `${prefix}${ahkString(value)}`;
    });
  }

  function v972FclDetailContexts() {
    const contexts = [];
    (state.routes || []).forEach((route) => groupRouteEquipment(route).forEach((group) => {
      const canonicalIncoterm = typeof routeIncotermLocationV961 === "function" ? routeIncotermLocationV961(route) : (fclIncludesPrecarriage(route) ? routeCollection(route) : routePol(route));
      contexts.push({
        subtitle: v972FclDetailSubject(route, group),
        incotermLocation: v972ReplaceLocations(canonicalIncoterm, v972LocationPairsForFcl(route))
      });
    }));
    return contexts;
  }

  generateAhk = function() {
    let script = v972Original.generateAhk();
    v972FclDetailContexts().forEach((context, index) => {
      script = v972ReplaceNthAhkMapValue(script, "subtitle", index, context.subtitle);
      script = v972ReplaceNthAhkMapValue(script, "incotermLocation", index, context.incotermLocation);
    });
    return script.replaceAll("v9.6.4", `v${V972_VERSION}`);
  };

  generateLclAhk = function() {
    let script = v972Original.generateLclAhk();
    const pairs = v972LocationPairsForLcl();
    const canonical = lclIsFob() ? "GOTHENBURG" : normalisedLocationName(lclCollectionValue());
    const incotermLocation = v972ReplaceLocations(canonical, pairs);
    script = v972ReplaceNthAhkMapValue(script, "incotermLocation", 0, incotermLocation);
    if (!isImportMode() && lclQuoteProfileV960() === V972_CHS) {
      script = v972ReplaceNthAhkMapValue(script, "polCode", 0, upper(state.lcl?.polCode || document.getElementById("lclPolCode")?.value || "SEGOT"));
    }
    return script.replaceAll("v9.6.4", `v${V972_VERSION}`);
  };

  // Keep the older Shipco PDF button on the improved extractor/parser.
  readShipcoPdfV960 = async function(file) {
    const message = document.getElementById("lclParseMessage");
    try {
      if (message) {
        message.textContent = "Reading Shipco PDF...";
        message.classList.remove("status-error");
      }
      const text = await extractSupplierPdfTextV972(await file.arrayBuffer());
      applyParsedShipcoQuoteV960(parseShipcoQuoteV960(text, "Shipco PDF"));
      if (message) message.textContent = "Shipco quote data extracted successfully.";
    } catch (error) {
      if (message) {
        message.textContent = error instanceof Error ? error.message : "Could not read the Shipco PDF.";
        message.classList.add("status-error");
      }
    }
  };

  v972InstallUi();
  installLocationDisplayEditorsV964();
  v972RefreshLocationEditorWording();
  v972SyncChsLclUi();

  window.BLU_AUTO_QUOTE_V972 = Object.freeze({
    version: V972_VERSION,
    extractSupplierPdfText: extractSupplierPdfTextV972,
    parseChsQuote: parseChsQuoteV972,
    parseShipcoQuote: parseShipcoQuoteV960,
    applyChsFcl: v972ApplyChsFcl,
    applyChsLcl: v972ApplyChsLcl,
    readSupplierPdf: v972ReadSupplierPdf,
    snapshot: () => ({
      mode: state.activeMode,
      direction: state.direction,
      subject: state.activeMode === "fcl" ? buildSubject() : lclSubject(),
      routes: state.routes,
      lcl: state.lcl
    })
  });
})();

(() => {
  "use strict";

  const V973_VERSION = "9.7.3";
  const V973_CHS = "CHS";
  const v973Api972 = window.BLU_AUTO_QUOTE_V972;
  const v973Base = {
    setAdvancedMode: setAdvancedModeV920,
    activateMode,
    toggleAgent,
    syncLclUi: syncLclV960Ui,
    newLclState,
    exportLclData,
    applyImportedLclData,
    resetLclForm,
    initialiseLocationSelectors,
    setLclCollectionFromText,
    applyImportedLclLocations,
    lclCreateCharges,
    generateAhk,
    generateLclAhk,
    resolvedPrecarriageSupplier,
    applyCollectionSelection,
    applyLocationSelection,
    applyDeliverySelection: applyDeliverySelectionV961,
    applyLclCollectionSelection,
    applyLclPodSelection,
    applyLclPolSelection: applyLclPolSelectionV910,
    applyLclDeliverySelection: applyLclDeliverySelectionV963,
    safeFilename
  };

  function v973Round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function v973Plain(value, digits = 2) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return String(v973Round(number, digits)).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }

  function v973Number(value) {
    const number = Number(String(value ?? "").trim().replace(/\s+/g, "").replace(",", "."));
    return Number.isFinite(number) ? number : NaN;
  }

  function v973NormalText(value) {
    return String(value ?? "").normalize("NFC").trim();
  }

  function v973SameUnicodeText(left, right) {
    return v973NormalText(left).toLocaleLowerCase("sv-SE") === v973NormalText(right).toLocaleLowerCase("sv-SE");
  }

  function v973CurrentLclProfile() {
    return upper(document.getElementById("lclSupplier")?.value || state.lcl?.quoteProfile || "NORDICON");
  }

  function v973LclSellingCurrency() {
    const select = document.getElementById("lclSellingCurrencyV973");
    const value = normaliseCurrencyCode(select?.value || state.lcl?.sellingCurrency || "");
    return value || (v973CurrentLclProfile() === V973_CHS ? "EUR" : "USD");
  }

  function v973SetLclSellingCurrency(currency, { userSet = false, refresh = true } = {}) {
    const wanted = normaliseCurrencyCode(currency) || (v973CurrentLclProfile() === V973_CHS ? "EUR" : "USD");
    state.lcl ||= {};
    state.lcl.sellingCurrency = wanted;
    state.lcl.sellingCurrencyUserSet = Boolean(userSet);
    const select = document.getElementById("lclSellingCurrencyV973");
    if (select) {
      if (![...select.options].some((option) => option.value === wanted)) {
        const option = document.createElement("option");
        option.value = wanted;
        option.textContent = wanted;
        select.append(option);
      }
      select.value = wanted;
    }
    if (refresh && typeof updateLclCalculation === "function") updateLclCalculation();
    return wanted;
  }

  function v973InstallSellingCurrencyUi() {
    const summary = document.querySelector(".lcl-fixed-summary");
    if (!summary || document.getElementById("lclSellingCurrencyV973")) return;
    const old = summary.querySelector("strong");
    const select = document.createElement("select");
    select.id = "lclSellingCurrencyV973";
    select.setAttribute("aria-label", "LCL selling currency");
    ["EUR", "USD", "SEK"].forEach((currency) => {
      const option = document.createElement("option");
      option.value = currency;
      option.textContent = currency;
      select.append(option);
    });
    old?.replaceWith(select);
    select.addEventListener("change", () => v973SetLclSellingCurrency(select.value, { userSet: true }));
    v973SetLclSellingCurrency(state.lcl?.sellingCurrency || (v973CurrentLclProfile() === V973_CHS ? "EUR" : "USD"), { refresh: false });
  }

  function v973SetPdfStatus(message, kind = "") {
    const fclStatus = document.getElementById("fclSupplierPdfStatusV973");
    if (fclStatus) {
      fclStatus.textContent = message || "";
      fclStatus.classList.toggle("status-error", kind === "error");
      fclStatus.classList.toggle("status-warning", kind === "warning");
    }
    const lclMessage = document.getElementById("lclParseMessage");
    if (state.activeMode === "lcl" && lclMessage) {
      lclMessage.textContent = message || "";
      lclMessage.classList.toggle("status-error", kind === "error");
    }
  }

  function v973SyncFclPdfButton() {
    const controls = document.getElementById("fclSupplierPdfControlsV973");
    if (!controls) return;
    const visible = state.activeMode === "fcl" &&
      document.body.classList.contains("advanced-mode-enabled") &&
      Boolean(document.getElementById("useAgent")?.checked) &&
      upper(document.getElementById("agent")?.value) === V973_CHS;
    controls.classList.toggle("hidden", !visible);
  }

  function v973SyncLclPdfButton() {
    const button = document.getElementById("lclOpenShipcoPdf");
    if (!button) return;
    const profile = v973CurrentLclProfile();
    const supported = !isImportMode() && ["SHIPCO", V973_CHS].includes(profile);
    button.classList.toggle("hidden", !supported);
    button.textContent = profile === V973_CHS ? "Load CHS PDF" : "Load Shipco PDF";
    button.title = profile === V973_CHS ? "Load a CHS LCL quotation" : "Load a Shipco LCL quotation";
  }

  function v973InstallAllLocationPolicy() {
    if (typeof lclCollectionCombo === "undefined" || !lclCollectionCombo || lclCollectionCombo.__v973AllLocationPolicy) return;
    const setOptions = lclCollectionCombo.setOptions.bind(lclCollectionCombo);
    lclCollectionCombo.setOptions = function(options, selectedValue = "") {
      let completeOptions = options;
      if (state.locations instanceof Map && state.locations.size && Array.isArray(options) && options.length !== state.locations.size) {
        completeOptions = locationOptions([...state.locations.keys()], false);
      }
      return setOptions(completeOptions, selectedValue);
    };
    lclCollectionCombo.__v973AllLocationPolicy = true;
  }

  function v973SyncAllLclCollectionOptions() {
    v973InstallAllLocationPolicy();
    if (!(state.locations instanceof Map) || !state.locations.size || typeof lclCollectionCombo === "undefined" || !lclCollectionCombo) return;
    const currentCode = upper(state.lcl?.collectionCode || document.getElementById("lclCollectionCode")?.value || lclCollectionCombo.value || "");
    const selected = state.locations.has(currentCode) ? currentCode : "";
    const typed = lclCollectionCombo.input?.value || "";
    const alreadyComplete = Array.isArray(lclCollectionCombo.options) && lclCollectionCombo.options.length === state.locations.size;
    if (!alreadyComplete) lclCollectionCombo.setOptions(locationOptions([...state.locations.keys()], false), selected);
    lclCollectionCombo.setDisabled(false);
    if (!selected && typed && lclCollectionCombo.input) lclCollectionCombo.input.value = typed;
  }

  function v973SyncUi() {
    v973InstallAllLocationPolicy();
    const importStatus = document.getElementById("bluQuoteImportStatus");
    if (importStatus && importStatus.textContent.trim() === "ChatGPT quote input") importStatus.textContent = "";
    v973InstallSellingCurrencyUi();
    v973SyncFclPdfButton();
    v973SyncLclPdfButton();
    v973SyncAllLclCollectionOptions();
  }

  function v973InstallUi() {
    ["openSupplierPdfV972", "supplierPdfFileV972", "supplierPdfStatusV972"].forEach((id) => document.getElementById(id)?.remove());
    const importStatus = document.getElementById("bluQuoteImportStatus");
    if (importStatus) importStatus.textContent = "";

    if (!document.getElementById("v973Styles")) {
      const style = document.createElement("style");
      style.id = "v973Styles";
      style.textContent = `
        .quote-file-status:empty { display:none; }
        .agent-supplier-cell { grid-template-columns:minmax(0, 1fr) auto; }
        .agent-supplier-cell .waiting-check { grid-column:1 / -1; }
        .agent-supplier-cell #agentField { grid-column:1; }
        .v973-agent-pdf-controls { display:flex; grid-column:2; align-items:flex-end; gap:7px; min-width:0; }
        .v973-agent-pdf-controls.hidden { display:none !important; }
        #fclOpenChsPdfV973 { white-space:nowrap; }
        #fclSupplierPdfStatusV973 { max-width:210px; color:#555; font:11px/1.25 Consolas, monospace; overflow-wrap:anywhere; }
        #fclSupplierPdfStatusV973.status-error { color:#a00000; }
        #fclSupplierPdfStatusV973.status-warning { color:#8a5a00; }
        .lcl-fixed-summary select { width:100%; min-width:92px; margin-top:3px; padding:5px 7px; border:1px solid #777; background:#fff; font:700 15px/1.2 inherit; }
        body:not(.advanced-mode-enabled) #fclSupplierPdfControlsV973 { display:none !important; }
        @media (max-width:620px) {
          .agent-supplier-cell { grid-template-columns:1fr; }
          .agent-supplier-cell .waiting-check, .agent-supplier-cell #agentField, #fclSupplierPdfControlsV973 { grid-column:1; }
        }
      `;
      document.head.append(style);
    }

    const cell = document.querySelector(".agent-supplier-cell");
    if (cell && !document.getElementById("fclSupplierPdfControlsV973")) {
      const controls = document.createElement("div");
      controls.id = "fclSupplierPdfControlsV973";
      controls.className = "v973-agent-pdf-controls hidden";
      const button = document.createElement("button");
      button.id = "fclOpenChsPdfV973";
      button.type = "button";
      button.className = "btn";
      button.textContent = "Load CHS PDF";
      const input = document.createElement("input");
      input.id = "fclChsPdfFileV973";
      input.type = "file";
      input.accept = ".pdf,application/pdf";
      input.className = "hidden";
      const status = document.createElement("span");
      status.id = "fclSupplierPdfStatusV973";
      status.setAttribute("role", "status");
      controls.append(button, input, status);
      cell.append(controls);
      button.addEventListener("click", () => input.click());
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        input.value = "";
        if (file) await v973ReadSupplierPdf(file, "CHS");
      });
    }

    document.getElementById("advancedMode")?.addEventListener("change", () => queueMicrotask(v973SyncUi));
    document.getElementById("useAgent")?.addEventListener("change", () => queueMicrotask(v973SyncUi));
    document.getElementById("agent")?.addEventListener("change", () => queueMicrotask(v973SyncUi));
    document.getElementById("lclSupplier")?.addEventListener("change", () => {
      const profile = v973CurrentLclProfile();
      v973SetLclSellingCurrency(profile === V973_CHS ? "EUR" : "USD", { refresh: false });
      queueMicrotask(() => {
        v973SyncUi();
        updateLclCalculation();
      });
    });
    v973SyncUi();
  }

  function v973DeriveChsLclMeta(parsed) {
    const terminalFee = (parsed?.fees || []).find((fee) => /(?:origin\s+thc|terminal\s+handling)/i.test(`${fee.description || ""} ${fee.basis || ""}`));
    const source = `${terminalFee?.basis || ""} ${terminalFee?.text || ""}`.replace(/\s+/g, " ");
    const rateMatch = /(-?\d[\d.,]*)\s*(EUR|USD|SEK|NOK|DKK)\s*\/\s*100\s*kg\b/i.exec(source);
    const ratioMatch = /\b1\s*[:=]\s*(\d+(?:[.,]\d+)?)\b/i.exec(source);
    const rate = rateMatch ? v973Number(rateMatch[1]) : NaN;
    const currency = upper(rateMatch?.[2] || terminalFee?.sourceCurrency || "EUR");
    const ratio = ratioMatch ? v973Number(ratioMatch[1]) : 333;
    const volume = v973Number(parsed?.volume);
    const actualWeight = v973Number(parsed?.weight);
    const volumeWeight = Number.isFinite(volume) && Number.isFinite(ratio) ? volume * ratio : NaN;
    const useWeightMeasurement = Number.isFinite(rate) && Number.isFinite(volumeWeight) && Number.isFinite(actualWeight) && volumeWeight > actualWeight + 0.0001;
    return {
      quoteNumber: parsed?.quoteNumber || "",
      terminalRate: rate,
      terminalCurrency: currency,
      ratio: Number.isFinite(ratio) ? ratio : 333,
      actualWeight,
      volume,
      volumeWeight,
      terminalAmount: useWeightMeasurement ? volumeWeight / 100 : 1,
      useWeightMeasurement,
      terminalBuyTotal: v973Number(terminalFee?.totalEur),
      terminalDescription: terminalFee?.description || "Origin THC"
    };
  }

  function v973PrepareChsLclState(parsed) {
    state.lcl ||= {};
    state.lcl.v973ChsMeta = v973DeriveChsLclMeta(parsed);
    state.lcl.sellingCurrency = "EUR";
    state.lcl.sellingCurrencyUserSet = false;
    (state.lcl.extraCharges || []).forEach((charge) => {
      if (/\bdocumentation\s+fee\b/i.test(String(charge.outputDescription || charge.name || ""))) {
        delete charge.fixedSellingUsd;
        charge.netSelling = true;
      }
    });
    const meta = state.lcl.v973ChsMeta;
    if (Number.isFinite(meta.terminalRate) && state.lcl.costs?.terminal) {
      state.lcl.costs.terminal.rate = v973Plain(meta.terminalRate, 4);
      setLclCosts(state.lcl.costs);
    }
    renderLclExtraCosts();
    v973SetLclSellingCurrency("EUR", { refresh: false });
    updateLclCalculation();
  }

  async function v973ReadSupplierPdf(file, expected = "AUTO") {
    try {
      v973SetPdfStatus(`Reading ${file.name}...`);
      const text = await v973Api972.extractSupplierPdfText(await file.arrayBuffer());
      const expectedSupplier = upper(expected);
      // CHS quotations can name SHIPCO as the carrier. Do not mistake that for
      // Shipco's own quotation format when the selected agent supplier is CHS.
      const looksShipco = /\bShipco\s+Transport\s+AB\b/i.test(text) || /\bLCL\s+QUOTATION\b/i.test(text);
      if (expectedSupplier === "SHIPCO" || (expectedSupplier !== V973_CHS && looksShipco)) {
        if (isImportMode()) activateDirectionV910("export");
        activateMode("lcl");
        const parsed = v973Api972.parseShipcoQuote(text, `Shipco PDF ${file.name}`);
        state.lcl.v973ChsMeta = null;
        applyParsedShipcoQuoteV960(parsed);
        v973SetLclSellingCurrency("USD", { refresh: false });
        v973SyncUi();
        updateLclCalculation();
        v973SetPdfStatus(`Shipco quote data extracted successfully: ${parsed.pallets} pcs, ${parsed.weight} kg, ${parsed.volume} cbm.`);
        return { supplier: "SHIPCO", parsed };
      }

      const parsed = v973Api972.parseChsQuote(text, file.name);
      let result;
      if (parsed.shipmentType === "FCL") {
        result = v973Api972.applyChsFcl(parsed);
      } else {
        result = v973Api972.applyChsLcl(parsed);
        v973PrepareChsLclState(parsed);
      }
      v973SyncUi();
      const total = Number.isFinite(result?.expectedTotal) ? `${v973Plain(result.expectedTotal)} EUR` : "total read";
      let message = `CHS ${parsed.shipmentType} #${parsed.quoteNumber} - ${total}. Supplier buying rates imported successfully.`;
      if (result?.warning) message += ` ${result.warning}`;
      v973SetPdfStatus(message, result?.warning ? "warning" : "");
      return { supplier: V973_CHS, parsed, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read the supplier PDF.";
      v973SetPdfStatus(message, "error");
      return { supplier: "", error: message };
    }
  }

  function v973Convert(value, from, to) {
    const amount = v973Number(value);
    if (!Number.isFinite(amount)) return NaN;
    const source = normaliseCurrencyCode(from);
    const target = normaliseCurrencyCode(to);
    if (!source || !target) return NaN;
    if (source === target) return amount;
    return lclConvert(amount, source, target);
  }

  function v973ChargeMultiplier(charge) {
    const per = String(charge?.per || "").toLowerCase();
    if (per === "v") return Math.max(1, v973Number(state.lcl?.volume) || v973Number(document.getElementById("lclVolume")?.value) || 1);
    if (per === "w") return Math.max(1, (v973Number(state.lcl?.weight) || v973Number(document.getElementById("lclWeight")?.value) || 0) / 1000);
    if (per === "weight_m") return Math.max(0, v973Number(charge?.amount) || 0);
    return 1;
  }

  function v973SellingTotalUsd(charges) {
    return (charges || []).reduce((sum, charge) => {
      const rate = v973Number(charge?.sellingRate);
      if (!Number.isFinite(rate)) return sum;
      const usd = v973Convert(rate, charge.sellingCurrency || "USD", "USD");
      return sum + (Number.isFinite(usd) ? usd * v973ChargeMultiplier(charge) : 0);
    }, 0);
  }

  function v973ConvertChargeSelling(charges, currency) {
    (charges || []).forEach((charge) => {
      const source = normaliseCurrencyCode(charge.sellingCurrency || "USD") || "USD";
      const rate = v973Number(charge.sellingRate);
      if (Number.isFinite(rate)) {
        const converted = v973Convert(rate, source, currency);
        if (Number.isFinite(converted)) charge.sellingRate = v973Plain(converted, 4);
      }
      charge.sellingCurrency = currency;
    });
  }

  function v973ApplyChsChargeRules(charges, currency) {
    const meta = state.lcl?.v973ChsMeta;
    if (!meta || v973CurrentLclProfile() !== V973_CHS || isImportMode()) return charges;
    const beforeUsd = v973SellingTotalUsd(charges);

    const documentation = charges.find((charge) => /\bdocumentation\s+fee\b/i.test(String(charge.description || "")));
    if (documentation) {
      const converted = v973Convert(documentation.buyRate, documentation.buyCurrency, currency);
      if (Number.isFinite(converted)) documentation.sellingRate = v973Plain(converted, 4);
      documentation.sellingCurrency = currency;
    }

    const terminal = charges.find((charge) => {
      const type = normaliseSearch(charge.type || "");
      const description = normaliseSearch(charge.description || "");
      return type === "terminal" || type.includes("terminal handling") || description.includes("terminal handling");
    });
    if (terminal && meta.useWeightMeasurement && Number.isFinite(meta.terminalRate)) {
      const sellingRate = v973Convert(meta.terminalRate, meta.terminalCurrency, currency);
      if (Number.isFinite(sellingRate)) terminal.sellingRate = v973Plain(sellingRate, 4);
      terminal.sellingCurrency = currency;
      terminal.per = "weight_m";
      terminal.amount = v973Plain(meta.terminalAmount, 3);
      terminal.weightUnit = "";
      terminal.description = `TERMINAL HANDLING CHARGE, ${v973Plain(sellingRate, 4)} ${currency}/100kg // 1cbm = ${v973Plain(meta.ratio, 3)}kg`;
    } else if (terminal && Number.isFinite(meta.terminalBuyTotal)) {
      const flat = v973Convert(meta.terminalBuyTotal, "EUR", currency);
      if (Number.isFinite(flat)) terminal.sellingRate = v973Plain(flat, 4);
      terminal.sellingCurrency = currency;
      terminal.per = "";
      terminal.amount = "";
      terminal.weightUnit = "";
    }

    const afterUsd = v973SellingTotalUsd(charges);
    const adjustmentUsd = beforeUsd - afterUsd;
    if (Math.abs(adjustmentUsd) > 0.005) {
      const balance = charges.find((charge) => normaliseSearch(charge.type) === "freight" && !/freight collect/i.test(charge.description || "")) ||
        charges.find((charge) => normaliseSearch(charge.type) === "trucking");
      if (balance) {
        const multiplier = v973ChargeMultiplier(balance) || 1;
        const adjustment = v973Convert(adjustmentUsd / multiplier, "USD", currency);
        const current = v973Number(balance.sellingRate);
        if (Number.isFinite(adjustment) && Number.isFinite(current)) balance.sellingRate = v973Plain(current + adjustment, 4);
      }
    }
    return charges;
  }

  newLclState = function(overrides = {}) {
    const result = v973Base.newLclState(overrides);
    const profile = upper(overrides?.quoteProfile || overrides?.supplier || result.quoteProfile || "NORDICON");
    result.sellingCurrency = normaliseCurrencyCode(overrides?.sellingCurrency || result.sellingCurrency) || (profile === V973_CHS ? "EUR" : "USD");
    result.sellingCurrencyUserSet = Boolean(overrides?.sellingCurrencyUserSet);
    result.v973ChsMeta = overrides?.v973ChsMeta ? { ...overrides.v973ChsMeta } : (result.v973ChsMeta || null);
    return result;
  };

  exportLclData = function() {
    const data = v973Base.exportLclData();
    data.appVersion = V973_VERSION;
    data.sellingCurrency = v973LclSellingCurrency();
    data.sellingCurrencyUserSet = Boolean(state.lcl?.sellingCurrencyUserSet);
    data.v973ChsMeta = state.lcl?.v973ChsMeta ? { ...state.lcl.v973ChsMeta } : null;
    return data;
  };

  applyImportedLclData = function(data) {
    const result = v973Base.applyImportedLclData(data);
    const fallback = upper(data?.quoteProfile || data?.supplier) === V973_CHS ? "EUR" : "USD";
    state.lcl.v973ChsMeta = data?.v973ChsMeta ? { ...data.v973ChsMeta } : (state.lcl.v973ChsMeta || null);
    v973SetLclSellingCurrency(data?.sellingCurrency || fallback, { userSet: Boolean(data?.sellingCurrencyUserSet), refresh: false });
    v973SyncUi();
    updateLclCalculation();
    return result;
  };

  resetLclForm = function(confirmReset = true) {
    const before = state.lcl;
    const result = v973Base.resetLclForm(confirmReset);
    if (confirmReset && state.lcl === before) return result;
    state.lcl.v973ChsMeta = null;
    v973SetLclSellingCurrency(v973CurrentLclProfile() === V973_CHS ? "EUR" : "USD", { refresh: false });
    v973SyncUi();
    return result;
  };

  lclCreateCharges = function(calc) {
    const charges = v973Base.lclCreateCharges(calc);
    if (!Array.isArray(charges) || isImportMode()) return charges;
    const currency = v973LclSellingCurrency();
    v973ConvertChargeSelling(charges, currency);
    return v973ApplyChsChargeRules(charges, currency);
  };

  function v973PatchLclAhk(script) {
    let output = String(script || "").replaceAll("v9.7.3", `v${V973_VERSION}`).replaceAll("v9.6.4", `v${V973_VERSION}`);
    const currency = v973LclSellingCurrency().toLowerCase();
    output = output.replace('SelectField("target currency", "usd")', `SelectField("target currency", "${currency}")`);
    output = output.replace('SelectField("selling rate currency", "usd")', 'SelectField("selling rate currency", StrLower(charge["sellingCurrency"]))');
    output = output.replace(
`    if charge["per"] = "w" {
      Send "{Tab}"
      Sleep 150
      SelectField("weight unit", "t")
    }`,
`    if charge["per"] = "weight_m" {
      Send "{Tab}"
      Sleep 150
      Send "^a"
      Sleep 80
      SlowType(StrReplace(String(charge["amount"]), ".", ","))
      Sleep FIELD_DELAY
    } else if charge["per"] = "w" {
      Send "{Tab}"
      Sleep 150
      SelectField("weight unit", "t")
    }`
    );
    return output;
  }

  generateLclAhk = function() {
    return v973PatchLclAhk(v973Base.generateLclAhk());
  };

  generateAhk = function() {
    return String(v973Base.generateAhk()).replaceAll("v9.7.3", `v${V973_VERSION}`).replaceAll("v9.6.4", `v${V973_VERSION}`);
  };

  resolvedPrecarriageSupplier = function(equipment, carrier) {
    if (equipment?.includeStuff && upper(equipment.precarriageSupplier) === "CARRIER") {
      const stuffing = stuffingSupplierConfig(equipment.stuffSupplier);
      if (stuffing) return stuffing;
    }
    return v973Base.resolvedPrecarriageSupplier(equipment, carrier);
  };

  safeFilename = function(value, maxLength = 180) {
    const cleaned = v973NormalText(value || "quote")
      .replace(/[<>:"/\\|?*\x00-\x1F]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[. ]+$/g, "")
      .trim()
      .slice(0, maxLength);
    return cleaned || "quote";
  };

  promptToSaveLocationDisplayV964 = function(input) {
    const context = locationContextV964(input.dataset.v964LocationScope, input.dataset.v964LocationKey);
    if (!context) return;
    const clean = v973NormalText(input.value || context.canonical) || v973NormalText(context.canonical);
    context.target[context.field] = clean;
    input.value = clean;
    if (!context.code || !context.canonical || clean === storedLocationDisplayNameV964(context.code)) {
      updateLocationDisplayOutputV964(context.scope);
      return;
    }
    const canonicalSame = v973SameUnicodeText(clean, context.canonical);
    const question = canonicalSame
      ? `Use the original location name "${context.canonical}" locally for ${context.code}?`
      : `Save "${clean}" locally for location code ${context.code}?`;
    if (window.confirm(question)) {
      if (canonicalSame) delete locationDisplayNamesV964[context.code];
      else locationDisplayNamesV964[context.code] = clean;
      saveLocationDisplayNamesV964();
    }
    updateLocationDisplayOutputV964(context.scope);
  };

  function v973ForceDisplayName(scope, key, oldCode) {
    const context = locationContextV964(scope, key);
    if (!context) return;
    if (upper(context.code) !== upper(oldCode)) {
      context.target[context.field] = v973NormalText(defaultLocationDisplayNameV964(context.code, context.canonical) || context.canonical);
    } else {
      context.target[context.field] = v973NormalText(context.target[context.field] || defaultLocationDisplayNameV964(context.code, context.canonical) || context.canonical);
    }
    syncLocationDisplayInputsV964();
  }

  applyCollectionSelection = function() {
    const oldCode = upper(activeRoute()?.collectionCode || "");
    const result = v973Base.applyCollectionSelection();
    v973ForceDisplayName("fcl", "collection", oldCode);
    return result;
  };

  applyLocationSelection = function(kind) {
    const oldCode = upper(activeRoute()?.[`${kind}Code`] || "");
    const result = v973Base.applyLocationSelection(kind);
    if (["pol", "pod"].includes(kind)) v973ForceDisplayName("fcl", kind, oldCode);
    return result;
  };

  applyDeliverySelectionV961 = function() {
    const oldCode = upper(activeRoute()?.deliveryCode || "");
    const result = v973Base.applyDeliverySelection();
    v973ForceDisplayName("fcl", "delivery", oldCode);
    return result;
  };

  applyLclCollectionSelection = function() {
    const oldCode = upper(state.lcl?.collectionCode || document.getElementById("lclCollectionCode")?.value || "");
    const result = v973Base.applyLclCollectionSelection();
    v973ForceDisplayName("lcl", "collection", oldCode);
    v973SyncAllLclCollectionOptions();
    return result;
  };

  applyLclPodSelection = function() {
    const oldCode = upper(state.lcl?.podCode || document.getElementById("lclPodCode")?.value || "");
    const result = v973Base.applyLclPodSelection();
    v973ForceDisplayName("lcl", "pod", oldCode);
    return result;
  };

  applyLclPolSelectionV910 = function() {
    const oldCode = upper(state.lcl?.polCode || document.getElementById("lclPolCode")?.value || "");
    const result = v973Base.applyLclPolSelection();
    v973ForceDisplayName("lcl", "pol", oldCode);
    return result;
  };

  applyLclDeliverySelectionV963 = function() {
    const oldCode = upper(state.lcl?.deliveryCode || "");
    const result = v973Base.applyLclDeliverySelection();
    v973ForceDisplayName("lcl", "delivery", oldCode);
    return result;
  };

  setLclCollectionFromText = function(name) {
    const clean = v973NormalText(name);
    const code = findLocationCodeByName(clean);
    v973SyncAllLclCollectionOptions();
    if (code) {
      lclCollectionCombo.value = code;
      lclCollectionCombo.input.value = `${code} - ${state.locations.get(code)}`;
      document.getElementById("lclCollectionCode").value = code;
      document.getElementById("lclCollectionName").value = state.locations.get(code) || clean;
      state.lcl.collectionCode = code;
      state.lcl.collectionName = state.locations.get(code) || clean;
      state.lcl.collectionCity = state.locations.get(code) || clean;
      state.lcl.collectionDisplayName = defaultLocationDisplayNameV964(code, state.locations.get(code) || clean);
    } else {
      lclCollectionCombo.value = "";
      lclCollectionCombo.input.value = clean;
      document.getElementById("lclCollectionCode").value = "";
      document.getElementById("lclCollectionName").value = clean;
      state.lcl.collectionCode = "";
      state.lcl.collectionName = clean;
      state.lcl.collectionCity = clean;
      state.lcl.collectionDisplayName = clean;
    }
    syncLocationDisplayInputsV964();
  };

  applyImportedLclLocations = function(data) {
    if (!state.locations.size) return v973Base.applyImportedLclLocations(data);
    v973SyncAllLclCollectionOptions();
    const collectionCode = upper(data?.collectionCode || "");
    if (collectionCode && state.locations.has(collectionCode)) {
      lclCollectionCombo.setOptions(locationOptions([...state.locations.keys()], false), collectionCode);
      lclCollectionCombo.value = collectionCode;
      lclCollectionCombo.input.value = `${collectionCode} - ${state.locations.get(collectionCode)}`;
      document.getElementById("lclCollectionCode").value = collectionCode;
      document.getElementById("lclCollectionName").value = state.locations.get(collectionCode) || data.collectionName || data.collectionCity || "";
      applyLclCollectionSelection();
    } else setLclCollectionFromText(data?.collectionCity || data?.collectionName || "");
    const podCode = upper(data?.podCode || "");
    lclPodCombo.setOptions(locationOptions([...state.locations.keys()]), podCode);
    if (podCode && lclPodCombo.selectedOption()) applyLclPodSelection();
    else setLclPodFromText(data?.podName || "");
    state.pendingLclImport = null;
  };

  initialiseLocationSelectors = function() {
    const result = v973Base.initialiseLocationSelectors();
    v973SyncAllLclCollectionOptions();
    return result;
  };

  syncLclV960Ui = function() {
    const result = v973Base.syncLclUi();
    v973SyncUi();
    return result;
  };

  setAdvancedModeV920 = function(enabled) {
    const result = v973Base.setAdvancedMode(enabled);
    v973SyncUi();
    return result;
  };

  activateMode = function(mode) {
    const result = v973Base.activateMode(mode);
    v973SyncUi();
    return result;
  };

  toggleAgent = function() {
    const result = v973Base.toggleAgent();
    v973SyncFclPdfButton();
    return result;
  };

  readShipcoPdfV960 = async function(file) {
    return v973ReadSupplierPdf(file, v973CurrentLclProfile());
  };

  v973InstallUi();
  queueMicrotask(v973SyncUi);

  window.BLU_AUTO_QUOTE_V973 = Object.freeze({
    version: V973_VERSION,
    extractSupplierPdfText: v973Api972.extractSupplierPdfText,
    parseChsQuote: v973Api972.parseChsQuote,
    parseShipcoQuote: v973Api972.parseShipcoQuote,
    deriveChsLclMeta: v973DeriveChsLclMeta,
    readSupplierPdf: v973ReadSupplierPdf,
    sellingCurrency: v973LclSellingCurrency,
    syncUi: v973SyncUi,
    snapshot: () => ({
      mode: state.activeMode,
      direction: state.direction,
      subject: state.activeMode === "fcl" ? buildSubject() : lclSubject(),
      routes: state.routes,
      lcl: state.lcl,
      charges: state.activeMode === "lcl" && calculateLcl() ? lclCreateCharges(calculateLcl()) : []
    })
  });
})();
