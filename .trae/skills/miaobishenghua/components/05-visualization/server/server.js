/**
 * 妙笔生花 - 可视化拓扑服务 v3.0
 * 大纲层三模块：人物层 | 金手指层 | 势力层
 * 连线：事件过程（线上）+ 关系变化（线下）+ 章节范围
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');

// ==================== 配置解析 ====================
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { projectRoot: '', port: 3456, syncInterval: 500 };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], val = args[i + 1];
    if (key === '--project-root') config.projectRoot = val;
    if (key === '--port') config.port = parseInt(val);
  }
  return config;
}

const CONFIG = parseArgs();
if (!CONFIG.projectRoot || !fs.existsSync(CONFIG.projectRoot)) {
  console.error('[错误] 请提供有效的项目根目录: --project-root "路径"');
  process.exit(1);
}

// 读取项目可视化配置
const vizConfigPath = path.join(CONFIG.projectRoot, '可视化配置.json');
let vizConfig = { enabled: true, auto_sync: true, sync_interval_ms: 500, server_port: 3456, worldview: 'default' };
if (fs.existsSync(vizConfigPath)) {
  try { vizConfig = JSON.parse(fs.readFileSync(vizConfigPath, 'utf-8')); } catch (e) {}
}

// ==================== 路径定义 ====================
const TOPOLOGY_DIR = path.join(CONFIG.projectRoot, '拓扑数据');
const SNAPSHOT_DIR = path.join(CONFIG.projectRoot, '可视化快照');
const WEB_DIR = path.join(__dirname, '..', 'web');

[TOPOLOGY_DIR, SNAPSHOT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==================== 三层拓扑数据 v3.0 ====================
// L1: 大纲层 - 人物层 | 金手指层 | 势力层
// L2: 细纲层 - 章节细纲（继承L1范围）
// L3: 正文层 - 正文编辑+词汇替换
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

const LAYER_FILES = {
  L1: 'topology_L1_v3.json',
  L2: 'topology_L2.json',
  L3: 'topology_L3.json'
};

// ==================== 加载/保存 ====================
function loadTopology() {
  let hasData = false;

  // L1 - 先扫描项目，如果有数据则使用扫描数据，否则加载保存的数据
  const l1File = path.join(TOPOLOGY_DIR, LAYER_FILES.L1);

  // 先扫描项目获取最新数据
  scanProject();

  // 如果扫描后没有数据，尝试加载保存的数据
  if (topologyData.L1.characters.nodes.length === 0 &&
      topologyData.L1.cheats.nodes.length === 0 &&
      topologyData.L1.forces.nodes.length === 0 &&
      fs.existsSync(l1File)) {
    try {
      const l1Data = JSON.parse(fs.readFileSync(l1File, 'utf-8'));
      if (l1Data.characters?.nodes?.length > 0 || l1Data.cheats?.nodes?.length > 0 || l1Data.forces?.nodes?.length > 0) {
        topologyData.L1 = { ...topologyData.L1, ...l1Data };
        hasData = true;
        console.log(`[L1] 已加载保存的数据: 人物=${l1Data.characters?.nodes?.length || 0}, 金手指=${l1Data.cheats?.nodes?.length || 0}, 势力=${l1Data.forces?.nodes?.length || 0}`);
      }
    } catch (e) {
      console.log('[L1] 加载失败，使用默认结构');
    }
  } else {
    hasData = true;
    console.log(`[L1] 使用扫描数据: 人物=${topologyData.L1.characters.nodes.length}, 金手指=${topologyData.L1.cheats.nodes.length}, 势力=${topologyData.L1.forces.nodes.length}`);
  }

  // L2 - 扫描后如果没有章节数据，尝试加载保存的数据
  if (topologyData.L2.chapters.length === 0) {
    const l2File = path.join(TOPOLOGY_DIR, LAYER_FILES.L2);
    if (fs.existsSync(l2File)) {
      try {
        const l2Data = JSON.parse(fs.readFileSync(l2File, 'utf-8'));
        if (l2Data.chapters?.length > 0) {
          topologyData.L2 = { ...topologyData.L2, ...l2Data };
          hasData = true;
          console.log(`[L2] 已加载保存的数据: 章节=${l2Data.chapters?.length || 0}`);
        }
      } catch (e) {
        console.log('[L2] 加载失败，使用默认结构');
      }
    }
  } else {
    console.log(`[L2] 使用扫描数据: 章节=${topologyData.L2.chapters.length}, 人物状态=${topologyData.L2.characters.nodes.length}, 金手指状态=${topologyData.L2.cheats.nodes.length}, 势力状态=${topologyData.L2.forces.nodes.length}`);
  }

  // L3 - 扫描后如果没有节点，尝试加载保存的数据
  if (topologyData.L3.nodes.length === 0) {
    const l3File = path.join(TOPOLOGY_DIR, LAYER_FILES.L3);
    if (fs.existsSync(l3File)) {
      try {
        const l3Data = JSON.parse(fs.readFileSync(l3File, 'utf-8'));
        if (l3Data.nodes?.length > 0) {
          topologyData.L3 = { ...topologyData.L3, ...l3Data };
          hasData = true;
          console.log(`[L3] 已加载保存的数据: ${l3Data.nodes.length} 节点`);
        }
      } catch (e) {}
    }
  } else {
    console.log(`[L3] 使用扫描数据: ${topologyData.L3.nodes.length} 节点`);
  }

  if (!hasData) {
    console.log('[扫描] 首次启动，扫描项目生成初始节点...');
    scanProject();
  }
}

function saveLayer(layer) {
  const data = topologyData[layer];
  data.version = (data.version || 0) + 1;
  data.lastModified = new Date().toISOString();
  const file = path.join(TOPOLOGY_DIR, LAYER_FILES[layer]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function saveSnapshot() {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  const snapPath = path.join(SNAPSHOT_DIR, `topology_${ts}.json`);
  fs.writeFileSync(snapPath, JSON.stringify(topologyData, null, 2), 'utf-8');
}

// ==================== 项目扫描 ====================
function scanProject() {
  console.log('[扫描] 扫描项目文档...');

  // === L1: 人物层 ===
  const charDir = path.join(CONFIG.projectRoot, '大纲', '角色设定');
  if (fs.existsSync(charDir)) {
    fs.readdirSync(charDir).forEach((file, idx) => {
      if (file.endsWith('.md')) {
        const filePath = path.join(charDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = extractTitle(content) || file.replace('.md', '');
        const { startState, endState } = extractCharacterStates(content);

        topologyData.L1.characters.nodes.push({
          id: `char_${String(idx + 1).padStart(3, '0')}`,
          type: 'character',
          label: title,
          file_path: `大纲/角色设定/${file}`,
          start_state: startState,
          end_state: endState,
          tags: [],
          notes: '',
          position: { x: 200 + (idx % 5) * 150, y: 150 + Math.floor(idx / 5) * 120 }
        });
      }
    });
  }

  // === L1: 金手指层 ===
  const cheatFile = path.join(CONFIG.projectRoot, '金手指设定.md');
  if (fs.existsSync(cheatFile)) {
    const content = fs.readFileSync(cheatFile, 'utf-8');
    const title = extractTitle(content) || '金手指';
    const stages = extractCheatStages(content);

    stages.forEach((stage, idx) => {
      topologyData.L1.cheats.nodes.push({
        id: `cheat_${String(idx + 1).padStart(3, '0')}`,
        type: 'cheat',
        label: stage.name || `${title} ${idx + 1}`,
        file_path: '金手指设定.md',
        start_chapter: stage.start || 1,
        end_chapter: stage.end || 10,
        description: stage.desc || '',
        tags: [],
        notes: '',
        position: { x: 200 + idx * 200, y: 200 }
      });
    });

    if (topologyData.L1.cheats.nodes.length === 0) {
      topologyData.L1.cheats.nodes.push({
        id: 'cheat_001',
        type: 'cheat',
        label: title,
        file_path: '金手指设定.md',
        start_chapter: 1,
        end_chapter: 100,
        description: '',
        tags: [],
        notes: '',
        position: { x: 300, y: 200 }
      });
    }
  }

  // === L1: 势力层 ===
  const forceDir = path.join(CONFIG.projectRoot, '势力设定');
  if (fs.existsSync(forceDir)) {
    fs.readdirSync(forceDir).forEach((file, idx) => {
      if (file.endsWith('.md')) {
        const filePath = path.join(forceDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = extractTitle(content) || file.replace('.md', '');

        topologyData.L1.forces.nodes.push({
          id: `force_${String(idx + 1).padStart(3, '0')}`,
          type: 'force',
          label: title,
          file_path: `势力设定/${file}`,
          tags: [],
          notes: '',
          position: { x: 200 + (idx % 4) * 180, y: 150 + Math.floor(idx / 4) * 140 }
        });
      }
    });
  }

  // === L2: 细纲层 - 章节节点 ===
  const chapterDir = path.join(CONFIG.projectRoot, '章节细纲');
  if (fs.existsSync(chapterDir)) {
    fs.readdirSync(chapterDir).forEach((file, idx) => {
      if (file.endsWith('.md')) {
        const filePath = path.join(chapterDir, file);
        const title = extractTitle(fs.readFileSync(filePath, 'utf-8')) || file.replace('.md', '');
        const chapterNum = extractChapterNumber(file) || idx + 1;

        topologyData.L2.chapters.push({
          id: `ch_${String(idx + 1).padStart(3, '0')}`,
          type: 'chapter',
          label: title,
          file_path: `章节细纲/${file}`,
          chapter_num: chapterNum,
          tags: [],
          notes: '',
          position: { x: 150 + (idx % 6) * 140, y: 120 + Math.floor(idx / 6) * 100 }
        });
      }
    });
  }

  // === L2: 细纲层 - 人物角色节点（每章独立文件夹） ===
  const charRoleDir = path.join(CONFIG.projectRoot, '章节细纲', '角色设定');
  if (fs.existsSync(charRoleDir)) {
    fs.readdirSync(charRoleDir).forEach(chapterFolder => {
      const chapterPath = path.join(charRoleDir, chapterFolder);
      if (!fs.statSync(chapterPath).isDirectory()) return;
      const chapterNum = extractChapterNumber(chapterFolder);
      if (!chapterNum) return;

      fs.readdirSync(chapterPath).forEach((file, fileIdx) => {
        if (!file.endsWith('.md')) return;
        if (file.startsWith('模板_')) return;
        const filePath = path.join(chapterPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = extractTitle(content) || file.replace('.md', '');
        const charName = file.replace('.md', '');

        topologyData.L2.characters.nodes.push({
          id: `l2_char_${String(chapterNum).padStart(3, '0')}_${charName}`,
          type: 'character_state',
          label: `${charName}（第${chapterNum}章）`,
          file_path: `章节细纲/角色设定/${chapterFolder}/${file}`,
          chapter_num: chapterNum,
          character_name: charName,
          tags: [],
          notes: '',
          position: { x: 200 + (fileIdx % 5) * 150, y: 150 + Math.floor(fileIdx / 5) * 120 }
        });
      });
    });
  }

  // === L2: 细纲层 - 金手指节点 ===
  const cheatRoleDir = path.join(CONFIG.projectRoot, '章节细纲', '金手指');
  if (fs.existsSync(cheatRoleDir)) {
    fs.readdirSync(cheatRoleDir).forEach((file, idx) => {
      if (file.endsWith('.md') && file.includes('_金手指')) {
        const filePath = path.join(cheatRoleDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = extractTitle(content) || file.replace('.md', '');
        const chapterNum = extractChapterNumber(file) || idx + 1;

        topologyData.L2.cheats.nodes.push({
          id: `l2_cheat_${String(idx + 1).padStart(3, '0')}`,
          type: 'cheat_state',
          label: title,
          file_path: `章节细纲/金手指/${file}`,
          chapter_num: chapterNum,
          tags: [],
          notes: '',
          position: { x: 200 + (idx % 5) * 150, y: 150 + Math.floor(idx / 5) * 120 }
        });
      }
    });
  }

  // === L2: 细纲层 - 势力节点 ===
  const forceRoleDir = path.join(CONFIG.projectRoot, '章节细纲', '势力');
  if (fs.existsSync(forceRoleDir)) {
    fs.readdirSync(forceRoleDir).forEach((file, idx) => {
      if (file.endsWith('.md') && file.includes('_势力')) {
        const filePath = path.join(forceRoleDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = extractTitle(content) || file.replace('.md', '');
        const chapterNum = extractChapterNumber(file) || idx + 1;

        topologyData.L2.forces.nodes.push({
          id: `l2_force_${String(idx + 1).padStart(3, '0')}`,
          type: 'force_state',
          label: title,
          file_path: `章节细纲/势力/${file}`,
          chapter_num: chapterNum,
          tags: [],
          notes: '',
          position: { x: 200 + (idx % 5) * 150, y: 150 + Math.floor(idx / 5) * 120 }
        });
      }
    });
  }

  // 如果L2人物/金手指/势力节点为空，则继承L1的数据创建模块节点
  if (topologyData.L2.characters.nodes.length === 0 &&
      topologyData.L2.cheats.nodes.length === 0 &&
      topologyData.L2.forces.nodes.length === 0) {
    syncL2FromL1();
  }

  // === L3: 正文层 ===
  const textDir = path.join(CONFIG.projectRoot, '正文');
  if (fs.existsSync(textDir)) {
    fs.readdirSync(textDir).forEach((file, idx) => {
      if (file.endsWith('.md') && !file.includes('_草稿')) {
        const title = file.replace('.md', '');
        topologyData.L3.nodes.push({
          id: `txt_${String(idx + 1).padStart(3, '0')}`,
          type: 'text',
          label: title,
          file_path: `正文/${file}`,
          tags: [],
          notes: '',
          position: { x: 150 + (idx % 5) * 160, y: 120 + Math.floor(idx / 5) * 110 }
        });
      }
    });
  }

  saveLayer('L1');
  saveLayer('L2');
  saveLayer('L3');

  console.log(`[扫描] L1完成: 人物=${topologyData.L1.characters.nodes.length}, 金手指=${topologyData.L1.cheats.nodes.length}, 势力=${topologyData.L1.forces.nodes.length}`);
  console.log(`[扫描] L2完成: 章节=${topologyData.L2.chapters.length}, 人物状态=${topologyData.L2.characters.nodes.length}, 金手指状态=${topologyData.L2.cheats.nodes.length}, 势力状态=${topologyData.L2.forces.nodes.length}`);
  console.log(`[扫描] L3完成: 正文=${topologyData.L3.nodes.length}`);
}

// ==================== 文档解析辅助函数 ====================
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m) || content.match(/^title:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractCharacterStates(content) {
  let startState = '', endState = '';
  const startMatch = content.match(/起点[状态]*[:：]\s*(.+)/);
  const endMatch = content.match(/终点[状态]*[:：]\s*(.+)/);
  if (startMatch) startState = startMatch[1].trim();
  if (endMatch) endState = endMatch[1].trim();
  return { startState, endState };
}

function extractCheatStages(content) {
  const stages = [];
  const lines = content.split('\n');
  lines.forEach(line => {
    const match = line.match(/^[-*]\s*第?([\d~\-]+)章[：:]\s*(.+)/);
    if (match) {
      stages.push({
        start: parseInt(match[1].split('~')[0]) || 1,
        end: parseInt(match[1].split('~')[1]) || parseInt(match[1].split('-')[1]) || parseInt(match[1]),
        name: match[2].trim(),
        desc: ''
      });
    }
  });
  return stages;
}

function extractChapterNumber(filename) {
  const match = filename.match(/第(\d+)章/) || filename.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// L2继承L1数据
function syncL2FromL1() {
  // 人物模块：复制L1人物节点到L2，添加章节范围约束
  topologyData.L2.characters.nodes = topologyData.L1.characters.nodes.map(char => ({
    ...char,
    l2_id: `l2_${char.id}`,
    current_state: char.start_state || '',
    state_changes: [] // 记录每章的状态变化
  }));

  // 金手指模块：复制L1金手指节点到L2
  topologyData.L2.cheats.nodes = topologyData.L1.cheats.nodes.map(cheat => ({
    ...cheat,
    l2_id: `l2_${cheat.id}`,
    current_level: 1,
    growth_changes: [] // 记录每章的成长变化
  }));

  // 势力模块：复制L1势力节点到L2
  topologyData.L2.forces.nodes = topologyData.L1.forces.nodes.map(force => ({
    ...force,
    l2_id: `l2_${force.id}`,
    current_relation: '',
    relation_changes: [] // 记录每章的关系变化
  }));
}

// ==================== WebSocket ====================
let wss = null;
let clients = new Set();

function broadcast(msg) {
  const data = JSON.stringify(msg);
  clients.forEach(ws => { if (ws.readyState === 1) ws.send(data); });
}

// ==================== 文件监听 ====================
let fileChangeTimer = null;

function startFileWatcher() {
  const watchPaths = [
    path.join(CONFIG.projectRoot, '大纲', '角色设定'),
    path.join(CONFIG.projectRoot, '大纲', '势力设定'),
    path.join(CONFIG.projectRoot, '大纲', '金手指设定.md'),
    path.join(CONFIG.projectRoot, '章节细纲'),
    path.join(CONFIG.projectRoot, '章节细纲', '角色设定'),
    path.join(CONFIG.projectRoot, '章节细纲', '金手指'),
    path.join(CONFIG.projectRoot, '章节细纲', '势力'),
    path.join(CONFIG.projectRoot, '正文')
  ].filter(p => fs.existsSync(p));

  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    depth: 5
  });

  watcher.on('add', filePath => handleFileChange('add', filePath));
  watcher.on('change', filePath => handleFileChange('change', filePath));
  watcher.on('unlink', filePath => handleFileChange('unlink', filePath));

  console.log('[监听] 已启动');
}

function handleFileChange(eventType, filePath) {
  if (!filePath.endsWith('.md')) return;
  const relativePath = path.relative(CONFIG.projectRoot, filePath).replace(/\\/g, '/');

  if (fileChangeTimer) clearTimeout(fileChangeTimer);
  fileChangeTimer = setTimeout(() => {
    processFileChange(eventType, relativePath);
  }, vizConfig.sync_interval_ms || 500);
}

function processFileChange(eventType, relativePath) {
  console.log('[文件]', eventType, relativePath);

  if (relativePath.startsWith('大纲/角色设定/')) {
    updateCharacterNode(eventType, relativePath);
  } else if (relativePath.startsWith('大纲/势力设定/')) {
    updateForceNode(eventType, relativePath);
  } else if (relativePath === '大纲/金手指设定.md') {
    updateCheatNode(eventType, relativePath);
  } else if (relativePath.startsWith('章节细纲/角色设定/')) {
    updateL2CharacterNode(eventType, relativePath);
  } else if (relativePath.startsWith('章节细纲/金手指/')) {
    updateL2CheatNode(eventType, relativePath);
  } else if (relativePath.startsWith('章节细纲/势力/')) {
    updateL2ForceNode(eventType, relativePath);
  } else if (relativePath.startsWith('章节细纲/') && relativePath.endsWith('.md') && !relativePath.includes('角色设定') && !relativePath.includes('金手指') && !relativePath.includes('势力')) {
    updateL2Node(eventType, relativePath);
  } else if (relativePath.startsWith('正文/')) {
    updateL3Node(eventType, relativePath);
  }
}

function updateCharacterNode(eventType, relativePath) {
  const module = topologyData.L1.characters;
  if (eventType === 'add') {
    const existing = module.nodes.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8')) || path.basename(relativePath, '.md');
    const newNode = {
      id: `char_${String(module.nodes.length + 1).padStart(3, '0')}`,
      type: 'character',
      label: title,
      file_path: relativePath,
      start_state: '',
      end_state: '',
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    module.nodes.push(newNode);
    saveLayer('L1');
    broadcast({ type: 'l1_node_added', module: 'characters', node: newNode });
  } else if (eventType === 'change') {
    const node = module.nodes.find(n => n.file_path === relativePath);
    if (node) {
      const content = fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8');
      const newTitle = extractTitle(content);
      if (newTitle && newTitle !== node.label) {
        node.label = newTitle;
        const { startState, endState } = extractCharacterStates(content);
        if (startState) node.start_state = startState;
        if (endState) node.end_state = endState;
        saveLayer('L1');
        broadcast({ type: 'l1_node_updated', module: 'characters', node });
      }
    }
  }
}

function updateForceNode(eventType, relativePath) {
  const module = topologyData.L1.forces;
  if (eventType === 'add') {
    const existing = module.nodes.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8')) || path.basename(relativePath, '.md');
    const newNode = {
      id: `force_${String(module.nodes.length + 1).padStart(3, '0')}`,
      type: 'force',
      label: title,
      file_path: relativePath,
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    module.nodes.push(newNode);
    saveLayer('L1');
    broadcast({ type: 'l1_node_added', module: 'forces', node: newNode });
  } else if (eventType === 'change') {
    const node = module.nodes.find(n => n.file_path === relativePath);
    if (node) {
      const newTitle = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8'));
      if (newTitle && newTitle !== node.label) {
        node.label = newTitle;
        saveLayer('L1');
        broadcast({ type: 'l1_node_updated', module: 'forces', node });
      }
    }
  }
}

function updateCheatNode(eventType, relativePath) {
  // 金手指只有一个文件，重新解析
  const module = topologyData.L1.cheats;
  const content = fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8');
  const stages = extractCheatStages(content);

  if (stages.length > 0) {
    module.nodes = stages.map((stage, idx) => ({
      id: `cheat_${String(idx + 1).padStart(3, '0')}`,
      type: 'cheat',
      label: stage.name,
      file_path: relativePath,
      start_chapter: stage.start,
      end_chapter: stage.end,
      description: stage.desc,
      tags: [],
      notes: '',
      position: module.nodes[idx]?.position || { x: 200 + idx * 200, y: 200 }
    }));
    saveLayer('L1');
    broadcast({ type: 'l1_module_updated', module: 'cheats', data: module });
  }
}

function updateL2Node(eventType, relativePath) {
  if (eventType === 'add') {
    const existing = topologyData.L2.chapters.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8')) || path.basename(relativePath, '.md');
    const chapterNum = extractChapterNumber(path.basename(relativePath)) || topologyData.L2.chapters.length + 1;
    const newNode = {
      id: `ch_${String(topologyData.L2.chapters.length + 1).padStart(3, '0')}`,
      type: 'chapter',
      label: title,
      file_path: relativePath,
      chapter_num: chapterNum,
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    topologyData.L2.chapters.push(newNode);
    saveLayer('L2');
    broadcast({ type: 'l2_node_added', node: newNode });
  }
}

function updateL2CharacterNode(eventType, relativePath) {
  const module = topologyData.L2.characters;
  const pathParts = relativePath.split('/');
  // 新路径格式: 章节细纲/角色设定/第XXX章/角色名.md
  const fileName = path.basename(relativePath, '.md');
  const chapterFolder = pathParts.length >= 4 ? pathParts[2] : '';
  const chapterNum = extractChapterNumber(chapterFolder) || 0;

  if (eventType === 'add') {
    const existing = module.nodes.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8')) || fileName;
    const newNode = {
      id: `l2_char_${String(chapterNum).padStart(3, '0')}_${fileName}`,
      type: 'character_state',
      label: `${fileName}（第${chapterNum}章）`,
      file_path: relativePath,
      chapter_num: chapterNum,
      character_name: fileName,
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    module.nodes.push(newNode);
    saveLayer('L2');
    broadcast({ type: 'l2_node_added', module: 'characters', node: newNode });
  } else if (eventType === 'change') {
    const node = module.nodes.find(n => n.file_path === relativePath);
    if (node) {
      const newTitle = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8'));
      if (newTitle) node.label = `${node.character_name || fileName}（第${chapterNum}章）`;
      saveLayer('L2');
      broadcast({ type: 'l2_node_updated', module: 'characters', node });
    }
  }
}

function updateL2CheatNode(eventType, relativePath) {
  const module = topologyData.L2.cheats;
  if (eventType === 'add') {
    const existing = module.nodes.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8')) || path.basename(relativePath, '.md');
    const chapterNum = extractChapterNumber(path.basename(relativePath)) || module.nodes.length + 1;
    const newNode = {
      id: `l2_cheat_${String(module.nodes.length + 1).padStart(3, '0')}`,
      type: 'cheat_state',
      label: title,
      file_path: relativePath,
      chapter_num: chapterNum,
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    module.nodes.push(newNode);
    saveLayer('L2');
    broadcast({ type: 'l2_node_added', module: 'cheats', node: newNode });
  } else if (eventType === 'change') {
    const node = module.nodes.find(n => n.file_path === relativePath);
    if (node) {
      const newTitle = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8'));
      if (newTitle && newTitle !== node.label) {
        node.label = newTitle;
        saveLayer('L2');
        broadcast({ type: 'l2_node_updated', module: 'cheats', node });
      }
    }
  }
}

function updateL2ForceNode(eventType, relativePath) {
  const module = topologyData.L2.forces;
  if (eventType === 'add') {
    const existing = module.nodes.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8')) || path.basename(relativePath, '.md');
    const chapterNum = extractChapterNumber(path.basename(relativePath)) || module.nodes.length + 1;
    const newNode = {
      id: `l2_force_${String(module.nodes.length + 1).padStart(3, '0')}`,
      type: 'force_state',
      label: title,
      file_path: relativePath,
      chapter_num: chapterNum,
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    module.nodes.push(newNode);
    saveLayer('L2');
    broadcast({ type: 'l2_node_added', module: 'forces', node: newNode });
  } else if (eventType === 'change') {
    const node = module.nodes.find(n => n.file_path === relativePath);
    if (node) {
      const newTitle = extractTitle(fs.readFileSync(path.join(CONFIG.projectRoot, relativePath), 'utf-8'));
      if (newTitle && newTitle !== node.label) {
        node.label = newTitle;
        saveLayer('L2');
        broadcast({ type: 'l2_node_updated', module: 'forces', node });
      }
    }
  }
}

function updateL3Node(eventType, relativePath) {
  if (eventType === 'add') {
    const existing = topologyData.L3.nodes.find(n => n.file_path === relativePath);
    if (existing) return;
    const title = path.basename(relativePath, '.md');
    const newNode = {
      id: `txt_${String(topologyData.L3.nodes.length + 1).padStart(3, '0')}`,
      type: 'text',
      label: title,
      file_path: relativePath,
      tags: [],
      notes: '',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }
    };
    topologyData.L3.nodes.push(newNode);
    saveLayer('L3');
    broadcast({ type: 'l3_node_added', node: newNode });
  }
}

// ==================== HTTP + WebSocket 服务 ====================
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath;

  // 根路径显示项目入口页面
  if (url.pathname === '/') {
    filePath = path.join(WEB_DIR, 'entry.html');
  } else {
    filePath = path.join(WEB_DIR, url.pathname);
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript',
    '.css': 'text/css', '.json': 'application/json'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  clients.add(ws);
  console.log('[WS] 客户端连接');

  ws.send(JSON.stringify({ type: 'init', data: topologyData, worldview: vizConfig.worldview || 'default' }));

  ws.on('message', message => {
    try { handleClientMessage(ws, JSON.parse(message)); }
    catch (e) { console.error('[WS] 消息解析失败:', e.message); }
  });

  ws.on('close', () => { clients.delete(ws); });
});

function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'set_project':
      // 切换项目路径
      if (msg.path && fs.existsSync(msg.path)) {
        CONFIG.projectRoot = msg.path;
        console.log(`[项目] 切换到: ${msg.path}`);
        // 重新加载拓扑数据
        loadTopology();
        ws.send(JSON.stringify({ type: 'init', data: topologyData, worldview: vizConfig.worldview || 'default' }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: '项目路径不存在' }));
      }
      break;

    case 'switch_layer':
      topologyData.activeLayer = msg.layer;
      if ((msg.layer === 'L1' || msg.layer === 'L2') && msg.module) {
        topologyData[msg.layer].activeModule = msg.module;
      }
      ws.send(JSON.stringify({ type: 'layer_switched', layer: msg.layer, data: getLayerData(msg.layer) }));
      break;

    case 'switch_l1_module':
      topologyData.L1.activeModule = msg.module;
      ws.send(JSON.stringify({ type: 'l1_module_switched', module: msg.module, data: topologyData.L1[msg.module] }));
      break;

    case 'update_l1_node':
      updateL1Node(msg.module, msg.node);
      break;

    case 'add_l1_node':
      addL1Node(msg.module, msg.node);
      break;

    case 'update_l1_edge':
      updateL1Edge(msg.module, msg.edge);
      break;

    case 'add_l1_edge':
      addL1Edge(msg.module, msg.edge);
      break;

    case 'confirm_relation':
      confirmRelation(msg.module, msg.edgeId);
      break;

    case 'update_node':
      if (msg.layer === 'L1') {
        updateL1Node(topologyData.L1.activeModule, msg.node);
      } else {
        updateNode(msg.layer, msg.node);
      }
      break;

    case 'add_node':
      if (msg.layer === 'L1') {
        addL1Node(topologyData.L1.activeModule, msg.node);
      } else {
        addNode(msg.layer, msg.node);
      }
      break;

    case 'update_edge':
      if (msg.layer === 'L1') {
        updateL1Edge(topologyData.L1.activeModule, msg.edge);
      } else {
        updateEdge(msg.layer, msg.edge);
      }
      break;

    case 'add_edge':
      if (msg.layer === 'L1') {
        addL1Edge(topologyData.L1.activeModule, msg.edge);
      } else {
        addEdge(msg.layer, msg.edge);
      }
      break;

    case 'delete_node':
      if (msg.layer === 'L1') {
        deleteL1Node(topologyData.L1.activeModule, msg.nodeId);
      } else {
        deleteNode(msg.layer, msg.nodeId);
      }
      break;

    case 'delete_edge':
      if (msg.layer === 'L1') {
        deleteL1Edge(topologyData.L1.activeModule, msg.edgeId);
      } else {
        deleteEdge(msg.layer, msg.edgeId);
      }
      break;

    case 'update_document':
      updateDocumentFromNode(msg.node);
      break;

    case 'get_text_content':
      const content = getTextContent(msg.filePath);
      ws.send(JSON.stringify({ type: 'text_content', content }));
      break;

    case 'save_text':
      saveTextContent(msg.filePath, msg.content);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      console.log('[WS] 未知消息类型:', msg.type);
  }
}

function getLayerData(layer) {
  if (layer === 'L1') {
    const module = topologyData.L1.activeModule || 'characters';
    return topologyData.L1[module];
  } else if (layer === 'L2') {
    const module = topologyData.L2.activeModule || 'characters';
    return topologyData.L2[module];
  }
  return topologyData[layer];
}

// ==================== L1 数据操作 ====================
function updateL1Node(module, node) {
  const mod = topologyData.L1[module];
  const idx = mod.nodes.findIndex(n => n.id === node.id);
  if (idx >= 0) {
    mod.nodes[idx] = { ...mod.nodes[idx], ...node };
    saveLayer('L1');
    broadcast({ type: 'l1_node_updated', module, node: mod.nodes[idx] });
  }
}

function addL1Node(module, node) {
  const mod = topologyData.L1[module];
  mod.nodes.push(node);
  saveLayer('L1');
  broadcast({ type: 'l1_node_added', module, node });
}

function deleteL1Node(module, nodeId) {
  const mod = topologyData.L1[module];
  mod.nodes = mod.nodes.filter(n => n.id !== nodeId);
  mod.edges = mod.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  saveLayer('L1');
  broadcast({ type: 'l1_node_deleted', module, nodeId });
}

function updateL1Edge(module, edge) {
  const mod = topologyData.L1[module];
  const idx = mod.edges.findIndex(e => e.id === edge.id);
  if (idx >= 0) {
    mod.edges[idx] = { ...mod.edges[idx], ...edge };
    saveLayer('L1');
    broadcast({ type: 'l1_edge_updated', module, edge: mod.edges[idx] });
  }
}

function addL1Edge(module, edge) {
  const mod = topologyData.L1[module];
  mod.edges.push(edge);
  saveLayer('L1');
  broadcast({ type: 'l1_edge_added', module, edge });
}

function deleteL1Edge(module, edgeId) {
  const mod = topologyData.L1[module];
  mod.edges = mod.edges.filter(e => e.id !== edgeId);
  saveLayer('L1');
  broadcast({ type: 'l1_edge_deleted', module, edgeId });
}

function confirmRelation(module, edgeId) {
  const mod = topologyData.L1[module];
  const edge = mod.edges.find(e => e.id === edgeId);
  if (edge) {
    edge.confirmed = true;
    saveLayer('L1');
    broadcast({ type: 'l1_edge_confirmed', module, edge });
  }
}

// ==================== L2/L3 数据操作 ====================
function updateNode(layer, node) {
  const data = topologyData[layer];
  const idx = data.nodes.findIndex(n => n.id === node.id);
  if (idx >= 0) {
    data.nodes[idx] = { ...data.nodes[idx], ...node };
    saveLayer(layer);
    broadcast({ type: 'node_updated', layer, node: data.nodes[idx] });
  }
}

function addNode(layer, node) {
  topologyData[layer].nodes.push(node);
  saveLayer(layer);
  broadcast({ type: 'node_added', layer, node });
}

function deleteNode(layer, nodeId) {
  topologyData[layer].nodes = topologyData[layer].nodes.filter(n => n.id !== nodeId);
  topologyData[layer].edges = topologyData[layer].edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  saveLayer(layer);
  broadcast({ type: 'node_deleted', layer, nodeId });
}

function updateEdge(layer, edge) {
  const data = topologyData[layer];
  const idx = data.edges.findIndex(e => e.id === edge.id);
  if (idx >= 0) {
    data.edges[idx] = { ...data.edges[idx], ...edge };
    saveLayer(layer);
    broadcast({ type: 'edge_updated', layer, edge: data.edges[idx] });
  }
}

function addEdge(layer, edge) {
  topologyData[layer].edges.push(edge);
  saveLayer(layer);
  broadcast({ type: 'edge_added', layer, edge });
}

function deleteEdge(layer, edgeId) {
  topologyData[layer].edges = topologyData[layer].edges.filter(e => e.id !== edgeId);
  saveLayer(layer);
  broadcast({ type: 'edge_deleted', layer, edgeId });
}

// ==================== 文档操作 ====================
function updateDocumentFromNode(node) {
  if (!node.file_path) return;
  const filePath = path.join(CONFIG.projectRoot, node.file_path);
  if (!fs.existsSync(filePath)) return;

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length > 0 && lines[0].startsWith('# ')) {
      lines[0] = `# ${node.label}`;
    }

    // 更新起点终点
    if (node.start_state || node.end_state) {
      let hasStart = false, hasEnd = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('起点')) { lines[i] = `起点：${node.start_state}`; hasStart = true; }
        if (lines[i].startsWith('终点')) { lines[i] = `终点：${node.end_state}`; hasEnd = true; }
      }
      if (!hasStart && node.start_state) lines.push(`起点：${node.start_state}`);
      if (!hasEnd && node.end_state) lines.push(`终点：${node.end_state}`);
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log('[文档] 已更新:', node.file_path);
  } catch (e) {
    console.error('[文档] 更新失败:', e.message);
  }
}

function getTextContent(filePath) {
  try {
    return fs.readFileSync(path.join(CONFIG.projectRoot, filePath), 'utf-8');
  } catch (e) {
    return '';
  }
}

function saveTextContent(filePath, content) {
  try {
    fs.writeFileSync(path.join(CONFIG.projectRoot, filePath), content, 'utf-8');
    console.log('[正文] 已保存:', filePath);
  } catch (e) {
    console.error('[正文] 保存失败:', e.message);
  }
}

// ==================== 启动 ====================
loadTopology();
startFileWatcher();

server.listen(CONFIG.port, () => {
  console.log('=================================');
  console.log('  妙笔生花 - 可视化拓扑服务 v3.0');
  console.log('  大纲三模块: 人物 | 金手指 | 势力');
  console.log('  项目:', CONFIG.projectRoot);
  console.log('  端口:', CONFIG.port);
  console.log('  访问: http://localhost:' + CONFIG.port);
  console.log('=================================');
});

process.on('SIGINT', () => { saveSnapshot(); process.exit(0); });
process.on('SIGTERM', () => { saveSnapshot(); process.exit(0); });
