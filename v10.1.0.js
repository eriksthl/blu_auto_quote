/* BLU Auto Quote v10.1.0
 * Web automation is isolated here. Do not edit the v9.7.4 Citrix engine.
 * Business values are taken from its generated quote Map, not recalculated.
 */
(() => {
  "use strict";
  const VERSION = "10.1.0";
  const STORAGE_KEY = "blu.autoquote.automation-mode.v10";
  const legacy = Object.freeze({
    generateAhk, generateLclAhk, exportFormData, exportLclData,
    applyImportedData, applyImportedLclData, buildMergedAhkV923,
    restoreDirectionStateV912
  });
  const deepFreeze = value => {
    if (value && typeof value === "object") {
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  };
  const CONFIG = deepFreeze({
  "coordinates": {
    "quotation tab": [
      275,
      161
    ],
    "create quotation": [
      351,
      186
    ],
    "project 949/950": [
      940,
      469
    ],
    "inquiry type": [
      1111,
      467
    ],
    "client fhb": [
      938,
      493
    ],
    "address": [
      1122,
      497
    ],
    "internal comment": [
      926,
      585
    ],
    "create": [
      906,
      667
    ],
    "attention to": [
      1266,
      352
    ],
    "subject": [
      1029,
      398
    ],
    "salutation": [
      1036,
      420
    ],
    "cover letter": [
      1040,
      449
    ],
    "display costs": [
      1026,
      491
    ],
    "target currency": [
      1148,
      491
    ],
    "event target currency": [
      1123,
      541
    ],
    "sales operator": [
      1045,
      582
    ],
    "header tab": [
      1003,
      147
    ],
    "cargo tab": [
      1027,
      150
    ],
    "add equipment": [
      1004,
      223
    ],
    "equipment quantity": [
      1028,
      269
    ],
    "kind of package": [
      1142,
      271
    ],
    "gross weight": [
      1108,
      311
    ],
    "volume": [
      1103,
      333
    ],
    "use weights per cargo": [
      1157,
      311
    ],
    "use volume per cargo": [
      1157,
      335
    ],
    "description of goods": [
      1237,
      339
    ],
    "hazardous": [
      1334,
      311
    ],
    "stackable": [
      1362,
      311
    ],
    "add equipment 2": [
      1003,
      235
    ],
    "add equipment 3": [
      1004,
      246
    ],
    "add equipment 4": [
      1006,
      257
    ],
    "add equipment 5": [
      1004,
      269
    ],
    "add equipment 6": [
      1005,
      280
    ],
    "add equipment 7": [
      1007,
      291
    ],
    "details tab": [
      1047,
      149
    ],
    "add detail 1": [
      997,
      193
    ],
    "subtitle": [
      1023,
      239
    ],
    "short description": [
      1030,
      268
    ],
    "plor loc code": [
      1086,
      323
    ],
    "polout loc code": [
      1083,
      335
    ],
    "podin loc code": [
      1086,
      345
    ],
    "plod loc code": [
      1086,
      358
    ],
    "plor mot": [
      1363,
      323
    ],
    "polout mot": [
      1363,
      334
    ],
    "plod mot": [
      1363,
      357
    ],
    "transit time": [
      1056,
      358
    ],
    "incoterm": [
      1055,
      428
    ],
    "incoterm location": [
      1326,
      428
    ],
    "service type": [
      1050,
      451
    ],
    "including": [
      1080,
      483
    ],
    "excluding": [
      1327,
      484
    ],
    "subject to": [
      1100,
      532
    ],
    "payment days": [
      1260,
      522
    ],
    "add sales charge 1": [
      1007,
      616
    ],
    "sales charge type": [
      1022,
      649
    ],
    "sales charge description": [
      1024,
      674
    ],
    "sales rate": [
      1028,
      788
    ],
    "sales rate currency": [
      1075,
      720
    ],
    "sales rate per (quantity/volume/weight etc.)": [
      1042,
      811
    ],
    "sales rate per amount": [
      1137,
      812
    ],
    "sales rate amount name (40'HC, CONSIGNMENT etc)": [
      1192,
      812
    ],
    "buying rate": [
      1021,
      857
    ],
    "buying rate currency": [
      1076,
      857
    ],
    "supplier": [
      1138,
      856
    ],
    "charges remarks": [
      1087,
      922
    ],
    "add sales charge 2": [
      1007,
      627
    ],
    "add sales charge 3": [
      1008,
      640
    ],
    "add sales charge 4": [
      1009,
      651
    ],
    "add sales charge 5": [
      1009,
      662
    ],
    "add sales charge 6": [
      1007,
      662
    ],
    "valid to date": [
      1265,
      235
    ],
    "select plor": [
      1029,
      324
    ],
    "select polout": [
      1033,
      337
    ],
    "select podin": [
      1033,
      348
    ],
    "select plod": [
      1030,
      359
    ],
    "delete selected event": [
      1095,
      373
    ],
    "podin mot": [
      1363,
      345
    ]
  },
  "detailStep": 11.4,
  "equipmentOffsets": [
    0,
    12,
    23,
    34,
    46,
    57,
    68
  ],
  "chargeOffsets": [
    0,
    11,
    24,
    35,
    46
  ],
  "timing": {
    "clickDelay": 60,
    "fieldDelay": 80,
    "menuKeyDelay": 15,
    "textKeyDelay": 5,
    "menuEnterDelay": 600,
    "supplierEnterDelay": 600,
    "menuAfterDelay": 150,
    "rowDelay": 800,
    "tabDelay": 600
  },
  "transportModes": {
    "t": "truck",
    "truck": "truck",
    "v": "vessel",
    "vessel": "vessel",
    "r": "rail",
    "rail": "rail"
  },
  "incoterms": {
    "exw": "Ex works",
    "fca": "Free carrier"
  },
  "chargeTypes": {
    "freight": "sfr",
    "stuffing": "stf",
    "port": "port due",
    "handling": "handling fee",
    "war": "war risk"
  }
});
  let automationMode = "citrix";
  try { if (localStorage.getItem(STORAGE_KEY) === "web") automationMode = "web"; } catch {}

  function offsetFor(kind, index) {
    if (!Number.isInteger(index) || index < 1) throw new Error("Row index must be a positive integer.");
    if (kind === "charge") return CONFIG.chargeOffsets[Math.min(index, CONFIG.chargeOffsets.length) - 1];
    if (kind === "equipment") return index <= CONFIG.equipmentOffsets.length
      ? CONFIG.equipmentOffsets[index - 1]
      : CONFIG.equipmentOffsets.at(-1) + Math.round((index - CONFIG.equipmentOffsets.length) * CONFIG.detailStep);
    if (kind === "detail") return Math.round((index - 1) * CONFIG.detailStep);
    throw new Error("Unknown Web coordinate group: " + kind);
  }
  function searchValue(value, mapping) {
    const original = String(value ?? "").trim();
    return mapping[original.toLowerCase()] || original;
  }
  const chargeSearch = value => searchValue(value, CONFIG.chargeTypes);
  const incotermSearch = value => searchValue(value, CONFIG.incoterms);
  const transportModeSearch = value => searchValue(value, CONFIG.transportModes);

  function invalidateGeneratedScripts() {
    state.generatedScript = "";
    if (state.lcl) state.lcl.generatedScript = "";
    for (const id of ["scriptOutput", "lclScriptOutput"]) if ($(id)) $(id).value = "";
    for (const id of ["copyScript", "downloadScript", "lclCopyScript", "lclDownloadScript"]) if ($(id)) $(id).disabled = true;
    // Direction snapshots may otherwise restore a script for the previous target.
    if (typeof directionStatesV912 !== "undefined") {
      for (const saved of Object.values(directionStatesV912 || {})) {
        if (!saved) continue;
        saved.generatedScript = saved.lclGeneratedScript = saved.scriptOutput = saved.lclScriptOutput = "";
      }
    }
  }
  function setAutomationMode(value, options = {}) {
    if (!["citrix", "web"].includes(value)) throw new Error("Unsupported BLU automation mode.");
    const changed = automationMode !== value;
    automationMode = value;
    if (changed) invalidateGeneratedScripts();
    if (options.persist !== false) try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    syncModeUi();
  }
  function webMetadata(data) {
    return { ...data, appVersion: VERSION, automationMode: "web" };
  }
  exportFormData = function() {
    const data = legacy.exportFormData();
    return automationMode === "web" ? webMetadata(data) : data;
  };
  exportLclData = function() {
    const data = legacy.exportLclData();
    return automationMode === "web" ? webMetadata(data) : data;
  };
  function importMode(data) {
    if (data?.automationMode === "web" || data?.automationMode === "citrix") setAutomationMode(data.automationMode);
  }
  applyImportedData = function(data) {
    const result = legacy.applyImportedData(data);
    importMode(data);
    return result;
  };
  applyImportedLclData = function(data) {
    const result = legacy.applyImportedLclData(data);
    importMode(data);
    return result;
  };
  restoreDirectionStateV912 = function(...args) {
    const result = legacy.restoreDirectionStateV912(...args);
    const sources = [state.generatedScript, state.lcl?.generatedScript].filter(Boolean);
    if (sources.some(source => /^; BLU_AUTOMATION_MODE: WEB$/m.test(source) !== (automationMode === "web"))) invalidateGeneratedScripts();
    syncModeUi();
    return result;
  };

  // Scan only a balanced Map expression. Never evaluate imported JavaScript/AHK.
  function extractQuoteBlock(source) {
    const start = source.indexOf("quote := Map(");
    if (start < 0) throw new Error("The frozen Citrix engine did not return quotation data.");
    let depth = 0, quoted = false;
    for (let i = start + "quote := Map".length; i < source.length; i++) {
      const c = source[i];
      if (quoted) {
        if (c === "`") { i++; continue; }
        if (c === '"') quoted = false;
      } else if (c === '"') quoted = true;
      else if (c === "(") depth++;
      else if (c === ")" && --depth === 0) return source.slice(start, i + 1);
    }
    throw new Error("The quotation Map was incomplete. No Web script was generated.");
  }
  function ahkDictionary(object) {
    return "Map(" + Object.entries(object).map(([key, value]) => ahkString(key) + ", " + ahkString(value)).join(", ") + ")";
  }
  function buildWebScript(source, lcl) {
    const quoteBlock = extractQuoteBlock(source);
    const data = lcl ? exportLclData() : exportFormData();
    const speed = window.BLU_AUTO_QUOTE_V974.speedPercent();
    const coords = Object.entries(CONFIG.coordinates).map(([name, xy]) => "  " + ahkString(name) + ", [" + xy.join(", ") + "]").join(",\n");
    const packageExpression = lcl ? ahkString("pe -") : (source.match(/SelectField\("kind of equipment", ("(?:`.|[^"\n])*?")\)/)?.[1] || '"pe"');
    const hazardous = lcl ? Boolean(String(data.imoDetails || "").trim()) : Boolean(data.fclOptions?.hazardous);
    const grossExpression = source.match(/TypeField\("gross weight", ("(?:`.|[^"\n])*?")\)/)?.[1] || ahkString(FIXED.grossWeight);
    const cargoExpression = source.match(/TypeField\("description of goods", ("(?:`.|[^"\n])*?")/)?.[1] || ahkString(FIXED.goodsDescription);
    const targetCurrency = lcl ? (data.sellingCurrency || "USD") : (data.targetCurrency || "USD");
    const manualBuying = Array.isArray(data.importBuyingOnly) && data.importBuyingOnly.length > 0;
    if ($("bluWebGenerationNote")) {
      $("bluWebGenerationNote").textContent = manualBuying
        ? "This LCL import contains buying-only rows. Web coordinates for separate buying rows were not provided. The script lists these rows for manual entry after sales entry; they are not silently discarded."
        : "";
      $("bluWebGenerationNote").hidden = !manualBuying;
    }
    return String.raw`#Requires AutoHotkey v2.0
#SingleInstance Force
#Warn

; Generated by BLU Auto Quote v10.1.0 - BLU Web Mode
; BLU_AUTOMATION_MODE: WEB
; Quotation values and pricing: frozen v9.7.4 engine, unchanged.
; Start with the BLU Web tab active in Edge, on the recorded 1920x1080 / 100% layout.
; F8 starts; F9 pauses/resumes; Esc aborts. Review and save manually. No sending.
; Detail step: 11.4 px, rounded. Equipment 5 is interpolated at Y=269.
; Charge offsets: 0,11,24,35,46; charge 6+ stays at charge 5 (46 px).
; Scroll to bottom ONCE per detail; do not re-anchor between individual charges.
${metadataBlock(webMetadata(data))}

SetTitleMatchMode 2
CoordMode "Mouse", "Screen"
SendMode "Event"
SetKeyDelay 10, -1
SetMouseDelay 20
BLU_WINDOW := "BLU Web ahk_exe msedge.exe"
SPEED_PERCENT := ${speed}
CLICK_DELAY := ${CONFIG.timing.clickDelay}
FIELD_DELAY := ${CONFIG.timing.fieldDelay}
MENU_KEY_DELAY := ${CONFIG.timing.menuKeyDelay}
TEXT_KEY_DELAY := ${CONFIG.timing.textKeyDelay}
MENU_ENTER_DELAY := ${CONFIG.timing.menuEnterDelay}
SUPPLIER_ENTER_DELAY := ${CONFIG.timing.supplierEnterDelay}
MENU_AFTER_DELAY := ${CONFIG.timing.menuAfterDelay}
ROW_DELAY := ${CONFIG.timing.rowDelay}
TAB_DELAY := ${CONFIG.timing.tabDelay}
WEB_LCL := ${lcl ? "true" : "false"}
WEB_IMPORT := ${data.direction === "import" ? "true" : "false"}
WEB_HAZARDOUS := ${hazardous ? "true" : "false"}
WEB_PACKAGE_SEARCH := ${packageExpression}
WEB_GROSS_WEIGHT := ${grossExpression}
WEB_CARGO_DESCRIPTION := ${cargoExpression}
WEB_TARGET_CURRENCY := ${ahkString(targetCurrency.toLowerCase())}
DETAIL_STEP := ${CONFIG.detailStep}
EQUIPMENT_OFFSETS := [${CONFIG.equipmentOffsets.join(", ")}]
CHARGE_OFFSETS := [${CONFIG.chargeOffsets.join(", ")}]
WEB_INCOTERMS := ${ahkDictionary(CONFIG.incoterms)}
WEB_CHARGE_TYPES := ${ahkDictionary(CONFIG.chargeTypes)}
WEB_TRANSPORT_MODES := ${ahkDictionary(CONFIG.transportModes)}
Running := false
SavedClipboard := ""
WebHwnd := 0

C := Map(
${coords}
)

${quoteBlock}

if FileExist(A_ScriptDir "\blu_prod_20260831114214.ico")
  TraySetIcon A_ScriptDir "\blu_prod_20260831114214.ico"
OnExit RestoreClipboard

F8:: {
  global Running
  if Running
    return
  Running := true
  try RunQuote()
  catch Error as err
    MsgBox "Web automation stopped:" Chr(10) Chr(10) err.Message Chr(10) Chr(10) "A partially entered quote may exist. Review it before restarting.", "BLU Web Mode", "Iconx"
  finally {
    ToolTip
    RestoreClipboard()
    Running := false
  }
}
F9::Pause -1
$Esc::ExitApp 1

RunQuote() {
  global quote, WEB_LCL, WEB_IMPORT, WEB_TARGET_CURRENCY, SavedClipboard, ROW_DELAY, TAB_DELAY
  CheckWebEnvironment()
  ActivateBluWeb()
  SavedClipboard := ClipboardAll()
  WebPreflight()

  ToolTip "BLU Web: create quotation", 20, 30
  WebScroll("up")
  WebClick("quotation tab", 0, TAB_DELAY)
  WebClick("create quotation", 0, ROW_DELAY)
  WebSelect("project 949/950", quote["project"])
  WebSelect("inquiry type", "f")
  WebSelect("client fhb", quote["clientCode"])
  WebTypeField("address", StrUpper(quote["clientName"]))
  WebTypeField("internal comment", quote["internalComment"])
  WebClick("create", 0, ROW_DELAY + 900)

  ToolTip "BLU Web: header", 20, 30
  WebScroll("up")
  ; Create quotation already opens Header. Do not click its tab again.
  WebTypeField("valid to date", quote["validTo"], 0, true)
  WebTypeField("attention to", quote["attentionTo"])
  WebTypeField("subject", quote["subject"])
  WebTypeField("salutation", quote["salutation"])
  WebTypeField("cover letter", quote["coverLetter"])
  WebDisplayCosts()
  WebSelect("target currency", WEB_TARGET_CURRENCY)
  WebClick("event target currency")
  WebSelect("sales operator", quote["salesOperator"])
  ; YearMonth is already set by BLU Web. Never touch it.

  ToolTip "BLU Web: cargo", 20, 30
  WebScroll("up")
  WebClick("cargo tab", 0, TAB_DELAY)
  FillWebCargo()

  ToolTip "BLU Web: details and charges", 20, 30
  WebScroll("up")
  WebClick("details tab", 0, TAB_DELAY)
  details := WEB_LCL ? [quote] : quote["details"]
  for index, detail in details {
    ; Remarks of the preceding detail are at the bottom of the page.
    WebScroll("up")
    dy := WebOffset("detail", index)
    WebClick("add detail 1", dy, ROW_DELAY)
    WebTypeField("subtitle", detail["subtitle"], dy)
    WebPasteField("short description", StrUpper(quote["clientName"]) Chr(13) Chr(10) detail["basisText"], dy)
    ConfigureWebRoute(detail, dy)

    ; All fields below this point use the fixed bottom-scrolled reference.
    WebScroll("down")
    WebTypeField("transit time", detail.Get("transitTime", quote.Get("transitTime", "")))
    WebSelect("incoterm", WebIncoterm(detail["incoterm"]))
    WebTypeField("incoterm location", detail.Get("incotermLocation", detail.Get("deliveryName", "")))
    WebSelect("service type", WEB_LCL ? "lcl/lcl" : "f")
    ; These two fields are always typed, never pasted.
    WebTypeField("including", detail.Get("including", ""))
    WebTypeField("excluding", detail.Get("excluding", quote.Get("excluding", "")))
    WebPasteField("subject to", detail.Get("subjectTo", quote.Get("subjectTo", "")))
    WebTypeField("payment days", quote["paymentDays"])
    chargeIndex := 0
    for charge in detail["charges"] {
      chargeIndex += 1
      FillWebCharge(charge, chargeIndex)
    }
    remarksOffset := chargeIndex > 0 ? WebOffset("charge", chargeIndex) : 0
    WebPasteField("charges remarks", detail.Get("remarks", ""), remarksOffset)
  }
  ToolTip
  WebBuyingOnlyNotice()
  RestoreClipboard()
  MsgBox "BLU Web entry completed. Review all fields, rates and route points, complete any listed manual buying rows, and save the quote in BLU Web before sending it.", "BLU Web Mode", "Iconi"
}

WebWait(milliseconds) {
  global SPEED_PERCENT
  Sleep Round(Max(0, milliseconds) * 100 / SPEED_PERCENT)
}

CheckWebEnvironment() {
  if A_ScreenWidth != 1920 || A_ScreenHeight != 1080
    throw Error("Recorded Web coordinates require a 1920 x 1080 primary display. Current: " A_ScreenWidth " x " A_ScreenHeight)
  if A_ScreenDPI != 96
    throw Error("Recorded Web coordinates require Windows scaling 100% (96 DPI).")
}

ActivateBluWeb() {
  global BLU_WINDOW, WebHwnd
  matches := WinGetList(BLU_WINDOW)
  if matches.Length = 0
    throw Error("Open the BLU Web tab in Microsoft Edge. Its window title must contain BLU Web; the number of other tabs does not matter.")
  active := WinActive(BLU_WINDOW)
  if !active && matches.Length > 1
    throw Error("Several BLU Web windows are open. Activate the intended window, then restart.")
  WebHwnd := active ? active : matches[1]
  target := "ahk_id " WebHwnd
  WinActivate target
  WinMaximize target
  if !WinWaitActive(target, , 6)
    throw Error("The BLU Web window could not be activated.")
  WebWait(900)
  WinGetPos &x, &y, , , target
  if x < -16 || x > 16 || y < -16 || y > 16
    throw Error("Move BLU Web to the primary display. The recorded coordinates are screen coordinates.")
}

EnsureWebActive() {
  global WebHwnd
  if !WebHwnd || !WinActive("ahk_id " WebHwnd)
    throw Error("BLU Web lost focus. No further keys or clicks were sent.")
}

WebOffset(kind, index) {
  global DETAIL_STEP, EQUIPMENT_OFFSETS, CHARGE_OFFSETS
  if index < 1
    throw Error("Invalid Web row index.")
  if kind = "charge"
    return CHARGE_OFFSETS[Min(index, CHARGE_OFFSETS.Length)]
  if kind = "equipment" {
    if index <= EQUIPMENT_OFFSETS.Length
      return EQUIPMENT_OFFSETS[index]
    return EQUIPMENT_OFFSETS[EQUIPMENT_OFFSETS.Length] + Round((index - EQUIPMENT_OFFSETS.Length) * DETAIL_STEP)
  }
  if kind = "detail"
    return Round((index - 1) * DETAIL_STEP)
  throw Error("Unknown Web coordinate group: " kind)
}

WebPreflight() {
  global quote, WEB_LCL, C
  if WEB_LCL
    return
  cargo := quote.Has("cargoEquipment") ? quote["cargoEquipment"] : quote["cargo"]
  if cargo.Length > 0 && C["description of goods"][2] + WebOffset("equipment", cargo.Length) > A_ScreenHeight - 35
    throw Error("Too many cargo rows for the recorded Web viewport. No quotation was created.")
  if quote["details"].Length > 0 && C["delete selected event"][2] + WebOffset("detail", quote["details"].Length) > A_ScreenHeight - 35
    throw Error("Too many details for the recorded Web viewport. No quotation was created.")
}

WebClick(name, dy := 0, wait := 0) {
  global C, CLICK_DELAY
  EnsureWebActive()
  if !C.Has(name)
    throw Error("Missing Web coordinate: " name)
  point := C[name]
  x := point[1], y := point[2] + dy
  if x < 0 || x >= A_ScreenWidth || y < 0 || y >= A_ScreenHeight
    throw Error("Web coordinate outside the screen: " name " at " x "," y)
  ; Only Y is offset. Mouse movement speed is not scaled by slow mode.
  Click x, y
  WebWait(wait > 0 ? wait : CLICK_DELAY)
}

WebClear() {
  EnsureWebActive()
  Send "^a"
  WebWait(50)
  Send "{Backspace}"
  WebWait(50)
}

WebTypeText(value, menu := false) {
  global SPEED_PERCENT, MENU_KEY_DELAY, TEXT_KEY_DELAY
  value := StrReplace(StrReplace(String(value), Chr(13), ""), Chr(9), " ")
  EnsureWebActive()
  if SPEED_PERCENT >= 100 {
    ; Literal keyboard input, NOT clipboard paste. Small batches keep focus checks
    ; frequent and stay well below SendInput's per-call input-size limit.
    position := 1
    while position <= StrLen(value) {
      EnsureWebActive()
      SendInput "{Text}" SubStr(value, position, 200)
      position += 200
    }
    return
  }
  ; Slow mode retains explicitly paced text, without changing mouse speed.
  for character in StrSplit(value) {
    EnsureWebActive()
    if character = Chr(10)
      SendInput "{Enter}"
    else
      SendInput "{Text}" character
    WebWait(menu ? MENU_KEY_DELAY : TEXT_KEY_DELAY)
  }
}

WebReady(name) {
  key := StrLower(name)
  if InStr(key, "currency") || InStr(key, "supplier") || key = "display costs" || key = "inquiry type" || key = "sales operator" || key = "incoterm" || key = "service type"
    WebWait(500)
}

WebTypeField(name, value, dy := 0, pressEnter := false) {
  global FIELD_DELAY, MENU_ENTER_DELAY, MENU_AFTER_DELAY
  WebClick(name, dy)
  WebClear()
  WebTypeText(value)
  WebWait(FIELD_DELAY)
  WebReady(name)
  EnsureWebActive()
  if pressEnter {
    WebWait(MENU_ENTER_DELAY)
    Send "{Enter}"
    WebWait(MENU_AFTER_DELAY)
  } else {
    Send "{Tab}"
    WebWait(FIELD_DELAY)
  }
}

WebSelect(name, value, dy := 0, arrowOffset := 0) {
  global MENU_ENTER_DELAY, MENU_AFTER_DELAY, SUPPLIER_ENTER_DELAY
  WebClick(name, dy)
  WebClear()
  WebTypeText(value, true)
  WebReady(name)
  WebWait(name = "supplier" ? SUPPLIER_ENTER_DELAY : MENU_ENTER_DELAY)
  if arrowOffset != 0 {
    key := arrowOffset > 0 ? "{Down}" : "{Up}"
    Loop Abs(arrowOffset) {
      EnsureWebActive()
      Send key
      WebWait(200)
    }
  }
  EnsureWebActive()
  Send "{Enter}"
  WebWait(MENU_AFTER_DELAY)
  Send "{Tab}"
  WebWait(150)
}

WebDoubleSelect(name, value, dy := 0) {
  WebClick(name, dy, 90)
  WebSelect(name, value, dy)
}

WebDisplayCosts() {
  WebSelect("display costs", "charges and total")
}

WebPasteField(name, value, dy := 0) {
  global SPEED_PERCENT, FIELD_DELAY
  if SPEED_PERCENT < 100 || String(value) = "" {
    WebTypeField(name, value, dy)
    return
  }
  ready := false
  Loop 3 {
    try {
      A_Clipboard := ""
      A_Clipboard := String(value)
      if ClipWait(2) && StrCompare(A_Clipboard, String(value), true) = 0 {
        ready := true
        break
      }
    }
    WebWait(150)
  }
  if !ready
    throw Error("Clipboard preparation failed for " name ". The field has not been cleared.")
  WebClick(name, dy, 200)
  WebClear()
  WebWait(350)
  EnsureWebActive()
  SendEvent "^v"
  WebWait(FIELD_DELAY + 450)
  WebReady(name)
  EnsureWebActive()
  Send "{Tab}"
  WebWait(200)
}

WebScroll(direction) {
  global TAB_DELAY
  EnsureWebActive()
  Send "{Esc}"
  ; Scroll from the current pointer position; no intermediate mouse destination.
  ; Keep wheel scrolling so Ctrl+Home/End cannot move a text-field caret instead.
  keys := direction = "up" ? "{WheelUp 20}" : "{WheelDown 20}"
  Loop 6 {
    EnsureWebActive()
    Send keys
    WebWait(60)
  }
  WebWait(TAB_DELAY)
}

FillWebCargo() {
  global quote, WEB_LCL, WEB_HAZARDOUS, WEB_PACKAGE_SEARCH, WEB_GROSS_WEIGHT, WEB_CARGO_DESCRIPTION, ROW_DELAY
  if WEB_LCL {
    WebClick("add equipment", 0, ROW_DELAY)
    WebTypeField("equipment quantity", quote["pallets"])
    WebSelect("kind of package", WEB_PACKAGE_SEARCH)
    WebTypeField("gross weight", quote["weight"])
    WebTypeField("volume", WebDecimal(quote["volume"]))
    WebClick("use weights per cargo")
    WebClick("use volume per cargo")
    WebTypeField("description of goods", quote["cargoDescription"])
    if WEB_HAZARDOUS
      WebClick("hazardous")
    if quote["stackable"]
      WebClick("stackable")
    return
  }
  cargo := quote.Has("cargoEquipment") ? quote["cargoEquipment"] : quote["cargo"]
  for index, equipment in cargo {
    dy := WebOffset("equipment", index)
    WebClick("add equipment", dy, ROW_DELAY)
    WebTypeField("equipment quantity", equipment["quantity"], dy)
    WebSelect("kind of package", equipment["equipmentSearch"], dy)
    WebTypeField("gross weight", quote.Get("grossWeight", WEB_GROSS_WEIGHT), dy)
    WebTypeField("description of goods", quote.Get("cargoDescription", WEB_CARGO_DESCRIPTION), dy)
    if WEB_HAZARDOUS
      WebClick("hazardous", dy)
  }
}

ConfigureWebRoute(detail, dy) {
  global MENU_ENTER_DELAY
  fields := ["plor loc code", "polout loc code", "podin loc code", "plod loc code"]
  selectors := ["select plor", "select polout", "select podin", "select plod"]
  codes := [detail["routeCollectionCode"], detail["routePolCode"], detail["routePodCode"], detail["routeDeliveryCode"]]
  enabled := [detail["hasCollection"], detail["hasPol"], detail["hasPod"], detail["hasDelivery"]]
  ; Fill locations and modes at their ORIGINAL row positions before deleting.
  for index, field in fields {
    if enabled[index] && codes[index] != ""
      WebSelect(field, codes[index], dy)
  }
  if detail["hasPol"] && detail["hasPod"]
    WebDoubleSelect("polout mot", "vessel", dy)
  else if detail["hasCollection"] && detail["hasPod"]
    WebDoubleSelect("podin mot", "vessel", dy)
  if detail["hasCollection"] && detail["hasPol"]
    WebDoubleSelect("plor mot", "truck", dy)
  if detail["hasDelivery"]
    WebDoubleSelect("plod mot", WebTransportMode(detail["deliveryMode"]), dy)
  ; Bottom-to-top: deleting a lower row cannot move the rows still to be selected.
  Loop 4 {
    index := 5 - A_Index
    if !enabled[index] {
      WebClick(selectors[index], dy)
      WebClick("delete selected event", dy, MENU_ENTER_DELAY)
    }
  }
}

WebIncoterm(value) {
  global WEB_INCOTERMS
  return WEB_INCOTERMS.Get(StrLower(Trim(String(value))), value)
}

WebChargeType(value) {
  global WEB_CHARGE_TYPES
  return WEB_CHARGE_TYPES.Get(StrLower(Trim(String(value))), value)
}

WebTransportMode(value) {
  global WEB_TRANSPORT_MODES
  return WEB_TRANSPORT_MODES.Get(StrLower(Trim(String(value))), value)
}

WebDecimal(value) {
  return StrReplace(String(value), ".", ",")
}

WebNumber(value) {
  return Number(StrReplace(String(value), ",", "."))
}

FillWebCharge(charge, index) {
  global quote, WEB_LCL, ROW_DELAY, WEB_TARGET_CURRENCY
  dy := WebOffset("charge", index)
  WebClick("add sales charge 1", dy, ROW_DELAY)
  WebSelect("sales charge type", WebChargeType(charge["type"]), dy)
  if charge["description"] != ""
    WebPasteField("sales charge description", charge["description"], dy)
  ; Every editable sales rate field is cleared before replacement.
  WebTypeField("sales rate", WebDecimal(charge["sellingRate"]), dy)
  WebSelect("sales rate currency", StrLower(charge.Get("sellingCurrency", WEB_TARGET_CURRENCY)), dy)
  per := WEB_LCL ? charge.Get("per", "") : "q"
  if per = ""
    per := "q"
  WebSelect("sales rate per (quantity/volume/weight etc.)", per, dy)
  ; Per-volume and per-weight amounts/units come from Cargo in BLU Web.
  ; Do NOT focus, clear or write either auto-populated field for those bases.
  if per != "v" && per != "w" {
    if per = "weight_m" {
      quantity := charge["amount"]
      quantityName := "W/M"
    } else {
      quantity := charge.Get("quantity", "1")
      quantityName := charge.Get("quantityDescription", "CONSIGNMENT")
    }
    WebTypeField("sales rate amount name (40'HC, CONSIGNMENT etc)", quantityName, dy)
    WebTypeField("sales rate per amount", WebDecimal(quantity), dy)
  }
  if charge["buyRate"] != ""
    WebTypeField("buying rate", WebDecimal(charge["buyRate"]), dy)
  if charge["buyCurrency"] != ""
    WebSelect("buying rate currency", StrLower(charge["buyCurrency"]), dy)
  if charge["supplier"] != ""
    WebSelect("supplier", charge["supplier"], dy, charge.Get("supplierArrow", 0))
}

WebBuyingOnlyNotice() {
  global quote
  if !quote.Has("buyingOnly") || quote["buyingOnly"].Length = 0
    return
  text := "MANUAL BUYING ENTRY REQUIRED" Chr(10) Chr(10) "Separate buying-only coordinates were not supplied for BLU Web. These costs remain in the calculation but have NOT been entered by the script. Add them in BLU Web before saving:" Chr(10)
  for charge in quote["buyingOnly"]
    text .= Chr(10) charge["description"] " | " charge["buyRate"] " " charge["buyCurrency"] " | " charge["supplier"]
  MsgBox text, "BLU Web - buying-only rows", "Icon!"
}

RestoreClipboard(*) {
  global SavedClipboard
  if IsObject(SavedClipboard) {
    A_Clipboard := SavedClipboard
    SavedClipboard := ""
  }
}
`;
  }

  generateAhk = function() {
    const source = legacy.generateAhk();
    return automationMode === "web" ? buildWebScript(source, false) : source;
  };
  generateLclAhk = function() {
    const source = legacy.generateLclAhk();
    return automationMode === "web" ? buildWebScript(source, true) : source;
  };

  function replaceAhkFunction(source, name, replacement) {
    const pattern = new RegExp("^" + name + "\\([^\\n]*\\) \\{[\\s\\S]*?^\\}", "m");
    if (!pattern.test(source)) throw new Error("Missing merged-script helper: " + name);
    return source.replace(pattern, () => replacement);
  }
  buildMergedAhkV923 = function(items) {
    const flags = items.map(item => /^; BLU_AUTOMATION_MODE: WEB$/m.test(String(item.content || "").replace(/\r/g, "")));
    if (!flags.some(Boolean)) return legacy.buildMergedAhkV923(items);
    if (!flags.every(Boolean)) throw new Error("BLU Web and BLU Citrix scripts cannot be mixed in one merged run. Create separate batches.");
    let source = legacy.buildMergedAhkV923(items);
    source = source.replace(/; Generated by BLU Auto Quote - merged-script runner[^\n]*/, "; Generated by BLU Auto Quote v10.1.0 - BLU Web merged runner\n; BLU_AUTOMATION_MODE: WEB");
    source = source.replace(/; Sequence after each completed quote:[\s\S]*?; then click New quote[^\n]*/, "; Review and save each Web quote manually before confirming the next one.\n; Each child opens its own quotation using the Web menu. No Ctrl+S is sent to Edge.");
    source = source.replace(/^BLU_EXACT_WINDOW :=.*$/m, 'BLU_EXACT_WINDOW := "BLU Web ahk_exe msedge.exe"')
      .replace(/^BLU_WINDOW :=.*$/m, 'BLU_WINDOW := "BLU Web ahk_exe msedge.exe"')
      .replace(/^NEW_QUOTE_[XY] :=.*\n/gm, "")
      .replace('Could not find the BLU Citrix window (wfica32.exe).', 'Could not find the BLU Web window (msedge.exe).');
    source = replaceAhkFunction(source, "SaveCurrentQuoteV923", String.raw`SaveCurrentQuoteV923(index) {
  ToolTip
  message := "Web quote " index " has been entered. Review it, complete any manual buying-only rows, and save it in BLU Web. Switch to Edge to do this before clicking OK here. Cancel stops the remaining batch."
  if MsgBox(message, "BLU Web - review and save", "OKCancel Default2") != "OK"
    throw Error("Batch stopped by user after Web quote " index ".")
}`);
    source = replaceAhkFunction(source, "OpenNewQuoteV923", String.raw`OpenNewQuoteV923(nextIndex) {
  ; The next Web child creates its own quotation. Never use a Citrix coordinate.
  ToolTip "Starting Web quote " nextIndex
}`);
    return source;
  };

  function syncModeUi() {
    document.body.dataset.bluAutomationMode = automationMode;
    if ($("bluAutomationMode")) $("bluAutomationMode").value = automationMode;
    const web = automationMode === "web";
    if ($("bluAutomationModeStatus")) $("bluAutomationModeStatus").textContent = web
      ? "BLU Web Mode - Microsoft Edge"
      : "BLU Citrix Mode - original v9.7.4 automation";
    if ($("bluWebModeHelp")) $("bluWebModeHelp").hidden = !web;
    if ($("bluWebGenerationNote") && !web) $("bluWebGenerationNote").hidden = true;
    document.querySelectorAll(".app-version").forEach(el => { el.textContent = "AHK Script Gen // Version " + VERSION; });
    document.title = "BLU Auto Quote v" + VERSION;
  }
  function installModeUi() {
    const style = document.createElement("style");
    style.textContent = `
      .blu-automation-bar{margin:12px 0;padding:10px 12px;border:1px solid #999;background:#f7f7f7;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
      .blu-automation-bar label{font-size:12px;font-weight:700;}
      .blu-automation-bar select{width:180px;margin:0;}
      .blu-automation-status{font-size:12px;color:#444;}
      .blu-web-help{flex-basis:100%;font-size:12px;line-height:1.5;}
      .blu-web-help[hidden],.blu-web-note[hidden]{display:none!important;}
      .blu-web-note{flex-basis:100%;padding:8px;border:1px solid #a66900;background:#fff6df;font-size:12px;}
      @media(max-width:600px){.blu-automation-status{flex-basis:100%;}}
    `;
    document.head.append(style);
    const bar = document.createElement("section");
    bar.className = "blu-automation-bar";
    bar.id = "bluAutomationBar";
    bar.setAttribute("aria-label", "BLU automation target");
    bar.innerHTML = `<label for="bluAutomationMode">Automation mode</label>
      <select id="bluAutomationMode"><option value="citrix">BLU Citrix Mode</option><option value="web">BLU Web Mode</option></select>
      <span id="bluAutomationModeStatus" class="blu-automation-status" aria-live="polite"></span>
      <div id="bluWebModeHelp" class="blu-web-help" hidden>Open BLU Web in Microsoft Edge on the recorded 1920 &times; 1080 layout, with Windows scaling at 100% and the same Edge zoom as when the coordinates were recorded. F8 starts, F9 pauses, Esc stops. The script creates the quotation through the Web menu. Review and save manually. In a merged Web batch, confirm after saving each quote.</div>
      <div id="bluWebGenerationNote" class="blu-web-note" role="status" hidden></div>`;
    document.querySelector("main > header").after(bar);
    $("bluAutomationMode").addEventListener("change", event => setAutomationMode(event.target.value));
    syncModeUi();
  }
  installModeUi();
  window.BLU_AUTO_QUOTE_V1010 = window.BLU_AUTO_QUOTE_V1000 = Object.freeze({
    version: VERSION, mode: () => automationMode, setMode: setAutomationMode,
    config: CONFIG, offsetFor, chargeSearch, incotermSearch, transportModeSearch, extractQuoteBlock,
    legacyFcl: legacy.generateAhk, legacyLcl: legacy.generateLclAhk,
    buildWebScript
  });
})();
