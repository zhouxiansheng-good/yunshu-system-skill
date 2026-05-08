/**
 * 妙笔生花 - 叙事宇宙编辑器 v2.1
 * 三层架构：L1大纲宇宙 → L2细纲星系 → L3正文星尘
 * 色彩心理学 + 行为心理学驱动设计
 */

// ==================== 全局状态 ====================
let cy = null;
let ws = null;
let currentLayer = 'L1';
let currentModule = 'characters';
let currentView = 'overview';
let currentChapterId = null;
let topologyData = {
  L1: {
    characters: { nodes: [], edges: [] },
    cheats: { nodes: [], edges: [] },
    forces: { nodes: [], edges: [] },
    activeModule: 'characters',
    version: 1
  },
  L2: {
    chapters: [],
    characters: { nodes: [], edges: [] },
    cheats: { nodes: [], edges: [] },
    forces: { nodes: [], edges: [] },
    activeModule: 'characters',
    version: 1
  },
  L3: { nodes: [], edges: [], version: 1 },
  activeLayer: 'L1'
};

const layerModuleState = {
  L1: 'characters',
  L2: 'characters'
};
let currentEditNodeId = null;
let currentEditEdgeId = null;
let isAddingEdge = false;
let edgeSourceNode = null;

const filterState = {};

// ==================== 色彩配置 ====================
const COLORS = {
  character: '#ff6b9d', cheat: '#ffd93d', event: '#6bcb77',
  world: '#4d96ff', force: '#c084fc', scene: '#f4a261',
  character_state: '#ff6b9d', cheat_state: '#ffd93d', force_state: '#c084fc',
  chapter: '#6bcb77',
  characters: '#ff6b9d', cheats: '#ffd93d', forces: '#c084fc'
};

const MODULE_CONFIG = {
  characters: {
    name: '人物', icon: '👤', color: '#ff6b9d', nodeType: 'character', edgeLabel: '关系'
  },
  cheats: {
    name: '金手指', icon: '⚡', color: '#ffd93d', nodeType: 'cheat', edgeLabel: '成长'
  },
  forces: {
    name: '势力', icon: '🏛️', color: '#c084fc', nodeType: 'force', edgeLabel: '关系'
  }
};

const EDGE_MARK_COLORS = {
  '悬疑点': '#ff9500', '反转点': '#ff2d55', '高潮': '#ffd60a',
  '伏笔': '#af52de', '因果': '#5ac8fa', '情感': '#ff6b9d'
};

const NODE_SHAPES = {
  character: 'ellipse', cheat: 'hexagon', event: 'round-rectangle',
  world: 'hexagon', force: 'round-rectangle', scene: 'ellipse',
  character_state: 'ellipse', cheat_state: 'hexagon', force_state: 'round-rectangle',
  chapter: 'round-rectangle'
};

const WORLDVIEW_BACKGROUNDS = {
  xuanhuan: {
    name: '玄幻',
    gradient: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d1a 70%)',
    particles: { hue1: 280, hue2: 200, count: 80 }
  },
  wuxia: {
    name: '武侠',
    gradient: 'radial-gradient(ellipse at center, #1a1a0a 0%, #0d0d1a 70%)',
    particles: { hue1: 30, hue2: 60, count: 60 }
  },
  xiandai: {
    name: '现代都市',
    gradient: 'radial-gradient(ellipse at center, #0a1a2e 0%, #0d0d1a 70%)',
    particles: { hue1: 200, hue2: 180, count: 50 }
  },
  kehuan: {
    name: '科幻',
    gradient: 'radial-gradient(ellipse at center, #0a1a1a 0%, #0d0d1a 70%)',
    particles: { hue1: 160, hue2: 120, count: 70 }
  },
  default: {
    name: '默认',
    gradient: 'radial-gradient(ellipse at center, #1a1a35 0%, #0d0d1a 70%)',
    particles: { hue1: 330, hue2: 200, count: 60 }
  }
};

const LAYER_NODE_TYPES = {
  L1: ['character', 'cheat', 'force'],
  L2: ['chapter', 'character_state', 'cheat_state', 'force_state'],
  L3: ['text']
};

// ==================== 粒子背景 ====================
let particleAnimationId = null;
let currentWorldview = 'default';

function initParticles(worldviewType = 'default') {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  if (particleAnimationId) {
    cancelAnimationFrame(particleAnimationId);
  }

  const bgConfig = WORLDVIEW_BACKGROUNDS[worldviewType] || WORLDVIEW_BACKGROUNDS.default;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.hue = Math.random() > 0.5 ? bgConfig.particles.hue1 : bgConfig.particles.hue2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < bgConfig.particles.count; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x, dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(100, 100, 200, ${0.1 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    particleAnimationId = requestAnimationFrame(animate);
  }
  animate();
}

function switchWorldview(worldviewType) {
  currentWorldview = worldviewType;
  const bgConfig = WORLDVIEW_BACKGROUNDS[worldviewType] || WORLDVIEW_BACKGROUNDS.default;
  const cyContainer = document.getElementById('cy');
  if (cyContainer) cyContainer.style.background = bgConfig.gradient;
  initParticles(worldviewType);
  showToast(`🌍 切换到${bgConfig.name}世界观背景`);
}

// ==================== Cytoscape 初始化 ====================
function initCytoscape() {
  cy = cytoscape({
    container: document.getElementById('cy'),
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(bgColor)',
          'label': 'data(label)',
          'width': 55, 'height': 55,
          'font-size': '11px', 'color': '#f0f0f5',
          'text-outline-color': '#0d0d1a', 'text-outline-width': 2,
          'text-valign': 'bottom', 'text-margin-y': 6,
          'border-width': 2, 'border-color': 'rgba(255,255,255,0.2)', 'border-opacity': 0.5,
          'transition-property': 'background-color, border-color, width, height',
          'transition-duration': '0.3s'
        }
      },
      {
        selector: 'node[?isTagged]',
        style: {
          'border-width': 3, 'border-color': 'data(tagColor)', 'border-opacity': 1,
          'shadow-blur': 15, 'shadow-color': 'data(tagColor)', 'shadow-opacity': 0.5
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4, 'border-color': '#fff', 'width': 65, 'height': 65,
          'shadow-blur': 25, 'shadow-color': 'data(bgColor)', 'shadow-opacity': 0.8
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2, 'line-color': '#2a2a4a', 'target-arrow-color': '#2a2a4a',
          'target-arrow-shape': 'triangle', 'curve-style': 'bezier',
          'label': 'data(label)', 'font-size': '10px', 'color': '#a0a0b8',
          'text-outline-color': '#0d0d1a', 'text-outline-width': 2, 'arrow-scale': 1.2
        }
      },
      {
        selector: 'edge[?hasMark]',
        style: {
          'line-color': 'data(markColor)', 'target-arrow-color': 'data(markColor)',
          'width': 3, 'line-style': 'data(lineStyle)'
        }
      },
      {
        selector: 'edge:selected',
        style: { 'line-color': '#ff6b9d', 'target-arrow-color': '#ff6b9d', 'width': 4 }
      }
    ],
    layout: { name: 'grid', padding: 30 },
    minZoom: 0.2, maxZoom: 3, wheelSensitivity: 0.3
  });

  cy.on('tap', 'node', (e) => {
    const node = e.target;
    if (isAddingEdge) {
      if (edgeSourceNode && edgeSourceNode.id() !== node.id()) {
        showEdgeModal(edgeSourceNode.id(), node.id());
        isAddingEdge = false;
        edgeSourceNode = null;
        document.body.style.cursor = 'default';
      }
    } else {
      openNodeInfoModal(node.id());
    }
  });

  cy.on('dbltap', 'node', (e) => {
    const node = e.target;
    if (currentLayer === 'L3') {
      openTextEditor(node.id());
    } else if (currentLayer === 'L2' && currentView === 'overview') {
      enterDetailView(node.id());
    } else {
      openEditPanel(node.id());
    }
  });

  cy.on('tap', 'edge', (e) => { openEdgeEdit(e.target.id()); });

  cy.on('tap', (e) => {
    if (e.target === cy) {
      closeEditPanel();
      closeEdgeModal();
      if (isAddingEdge) { isAddingEdge = false; edgeSourceNode = null; document.body.style.cursor = 'default'; }
    }
  });

  cy.on('cxttap', 'node', (e) => { e.preventDefault(); showContextMenu(e.originalEvent, e.target.id()); });

  cy.on('dragfree', 'node', (e) => {
    const node = e.target;
    const pos = node.position();
    const data = node.data();
    let allNodes = [];
    if (currentLayer === 'L1') {
      const activeModule = layerModuleState.L1;
      allNodes = topologyData.L1[activeModule].nodes;
    } else if (currentLayer === 'L2') {
      if (currentView === 'overview') {
        allNodes = topologyData.L2.chapters || [];
      } else {
        const activeModule = layerModuleState.L2;
        allNodes = topologyData.L2[activeModule].nodes;
      }
    } else {
      allNodes = topologyData[currentLayer].nodes || [];
    }
    const realNode = allNodes.find(n => n.id === data.id);
    if (realNode) {
      realNode.position = { x: pos.x, y: pos.y };
      send({ type: 'update_node', layer: currentLayer, node: realNode });
    }
  });
}

// ==================== WebSocket ====================
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    updateStatus(true);
    showToast('🌌 已连接到叙事宇宙');
    const urlParams = new URLSearchParams(window.location.search);
    const projectPath = urlParams.get('project');
    if (projectPath) send({ type: 'set_project', path: projectPath });
  };

  ws.onmessage = (e) => {
    try { handleServerMessage(JSON.parse(e.data)); }
    catch (err) { console.error('消息解析失败:', err); }
  };

  ws.onclose = () => { updateStatus(false); showToast('⚠️ 连接断开，5秒后重试...'); setTimeout(initWebSocket, 5000); };
  ws.onerror = () => { updateStatus(false); };
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case 'init':
      topologyData = msg.data;
      currentLayer = 'L1';
      layerModuleState.L1 = topologyData.L1.activeModule || 'characters';
      layerModuleState.L2 = (topologyData.L2 && topologyData.L2.activeModule) || 'characters';
      currentView = 'overview';
      currentChapterId = null;
      updateLayerUI();
      updateModuleTabsUI();
      renderLayer(currentLayer);
      updateTypeList();
      if (msg.worldview) switchWorldview(msg.worldview);
      break;

    case 'layer_switched':
      if (msg.layer === 'L1' && msg.data) {
        if (msg.data.characters) topologyData.L1.characters = msg.data.characters;
        if (msg.data.cheats) topologyData.L1.cheats = msg.data.cheats;
        if (msg.data.forces) topologyData.L1.forces = msg.data.forces;
      } else {
        topologyData[msg.layer] = msg.data;
      }
      renderLayer(msg.layer);
      break;

    case 'l1_module_switched':
      if (msg.data && msg.module) topologyData.L1[msg.module] = msg.data;
      renderLayer('L1');
      break;

    case 'l1_node_added':
      if (msg.module) { topologyData.L1[msg.module].nodes.push(msg.node); if (currentLayer === 'L1') { addNodeToGraph(msg.node); updateTypeList(); } }
      break;
    case 'l1_node_updated':
      if (msg.module) { updateNodeData(msg.node); const idx = topologyData.L1[msg.module].nodes.findIndex(n => n.id === msg.node.id); if (idx >= 0) topologyData.L1[msg.module].nodes[idx] = msg.node; }
      break;
    case 'l1_node_deleted':
      if (msg.module && currentLayer === 'L1') removeNodeFromGraph(msg.nodeId);
      break;
    case 'l1_edge_added':
      if (msg.module) topologyData.L1[msg.module].edges.push(msg.edge);
      if (currentLayer === 'L1') addEdgeToGraph(msg.edge);
      break;
    case 'l1_edge_updated':
      if (msg.module) { const eIdx = topologyData.L1[msg.module].edges.findIndex(e => e.id === msg.edge.id); if (eIdx >= 0) topologyData.L1[msg.module].edges[eIdx] = msg.edge; if (currentLayer === 'L1') updateEdgeData(msg.edge); }
      break;
    case 'l1_edge_deleted':
      if (msg.module && currentLayer === 'L1') removeEdgeFromGraph(msg.edgeId);
      break;

    case 'l2_node_added':
      if (msg.module) { topologyData.L2[msg.module].nodes.push(msg.node); if (currentLayer === 'L2') { addNodeToGraph(msg.node); updateTypeList(); } }
      break;
    case 'l2_node_updated':
      if (msg.module) { updateNodeData(msg.node); const idx = topologyData.L2[msg.module].nodes.findIndex(n => n.id === msg.node.id); if (idx >= 0) topologyData.L2[msg.module].nodes[idx] = msg.node; }
      break;

    case 'l3_node_added':
      topologyData.L3.nodes.push(msg.node);
      if (currentLayer === 'L3') { addNodeToGraph(msg.node); updateTypeList(); }
      break;

    case 'chapters_generated': showChaptersPanel(msg.chapters); break;
    case 'text_content': handleTextContent(msg.content); break;
    case 'pong': break;
    default: console.log('未知消息:', msg.type);
  }
  updateStatusInfo();
}

function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

// ==================== 渲染层 ====================
function renderLayer(layer) {
  if (!cy) return;
  cy.elements().remove();

  let data = getCurrentLayerData();
  if (!data || !data.nodes || data.nodes.length === 0) return;

  const isL2Overview = currentLayer === 'L2' && currentView === 'overview';

  const nodes = data.nodes.map(n => ({
    data: {
      id: n.id, label: n.label, type: n.type,
      bgColor: COLORS[n.type] || '#666',
      filePath: n.file_path || '', notes: n.notes || '', tags: n.tags || [],
      isTagged: (n.tags || []).length > 0, tagColor: getTagColor(n.tags),
      start_state: n.start_state || '', end_state: n.end_state || '',
      start_chapter: n.start_chapter || 1, end_chapter: n.end_chapter || 1,
      chapter_num: n.chapter_num || 0
    },
    position: n.position || { x: Math.random() * 600 + 50, y: Math.random() * 400 + 50 }
  }));

  const nodeIds = new Set(nodes.map(n => n.data.id));
  const edges = (data.edges || []).filter(e => nodeIds.has(e.from || e.source) && nodeIds.has(e.to || e.target))
    .map(e => ({
      data: {
        id: e.id, source: e.from || e.source, target: e.to || e.target,
        label: e.label || '', type: e.type || 'related', tags: e.tags || [],
        hasMark: (e.tags || []).length > 0, markColor: getTagColor(e.tags),
        lineStyle: (e.tags || []).includes('因果') ? 'dashed' : 'solid'
      }
    }));

  cy.add([...nodes, ...edges]);

  if (nodes.length > 0) {
    if (isL2Overview) {
      cy.layout({
        name: 'grid', padding: 30, animate: true, animationDuration: 400,
        spacingFactor: 1.2, cols: Math.ceil(Math.sqrt(nodes.length))
      }).run();
    } else {
      cy.layout({
        name: 'cose', padding: 40, animate: true, animationDuration: 600,
        componentSpacing: 100, nodeRepulsion: 400000, idealEdgeLength: 120, randomize: false
      }).run();
    }
  }

  updateTypeList();
  updateStatusInfo();
  updateBreadcrumb();
}

function addNodeToGraph(node) {
  cy.add({
    data: {
      id: node.id, label: node.label, type: node.type,
      bgColor: COLORS[node.type] || '#666',
      filePath: node.file_path || '', notes: node.notes || '', tags: node.tags || [],
      isTagged: (node.tags || []).length > 0, tagColor: getTagColor(node.tags),
      start_state: node.start_state || '', end_state: node.end_state || '',
      start_chapter: node.start_chapter || 1, end_chapter: node.end_chapter || 1,
      chapter_num: node.chapter_num || 0
    },
    position: node.position || { x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 }
  });
}

function addEdgeToGraph(edge) {
  const sourceNode = topologyData[currentLayer].nodes.find(n => n.id === edge.source);
  const targetNode = topologyData[currentLayer].nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return;

  cy.add({
    data: {
      id: edge.id, source: edge.source, target: edge.target,
      label: edge.label || '', tags: edge.tags || [],
      hasMark: (edge.tags || []).length > 0, markColor: getTagColor(edge.tags),
      lineStyle: (edge.tags || []).includes('因果') ? 'dashed' : 'solid'
    }
  });
}

function updateNodeData(node) {
  const cyNode = cy.getElementById(node.id);
  if (cyNode.length > 0) {
    cyNode.data({
      label: node.label, type: node.type, bgColor: COLORS[node.type] || '#666',
      notes: node.notes || '', tags: node.tags || [],
      isTagged: (node.tags || []).length > 0, tagColor: getTagColor(node.tags)
    });
  }
  if (currentEditNodeId === node.id) fillEditPanel(node);
}

function updateEdgeData(edge) {
  const cyEdge = cy.getElementById(edge.id);
  if (cyEdge.length > 0) {
    cyEdge.data({
      label: edge.label || '', tags: edge.tags || [],
      hasMark: (edge.tags || []).length > 0, markColor: getTagColor(edge.tags),
      lineStyle: (edge.tags || []).includes('因果') ? 'dashed' : 'solid'
    });
  }
}

function removeNodeFromGraph(nodeId) {
  const cyNode = cy.getElementById(nodeId);
  if (cyNode.length > 0) cyNode.remove();
  const data = getCurrentLayerData();
  if (data) {
    data.nodes = data.nodes.filter(n => n.id !== nodeId);
    data.edges = data.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  }
}

function removeEdgeFromGraph(edgeId) {
  const cyEdge = cy.getElementById(edgeId);
  if (cyEdge.length > 0) cyEdge.remove();
  const data = getCurrentLayerData();
  if (data) data.edges = data.edges.filter(e => e.id !== edgeId);
}

function getTagColor(tags) {
  if (!tags || tags.length === 0) return null;
  for (const tag of tags) { if (EDGE_MARK_COLORS[tag]) return EDGE_MARK_COLORS[tag]; }
  return null;
}

// ==================== UI 交互 ====================
function initUI() {
  document.querySelectorAll('.layer-tab').forEach(tab => {
    tab.addEventListener('click', () => switchLayer(tab.dataset.layer));
  });

  document.querySelectorAll('.module-tab').forEach(tab => {
    tab.addEventListener('click', () => switchModule(tab.dataset.module));
  });

  document.getElementById('btnAddNode').addEventListener('click', () => showAddNodeModal());

  document.getElementById('btnAddEdge').addEventListener('click', () => {
    const selected = cy.$(':selected');
    if (selected.length === 1 && selected.isNode()) {
      isAddingEdge = true; edgeSourceNode = selected; document.body.style.cursor = 'crosshair';
      showToast('⟿ 请点击目标节点');
    } else { showToast('请先选择一个源节点'); }
  });

  document.getElementById('btnDelete').addEventListener('click', () => {
    const selected = cy.$(':selected');
    selected.forEach(el => {
      if (el.isNode()) { send({ type: 'delete_node', layer: currentLayer, nodeId: el.id() }); removeNodeFromGraph(el.id()); }
      else if (el.isEdge()) { send({ type: 'delete_edge', layer: currentLayer, edgeId: el.id() }); removeEdgeFromGraph(el.id()); }
    });
  });

  document.getElementById('btnFit').addEventListener('click', () => cy.fit(cy.elements(), 50));
  document.getElementById('btnLayout').addEventListener('click', () => cy.layout({ name: 'cose', padding: 40, animate: true, animationDuration: 800 }).run());

  document.getElementById('btnGenerateChapters').addEventListener('click', () => {
    if (currentLayer === 'L1') { send({ type: 'generate_outline' }); showToast('✨ 正在生成大纲...'); }
    else if (currentLayer === 'L2') { send({ type: 'generate_chapters' }); showToast('✨ 正在生成细纲...'); }
    else if (currentLayer === 'L3') { send({ type: 'generate_text' }); showToast('✨ 正在生成正文...'); }
  });

  document.getElementById('btnClosePanel').addEventListener('click', closeEditPanel);
  document.getElementById('btnSaveNode').addEventListener('click', saveNodeEdit);
  document.getElementById('btnCloseNodeInfo').addEventListener('click', closeNodeInfoModal);
  document.getElementById('nodeInfoModal').addEventListener('click', (e) => { if (e.target === document.getElementById('nodeInfoModal')) closeNodeInfoModal(); });

  document.getElementById('btnSaveEdge').addEventListener('click', saveEdgeEdit);
  document.getElementById('btnConfirmEdge').addEventListener('click', confirmEdgeEdit);
  document.getElementById('btnSaveAndContinue').addEventListener('click', saveEdgeAndContinue);
  document.getElementById('edgeModal').addEventListener('click', (e) => { if (e.target === document.getElementById('edgeModal')) closeEdgeModal(); });

  document.getElementById('btnCloseChapters').addEventListener('click', () => document.getElementById('chaptersPanel').classList.remove('open'));
  document.getElementById('btnBackToOverview').addEventListener('click', () => exitDetailView());
  document.getElementById('btnSaveText').addEventListener('click', saveTextEditor);
  document.getElementById('btnCloseTextEditor').addEventListener('click', closeTextEditor);

  document.querySelectorAll('.mark-btn').forEach(btn => { btn.addEventListener('click', () => toggleTag(btn.dataset.tag)); });
  document.querySelectorAll('.edge-mark-btn').forEach(btn => { btn.addEventListener('click', () => btn.classList.toggle('selected')); });

  document.getElementById('contextMenu').addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const nodeId = document.getElementById('contextMenu').dataset.nodeId;
    if (!action || !nodeId) return;
    switch (action) {
      case 'edit': openEditPanel(nodeId); break;
      case 'addEdge':
        const node = cy.getElementById(nodeId);
        if (node.length > 0) { isAddingEdge = true; edgeSourceNode = node; document.body.style.cursor = 'crosshair'; showToast('⟿ 请点击目标节点'); }
        break;
      case 'enterDetail': if ((currentLayer === 'L2' || currentLayer === 'L3') && currentView === 'overview') enterDetailView(nodeId); break;
      case 'markSuspense': toggleNodeTag(nodeId, '悬疑点'); break;
      case 'markTwist': toggleNodeTag(nodeId, '反转点'); break;
      case 'markClimax': toggleNodeTag(nodeId, '高潮'); break;
      case 'markForeshadow': toggleNodeTag(nodeId, '伏笔'); break;
      case 'openFile': openNodeFile(nodeId); break;
      case 'delete': send({ type: 'delete_node', layer: currentLayer, nodeId }); removeNodeFromGraph(nodeId); break;
    }
    hideContextMenu();
  });

  document.addEventListener('click', (e) => { if (!e.target.closest('.context-menu')) hideContextMenu(); });
}

// ==================== 层切换 ====================
function switchLayer(layer) {
  currentLayer = layer;
  topologyData.activeLayer = layer;
  currentView = 'overview';
  currentChapterId = null;
  document.querySelectorAll('.layer-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.layer === layer));
  const moduleTabs = document.getElementById('moduleTabs');
  if (moduleTabs) {
    if (layer === 'L2') {
      moduleTabs.classList.remove('visible');
    } else {
      moduleTabs.classList.toggle('visible', layer === 'L1');
    }
  }
  updateModuleTabsUI();
  updateGenerateButton();
  updateBackButton();
  renderLayer(layer);
  showToast(`🌌 切换到${getLayerName(layer)}`);
}

function updateGenerateButton() {
  const btn = document.getElementById('btnGenerateChapters');
  if (currentLayer === 'L1') btn.textContent = '✨ 生成大纲';
  else if (currentLayer === 'L2') btn.textContent = '✨ 生成细纲';
  else if (currentLayer === 'L3') btn.textContent = '✨ 生成正文';
}

function switchModule(module) {
  const currentModuleInLayer = layerModuleState[currentLayer];
  if (currentModuleInLayer === module) return;
  layerModuleState[currentLayer] = module;
  topologyData[currentLayer].activeModule = module;
  document.querySelectorAll('.module-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.module === module));
  currentView = 'overview';
  currentChapterId = null;
  renderLayer(currentLayer);
  const config = MODULE_CONFIG[module];
  showToast(`${config.icon} 切换到${config.name}模块`);
}

function getLayerName(layer) { return { L1: '大纲宇宙', L2: '细纲星系', L3: '正文星尘' }[layer]; }

function updateLayerUI() {
  document.querySelectorAll('.layer-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.layer === currentLayer));
}

function updateModuleTabsUI() {
  const activeModule = layerModuleState[currentLayer];
  document.querySelectorAll('.module-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.module === activeModule));
  const moduleTabs = document.getElementById('moduleTabs');
  if (moduleTabs) moduleTabs.classList.toggle('visible', currentLayer === 'L1' || currentLayer === 'L2');
}

// ==================== 节点类型列表 ====================
function updateTypeList() {
  const container = document.getElementById('nodeTypeList');
  if (!container) return;

  let types, data, moduleInfo = '';

  if (currentLayer === 'L1') {
    const activeModule = layerModuleState.L1;
    const config = MODULE_CONFIG[activeModule];
    types = [config.nodeType];
    data = topologyData.L1[activeModule];
    const edgeCount = data.edges.length;
    moduleInfo = `
      <div style="margin-bottom:16px;padding:12px;background:var(--bg-elevated);border-radius:10px;border:1px solid var(--border-subtle)">
        <div style="font-size:13px;font-weight:600;color:${config.color};margin-bottom:4px">${config.icon} 大纲-${config.name}模块</div>
        <div style="font-size:11px;color:var(--text-muted)">${data.nodes.length} 个节点 · ${edgeCount} 条${config.edgeLabel}</div>
      </div>
    `;
  } else if (currentLayer === 'L2') {
    if (currentView === 'overview') {
      types = ['chapter'];
      data = { nodes: topologyData.L2.chapters || [], edges: [] };
      moduleInfo = `
        <div style="margin-bottom:16px;padding:12px;background:var(--bg-elevated);border-radius:10px;border:1px solid var(--border-subtle)">
          <div style="font-size:13px;font-weight:600;color:#6bcb77;margin-bottom:4px">📖 细纲-章节列表</div>
          <div style="font-size:11px;color:var(--text-muted)">${data.nodes.length} 个章节 · 双击进入查看人物卡</div>
        </div>
      `;
    } else {
      const activeModule = layerModuleState.L2;
      const config = MODULE_CONFIG[activeModule];
      types = [`${config.nodeType}_state`];
      data = getCurrentLayerData();
      const chapterNode = topologyData.L2.chapters ? topologyData.L2.chapters.find(n => n.id === currentChapterId) : null;
      const chapterNum = chapterNode ? chapterNode.chapter_num : '?';
      moduleInfo = `
        <div style="margin-bottom:16px;padding:12px;background:var(--bg-elevated);border-radius:10px;border:1px solid var(--border-subtle)">
          <div style="font-size:13px;font-weight:600;color:${config.color};margin-bottom:4px">${config.icon} 第${chapterNum}章-${config.name}卡</div>
          <div style="font-size:11px;color:var(--text-muted)">${data.nodes.length} 个人物卡</div>
        </div>
      `;
    }
  } else if (currentLayer === 'L3') {
    types = ['text'];
    data = topologyData.L3;
    moduleInfo = `
      <div style="margin-bottom:16px;padding:12px;background:var(--bg-elevated);border-radius:10px;border:1px solid var(--border-subtle)">
        <div style="font-size:13px;font-weight:600;color:var(--climax);margin-bottom:4px">⭐ 正文层</div>
        <div style="font-size:11px;color:var(--text-muted)">${data.nodes.length} 个章节</div>
      </div>
    `;
  }

  const counts = {};
  types.forEach(t => counts[t] = 0);
  if (data && data.nodes) { data.nodes.forEach(n => { if (counts[n.type] !== undefined) counts[n.type]++; }); }

  const typeNames = {
    character: '人物节点', cheat: '金手指节点', event: '事件节点',
    world: '世界观节点', force: '势力节点', scene: '场景节点',
    chapter: '章节节点', text: '正文章节',
    character_state: '人物卡', cheat_state: '金手指状态', force_state: '势力状态'
  };
  const typeIcons = {
    character: '👤', cheat: '⚡', event: '📌',
    world: '🌍', force: '🏛️', scene: '🎬',
    chapter: '📖', text: '📝',
    character_state: '👤', cheat_state: '⚡', force_state: '🏛️'
  };

  container.innerHTML = moduleInfo + types.map(type => `
    <div class="node-type-item" data-type="${type}">
      <div class="type-icon" style="background:${COLORS[type]}20;color:${COLORS[type]}">${typeIcons[type] || '📄'}</div>
      <div class="type-info">
        <div class="type-name">${typeNames[type] || type}</div>
        <div class="type-count">${counts[type] || 0} 个</div>
      </div>
    </div>
  `).join('');
}

function getCurrentLayerData() {
  if (currentLayer === 'L1') return topologyData.L1[layerModuleState.L1] || { nodes: [], edges: [] };
  else if (currentLayer === 'L2') {
    if (currentView === 'overview') {
      return { nodes: topologyData.L2.chapters || [], edges: [] };
    } else {
      const chapterNum = currentChapterId ? parseInt(currentChapterId.replace('ch_', '')) : 0;
      const activeModule = layerModuleState.L2;
      const moduleData = topologyData.L2[activeModule] || { nodes: [], edges: [] };
      const filteredNodes = moduleData.nodes.filter(n => n.chapter_num === chapterNum);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = moduleData.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
      return { nodes: filteredNodes, edges: filteredEdges };
    }
  }
  return topologyData[currentLayer];
}

// ==================== 节点信息弹窗 ====================
function openNodeInfoModal(nodeId) {
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === nodeId);
  if (!node) return;

  const modal = document.getElementById('nodeInfoModal');
  const iconEl = document.getElementById('nodeInfoIcon');
  const nameEl = document.getElementById('nodeInfoName');
  const typeEl = document.getElementById('nodeInfoType');
  const bodyEl = document.getElementById('nodeInfoBody');

  if (currentLayer === 'L2' && currentView === 'overview') {
    iconEl.textContent = '📖';
    iconEl.style.borderColor = '#6bcb77';
    iconEl.style.color = '#6bcb77';
    typeEl.textContent = '章节节点';
  } else if (currentLayer === 'L1') {
    const activeModule = layerModuleState.L1;
    const config = MODULE_CONFIG[activeModule];
    iconEl.textContent = config.icon;
    iconEl.style.borderColor = config.color;
    iconEl.style.color = config.color;
    typeEl.textContent = `大纲-${config.name}节点`;
  } else if (currentLayer === 'L2' && currentView === 'detail') {
    const activeModule = layerModuleState.L2;
    const config = MODULE_CONFIG[activeModule];
    iconEl.textContent = config.icon;
    iconEl.style.borderColor = config.color;
    iconEl.style.color = config.color;
    typeEl.textContent = `细纲-${config.name}卡`;
  } else {
    const typeNames = { chapter: '章节', text: '正文', scene: '场景' };
    const typeIcons = { chapter: '📖', text: '📝', scene: '🎬' };
    iconEl.textContent = typeIcons[node.type] || '📄';
    typeEl.textContent = typeNames[node.type] || '节点';
  }

  nameEl.textContent = node.label;
  bodyEl.innerHTML = generateNodeInfoContent(node, data);
  modal.classList.add('open');
}

function closeNodeInfoModal() { document.getElementById('nodeInfoModal').classList.remove('open'); }

function generateNodeInfoContent(node, data) {
  let html = '';

  if (currentLayer === 'L2' && currentView === 'overview' && node.type === 'chapter') {
    html += '<div class="node-info-section">';
    html += '<h4>📋 章节信息</h4>';
    html += `<div class="node-info-field"><span class="field-label">章节号</span><span class="field-value">第${node.chapter_num || '?'}章</span></div>`;
    html += `<div class="node-info-field"><span class="field-label">章节标题</span><span class="field-value">${node.label || '未命名'}</span></div>`;
    if (node.file_path) {
      html += `<div class="node-info-field"><span class="field-label">关联文档</span><span class="field-value" style="font-size:11px">${node.file_path}</span></div>`;
    }

    const charCount = (topologyData.L2.characters ? topologyData.L2.characters.nodes.filter(n => n.chapter_num === node.chapter_num).length : 0);
    html += `<div class="node-info-field"><span class="field-label">人物卡</span><span class="field-value">${charCount} 个</span></div>`;
    html += '</div>';

    html += '<div style="display:flex;gap:10px;margin-top:20px">';
    html += `<button class="btn-save" style="flex:1" onclick="closeNodeInfoModal();enterDetailView('${node.id}')"><span>📖 进入章节</span></button>`;
    if (node.file_path) {
      html += `<button class="btn-save" style="flex:1;background:var(--bg-elevated);color:var(--text-secondary)" onclick="openNodeFile('${node.id}')"><span>📄 打开文档</span></button>`;
    }
    html += '</div>';
    return html;
  }

  const activeModule = layerModuleState[currentLayer];

  html += '<div class="node-info-section">';
  html += '<h4>📋 基础信息</h4>';

  if (currentLayer === 'L1') {
    if (activeModule === 'characters') {
      html += `<div class="node-info-field"><span class="field-label">起点状态</span><span class="field-value">${node.start_state || '未设置'}</span></div>`;
      html += `<div class="node-info-field"><span class="field-label">终点状态</span><span class="field-value">${node.end_state || '未设置'}</span></div>`;
    } else if (activeModule === 'cheats') {
      html += `<div class="node-info-field"><span class="field-label">章节范围</span><span class="field-value">第${node.start_chapter || 1}章 ~ 第${node.end_chapter || 1}章</span></div>`;
      html += `<div class="node-info-field"><span class="field-label">成长描述</span><span class="field-value">${node.description || '未设置'}</span></div>`;
    } else if (activeModule === 'forces') {
      html += `<div class="node-info-field"><span class="field-label">势力类型</span><span class="field-value">${node.force_type || '未设置'}</span></div>`;
    }
  } else if (currentLayer === 'L2') {
    if (activeModule === 'characters') {
      html += `<div class="node-info-field"><span class="field-label">章节</span><span class="field-value">第${node.chapter_num || '?'}章</span></div>`;
      html += `<div class="node-info-field"><span class="field-label">人物卡</span><span class="field-value">${node.label}</span></div>`;
    } else if (activeModule === 'cheats') {
      html += `<div class="node-info-field"><span class="field-label">章节</span><span class="field-value">第${node.chapter_num || '?'}章</span></div>`;
    } else if (activeModule === 'forces') {
      html += `<div class="node-info-field"><span class="field-label">章节</span><span class="field-value">第${node.chapter_num || '?'}章</span></div>`;
    }
  }

  if (node.file_path) {
    html += `<div class="node-info-field"><span class="field-label">关联文档</span><span class="field-value" style="font-size:11px">${node.file_path}</span></div>`;
  }
  if (node.notes) {
    html += `<div class="node-info-field"><span class="field-label">备注</span><span class="field-value" style="font-size:11px">${node.notes}</span></div>`;
  }
  html += '</div>';

  const connections = data.edges.filter(e => e.source === node.id || e.target === node.id);
  if (connections.length > 0) {
    html += '<div class="node-info-section">';
    html += `<h4>🔗 关联关系 (${connections.length})</h4>`;
    html += '<div class="node-info-connections">';
    connections.forEach(edge => {
      const isSource = edge.source === node.id;
      const otherId = isSource ? edge.target : edge.source;
      const otherNode = data.nodes.find(n => n.id === otherId);
      const otherName = otherNode ? otherNode.label : '未知节点';
      const relationType = edge.relationship_type || 'neutral';
      const typeLabels = {
        neutral: '😐 中立', friendly: '🤝 友好', hostile: '⚔️ 敌对',
        mentor: '👨‍🏫 师徒', lover: '💕 恋人', family: '👨‍👩‍👧 亲人',
        ally: '🛡️ 同盟', rival: '🏆 竞争'
      };
      html += '<div class="connection-item">';
      html += `<span class="conn-target">${isSource ? '→' : '←'} ${otherName}</span>`;
      html += `<span class="conn-type">${typeLabels[relationType] || relationType}</span>`;
      html += '</div>';
    });
    html += '</div></div>';
  }

  html += '<div style="display:flex;gap:10px;margin-top:20px">';
  html += `<button class="btn-save" style="flex:1" onclick="closeNodeInfoModal();openEditPanel('${node.id}')"><span>✏️ 编辑节点</span></button>`;
  if (node.file_path) {
    html += `<button class="btn-save" style="flex:1;background:var(--bg-elevated);color:var(--text-secondary)" onclick="openNodeFile('${node.id}')"><span>📄 打开文档</span></button>`;
  }
  html += '</div>';

  return html;
}

// ==================== 编辑面板 ====================
function openEditPanel(nodeId) {
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === nodeId);
  if (!node) return;
  currentEditNodeId = nodeId;
  fillEditPanel(node);
  document.getElementById('editPanel').classList.add('open');
}

function fillEditPanel(node) {
  document.getElementById('editLabel').value = node.label || '';
  document.getElementById('editType').value = node.type || 'character';
  document.getElementById('editFilePath').value = node.file_path || '无';
  document.getElementById('editNotes').value = node.notes || '';
  renderTagList(node.tags || []);
  document.querySelectorAll('.mark-btn').forEach(btn => btn.classList.toggle('active', (node.tags || []).includes(btn.dataset.tag)));
  updateEditPanelForModule(node);
}

function updateEditPanelForModule(node) {
  const panel = document.getElementById('editPanel');
  panel.querySelectorAll('.module-field').forEach(el => el.remove());
  const activeModule = layerModuleState[currentLayer];

  if (currentLayer === 'L1') {
    if (activeModule === 'characters') {
      addModuleField(panel, '起点状态', 'editStartState', node.start_state || '', '人物初始状态...');
      addModuleField(panel, '终点状态', 'editEndState', node.end_state || '', '人物最终状态...');
    } else if (activeModule === 'cheats') {
      addModuleField(panel, '开始章节', 'editStartChapter', node.start_chapter || 1, '', 'number');
      addModuleField(panel, '结束章节', 'editEndChapter', node.end_chapter || 1, '', 'number');
      addModuleField(panel, '成长描述', 'editCheatDesc', node.description || '', '描述金手指的成长变化...');
    } else if (activeModule === 'forces') {
      addModuleField(panel, '势力类型', 'editForceType', node.force_type || '', '例如：门派/组织/国家...');
    }
  } else if (currentLayer === 'L2') {
    addModuleField(panel, '章节号', 'editChapterNum', node.chapter_num || 1, '', 'number');
  }
}

function addModuleField(panel, label, id, value, placeholder, type = 'text') {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group module-field';
  if (type === 'number') {
    formGroup.innerHTML = `<label>${label}</label><input type="number" id="${id}" value="${value}" min="1" style="width:100%;padding:12px 14px;border:1px solid var(--border-subtle);border-radius:10px;background:var(--bg-elevated);color:var(--text-primary);font-family:inherit;font-size:14px">`;
  } else {
    formGroup.innerHTML = `<label>${label}</label><input type="text" id="${id}" value="${value}" placeholder="${placeholder}" style="width:100%;padding:12px 14px;border:1px solid var(--border-subtle);border-radius:10px;background:var(--bg-elevated);color:var(--text-primary);font-family:inherit;font-size:14px">`;
  }
  const notesGroup = panel.querySelector('#editNotes').closest('.form-group');
  if (notesGroup) notesGroup.parentNode.insertBefore(formGroup, notesGroup);
}

function closeEditPanel() { document.getElementById('editPanel').classList.remove('open'); currentEditNodeId = null; }

function saveNodeEdit() {
  if (!currentEditNodeId) return;
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === currentEditNodeId);
  if (!node) return;

  const oldLabel = node.label;
  node.label = document.getElementById('editLabel').value;
  node.type = document.getElementById('editType').value;
  node.notes = document.getElementById('editNotes').value;

  const activeModule = layerModuleState[currentLayer];

  if (currentLayer === 'L1') {
    if (activeModule === 'characters') {
      const startState = document.getElementById('editStartState');
      const endState = document.getElementById('editEndState');
      if (startState) node.start_state = startState.value;
      if (endState) node.end_state = endState.value;
    } else if (activeModule === 'cheats') {
      const startCh = document.getElementById('editStartChapter');
      const endCh = document.getElementById('editEndChapter');
      const desc = document.getElementById('editCheatDesc');
      if (startCh) node.start_chapter = parseInt(startCh.value) || 1;
      if (endCh) node.end_chapter = parseInt(endCh.value) || 1;
      if (desc) node.description = desc.value;
    } else if (activeModule === 'forces') {
      const forceType = document.getElementById('editForceType');
      if (forceType) node.force_type = forceType.value;
    }
  } else if (currentLayer === 'L2') {
    const chapterNum = document.getElementById('editChapterNum');
    if (chapterNum) node.chapter_num = parseInt(chapterNum.value) || 1;
  }

  if (currentLayer === 'L1') {
    send({ type: 'update_l1_node', module: activeModule, node });
  } else {
    send({ type: 'update_node', layer: currentLayer, node });
  }
  updateNodeData(node);

  if (node.file_path && oldLabel !== node.label) {
    send({ type: 'update_document', node });
    showToast('💾 节点已保存，文档已更新');
  } else {
    showToast('💾 节点已保存');
  }
  closeEditPanel();
}

function renderTagList(tags) {
  const container = document.getElementById('tagList');
  container.innerHTML = tags.map(tag => {
    const color = EDGE_MARK_COLORS[tag] || '#a0a0b8';
    return `<span class="tag" style="border-color:${color};color:${color}">${tag} <span class="remove" data-tag="${tag}">×</span></span>`;
  }).join('');
  container.querySelectorAll('.remove').forEach(btn => { btn.addEventListener('click', () => toggleTag(btn.dataset.tag)); });
}

function toggleTag(tag) {
  if (!currentEditNodeId) return;
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === currentEditNodeId);
  if (!node) return;
  const idx = node.tags.indexOf(tag);
  if (idx >= 0) node.tags.splice(idx, 1);
  else node.tags.push(tag);
  renderTagList(node.tags);
  document.querySelectorAll('.mark-btn').forEach(btn => btn.classList.toggle('active', node.tags.includes(btn.dataset.tag)));
}

function toggleNodeTag(nodeId, tag) {
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === nodeId);
  if (!node) return;
  const idx = node.tags.indexOf(tag);
  if (idx >= 0) node.tags.splice(idx, 1);
  else node.tags.push(tag);
  if (currentLayer === 'L1') {
    send({ type: 'update_l1_node', module: layerModuleState[currentLayer], node });
  } else {
    send({ type: 'update_node', layer: currentLayer, node });
  }
  updateNodeData(node);
  showToast(idx >= 0 ? `已移除 ${tag}` : `已标记 ${tag}`);
}

// ==================== 新建节点弹窗 ====================
function showAddNodeModal() {
  const types = LAYER_NODE_TYPES[currentLayer];
  const typeNames = { character: '人物', cheat: '金手指', event: '事件', world: '世界观', force: '势力', scene: '场景', character_state: '人物卡', cheat_state: '金手指状态', force_state: '势力状态', chapter: '章节' };
  const typeIcons = { character: '👤', cheat: '⚡', event: '📌', world: '🌍', force: '🏛️', scene: '🎬', character_state: '👤', cheat_state: '⚡', force_state: '🏛️', chapter: '📖' };

  const existing = document.getElementById('addNodeModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'addNodeModal';
  modal.className = 'edge-modal open';
  modal.innerHTML = `
    <div class="edge-modal-content" style="width:360px">
      <h3>✦ 新建节点</h3>
      <div class="form-group">
        <label>节点名称</label>
        <input type="text" id="newNodeLabel" placeholder="输入节点名称..." style="width:100%;padding:12px;border:1px solid var(--border-subtle);border-radius:10px;background:var(--bg-elevated);color:var(--text-primary);font-family:inherit;font-size:14px">
      </div>
      <div class="form-group">
        <label>选择类型</label>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
          ${types.map(type => `
            <button class="type-select-btn" data-type="${type}" style="padding:12px;border:1px solid var(--border-subtle);border-radius:10px;background:var(--bg-elevated);color:var(--text-secondary);cursor:pointer;font-family:inherit;font-size:13px;display:flex;align-items:center;gap:8px;transition:all 0.2s">
              <span style="font-size:18px">${typeIcons[type] || '📄'}</span>
              <span>${typeNames[type] || type}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <button class="btn-save" id="btnConfirmAddNode" style="margin-top:8px"><span>✦ 创建节点</span></button>
    </div>
  `;

  document.body.appendChild(modal);
  let selectedType = types[0];

  modal.querySelectorAll('.type-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.type-select-btn').forEach(b => { b.style.borderColor = 'var(--border-subtle)'; b.style.color = 'var(--text-secondary)'; });
      btn.style.borderColor = COLORS[btn.dataset.type];
      btn.style.color = COLORS[btn.dataset.type];
      selectedType = btn.dataset.type;
    });
  });

  const firstBtn = modal.querySelector('.type-select-btn');
  if (firstBtn) { firstBtn.style.borderColor = COLORS[firstBtn.dataset.type]; firstBtn.style.color = COLORS[firstBtn.dataset.type]; }

  modal.querySelector('#btnConfirmAddNode').addEventListener('click', () => {
    const label = document.getElementById('newNodeLabel').value.trim() || '新节点';
    const newNode = {
      id: `${selectedType}_${Date.now()}`, type: selectedType, label: label,
      file_path: '', tags: [], notes: '',
      position: { x: cy.width() / 2 + (Math.random() - 0.5) * 100, y: cy.height() / 2 + (Math.random() - 0.5) * 100 }
    };

    if (currentLayer === 'L1') {
      const moduleData = topologyData.L1[layerModuleState.L1];
      moduleData.nodes.push(newNode);
      addNodeToGraph(newNode);
      send({ type: 'add_l1_node', module: layerModuleState.L1, node: newNode });
    } else if (currentLayer === 'L2') {
      const moduleData = topologyData.L2[layerModuleState.L2];
      moduleData.nodes.push(newNode);
      addNodeToGraph(newNode);
      send({ type: 'add_l2_node', module: layerModuleState.L2, node: newNode });
    } else {
      topologyData[currentLayer].nodes.push(newNode);
      addNodeToGraph(newNode);
      send({ type: 'add_node', layer: currentLayer, node: newNode });
    }

    showToast(`✦ ${typeNames[selectedType] || selectedType}节点已创建`);
    modal.remove();
  });

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ==================== 连线编辑 ====================
function showEdgeModal(sourceId, targetId) {
  currentEditEdgeId = `edge_${Date.now()}`;
  resetEdgeForm();
  const modal = document.getElementById('edgeModal');
  modal.dataset.sourceId = sourceId;
  modal.dataset.targetId = targetId;
  modal.dataset.isNew = 'true';
  modal.classList.add('open');
}

function openEdgeEdit(edgeId) {
  const data = getCurrentLayerData();
  const edge = data.edges.find(e => e.id === edgeId);
  if (!edge) return;
  currentEditEdgeId = edgeId;
  fillEdgeForm(edge);
  const modal = document.getElementById('edgeModal');
  modal.dataset.sourceId = edge.source;
  modal.dataset.targetId = edge.target;
  modal.dataset.isNew = 'false';
  modal.classList.add('open');
}

function resetEdgeForm() {
  const labelInput = document.getElementById('edgeLabel');
  if (labelInput) labelInput.value = '';
  document.querySelectorAll('.edge-mark-btn').forEach(btn => btn.classList.remove('selected'));
  ['edgeEventProcess', 'edgeRelationshipChange', 'edgeRelationshipType', 'edgeStartChapter', 'edgeEndChapter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { if (id === 'edgeRelationshipType') el.value = 'neutral'; else if (id.includes('Chapter')) el.value = id.includes('Start') ? '1' : '5'; else el.value = ''; }
  });
}

function fillEdgeForm(edge) {
  const labelInput = document.getElementById('edgeLabel');
  if (labelInput) labelInput.value = edge.label || '';
  document.querySelectorAll('.edge-mark-btn').forEach(btn => btn.classList.toggle('selected', (edge.tags || []).includes(btn.dataset.mark)));
  const fields = { edgeEventProcess: edge.event_process, edgeRelationshipChange: edge.relationship_change, edgeRelationshipType: edge.relationship_type || 'neutral', edgeStartChapter: edge.start_chapter || '1', edgeEndChapter: edge.end_chapter || '5' };
  Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
}

function closeEdgeModal() { document.getElementById('edgeModal').classList.remove('open'); currentEditEdgeId = null; }

function collectEdgeData(confirmed) {
  const modal = document.getElementById('edgeModal');
  const marks = [];
  document.querySelectorAll('.edge-mark-btn.selected').forEach(btn => marks.push(btn.dataset.mark));
  return {
    id: currentEditEdgeId,
    source: modal.dataset.sourceId, target: modal.dataset.targetId,
    label: document.getElementById('edgeLabel').value,
    tags: marks,
    event_process: document.getElementById('edgeEventProcess')?.value || '',
    relationship_change: document.getElementById('edgeRelationshipChange')?.value || '',
    relationship_type: document.getElementById('edgeRelationshipType')?.value || 'neutral',
    start_chapter: parseInt(document.getElementById('edgeStartChapter')?.value) || 1,
    end_chapter: parseInt(document.getElementById('edgeEndChapter')?.value) || 1,
    confirmed
  };
}

function saveEdgeToServer(edgeData) {
  const data = getCurrentLayerData();
  const existingEdge = data.edges.find(e => e.id === currentEditEdgeId);
  if (existingEdge) {
    Object.assign(existingEdge, edgeData);
    if (currentLayer === 'L1') send({ type: 'update_l1_edge', module: layerModuleState.L1, edge: existingEdge });
    else send({ type: 'update_edge', layer: currentLayer, edge: existingEdge });
    updateEdgeData(existingEdge);
  } else {
    data.edges.push(edgeData);
    addEdgeToGraph(edgeData);
    if (currentLayer === 'L1') send({ type: 'add_l1_edge', module: layerModuleState.L1, edge: edgeData });
    else send({ type: 'add_edge', layer: currentLayer, edge: edgeData });
  }
}

function saveEdgeEdit() { saveEdgeToServer(collectEdgeData(false)); showToast('💾 关系已保存'); closeEdgeModal(); }
function confirmEdgeEdit() { saveEdgeToServer(collectEdgeData(true)); showToast('✅ 关系已确定'); closeEdgeModal(); }
function saveEdgeAndContinue() { saveEdgeToServer(collectEdgeData(false)); showToast('💾 关系已保存，请继续添加'); currentEditEdgeId = `edge_${Date.now()}`; resetEdgeForm(); }

// ==================== 章节生成面板 ====================
function showChaptersPanel(chapters) {
  const container = document.getElementById('chaptersList');
  container.innerHTML = chapters.map(ch => `
    <div class="chapter-card">
      <div class="chapter-num">第 ${ch.chapterNum} 章</div>
      <div class="chapter-title">${ch.title}</div>
      <div class="chapter-marks">
        ${ch.marks.map(m => `<span class="chapter-mark" style="background:${EDGE_MARK_COLORS[m] || '#666'}20;color:${EDGE_MARK_COLORS[m] || '#666'};border:1px solid ${EDGE_MARK_COLORS[m] || '#666'}">${m}</span>`).join('')}
      </div>
    </div>
  `).join('');
  document.getElementById('chaptersPanel').classList.add('open');
}

// ==================== 右键菜单 ====================
function showContextMenu(event, nodeId) {
  const menu = document.getElementById('contextMenu');
  menu.dataset.nodeId = nodeId;
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  menu.style.display = 'block';
}
function hideContextMenu() { document.getElementById('contextMenu').style.display = 'none'; }

function openNodeFile(nodeId) {
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === nodeId);
  if (!node || !node.file_path) { showToast('该节点未关联文档'); return; }
  send({ type: 'open_file', filePath: node.file_path });
  showToast('已请求打开文档');
}

// ==================== 辅助功能 ====================
function updateStatus(connected) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  if (connected) { dot.classList.remove('offline'); text.textContent = '已连接'; }
  else { dot.classList.add('offline'); text.textContent = '已断开'; }
}

function updateStatusInfo() {
  let info;
  if (currentLayer === 'L1') {
    const data = getCurrentLayerData();
    const config = MODULE_CONFIG[layerModuleState.L1];
    info = `L1-${config.name}: ${data.nodes.length}节点/${data.edges.length}关系`;
  } else if (currentLayer === 'L2') {
    if (currentView === 'overview') {
      const chapters = topologyData.L2.chapters || [];
      info = `L2-章节: ${chapters.length}个章节`;
    } else {
      const data = getCurrentLayerData();
      const config = MODULE_CONFIG[layerModuleState.L2];
      info = `L2-${config.name}卡: ${data.nodes.length}个`;
    }
  } else {
    const data = topologyData[currentLayer];
    info = `${currentLayer}: ${data ? data.nodes.length : 0}节点`;
  }
  document.getElementById('layerInfo').textContent = info;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==================== 键盘快捷键 ====================
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }
    switch (e.key) {
      case 'Delete': case 'Backspace':
        cy.$(':selected').forEach(el => {
          if (el.isNode()) { send({ type: 'delete_node', layer: currentLayer, nodeId: el.id() }); removeNodeFromGraph(el.id()); }
          else if (el.isEdge()) { send({ type: 'delete_edge', layer: currentLayer, edgeId: el.id() }); removeEdgeFromGraph(el.id()); }
        });
        break;
      case 'a': document.getElementById('btnAddNode').click(); break;
      case 'e': document.getElementById('btnAddEdge').click(); break;
      case 'f': cy.fit(cy.elements(), 50); break;
      case 'l': cy.layout({ name: 'cose', padding: 40, animate: true, animationDuration: 800 }).run(); break;
      case '1': switchLayer('L1'); break;
      case '2': switchLayer('L2'); break;
      case '3': switchLayer('L3'); break;
      case 'Escape':
        closeEditPanel(); closeEdgeModal();
        if (isAddingEdge) { isAddingEdge = false; edgeSourceNode = null; document.body.style.cursor = 'default'; }
        else if (currentView === 'detail') exitDetailView();
        break;
      case 'b': if (currentView === 'detail') exitDetailView(); break;
    }
  });
}

// ==================== L3正文层编辑器 ====================
let currentTextNodeId = null;

const VOCABULARY_DATA = [
  { word: '说', alternatives: ['道', '讲', '言', '喊', '叫', '嘟囔', '嘀咕', '咆哮', '低语'], context: '对话动词' },
  { word: '走', alternatives: ['行', '跑', '奔', '冲', '踱', '溜', '逃', '赶', '漫步'], context: '移动动词' },
  { word: '看', alternatives: ['望', '瞧', '盯', '瞥', '扫', '视', '观察', '注视', '打量'], context: '视觉动词' },
  { word: '笑', alternatives: ['微笑', '大笑', '冷笑', '苦笑', '嗤笑', '莞尔', '咧嘴', '狂笑'], context: '表情动词' },
  { word: '生气', alternatives: ['愤怒', '恼火', '暴怒', '气愤', '恼怒', '愠怒', '盛怒', '勃然大怒'], context: '情绪描写' },
  { word: '害怕', alternatives: ['恐惧', '惊恐', '畏惧', '胆怯', '战栗', '发抖', '毛骨悚然', '心惊胆战'], context: '情绪描写' },
  { word: '高兴', alternatives: ['开心', '喜悦', '兴奋', '欣喜', '愉悦', '快活', '欢欣', '兴高采烈'], context: '情绪描写' },
  { word: '漂亮', alternatives: ['美丽', '俊俏', '秀丽', '标致', '动人', '迷人', '娇艳', '楚楚动人'], context: '外貌描写' },
  { word: '大', alternatives: ['巨大', '庞大', '硕大', '宏伟', '宽广', '辽阔', '浩瀚', '无边无际'], context: '大小描写' },
  { word: '小', alternatives: ['微小', '细小', '玲珑', '精致', '娇小', '迷你', '微不足道', '微乎其微'], context: '大小描写' }
];

function openTextEditor(nodeId) {
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === nodeId);
  if (!node) return;
  currentTextNodeId = nodeId;
  document.getElementById('textEditorPanel').classList.add('active');
  document.getElementById('cy').style.display = 'none';
  document.getElementById('textEditorTitle').textContent = node.label;
  send({ type: 'get_text_content', filePath: node.file_path });
  renderVocabularyList();
  showToast(`📝 打开 ${node.label} 编辑器`);
}

function renderVocabularyList() {
  const container = document.getElementById('vocabularyList');
  container.innerHTML = VOCABULARY_DATA.map(vocab => `
    <div class="vocab-item" data-word="${vocab.word}">
      <div class="vocab-word">${vocab.word}</div>
      <div class="vocab-alts">${vocab.alternatives.join(' · ')}</div>
      <div class="vocab-context">${vocab.context}</div>
    </div>
  `).join('');
  container.querySelectorAll('.vocab-item').forEach(item => {
    item.addEventListener('click', () => {
      const word = item.dataset.word;
      const alts = VOCABULARY_DATA.find(v => v.word === word)?.alternatives || [];
      if (alts.length > 0) { const randomAlt = alts[Math.floor(Math.random() * alts.length)]; insertTextAtCursor(randomAlt); showToast(`✨ 已插入「${randomAlt}」`); }
    });
  });
}

function insertTextAtCursor(text) {
  const textarea = document.getElementById('textEditorContent');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
}

function saveTextEditor() {
  if (!currentTextNodeId) return;
  const data = getCurrentLayerData();
  const node = data.nodes.find(n => n.id === currentTextNodeId);
  if (!node) return;
  send({ type: 'save_text', filePath: node.file_path, content: document.getElementById('textEditorContent').value });
  showToast('💾 正文已保存');
}

function closeTextEditor() {
  document.getElementById('textEditorPanel').classList.remove('active');
  document.getElementById('cy').style.display = 'block';
  currentTextNodeId = null;
  showToast('↩ 返回章节列表');
}

function handleTextContent(content) { document.getElementById('textEditorContent').value = content || ''; }

// ==================== 详情视图导航 ====================
function enterDetailView(nodeId) {
  currentView = 'detail';
  currentChapterId = nodeId;
  document.getElementById('btnBackToOverview').style.display = 'flex';
  document.getElementById('btnGenerateChapters').style.display = 'none';

  if (currentLayer === 'L2') {
    const moduleTabs = document.getElementById('moduleTabs');
    if (moduleTabs) moduleTabs.classList.add('visible');
  }

  const chapterNode = topologyData.L2.chapters ? topologyData.L2.chapters.find(n => n.id === nodeId) : null;
  const chapterLabel = chapterNode ? chapterNode.label : nodeId;
  showToast(`📖 进入${chapterLabel}详情`);
  renderLayer(currentLayer);
}

function exitDetailView() {
  currentView = 'overview';
  currentChapterId = null;
  document.getElementById('btnBackToOverview').style.display = 'none';
  document.getElementById('btnGenerateChapters').style.display = 'block';

  if (currentLayer === 'L2') {
    const moduleTabs = document.getElementById('moduleTabs');
    if (moduleTabs) moduleTabs.classList.remove('visible');
  }

  showToast('↩ 返回章节列表');
  renderLayer(currentLayer);
}

function updateBackButton() {
  const btn = document.getElementById('btnBackToOverview');
  if (btn) btn.style.display = currentView === 'detail' ? 'flex' : 'none';
}

function updateBreadcrumb() {
  const layerName = { L1: '大纲宇宙', L2: '细纲星系', L3: '正文星尘' }[currentLayer];
  let info = `${currentLayer}: ${layerName}`;
  if (currentLayer === 'L2' && currentView === 'detail' && currentChapterId) {
    const chapterNode = topologyData.L2.chapters ? topologyData.L2.chapters.find(n => n.id === currentChapterId) : null;
    if (chapterNode) {
      const chapterNum = chapterNode.chapter_num || '?';
      info += ` > 第${chapterNum}章`;
    }
  }
  document.getElementById('layerInfo').textContent = info;
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  const savedWorldview = localStorage.getItem('worldview_type') || 'default';
  initParticles(savedWorldview);
  initCytoscape();
  initWebSocket();
  initUI();
  initKeyboard();
  initWorldviewSelector();
});

function initWorldviewSelector() {
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case 'x': switchWorldview('xuanhuan'); break;
      case 'w': switchWorldview('wuxia'); break;
      case 'c': switchWorldview('xiandai'); break;
      case 'k': switchWorldview('kehuan'); break;
      case 'd': switchWorldview('default'); break;
    }
  });
}
