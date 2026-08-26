/**
 * MemoryVerse - Complete Scrapbook Editor Engine
 */

window.state = {
  canvas: null,
  scaler: null,
  viewport: null,
  activeItem: null,
  highestZIndex: 10,
  scale: 1
};

window.SCRAPBOOK_ID = 1;
window.BASE_STATIC_URL = '/static/';

window.STICKER_CATEGORIES = [
  { id: 'animals', name: '🐰 Animals', json: 'animals.json' },
  { id: 'emotions', name: '😊 Emotions', json: 'emotions.json' },
  { id: 'flowers', name: '🌸 Flowers', json: 'flowers.json' },
  { id: 'aesthetic', name: '✨ Aesthetic', json: 'aesthetic.json' },
  { id: 'food', name: '🍔 Food', json: 'food.json' },
  { id: 'travel', name: '✈️ Travel', json: 'travel.json' },
  { id: 'study', name: '📚 Study', json: 'study.json' }
];

document.addEventListener('DOMContentLoaded', () => {
  window.state.canvas = document.getElementById('scrapbookCanvas');
  window.state.scaler = document.getElementById('canvasScaler');
  window.state.viewport = document.getElementById('viewport');

  if (window.state.canvas) {
    window.SCRAPBOOK_ID = parseInt(window.state.canvas.dataset.id, 10) || 1;
    window.BASE_STATIC_URL = window.state.canvas.dataset.static || '/static/';
    if (!window.BASE_STATIC_URL.endsWith('/')) window.BASE_STATIC_URL += '/';
    
    applyCanvasBackground(window.state.canvas.dataset.bg || '#FFF8CF');
  }

  updateResponsiveScale();
  window.addEventListener('resize', updateResponsiveScale);

  const bindClick = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  bindClick('btnBg', () => openPanel('backgrounds'));
  bindClick('btnPhoto', () => {
    const pInput = document.getElementById('photoInput');
    if (pInput) pInput.click();
  });
  bindClick('btnStickers', () => openPanel('stickers'));
  bindClick('btnFrames', () => openPanel('frames'));
  bindClick('btnPapers', () => openPanel('papers'));
  bindClick('btnTape', () => openPanel('tape'));
  bindClick('btnText', () => addText());
  bindClick('btnCloseDrawer', () => closeDrawer());
  bindClick('saveBtn', () => saveScrapbook());

  setupTextFormatControls();

  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', function() {
      handlePhotoUpload(this);
    });
  }

  // Restore initial items
  try {
    const rawData = document.getElementById('initialItemsData');
    if (rawData && rawData.textContent.trim() !== '') {
      const initialItems = JSON.parse(rawData.textContent);
      if (Array.isArray(initialItems)) {
        initialItems.forEach(item => restoreItem(item));
      }
    }
  } catch (err) {
    console.error('[MemoryVerse] Error restoring items:', err);
  }

  if (window.state.canvas) {
    window.state.canvas.addEventListener('pointerdown', (e) => {
      if (e.target === window.state.canvas) {
        deselectAll();
      }
    });
  }
});

// ----------------- RESPONSIVE SCALER -----------------

function updateResponsiveScale() {
  if (!window.state.viewport || !window.state.scaler) return;
  const vw = window.state.viewport.clientWidth - 24;
  const vh = window.state.viewport.clientHeight - 24;

  const canvasW = 800;
  const canvasH = 600;

  const scaleX = vw / canvasW;
  const scaleY = vh / canvasH;
  const targetScale = Math.min(scaleX, scaleY, 1.0);

  window.state.scale = targetScale;
  window.state.scaler.style.transform = `scale(${targetScale})`;
}

// ----------------- BACKGROUND -----------------

function applyCanvasBackground(val) {
  if (!window.state.canvas) return;
  if (val.startsWith('url(') || val.includes('/') || val.endsWith('.png') || val.endsWith('.jpg')) {
    const cleanUrl = val.startsWith('url(') ? val : `url("${val}")`;
    window.state.canvas.style.backgroundImage = cleanUrl;
    window.state.canvas.style.backgroundSize = 'cover';
    window.state.canvas.style.backgroundPosition = 'center';
  } else {
    window.state.canvas.style.backgroundImage = 'none';
    window.state.canvas.style.backgroundColor = val;
  }
}

// ----------------- SELECTION & HANDLES -----------------

function deselectAll() {
  if (window.state.activeItem) {
    window.state.activeItem.classList.remove('selected');
    const handles = window.state.activeItem.querySelectorAll('.item-handle');
    handles.forEach(h => h.remove());
    window.state.activeItem = null;
  }
  const bar = document.getElementById('textFormatBar');
  if (bar) bar.classList.remove('active');
}

function selectItem(el) {
  if (window.state.activeItem === el) return;
  deselectAll();
  window.state.activeItem = el;
  el.classList.add('selected');

  window.state.highestZIndex += 1;
  el.style.zIndex = window.state.highestZIndex;

  const resizeH = document.createElement('div');
  resizeH.className = 'item-handle resize-handle';
  resizeH.innerHTML = '⤡';
  attachResizeController(resizeH, el);
  el.appendChild(resizeH);

  const rotateH = document.createElement('div');
  rotateH.className = 'item-handle rotate-handle';
  rotateH.innerHTML = '↻';
  attachRotateController(rotateH, el);
  el.appendChild(rotateH);

  const deleteH = document.createElement('div');
  deleteH.className = 'item-handle delete-handle';
  deleteH.innerHTML = '✕';
  deleteH.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    el.remove();
    deselectAll();
  });
  el.appendChild(deleteH);

  if (el.dataset.type === 'text') {
    syncTextFormatBar(el);
  }
}

function createBaseItemElement(type, x, y, width, height, rotation, zIndex) {
  const el = document.createElement('div');
  el.className = 'canvas-item';
  el.dataset.type = type;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;

  const rot = parseFloat(rotation) || 0;
  el.dataset.rotation = rot;
  el.style.transform = `rotate(${rot}deg)`;

  const z = parseInt(zIndex, 10) || ++window.state.highestZIndex;
  el.style.zIndex = z;
  if (z > window.state.highestZIndex) window.state.highestZIndex = z;

  attachDragController(el);
  window.state.canvas.appendChild(el);
  return el;
}

// ----------------- DRAG, RESIZE, ROTATE CONTROLLERS -----------------

function attachDragController(el) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initLeft = 0, initTop = 0;

  el.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('item-handle')) return;

    selectItem(el);
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initLeft = parseFloat(el.style.left) || 0;
    initTop = parseFloat(el.style.top) || 0;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const currentScale = window.state.scale || 1.0;
    const dx = (e.clientX - startX) / currentScale;
    const dy = (e.clientY - startY) / currentScale;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      el.style.left = `${initLeft + dx}px`;
      el.style.top = `${initTop + dy}px`;
    }
  });

  const stopDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  el.addEventListener('pointerup', stopDrag);
  el.addEventListener('pointercancel', stopDrag);
}

function attachResizeController(handle, el) {
  let isResizing = false;
  let startX = 0;
  let startW = 0, startH = 0;
  let aspectRatio = 1;

  handle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startW = parseFloat(el.style.width) || 100;
    startH = parseFloat(el.style.height) || 100;
    aspectRatio = startW / startH;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener('pointermove', (e) => {
    if (!isResizing) return;
    e.preventDefault();
    const currentScale = window.state.scale || 1.0;
    const dx = (e.clientX - startX) / currentScale;
    let newWidth = startW + dx;

    newWidth = Math.max(40, Math.min(500, newWidth));
    const newHeight = newWidth / aspectRatio;

    el.style.width = `${newWidth}px`;
    el.style.height = `${newHeight}px`;

    const txt = el.querySelector('.canvas-text');
    if (txt) {
      const calcFont = Math.max(14, Math.round(newWidth * 0.12));
      txt.style.fontSize = `${calcFont}px`;
      const sizeInput = document.getElementById('fontSizeInput');
      if (sizeInput) sizeInput.value = calcFont;
    }
  });

  const stopResize = (e) => {
    if (isResizing) {
      isResizing = false;
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  handle.addEventListener('pointerup', stopResize);
  handle.addEventListener('pointercancel', stopResize);
}

function attachRotateController(handle, el) {
  let isRotating = false;
  let centerX = 0, centerY = 0;

  handle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    isRotating = true;

    const rect = el.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener('pointermove', (e) => {
    if (!isRotating) return;
    e.preventDefault();
    const radians = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let degrees = radians * (180 / Math.PI) + 135;
    degrees = (degrees + 360) % 360;

    el.dataset.rotation = degrees.toFixed(1);
    el.style.transform = `rotate(${degrees}deg)`;
  });

  const stopRotate = (e) => {
    if (isRotating) {
      isRotating = false;
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };

  handle.addEventListener('pointerup', stopRotate);
  handle.addEventListener('pointercancel', stopRotate);
}

// ----------------- TEXT FORMATTING CONTROLS -----------------

function setupTextFormatControls() {
  const bar = document.getElementById('textFormatBar');
  if (bar) {
    bar.addEventListener('pointerdown', (e) => e.stopPropagation());
    bar.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  const fontSelect = document.getElementById('fontFamilySelect');
  if (fontSelect) {
    fontSelect.addEventListener('change', () => {
      if (window.state.activeItem && window.state.activeItem.dataset.type === 'text') {
        const txt = window.state.activeItem.querySelector('.canvas-text');
        if (txt) txt.style.fontFamily = fontSelect.value;
      }
    });
  }

  const sizeInput = document.getElementById('fontSizeInput');
  const setFontSize = (size) => {
    const val = Math.max(10, Math.min(150, parseInt(size, 10) || 22));
    if (sizeInput) sizeInput.value = val;
    if (window.state.activeItem && window.state.activeItem.dataset.type === 'text') {
      const txt = window.state.activeItem.querySelector('.canvas-text');
      if (txt) {
        txt.style.fontSize = `${val}px`;
        txt.style.lineHeight = `${Math.round(val * 1.3)}px`;
      }
    }
  };

  if (sizeInput) {
    sizeInput.addEventListener('input', () => setFontSize(sizeInput.value));
  }

  const btnDec = document.getElementById('btnDecreaseSize');
  if (btnDec) {
    btnDec.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = parseInt(sizeInput.value, 10) || 22;
      setFontSize(cur - 2);
    });
  }

  const btnInc = document.getElementById('btnIncreaseSize');
  if (btnInc) {
    btnInc.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = parseInt(sizeInput.value, 10) || 22;
      setFontSize(cur + 2);
    });
  }

  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.state.activeItem && window.state.activeItem.dataset.type === 'text') {
        const txt = window.state.activeItem.querySelector('.canvas-text');
        if (txt) {
          txt.style.color = dot.dataset.color;
          document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
          dot.classList.add('selected');
        }
      }
    });
  });

  const btnBold = document.getElementById('btnBold');
  if (btnBold) {
    btnBold.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.state.activeItem && window.state.activeItem.dataset.type === 'text') {
        const txt = window.state.activeItem.querySelector('.canvas-text');
        if (txt) {
          const isBold = txt.style.fontWeight === 'bold' || txt.style.fontWeight === '700';
          txt.style.fontWeight = isBold ? 'normal' : 'bold';
          btnBold.classList.toggle('active', !isBold);
        }
      }
    });
  }

  const btnItalic = document.getElementById('btnItalic');
  if (btnItalic) {
    btnItalic.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.state.activeItem && window.state.activeItem.dataset.type === 'text') {
        const txt = window.state.activeItem.querySelector('.canvas-text');
        if (txt) {
          const isItalic = txt.style.fontStyle === 'italic';
          txt.style.fontStyle = isItalic ? 'normal' : 'italic';
          btnItalic.classList.toggle('active', !isItalic);
        }
      }
    });
  }

  const btnUnderline = document.getElementById('btnUnderline');
  if (btnUnderline) {
    btnUnderline.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.state.activeItem && window.state.activeItem.dataset.type === 'text') {
        const txt = window.state.activeItem.querySelector('.canvas-text');
        if (txt) {
          const isUnderline = txt.style.textDecoration === 'underline';
          txt.style.textDecoration = isUnderline ? 'none' : 'underline';
          btnUnderline.classList.toggle('active', !isUnderline);
        }
      }
    });
  }
}

function syncTextFormatBar(el) {
  const bar = document.getElementById('textFormatBar');
  if (!bar) return;
  bar.classList.add('active');

  const txt = el.querySelector('.canvas-text');
  if (!txt) return;

  const fontSelect = document.getElementById('fontFamilySelect');
  if (fontSelect && txt.style.fontFamily) {
    fontSelect.value = txt.style.fontFamily;
  }

  const sizeInput = document.getElementById('fontSizeInput');
  if (sizeInput) {
    const currentSize = parseInt(window.getComputedStyle(txt).fontSize, 10) || 22;
    sizeInput.value = currentSize;
  }

  const btnBold = document.getElementById('btnBold');
  if (btnBold) {
    const isBold = txt.style.fontWeight === 'bold' || txt.style.fontWeight === '700';
    btnBold.classList.toggle('active', isBold);
  }

  const btnItalic = document.getElementById('btnItalic');
  if (btnItalic) {
    btnItalic.classList.toggle('active', txt.style.fontStyle === 'italic');
  }

  const btnUnderline = document.getElementById('btnUnderline');
  if (btnUnderline) {
    btnUnderline.classList.toggle('active', txt.style.textDecoration === 'underline');
  }
}

// ----------------- ADD & RESTORE TEXT ITEMS -----------------

function addText() {
  const w = 220;
  const h = 80;
  const el = createBaseItemElement('text', 60, 60, w, h, 0, ++window.state.highestZIndex);

  const textDiv = document.createElement('div');
  textDiv.className = 'canvas-text';
  textDiv.contentEditable = 'true';
  textDiv.innerText = 'Write your memory... ✨';
  textDiv.style.fontSize = '22px';
  textDiv.style.color = '#37352F';

  el.appendChild(textDiv);
  selectItem(el);
  textDiv.focus();
}

function restoreItem(itemData) {
  const el = createBaseItemElement(
    itemData.type,
    itemData.x,
    itemData.y,
    itemData.width,
    itemData.height,
    itemData.rotation,
    itemData.z_index
  );

  if (['sticker', 'photo', 'frame', 'paper', 'tape'].includes(itemData.type)) {
    const img = document.createElement('img');
    img.src = itemData.content;
    img.onerror = () => el.remove();
    el.appendChild(img);
  } else if (itemData.type === 'text') {
    const textDiv = document.createElement('div');
    textDiv.className = 'canvas-text';
    textDiv.contentEditable = 'true';
    textDiv.innerText = itemData.content || 'Write your memory...';

    if (itemData.extra_data) {
      try {
        const extra = typeof itemData.extra_data === 'string' ? JSON.parse(itemData.extra_data) : itemData.extra_data;
        if (extra.fontFamily) textDiv.style.fontFamily = extra.fontFamily;
        if (extra.color) textDiv.style.color = extra.color;
        if (extra.fontWeight) textDiv.style.fontWeight = extra.fontWeight;
        if (extra.fontStyle) textDiv.style.fontStyle = extra.fontStyle;
        if (extra.textDecoration) textDiv.style.textDecoration = extra.textDecoration;
        if (extra.fontSize) textDiv.style.fontSize = extra.fontSize;
      } catch (_) {}
    }

    if (!textDiv.style.fontSize) {
      textDiv.style.fontSize = `${Math.max(14, Math.round(itemData.width * 0.12))}px`;
    }
    el.appendChild(textDiv);
  }
}

// ----------------- DRAWER & ASSETS -----------------

function openPanel(panelType) {
  const drawer = document.getElementById('editorDrawer');
  const title = document.getElementById('drawerTitle');
  const content = document.getElementById('drawerContent');
  if (!drawer || !title || !content) return;

  drawer.classList.add('open');

  if (panelType === 'stickers') {
    title.innerText = 'Choose Sticker 🌸';
    renderStickerPanel(content);
  } else if (panelType === 'backgrounds') {
    title.innerText = 'Choose Background 🖼️';
    renderBackgroundPanel(content);
  } else if (panelType === 'tape') {
    title.innerText = 'Washi Tape 🎀';
    renderImageAssetsPanel(content, 'tapes', 'tapes.json', 'tape');
  } else if (panelType === 'papers') {
    title.innerText = 'Paper Notes 📜';
    renderImageAssetsPanel(content, 'papers', 'papers.json', 'paper');
  } else if (panelType === 'frames') {
    title.innerText = 'Aesthetic Frames 🖼️';
    renderImageAssetsPanel(content, 'frames', 'frames.json', 'frame');
  }
}

function closeDrawer() {
  const drawer = document.getElementById('editorDrawer');
  if (drawer) drawer.classList.remove('open');
}

function renderStickerPanel(container) {
  container.innerHTML = `
    <div class="sticker-category-tabs" id="categoryTabs"></div>
    <div class="sticker-grid" id="stickersGrid"></div>
  `;

  const tabsContainer = document.getElementById('categoryTabs');
  window.STICKER_CATEGORIES.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-tab ${idx === 0 ? 'active' : ''}`;
    btn.innerText = cat.name;
    btn.onclick = () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      loadCategoryStickers(cat);
    };
    tabsContainer.appendChild(btn);
  });

  loadCategoryStickers(window.STICKER_CATEGORIES[0]);
}

async function loadCategoryStickers(category) {
  const grid = document.getElementById('stickersGrid');
  if (!grid) return;
  grid.innerHTML = '<p style="color: #787774; font-size: 0.85rem;">Loading stickers...</p>';

  try {
    let files = [];
    const apiRes = await fetch(`/api/stickers/${category.id}`);
    if (apiRes.ok) files = await apiRes.json();
    
    if (!files || files.length === 0) {
      const jsonRes = await fetch(`${window.BASE_STATIC_URL}data/${category.json}?t=${Date.now()}`);
      if (jsonRes.ok) files = await jsonRes.json();
    }

    if (!Array.isArray(files) || files.length === 0) {
      grid.innerHTML = `<p style="color: #787774; font-size: 0.85rem; padding: 12px;">Place PNG files in <code>static/images/stickers/${category.id}/</code></p>`;
      return;
    }

    grid.innerHTML = '';
    files.forEach(filename => {
      if (!filename || typeof filename !== 'string') return;
      const stickerUrl = `${window.BASE_STATIC_URL}images/stickers/${category.id}/${encodeURIComponent(filename.trim())}`;

      const card = document.createElement('div');
      card.className = 'sticker-grid-item';

      const img = document.createElement('img');
      img.src = stickerUrl;
      img.alt = filename;
      img.loading = 'lazy';
      img.onerror = () => card.remove();

      card.appendChild(img);
      card.onclick = () => {
        addMediaToCanvas('sticker', stickerUrl, 100, 100);
        closeDrawer();
      };

      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color: #787774; font-size: 0.85rem; padding: 12px;">Could not load stickers for ${category.name}.</p>`;
  }
}

async function renderImageAssetsPanel(container, folderName, jsonName, itemType) {
  container.innerHTML = '<div class="sticker-grid" id="assetGrid"><p style="color: #787774; font-size: 0.85rem;">Loading assets...</p></div>';
  const grid = document.getElementById('assetGrid');

  try {
    let files = [];
    const apiRes = await fetch(`/api/stickers/${folderName}`);
    if (apiRes.ok) files = await apiRes.json();

    if (!files || files.length === 0) {
      const jsonRes = await fetch(`${window.BASE_STATIC_URL}data/${jsonName}?t=${Date.now()}`);
      if (jsonRes.ok) files = await jsonRes.json();
    }

    if (!Array.isArray(files) || files.length === 0) {
      grid.innerHTML = `<p style="color: #787774; font-size: 0.85rem; padding: 12px;">Place files in <code>static/images/stickers/${folderName}/</code></p>`;
      return;
    }

    grid.innerHTML = '';
    files.forEach(filename => {
      const assetUrl = `${window.BASE_STATIC_URL}images/stickers/${folderName}/${encodeURIComponent(filename.trim())}`;
      const card = document.createElement('div');
      card.className = 'sticker-grid-item';

      const img = document.createElement('img');
      img.src = assetUrl;
      img.onerror = () => card.remove();

      card.appendChild(img);
      card.onclick = () => {
        const defaultWidth = itemType === 'tape' ? 140 : (itemType === 'paper' ? 150 : 160);
        const defaultHeight = itemType === 'tape' ? 50 : (itemType === 'paper' ? 150 : 160);
        addMediaToCanvas(itemType, assetUrl, defaultWidth, defaultHeight);
        closeDrawer();
      };

      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color: #787774; font-size: 0.85rem; padding: 12px;">No files found in <code>static/images/stickers/${folderName}/</code></p>`;
  }
}

async function renderBackgroundPanel(container) {
  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">Solid Pastels 🎨</h4>
      <div id="solidBgContainer" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
    </div>
    <div>
      <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">Image Backgrounds 🖼️</h4>
      <div id="imageBgGrid" class="sticker-grid"><p style="color: #787774; font-size: 0.8rem;">Loading background images...</p></div>
    </div>
  `;

  const solidBgs = [
    { name: 'Cream 🤍', color: '#F8F6F2' },
    { name: 'Pink 🌸', color: '#FFE4EC' },
    { name: 'Sky ☁️', color: '#E5F4FF' },
    { name: 'Lavender 💜', color: '#EEE6FF' },
    { name: 'Yellow 💛', color: '#FFF8CF' },
    { name: 'Mint 🌿', color: '#E2F8E7' }
  ];
  const solidContainer = document.getElementById('solidBgContainer');
  solidBgs.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tool-btn';
    btn.style.background = b.color;
    btn.innerText = b.name;
    btn.onclick = () => {
      applyCanvasBackground(b.color);
      closeDrawer();
    };
    solidContainer.appendChild(btn);
  });

  const imageGrid = document.getElementById('imageBgGrid');
  try {
    let bgs = [];
    const apiRes = await fetch('/api/stickers/backgrounds');
    if (apiRes.ok) bgs = await apiRes.json();
    if (!bgs || bgs.length === 0) {
      const jsonRes = await fetch(`${window.BASE_STATIC_URL}data/backgrounds.json?t=${Date.now()}`);
      if (jsonRes.ok) bgs = await jsonRes.json();
    }

    if (Array.isArray(bgs) && bgs.length > 0) {
      imageGrid.innerHTML = '';
      bgs.forEach(bgFile => {
        const bgUrl = `${window.BASE_STATIC_URL}images/stickers/backgrounds/${encodeURIComponent(bgFile.trim())}`;
        const card = document.createElement('div');
        card.className = 'sticker-grid-item';

        const img = document.createElement('img');
        img.src = bgUrl;
        img.onerror = () => card.remove();

        card.appendChild(img);
        card.onclick = () => {
          applyCanvasBackground(bgUrl);
          closeDrawer();
        };
        imageGrid.appendChild(card);
      });
    } else {
      imageGrid.innerHTML = '<p style="color: #787774; font-size: 0.8rem; padding: 12px;">Place images into <code>static/images/stickers/backgrounds/</code></p>';
    }
  } catch (e) {
    imageGrid.innerHTML = '<p style="color: #787774; font-size: 0.8rem; padding: 12px;">No custom background images found.</p>';
  }
}

function addMediaToCanvas(type, srcUrl, width = 100, height = 100) {
  const el = createBaseItemElement(type, 80, 80, width, height, 0, ++window.state.highestZIndex);
  const img = document.createElement('img');
  img.src = srcUrl;
  el.appendChild(img);
  selectItem(el);
}

function handlePhotoUpload(input) {
  if (!input.files || !input.files[0]) return;
  const formData = new FormData();
  formData.append('image', input.files[0]);

  fetch('/scrapbook/upload_image', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      addMediaToCanvas('photo', res.url, 160, 160);
    } else {
      alert('Failed to upload photo: ' + (res.message || 'Unknown error'));
    }
    input.value = '';
  })
  .catch(err => {
    console.error('[MemoryVerse] Photo Upload Error:', err);
    input.value = '';
  });
}

// ----------------- SAVE PERSISTENCE -----------------

function saveScrapbook() {
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.innerText = 'Saving... ✨';

  const items = [];
  const itemEls = window.state.canvas.querySelectorAll('.canvas-item');

  itemEls.forEach(el => {
    const type = el.dataset.type;
    let content = '';
    let extraData = {};

    if (['sticker', 'photo', 'frame', 'paper', 'tape'].includes(type)) {
      const img = el.querySelector('img');
      content = img ? img.src : '';
    } else if (type === 'text') {
      const txt = el.querySelector('.canvas-text');
      content = txt ? txt.innerText : '';
      if (txt) {
        extraData = {
          fontFamily: txt.style.fontFamily || "'Plus Jakarta Sans', sans-serif",
          color: txt.style.color || '#37352F',
          fontWeight: txt.style.fontWeight || 'normal',
          fontStyle: txt.style.fontStyle || 'normal',
          textDecoration: txt.style.textDecoration || 'none',
          fontSize: txt.style.fontSize || '22px'
        };
      }
    }

    items.push({
      type: type,
      content: content,
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top) || 0,
      width: parseFloat(el.style.width) || 100,
      height: parseFloat(el.style.height) || 100,
      rotation: parseFloat(el.dataset.rotation) || 0,
      z_index: parseInt(el.style.zIndex, 10) || 1,
      extra_data: extraData
    });
  });

  const currentBg = window.state.canvas.style.backgroundImage && window.state.canvas.style.backgroundImage !== 'none'
    ? window.state.canvas.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '')
    : (window.state.canvas.style.backgroundColor || '#FFF8CF');

  const payload = {
    title: document.getElementById('scrapbookTitle').value,
    background: currentBg,
    items: items
  };

  fetch(`/scrapbook/${window.SCRAPBOOK_ID}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      if (saveBtn) saveBtn.innerText = 'Saved! 💖';
      setTimeout(() => { if (saveBtn) saveBtn.innerText = 'Save 💚'; }, 2000);
    } else {
      alert('Failed to save scrapbook.');
      if (saveBtn) saveBtn.innerText = 'Save 💚';
    }
  })
  .catch(err => {
    console.error('[MemoryVerse] Save Error:', err);
    if (saveBtn) saveBtn.innerText = 'Save 💚';
  });
}