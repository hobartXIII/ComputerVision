// 從各章「❓ 問答閱讀筆記」（<div class="qa">）抽出內容整理，產生 chapters/exam-content.js 給考題頁使用
// 用法：node tools/build-exam-content.js（改了任何一章的問答閱讀筆記後重跑）
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// 每個 qa-item 在考題頁顯示的內容標題（依各章問答閱讀筆記的順序）
const LABELS = {
  c1: ['機器學習（ML）與深度學習（DL）', '支持向量機（SVM）', '核技巧（Kernel Trick）', 'K 最近鄰（KNN）', '主成分分析（PCA）',
    '激活函數（Activation Function）', '損失函數（Loss Function）', '梯度下降（Gradient Descent）與學習率（Learning Rate）', '優化器（Optimizer）'],
  c2: ['濾波器是特徵偵測器', '卷積（Convolution）與特徵圖（Feature Map）', '垂直邊緣偵測器', '彩色圖（RGB）的卷積',
    '卷積層的超參數', 'Padding', 'Stride', '輸出尺寸計算', 'ReLU', 'Pooling',
    '全連接層（Fully Connected Layer）', '參數量計算', '參數（Parameter）與超參數（Hyperparameter）', 'CNN 比全連接網路有效的原因'],
  c3: ['Training／Validation／Test', 'Loss、Accuracy 曲線與混淆矩陣（Confusion Matrix）', 'Precision、Recall、Accuracy',
    '過度擬合（Overfitting）', 'L1 與 L2 正則化', 'Dropout', 'Early Stopping', 'Batch Normalization（BN）',
    '資料擴增（Data Augmentation）', '遮擋類：CutOut、Random Erasing、Hide-and-Seek、GridMask',
    '混合與組合類：MixUp、CutMix、Copy-Paste、Mosaic', 'Adaptive Data Augmentation 與 Targeted Data Generation'],
  c4: ['參數量與運算量', 'VGGNet 的設計與優缺點', 'VGG 全部用 3×3 的原因', '梯度消失與梯度爆炸', 'ResNet 與殘差連接', 'ResNet 的優缺點',
    'Inception 的核心想法', '1×1 卷積（瓶頸層 Bottleneck Layer）', '輔助分類器與 Inception 的優缺點', 'Global Average Pooling（GAP）',
    '計算成本與訓練效率', 'SqueezeNet 的目標與設計策略', 'Fire module 與 SqueezeNet 的缺點',
    'Depthwise Separable Convolution', 'MobileNet 的超參數 α、ρ', 'MobileNet 的優缺點', '各模型要解決的問題'],
  'c4-2': ['DenseNet', 'ResNet 的限制與 DenseNet 的改進', 'Dense Block 與增長率 k', 'Dense Block 組成層的順序',
    'DenseNet-B 的 Bottleneck Layer', '過渡層（Transition Layer）與 DenseNet-BC', 'DenseNet 省參數的原因', 'DenseNet 的優缺點', 'ResNet 與 DenseNet 的比較'],
  c5: ['遷移學習（Transfer Learning）', '特徵提取（Feature Extraction）', '微調（Fine-tuning）', '先凍結再解凍的原因',
    'Full Fine-tuning', 'Partial／Selective 與 Last-k Fine-tuning', 'PEFT', 'LoRA', 'Regularized Fine-tuning 與 L2-SP'],
};
const TITLES = { c1: 'C1 視覺機器學習模型', c2: 'C2 卷積神經網路（CNN）', c3: 'C3 模型品質與改進',
  c4: 'C4 進階影像視覺模型（Part 1）', 'c4-2': 'C4-2 進階影像視覺模型（Part 2）：DenseNet', c5: 'C5 遷移學習與微調' };

const out = [];
for (const id of Object.keys(LABELS)) {
  const html = fs.readFileSync(path.join(root, 'chapters', id + '.html'), 'utf8');
  const start = html.indexOf('<div class="qa">');
  const end = html.indexOf('<h2 id="summary"', start);
  if (start < 0 || end < 0) throw new Error(id + '：找不到問答閱讀筆記');
  const qa = html.slice(start, end);
  const groups = [];
  let n = 0;
  const re = /<h4>([\s\S]*?)<\/h4>|<details class="qa-item"><summary>[\s\S]*?<\/summary><div>([\s\S]*?)<\/div><\/details>/g;
  for (let m; (m = re.exec(qa));) {
    if (m[1] != null) { groups.push({ title: m[1].trim(), items: [] }); continue; }
    const label = LABELS[id][n];
    if (!label) throw new Error(`${id}：問答閱讀筆記有 ${n + 1} 題以上，LABELS 不夠`);
    n += 1;
    const body = m[2].split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
    groups[groups.length - 1].items.push({ at: `${id}:${n}`, label, html: body });
  }
  if (n !== LABELS[id].length) throw new Error(`${id}：問答閱讀筆記有 ${n} 題，LABELS 有 ${LABELS[id].length} 個`);
  out.push({ id, ch: id.replace(/-\d+$/, ''), title: TITLES[id], groups });
}

const js = '/* 考題頁的內容整理：由 tools/build-exam-content.js 從各章「❓ 問答閱讀筆記」產生，不要手改 */\n'
  + 'window.EXAM_CONTENT = ' + JSON.stringify(out, null, 1) + ';\n';
fs.writeFileSync(path.join(root, 'chapters', 'exam-content.js'), js);
console.log('chapters/exam-content.js：' + out.map((c) => `${c.id} ${c.groups.reduce((s, g) => s + g.items.length, 0)}`).join('、'));
