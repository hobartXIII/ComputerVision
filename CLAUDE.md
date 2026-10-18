# 電腦視覺 互動式網頁筆記

國立中興大學「電腦視覺」課程（授課：楊景明）的互動式網頁筆記。每章一頁，把講義內容整理成可以操作的網頁，例如可以拖拉參數、逐步執行，讓公式與計算「動起來」，用於準備期中考與期末考。

- 期中考：2026-10-29
- 期末考：2026-12-17

## 資料來源

| 來源 | 位置 | 用途 |
|---|---|---|
| 講義 PDF | Google 雲端硬碟「電腦視覺」資料夾 `1G3x-BhZKfFVIzODrT6K7tVmPdqv1o2bp` | 原始內容，以此為準 |
| 文字筆記 | Notion「👁️ 電腦視覺筆記」 https://app.notion.com/p/3eb75b0b5a1381e69740c95b51caedf6 | 已整理好的逐章筆記，網頁內容以此為底稿 |
| 程式碼 | https://github.com/hobartXIII/ComputerVision （`main`） | 本專案 |

- 讀講義：用 Google Drive 工具搜尋 `parentId = '1G3x-BhZKfFVIzODrT6K7tVmPdqv1o2bp'`，找新章節也用同樣的方式。
- 讀筆記：用 Notion fetch 讀主頁，再讀各章子頁面。
- **講義 PDF 不可放進 repo**：講義有著作權，repo 可能公開，所以只能連回雲端硬碟。`.gitignore` 已排除 `*.pdf`。

## 目前進度

| 章 | 講義 | Notion 筆記 | 網頁 |
|---|---|---|---|
| C0 課程導論：什麼是電腦視覺 | c0_introduction.pptx.pdf | ✅ | ✅ |
| C1 視覺機器學習模型 | c1_computer_vision_models \| iLearning 3.pdf | ✅ | ✅ |
| C2 卷積神經網路（CNN） | c2_cnn.pdf | ✅ | ✅ |
| C3 模型品質與改進 | c3_model_improvement \| iLearning 3.pdf | ✅ | ✅ |
| C4 進階影像視覺模型（Part 1） | c4_advanced_cnn_part1.pdf | ✅ | ✅ |
| C4 進階影像視覺模型（Part 2）：DenseNet | c4_advanced_cnn_part2.pdf | ✅ | ✅（`c4-2.html`） |
| C5 遷移學習與微調 | c5_transfer_learning_and_fine_tuning.pdf | ✅ | ✅ |

同一章分成多份講義時，後面的部分用 `c<n>-<part>.html`（例如 C4 Part 2 是 `c4-2.html`，頁首顯示「C4-2」）。

C4 講義標註 (Skip) 的 LeNet、AlexNet、EfficientNet 不在考試範圍，頁面保留但標「不考」。

新增或完成章節時，請更新這張表，也要更新 `assets/common.js` 裡的 `CHAPTERS`。

## 技術架構

- 純靜態網站：HTML + CSS + 原生 JavaScript，**不需建置步驟**，直接用瀏覽器開啟 `index.html` 就能用，之後也可以直接部署到 GitHub Pages。
- 數學公式用 KaTeX，外部函式庫一律從 CDN 載入（cdnjs 或 jsDelivr），不引入 npm 或打包工具。
- 互動圖用 `<canvas>` 或 inline SVG 自己畫，除非真的必要，不引入大型圖表庫。
- 支援手機寬度與深色模式（色彩用 CSS 變數定義在 `:root`）。

```
index.html            首頁：考試倒數、章節卡片（由 CHAPTERS 產生）
assets/style.css      共用樣式與色彩 tokens（淺色／深色）
assets/common.js      CHAPTERS 與 EXAMS 清單、頁首、目錄、主題切換、KaTeX、測驗、螢光筆、
                      matrix()、setupCanvas()、onRedraw()、bindRange() 等工具，掛在 window.CV
assets/highlights.js  共享螢光筆標記（由 tools/merge-highlights.js 產生）
tools/merge-highlights.js  把頁面匯出的螢光筆 JSON 合併進 highlights.js（Node）
chapters/c<n>.html    每章一頁，檔名與講義章號一致
chapters/c<n>.js      該章的互動元件，每個元件一個 IIFE，對應 HTML 裡的 .widget#w-xxx
```

- 所有 script 都用 `defer` 載入，順序是 KaTeX → `common.js` → `c<n>.js`。不能用 ES modules，因為用 `file://` 直接開啟時會被擋。
- 頁首、目錄、測驗行為由 `common.js` 自動產生，章節頁只需寫 `<body data-chapter="c<n>">` 和 `<nav class="toc">`。
- 靜態文字的公式用 `\( \)`（行內）與 `$$ $$`（區塊），在 `load` 時由 auto-render 處理；互動元件的動態公式用 `CV.tex(el, str)`。
- 畫布元件用 `CV.onRedraw(draw)` 註冊，視窗縮放與切換主題時會自動重畫；顏色一律從 CSS 變數讀取（`CV.cssVar('--c-a')`）。
- 測驗：選擇題寫 `<div class="quiz" data-answer="B">`，選項 `<button data-opt="A">`，解析放 `.explain[hidden]`；簡答題用 `<details class="answer">`。
- 螢光筆（完整規格與移植說明見 `docs/highlighter.md`，給其他課程的筆記專案使用；改了螢光筆行為要同步更新該文件）：章節頁 `<main>` 裡選取文字會跳出色票（黃／綠／粉底、紅／藍字），點已標記的文字可換色或移除。新標記會取代重疊的舊標記（不疊層），選取範圍有標記時可用「🧽 清除」挖掉；頁首「🖍 標記」選單有匯出、清除本頁、清除本課程全部（都按兩次確認）。首頁不啟動。`.widget`、公式、按鈕不能標記。標記以「純文字位置＋原文＋前後各 20 字」記錄；位置對不上時，在相同文字中挑前後文最像的。
  - 個人標記：存在瀏覽器 `localStorage` 的 `cv-hl:<chapter>`，只留在那個網址來源（GitHub Pages、localhost、`file://` 各自分開）。前綴 `cv` 來自 `common.js` 的 `COURSE.id`：同一個 github.io 網域下的其他課程筆記共用 localStorage，靠前綴分開，其他課程要換成自己的識別。
  - 共享標記：`assets/highlights.js`（`window.CV_SHARED_HL`），由 `common.js` 自動載入，每台裝置都看得到。在頁面上改色或隱藏只記在 `cv-hl-ovr:<chapter>`。
  - 回寫流程：使用者在 GitHub Pages 按頁首「🖍 匯出」下載 `ComputerVision-highlights-YYYY-MM-DD.json`（檔名來自 `COURSE.name`，檔內也記錄 `course`）→ `node tools/merge-highlights.js <檔案>` 合併（課程不符會拒絕；新增、改色、刪除，重複執行不會重複加）→ commit／push。部署後，瀏覽器裡已寫進共享檔的個人標記與修改會自動清掉。
- 逐步展開：`<div class="steps"><p class="steps-title">題目</p><ol><li>…</li></ol></div>`，每步的解釋放 `<span class="why">`；`common.js` 會自動加上「下一步／全部展開／收起」按鈕，一開始只顯示題目。

## 每章頁面的結構

沿用 Notion 筆記的章節順序，讓兩邊可以對照：

1. 本章重點摘要
2. 章節大綱
3. 關鍵名詞表（中文、英文、定義、一句話直覺解釋）
4. 公式與計算：每個公式都要附數值例子，能做成互動的就做成互動
5. 方法比較表
6. 圖表說明：講義裡的圖儘量用互動元件重現
7. 常見觀念陷阱
8. 自我測驗：答案預設隱藏，點開才顯示；選擇題可即時判斷對錯

## 寫作規範

- 使用**繁體中文**。專有名詞第一次出現時寫成「中文（English, 縮寫）」，例如「卷積神經網路（Convolutional Neural Network, CNN）」。
- 沿用 Notion 的標註方式：
  - 【補充】：講義沒寫、但有助於理解的內容
  - 【待確認】：講義文字無法擷取（多半是圖片），或講義本身前後不一致
- 講義與正確計算不一致時，網頁要**顯示正確值**，並用【待確認】說明講義原本寫的是什麼。已知的不一致（C2）：
  - Conv 層參數量範例：講義寫 `(3×3×3)+1=10`、×16=160，正確應為 28×16=448（160 是輸入深度為 1 的情況）
  - Simple CNN 的 Conv_2：有一頁寫 18,494，正確值為 18,496
  - Padding 頁的 5×5 輸出矩陣與實際計算不符，應以重算結果為準
- 互動元件的預設值要用**講義的原例子**，讓頁面一打開看到的就和上課內容相同。

## 各章的互動元件與驗證值

修改元件後，預設值必須仍然算出右欄的結果：

| 章 | 元件 | 預設值應得到 |
|---|---|---|
| C0 | 四大任務切換（`#w-tasks`）、手寫規則判斷蘋果（`#w-rules`）、成績計算器（`#w-grade`） | 成績 70/80/90/85/100 → 84 |
| C1 | RGB 像素（`#w-rgb`）、SVM 間隔（`#w-svm`）、Kernel Trick（`#w-kernel`）、KNN（`#w-knn`）、PCA（`#w-pca`） | 224×224×3 = 150,528 |
| C1 | 距離比較（`#w-dist`） | 歐幾里得 10.05 vs 9.9；曼哈頓 11 vs 14 |
| C1 | Softmax＋交叉熵（`#w-soft`）、Sigmoid（`#w-sig`） | z=(2,1,0) → (0.665, 0.245, 0.090)，損失 0.408 |
| C1 | 梯度下降（`#w-gd`），\(L(w)=0.1w^4-w^2+0.9w\)，w₀=3 | GD η=0.05 卡在局部最小值；η=0.5 震盪；η=0.8 發散；Momentum η=0.05 到全域最小值 |
| C1 | 編碼比較（`#w-enc`）、混淆矩陣（`#w-met`） | TP40/FP10/FN20/TN30 → 0.8、0.667、0.7 |
| C2 | 卷積逐步（`#w-conv`） | p0 s1 → [[2,1,−1],[−1,1,3],[2,1,1]]；s2 → [[2,−1],[2,1]]；左亮右暗＋垂直邊緣 → 每列 3 3 0 |
| C2 | 多頻道卷積（`#w-rgb`）、覆蓋次數（`#w-cover`）、天使與魔鬼（`#w-why`）、ReLU＋Pooling（`#w-pool`） | 覆蓋次數：p0 角落 1 次、p1 角落 4 次 |
| C2 | 尺寸計算器（`#w-size`）、MNIST CNN（`#w-cnn`） | 合計 1,199,882 |
| C3 | MNIST 混淆矩陣（`#w-cm`，示意數字） | 最常見錯誤 4→9（18）、7→2（14） |
| C3 | 門檻值（`#w-thr`）、二元指標（`#w-bin`） | 門檻 0.5 → TP90/FN10/FP5/TN40；Acc 0.897、Recall 0.9、FPR 0.111、Spec 0.889、Precision 0.947、F1 0.923 |
| C3 | 多項式擬合（`#w-fit`）、Dropout（`#w-drop`） | 次方 3、λ=0 為泛化良好；Dropout 0.5 → 每個隱藏層關 3/6 個節點 |
| C3 | L1／L2（`#w-pen`） | 權重 (3, −0.1, 0)、λ=0.01 → L1 0.031、L2 0.0901 |
| C3 | BN（`#w-bn`） | (2,4,6,8)、γ=2、β=1 → x̂ ≈ (−1.342, −0.447, 0.447, 1.342)、y ≈ (−1.683, 0.106, 1.894, 3.683)；running_mean 0.5 → 0.85 |
| C3 | Early Stopping（`#w-es`） | P=3、0.50/0.40/0.35/0.36/0.37/0.38 → 第 6 epoch 停、取回第 3；測驗題 P=2 → 第 5 epoch 停 |
| C3 | 資料擴增（`#w-aug`） | MixUp λ=0.7 → 狗 0.7、貓 0.3；CutMix 32×32 貼 16×16 → 0.25 |
| C4 | 卷積三數字（`#w-conv3`） | 12×12×3、5×5、128 → 8×8×128、參數 9,728、乘法 614,400 |
| C4 | VGG 參數量（`#w-vgg`） | VGG16 → 138,357,544（FC 約 89%）；VGG19 → 143,667,240 |
| C4 | Inception module（`#w-incep`）、瓶頸層（`#w-bneck`） | 3a 輸出 28×28×256；28×28×192、5×5→32、瓶頸 16 → 120,422,400 vs 12,443,648 |
| C4 | ResNet（`#w-res`） | w₂=0 時 ResNet MSE 0；N=20、d=0.5 → 9.54×10⁻⁷；d=1.5 → 3,325 |
| C4 | GAP（`#w-gap`） | 7×7×512 → Flatten＋FC4096 102,764,544 vs GAP＋FC1000 513,000 |
| C4 | Fire module（`#w-fire`） | fire2（96,16,64,64）→ 11,920 vs 110,720；測驗題（128,…）→ 12,432 vs 147,584 |
| C4 | Depthwise Separable（`#w-dsc`） | 12×12×3、5×5、128 → 614,400 vs 29,376；測驗題 16×16×32→64 same → 4,718,592 vs 598,016 |
| C4 | MobileNet α／ρ（`#w-mob`）、Compound Scaling（`#w-scale`）、比較圖（`#w-models`） | α=0.5 → 約 0.25 倍；224→160 → 0.51 倍；φ=1 → 1.92 |
| C4-2 | Dense Block（`#w-dense`） | k₀=64、k=32、6 層 → 輸入 64…224、輸出 256、連接 21 條 |
| C4-2 | Bottleneck（`#w-bottle`） | C=992、k=32 → 285,696 vs 163,840（0.573）；C=64 → 18,432 vs 45,056；C=512 → 147,456 vs 102,400 |
| C4-2 | 整個網路（`#w-net`） | DenseNet-121（k=32、θ=0.5、B）→ 7,978,856；169 → 14,149,480；201 → 20,013,928；264 → 33,337,704；無 B → 10,869,096 |
| C5 | 微調策略（`#w-strat`，ResNet-50＋10 類、Adam）、k 怎麼選（`#w-k`） | 特徵提取 20,490（0.09%、94.4 MB）；Last-k k=1 → 14,985,226（63.7%）；k=2 → 22,083,594；Full 23,528,522（376.5 MB） |
| C5 | LoRA（`#w-lora`）、數字例子（`#w-merge`） | 768×768、r=8 → 12,288（2.08%）；1024、r=16 → 32,768；ViT-B 10 任務 860M vs 91.9M；B=(0.5,1)、A=(2,−1)、x=(3,1) → h=(5.5,6) |
| C5 | L2-SP（`#w-l2sp`） | α=1、w⁰=(2,1)、w*=(3,3) → L2-SP (2.5,2)、weight decay (1.5,1.5) |

C3 門檻元件的分數是依常態分位數排列產生的，讓門檻 0.5 剛好得到講義的 TP90/FN10/FP5/TN40；改分布參數後要重新確認。

梯度下降曲線的係數是模擬後才選定的：換係數或學習率範圍之前，先用 Node 模擬確認上面這幾種現象仍然成立，頁面上的「試試看」說明才不會與實際行為不符。

## 新增一章的流程

1. 在雲端硬碟找到新講義，讀取內容。
2. 讀取 Notion 上對應的章節筆記；如果還沒有，先依照同樣的格式建立 Notion 子頁面（「C<n> 中文標題」）。
3. 以現有章節為範本，建立 `chapters/c<n>.html` 與 `chapters/c<n>.js`，在 `assets/common.js` 的 `CHAPTERS` 加一行（首頁與頁首會自動出現），並更新本檔的進度表與驗證值表。
4. 驗證：
   - `node --check chapters/c<n>.js` 確認沒有語法錯誤。
   - 在專案根目錄執行 `python -m http.server 8765`，用瀏覽器開啟 `http://localhost:8765/chapters/c<n>.html`。
   - 確認互動元件預設值算出來的結果和 Notion 筆記的數值例子相同。
   - 確認頁面上沒有 `.katex-error`（公式都有正確顯示）。
   - 在 390px 寬度下，`document.documentElement.scrollWidth` 不可以超過視窗寬度，淺色和深色主題都要看一次。

## Git

- 預設分支是 `main`，remote 是 `origin`。
- 使用者要求時才 commit 或 push。
