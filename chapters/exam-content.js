/* 考題頁的內容整理：由 tools/build-exam-content.js 從各章「❓ 問答閱讀筆記」產生，不要手改 */
window.EXAM_CONTENT = [
 {
  "id": "c1",
  "ch": "c1",
  "title": "C1 視覺機器學習模型",
  "groups": [
   {
    "title": "機器學習與深度學習（2.3）",
    "items": [
     {
      "at": "c1:1",
      "label": "機器學習（ML）與深度學習（DL）",
      "html": "<ul>\n<li>關係：AI ⊃ ML ⊃ DL。ML 是「接觸越多資料、表現越好」的演算法；DL 是 ML 的子集，用<strong>多層神經網路</strong>從大量資料中學習。</li>\n<li>關鍵差別在<strong>特徵擷取</strong>：ML 要<strong>人工擷取特徵</strong>，再交給分類模型；DL 由同一個神經網路<strong>同時做特徵擷取＋分類</strong>，特徵是模型自己學的。</li>\n<li>ML 依資料分成監督式（有標籤）、非監督式（無標籤）、強化學習（靠回饋獎勵）。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "SVM、Kernel Trick、KNN、PCA（2.4～2.6）",
    "items": [
     {
      "at": "c1:2",
      "label": "支持向量機（SVM）",
      "html": "<p>支持向量機（Support Vector Machine, SVM）是監督式分類演算法，目標是找一個<strong>最佳超平面（hyperplane）</strong>區分不同類別，同時<strong>最大化間隔（Margin）</strong>：讓兩類資料點離超平面越遠越好，新資料進來時才能維持高準確率。</p>\n<p>缺點：不適合大資料集（找超平面很耗時）；非線性資料處理有限（kernel 與調參難選）；原本為二分類設計，多分類要「一對一」或「一對多」轉換。</p>"
     },
     {
      "at": "c1:3",
      "label": "核技巧（Kernel Trick）",
      "html": "<p>當資料<strong>無法用一條線（超平面）切開</strong>（線性不可分）時，用 Kernel Trick 把資料<strong>投影到更高維的空間</strong>，在高維空間裡就能用超平面切開。</p>\n<p>直覺例子：一維數線上「中間一類、兩邊另一類」切不開；加上 \\(x^2\\) 當第二維後，就能用一條水平線分開。<span class=\"tag add\">補充</span></p>"
     },
     {
      "at": "c1:4",
      "label": "K 最近鄰（KNN）",
      "html": "<p>K 最近鄰（K-Nearest Neighbors, KNN）以<strong>距離</strong>判斷類別：① 算新樣本和所有訓練樣本的距離 ② 取最近的 K 個鄰居 ③ <strong>多數決</strong>。K 通常設<strong>奇數</strong>，避免票數各半。距離可用歐幾里得或曼哈頓距離。</p>\n<p>缺點：計算效率低（預測時要和所有樣本算距離）；<strong>高維度資料表現不佳</strong>（距離概念失效）；無法處理非線性關係。</p>"
     },
     {
      "at": "c1:5",
      "label": "主成分分析（PCA）",
      "html": "<p>主成分分析（Principal Component Analysis, PCA）是<strong>降維</strong>技術：在保留主要資訊的同時減少特徵數量，把資料投影到<strong>變異性最大的方向</strong>（主成分）。</p>\n<p>CV 應用：圖像降維（例如邊緣偵測只用灰階，資料剩 1/3，計算更快）、圖像去噪。限制：只能做<strong>線性降維</strong>，對非線性資料處理有限，可能遺失細節。</p>"
     }
    ]
   },
   {
    "title": "神經網路的訓練（2.8～2.14）",
    "items": [
     {
      "at": "c1:6",
      "label": "激活函數（Activation Function）",
      "html": "<p>為了<strong>引入非線性</strong>。沒有激活函數，疊再多層也只等於一層線性模型，學不出彎曲的決策邊界。</p>\n<p>常見：Sigmoid（輸出 0～1，二元分類輸出層）、tanh、<strong>ReLU</strong>（計算快、正值區梯度為 1，比 Sigmoid 不容易梯度消失）、Leaky ReLU、ELU；多類別輸出層用 Softmax（機率加總為 1）。</p>"
     },
     {
      "at": "c1:7",
      "label": "損失函數（Loss Function）",
      "html": "<p>衡量<strong>預測值和真實值之間的差距</strong>，作為調整權重的依據；訓練目標就是把 Loss 降到最小。</p>\n<ul>\n<li>分類：<strong>交叉熵（Cross-Entropy）</strong>。例：正確類別機率 0.9 → \\(-\\ln0.9\\approx0.105\\)；機率越低，損失越大。</li>\n<li>迴歸：<strong>均方誤差（MSE）</strong>或<strong>平均絕對誤差（MAE）</strong>。MSE 對大誤差罰得重；MAE 對離群值較不敏感。</li>\n</ul>"
     },
     {
      "at": "c1:8",
      "label": "梯度下降（Gradient Descent）與學習率（Learning Rate）",
      "html": "$$w\\leftarrow w-\\alpha\\,\\frac{\\partial L}{\\partial w}$$\n<p>反向傳播算出 Loss 對每個權重的梯度後，<strong>沿梯度的反方向</strong>更新權重，讓 Loss 一步步變小。學習率 \\(\\alpha\\) 決定每一步走多大，是需要調整的<strong>超參數</strong>：</p>\n<ul>\n<li>太大：更新過快，可能<strong>跳過最佳解</strong>、震盪甚至發散。</li>\n<li>太小：更新過慢，收斂很久，可能<strong>無法到達最佳解</strong>。</li>\n</ul>"
     },
     {
      "at": "c1:9",
      "label": "優化器（Optimizer）",
      "html": "<p>優化器根據訓練損失調整模型參數，是梯度下降的改良版：</p>\n<ul>\n<li><strong>SGD</strong>（隨機梯度下降）：每次用一筆或一個 batch 的資料算梯度；更新快，但波動、收斂不穩定，而這個波動可能幫助<strong>跳出 local minima</strong>。</li>\n<li><strong>Momentum</strong>：加上慣性（上一步的移動），在平坦處或梯度為 0 的地方仍會前進，有機會衝過小山丘，也減少抖動。</li>\n<li><strong>RMSProp</strong>：自動調整每個參數的學習率。</li>\n<li><strong>Adam</strong>：<strong>結合 Momentum 與 RMSProp</strong>，同時考慮動量方向與自適應學習率，是常用的預設選擇。</li>\n</ul>"
     }
    ]
   }
  ]
 },
 {
  "id": "c2",
  "ch": "c2",
  "title": "C2 卷積神經網路（CNN）",
  "groups": [
   {
    "title": "CNN 的直覺與卷積（2.1～2.3）",
    "items": [
     {
      "at": "c2:1",
      "label": "濾波器是特徵偵測器",
      "html": "<p>人分辨貓狗靠的是鬍鬚、臉型、眼睛等<strong>特徵</strong>。CNN 讓模型<strong>自己學會偵測</strong>這些特徵，不需要人工設計。</p>\n<ul>\n<li>每一個<strong>濾波器（Filter／Kernel）</strong>就是一個特徵偵測器，專門找一種形狀（例如上邊、左邊、垂直邊緣）。</li>\n<li>濾波器裡的數字一開始是隨機的，用反向傳播與梯度下降學出來（C1）。</li>\n</ul>"
     },
     {
      "at": "c2:2",
      "label": "卷積（Convolution）與特徵圖（Feature Map）",
      "html": "<p>濾波器在輸入圖上滑動，每到一個位置就把框住的區域和濾波器<strong>對應位置相乘，再全部相加</strong>，得到一個數字。所有位置的結果組成<strong>特徵圖（Feature Map）</strong>，標出「哪裡有這個特徵」。</p>\n<p>注意：是<strong>逐格相乘再加總</strong>，不是矩陣乘法。例：講義 5×5 輸入卷 3×3 濾波器，左上角 \\(=2\\)，整張輸出是 3×3。</p>"
     },
     {
      "at": "c2:3",
      "label": "垂直邊緣偵測器",
      "html": "<p>濾波器每列是 \\(1,0,-1\\)，等於「左邊減右邊」。框住的區域左亮右暗時，相減的差很大 → 輸出大值；整片一樣亮（或一樣暗）時左右抵消 → 輸出 0。</p>\n<p>講義例：輸入每列 \\(1,1,0,0,0\\)（左亮右暗）→ 輸出每列 \\(3,3,0\\)，大值 3 出現在亮暗交界。</p>"
     },
     {
      "at": "c2:4",
      "label": "彩色圖（RGB）的卷積",
      "html": "<ul>\n<li><strong>濾波器的深度要等於輸入的通道數</strong>：RGB 有 3 個通道，3×3 的濾波器其實是 3×3×3。</li>\n<li>三個通道各自相乘後<strong>全部加總</strong>（再加 bias），每個位置只輸出一個數 → 一個濾波器得到一張特徵圖。</li>\n<li><strong>輸出深度 = 濾波器的數量</strong>。例：\\(5\\times5\\times3\\) 卷 2 個 \\(3\\times3\\times3\\) → \\(3\\times3\\times2\\)。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "卷積層的超參數：Filter、Padding、Stride（2.4～2.6）",
    "items": [
     {
      "at": "c2:5",
      "label": "卷積層的超參數",
      "html": "<p>四個：<strong>Kernel size</strong>（濾波器大小 k×k）、<strong>Depth</strong>（濾波器數量）、<strong>Padding</strong>（外圍補幾圈 0）、<strong>Stride</strong>（每次移動幾格）。</p>\n<p>小濾波器（1×1、3×3）抓邊緣、紋理等細節，參數少；大濾波器（5×5、7×7）看大範圍，但參數多。現代 CNN 多用多層 3×3：兩層 3×3 看到的範圍等於一個 5×5，權重 18 比 25 少，還多一次非線性。<span class=\"tag add\">補充</span></p>"
     },
     {
      "at": "c2:6",
      "label": "Padding",
      "html": "<p>Padding 是在輸入圖片外圍補 0。主要有兩個目的：</p>\n<ol>\n<li><strong>避免 feature map 越卷越小</strong>：沒有 padding 時每做一次卷積尺寸就縮小（5×5 卷 3×3 → 3×3），模型較深時特徵圖會很快縮到太小；補一圈 0（5×5 → 7×7）後輸出可維持 5×5。</li>\n<li><strong>增加邊緣／角落像素的貢獻</strong>：沒有 padding 時，角落像素只會被卷積到一次，中間像素卻會被卷積很多次，邊緣資訊容易被忽略（padding 1 後角落變成 4 次）。</li>\n</ol>\n<p>常用組合：3×3 濾波器、stride 1 配 padding 1，輸出和輸入同尺寸（same padding）。</p>"
     },
     {
      "at": "c2:7",
      "label": "Stride",
      "html": "<p>Stride 是濾波器每次移動的格數。stride 越大，輸出 feature map 越小。</p>\n<p>好處：<strong>增加訓練效率、減少重複使用相同的像素、控制 feature map 的大小</strong>。例：5×5 卷 3×3，stride 1 → 3×3；stride 2 → 2×2。</p>"
     },
     {
      "at": "c2:8",
      "label": "輸出尺寸計算",
      "html": "$$m=\\left\\lfloor\\frac{n+2p-f}{s}\\right\\rfloor+1=\\frac{28+2\\times0-5}{1}+1=24$$\n<p>\\(n\\)：輸入邊長 28；\\(f\\)：filter 邊長 5；\\(p\\)：padding 0；\\(s\\)：stride 1。<strong>答：24×24</strong>（用 \\(N_f\\) 個 filter 時深度為 \\(N_f\\)）。計算題要寫出公式與代入過程。</p>\n<p>同一個公式也適用池化：2×2、stride 2 → 邊長減半。除不盡時 ⌊ ⌋ 無條件捨去，例如 \\(n=6,f=3,s=2\\) → \\(\\lfloor3/2\\rfloor+1=2\\)。</p>"
     }
    ]
   },
   {
    "title": "ReLU 與 Pooling（2.7～2.8）",
    "items": [
     {
      "at": "c2:9",
      "label": "ReLU",
      "html": "<p>\\(\\text{ReLU}(x)=\\max(0,x)\\)：負數變 0、正數保留。講義給三個理由：</p>\n<ol>\n<li><strong>正負意義分開處理</strong>：正值代表「由暗到亮」、負值代表「由亮到暗」時，下一層只能乘同一個權重，一個加分另一個就自動扣分，兩種特徵綁在一起（天使與魔鬼的比喻）。</li>\n<li><strong>引入非線性</strong>：沒有激活函數時，疊再多層線性運算都能合併成一層。</li>\n<li><strong>計算快、訓練穩定</strong>：只要比大小；正值區梯度永遠是 1，不像 Sigmoid／Tanh 會梯度消失。</li>\n</ol>\n<p>缺點：為了學負向特徵可能要多佔用 filter；<strong>Dying ReLU</strong>：神經元一直輸出負值時梯度為 0，永久停止學習（可改用 LeakyReLU、ELU）。</p>"
     },
     {
      "at": "c2:10",
      "label": "Pooling",
      "html": "<p>Pooling（池化，又稱 Subsampling／Downsampling）的主要目的是<strong>縮小 feature map 的尺寸，在不丟失重要資訊的情況下減少後續的計算量與訓練參數</strong>。</p>\n<ul>\n<li>原因：<strong>相鄰像素通常具有相似的特徵</strong>，用一個值（Max Pooling 取最大值）代表一個區塊即可。</li>\n<li>讓模型<strong>不受微小特徵差異（例如些微位移）影響</strong>。</li>\n<li>常用設定：2×2、stride 2、no padding → 高寬減半、<strong>深度不變</strong>；Pooling <strong>沒有可訓練參數</strong>。</li>\n<li>注意：stride 太大會丟失重要資訊。</li>\n</ul>\n<p>種類：Max Pooling（取最大）、Average Pooling（取平均）、Sum Pooling（加總）。</p>"
     }
    ]
   },
   {
    "title": "全連接層、參數量與超參數（2.9～2.11）",
    "items": [
     {
      "at": "c2:11",
      "label": "全連接層（Fully Connected Layer）",
      "html": "<p>全連接層（Fully Connected Layer，又稱 Dense Layer）負責<strong>整合前面卷積層與池化層抽出的特徵，並據此完成分類</strong>。</p>\n<ul>\n<li>進入 FC 前先把多維 feature map <strong>展平（Flatten）</strong>成一維向量。</li>\n<li>每個節點都和下一層每個節點相連，把各處偵測到的局部特徵組合起來做整體判斷。</li>\n<li>最後一層節點數 = 類別數，接 <strong>Softmax</strong> 輸出各類別機率。</li>\n<li>FC 通常是參數最多的部分（講義 MNIST 例子約佔 98%）。</li>\n</ul>"
     },
     {
      "at": "c2:12",
      "label": "參數量計算",
      "html": "$$\\text{Conv}=(f\\times f\\times d+1)\\times N_f,\\qquad \\text{FC}=(L+1)\\times N$$\n<p>\\(d\\) 是<strong>輸入深度</strong>，\\(+1\\) 是每個濾波器（節點）的 bias。</p>\n<ul>\n<li>Conv_1：輸入 28×28×1，32 個 3×3：\\((9\\times1+1)\\times32=320\\) → 26×26×32</li>\n<li>Conv_2：輸入深度已是 32：\\((9\\times32+1)\\times64=18{,}496\\) → 24×24×64</li>\n<li>Max Pool → 12×12×64，Flatten → 9,216（都是 0 參數）</li>\n<li>FC 128：\\((9{,}216+1)\\times128=1{,}179{,}776\\)；輸出 10 類：\\((128+1)\\times10=1{,}290\\)</li>\n<li>合計 <strong>1,199,882</strong>，FC 那層約佔 98%。</li>\n</ul>\n<p>易錯：RGB 輸入、16 個 3×3 → \\((3\\times3\\times3+1)\\times16=448\\)。講義那頁寫成 160 是把深度當成 1 <span class=\"tag chk\">待確認</span>。</p>"
     },
     {
      "at": "c2:13",
      "label": "參數（Parameter）與超參數（Hyperparameter）",
      "html": "<ul>\n<li><strong>參數</strong>：<strong>訓練過程中由模型自己學習</strong>的變數，又稱可學習參數或權重，例如 filter 的權重與 bias、FC 的權重與 bias，由梯度下降與反向傳播更新。</li>\n<li><strong>超參數</strong>：<strong>訓練前由人手動設定</strong>、模型不會自己學的值，例如 filter 大小與數量、stride、padding、節點數、激活函數、learning rate、batch size、epoch 數、Dropout rate；通常看 Validation 結果調整。</li>\n<li>沒有可訓練參數的層：ReLU、Max Pooling、Flatten。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "為什麼 CNN 有用（2.12）",
    "items": [
     {
      "at": "c2:14",
      "label": "CNN 比全連接網路有效的原因",
      "html": "<p>作答時寫出這些名詞：</p>\n<ol>\n<li><strong>參數共享（Parameter Sharing）</strong>：同一個 filter 的參數在整張圖不同位置重複使用，偵測相同的特徵，參數量和輸入圖片大小無關。</li>\n<li><strong>連接稀疏性（Sparsity of Connections）</strong>：輸出的每個值只由輸入的一小塊像素（例如 3×3）計算，大幅減少參數量。例：28×28 的圖用全連接產生 26×26×32 = 21,632 個節點，要 \\(784\\times21{,}632=16{,}959{,}488\\) 個參數；CNN 的 Conv_1 只要 320 個。參數少 → 訓練快、較不易 overfitting。</li>\n<li><strong>不變性（Invariance）</strong>：特徵不論出現在圖片哪個位置都偵測得到；搭配 Pooling，對微小位移也不敏感。</li>\n</ol>\n<p>另可補充：CNN 直接在二維上卷積，<strong>保留空間結構</strong>（全連接要先攤平，上下左右相鄰的關係就消失了），並能<strong>自動學習特徵</strong>，層數越深組合出越複雜的特徵。</p>"
     }
    ]
   }
  ]
 },
 {
  "id": "c3",
  "ch": "c3",
  "title": "C3 模型品質與改進",
  "groups": [
   {
    "title": "資料集與評估（2.1～2.4）",
    "items": [
     {
      "at": "c3:1",
      "label": "Training／Validation／Test",
      "html": "<ul>\n<li><strong>Training set</strong>：讓模型<strong>學習參數</strong>，每個 epoch 用梯度下降與反向傳播更新權重。</li>\n<li><strong>Validation set</strong>：<strong>訓練期間</strong>公正評估模型（每個 epoch 結束算 loss 與 accuracy），用來<strong>調整超參數、挑選最佳模型、判斷 overfitting 或 Early Stopping</strong>，不用來更新權重。</li>\n<li><strong>Test set</strong>：模型<strong>從未看過</strong>的資料，<strong>訓練全部結束後只用一次</strong>，評估最終的泛化能力。</li>\n</ul>\n<p>注意：Test 不能拿來調模型，否則評估結果會過度樂觀。</p>"
     },
     {
      "at": "c3:2",
      "label": "Loss、Accuracy 曲線與混淆矩陣（Confusion Matrix）",
      "html": "<ul>\n<li>Training loss 一直下降、Validation loss 卻開始上升（或兩者 Accuracy 差距拉大）→ 開始 <strong>overfitting</strong>。</li>\n<li>Accuracy 只有一個數字，看不出模型在<strong>每個類別</strong>的對錯。混淆矩陣列出「真實 vs 預測」的每一格，能找出表現較差的類別、容易把誰誤認成誰（例：MNIST 的 4 常被判成 9）。</li>\n</ul>"
     },
     {
      "at": "c3:3",
      "label": "Precision、Recall、Accuracy",
      "html": "<ul>\n<li><strong>Accuracy</strong>：所有樣本中預測正確的比例 \\(\\dfrac{TP+TN}{TP+TN+FP+FN}\\)。</li>\n<li><strong>Precision</strong>：<strong>被預測為正的</strong>樣本中真的是正的比例（預測為陽性的可信度）\\(\\dfrac{TP}{TP+FP}\\)。</li>\n<li><strong>Recall</strong>（＝ Sensitivity、TPR）：<strong>實際為正的</strong>樣本中被正確找出的比例（有沒有漏抓）\\(\\dfrac{TP}{TP+FN}\\)。</li>\n</ul>\n<p>類別不平衡時 Accuracy 可能很高但模型不好，要搭配 Precision 與 Recall；兩者通常有取捨，例如疾病篩檢重視 Recall，避免漏掉病人。F1 是兩者的調和平均。</p>\n<p>講義 COVID 例：TP=90、FN=10、FP=5、TN=40 → Accuracy ≈ 0.897、Precision ≈ 0.947、Recall = 0.9。</p>"
     }
    ]
   },
   {
    "title": "Overfitting 與正則化（2.5～2.10）",
    "items": [
     {
      "at": "c3:4",
      "label": "過度擬合（Overfitting）",
      "html": "<p>模型在訓練資料表現很好，在新資料表現很差：把訓練資料的雜訊和細節也背起來，<strong>泛化能力差</strong>。</p>\n<p>改善：增加資料（含資料擴增）、降低模型複雜度、正則化（L1／L2、Dropout、Early Stopping、Batch Normalization）。</p>"
     },
     {
      "at": "c3:5",
      "label": "L1 與 L2 正則化",
      "html": "<p>兩者都在 Loss 加上 Penalty，迫使模型使用較小的權重，強度由 \\(\\lambda\\) 控制：</p>\n$$L_{L1}=L+\\lambda\\sum_j|\\theta_j|,\\qquad L_{L2}=L+\\lambda\\sum_j\\theta_j^2$$\n<div class=\"table-wrap\"><table>\n<thead><tr><th></th><th>L1（Lasso）</th><th>L2（Ridge）</th></tr></thead>\n<tbody>\n<tr><td>Penalty</td><td>權重<strong>絕對值</strong>總和</td><td>權重<strong>平方</strong>總和</td></tr>\n<tr><td>效果</td><td>優先把不重要特徵的權重<strong>降為 0</strong></td><td>把<strong>所有權重一起變小</strong>，大權重罰更重</td></tr>\n<tr><td>結果</td><td>稀疏，有<strong>特徵選取</strong>效果</td><td>權重小而平滑，避免少數節點主導</td></tr>\n</tbody>\n</table></div>\n<p>共同注意：\\(\\lambda\\) 太大，權重被壓得過小，會 Underfitting。</p>"
     },
     {
      "at": "c3:6",
      "label": "Dropout",
      "html": "<p>Dropout 是<strong>正則化（Regularization）技術</strong>，用來防止 Overfitting。</p>\n<ol>\n<li>訓練時，每個 mini-batch <strong>隨機關閉</strong>某一層的部分節點（比例由 Dropout Rate 控制，例如 0.5）。</li>\n<li>前向與反向傳遞只經過開著的節點，也只更新它們的權重。</li>\n<li>下一個 mini-batch 恢復所有節點，再重新隨機關閉一批。</li>\n<li><strong>測試（推論）時不關閉，使用所有節點</strong>。</li>\n</ol>\n<p>為什麼有效：每次訓練的都是不同的子網路，模型<strong>不能依賴少數特定節點</strong>，被迫學到更可靠、更具代表性的特徵，泛化較好（效果類似許多子網路的集成 <span class=\"tag add\">補充</span>）。代價：收斂較慢，要搭配更多 epoch。</p>"
     },
     {
      "at": "c3:7",
      "label": "Early Stopping",
      "html": "<p>每個 epoch 看 Validation loss，<strong>連續 P 個 epoch（patience）沒有進步就停止訓練</strong>，並<strong>取回 Validation loss 最低那一輪的權重</strong>。好處是不用事先決定 epoch 數、在 overfitting 之前停下。</p>\n<p>例：P = 3，Val loss 0.50 / 0.40 / 0.35 / 0.36 / 0.37 / 0.38 → 第 6 個 epoch 停，取回第 3 個 epoch 的權重。</p>"
     },
     {
      "at": "c3:8",
      "label": "Batch Normalization（BN）",
      "html": "<ul>\n<li>對每個 mini-batch <strong>計算 mean 與標準差並標準化</strong>，再用可學習的 \\(\\gamma\\)（縮放）、\\(\\beta\\)（平移）做 \\(y=\\gamma\\hat{x}+\\beta\\)。CNN 中每個 channel 各有一組。</li>\n<li>通常放在 Conv 與 Activation 之間，<strong>穩定每一層輸入的分布</strong>（緩解 Internal Covariate Shift）。</li>\n<li>效果：訓練更穩定、<strong>可以用較大的學習率、收斂較快</strong>，也有輕微的正則化效果。</li>\n<li>訓練時用當下 batch 的統計量；<strong>推論時改用訓練中以移動平均累積的 running mean／running STD</strong>（推論時 batch 可能只有一張）。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "資料擴增（2.11）",
    "items": [
     {
      "at": "c3:9",
      "label": "資料擴增（Data Augmentation）",
      "html": "<p>Overfitting 的原因之一是訓練資料不夠；資料擴增對訓練資料做變換，<strong>增加資料的多樣性</strong>，等於讓模型每次看到不同版本的圖片，減少 overfitting、提升泛化。</p>\n<p>基本方法：翻轉、亮度與對比、旋轉、縮放、裁切、扭曲。<strong>一般只對訓練資料做</strong>，通常在 Data Loader 搬資料時即時產生。</p>"
     },
     {
      "at": "c3:10",
      "label": "遮擋類：CutOut、Random Erasing、Hide-and-Seek、GridMask",
      "html": "<p>共同目的：遮住一部分，<strong>強迫模型用多個特徵判斷</strong>，不只盯著最明顯的地方。</p>\n<ul>\n<li><strong>CutOut</strong>：遮住一塊<strong>固定大小的正方形</strong>，填 0（黑色）。</li>\n<li><strong>Random Erasing</strong>：矩形的<strong>長寬比與面積都隨機</strong>，填<strong>隨機數值</strong>，比 CutOut 更多變化。</li>\n<li><strong>Hide-and-Seek</strong>：切成 S×S 網格，<strong>每格依機率獨立遮掉</strong>；主要區域被遮時會學次要區域，但可能一次遮太多或太少。</li>\n<li><strong>GridMask</strong>：<strong>規律、等間距</strong>的網格遮擋，平衡「過度保留」與「過度刪除」。</li>\n</ul>"
     },
     {
      "at": "c3:11",
      "label": "混合與組合類：MixUp、CutMix、Copy-Paste、Mosaic",
      "html": "<ul>\n<li><strong>MixUp</strong>：兩張圖<strong>整張線性混合</strong>，標籤也按比例混合。例：\\(\\lambda=0.7\\) → 標籤「狗 0.7、貓 0.3」。</li>\n<li><strong>CutMix</strong>：A 圖<strong>挖一塊換成 B 圖</strong>，標籤<strong>依面積比例</strong>混合。例：32×32 貼 16×16 → B 佔 0.25。</li>\n<li><strong>Copy-Paste</strong>：把物件<strong>連同 mask 貼到另一張圖</strong>，可同步更新 mask、bbox。</li>\n<li><strong>Mosaic</strong>：<strong>多張（常見 4 張）拼成一張</strong>，一張圖就看到不同背景、尺度、位置。</li>\n</ul>"
     },
     {
      "at": "c3:12",
      "label": "Adaptive Data Augmentation 與 Targeted Data Generation",
      "html": "<ul>\n<li><strong>Adaptive Data Augmentation</strong>：依訓練中的 <strong>loss／梯度回饋，動態調整擴增的種類與強度</strong>，讓樣本維持適當的挑戰性（擴增參數往讓 loss 變大的方向更新）。</li>\n<li><strong>Targeted Data Generation（TDG）</strong>：不是平均增加資料，而是<strong>找出模型容易誤判的子群（subgroup）</strong>，針對它生成標註正確的合成樣本，把資料花在模型的弱點上。</li>\n</ul>"
     }
    ]
   }
  ]
 },
 {
  "id": "c4",
  "ch": "c4",
  "title": "C4 進階影像視覺模型（Part 1）",
  "groups": [
   {
    "title": "先複習：一層卷積的三個數字（2.3）",
    "items": [
     {
      "at": "c4:1",
      "label": "參數量與運算量",
      "html": "<ul>\n<li><strong>參數量</strong> \\(=(k\\times k\\times C_{in}+1)\\times C_{out}\\)：只和 filter 大小、輸入／輸出通道數有關，<strong>和圖片大小無關</strong>（同一個 filter 掃全圖，權重共享）。</li>\n<li><strong>乘法次數</strong> \\(=H\\times W\\times C_{out}\\times(k\\times k\\times C_{in})\\)：輸出有幾個數字 × 每個數字要乘幾次，<strong>圖越大越多</strong>。</li>\n</ul>\n<p>例（講義）：12×12×3 輸入、128 個 5×5、p0 s1 → 輸出 8×8×128；參數 \\(76\\times128=9{,}728\\)；乘法 \\(8\\times8\\times128\\times75=614{,}400\\)。</p>\n<p>所以「參數少」和「運算少」是兩回事，這是 SqueezeNet 和 MobileNet 差別的關鍵。</p>"
     }
    ]
   },
   {
    "title": "VGGNet（2.3）",
    "items": [
     {
      "at": "c4:2",
      "label": "VGGNet 的設計與優缺點",
      "html": "<ul>\n<li>2014 年提出，ImageNet top-5 準確率 92.7%。VGG16 = 13 層 Conv ＋ 3 層 FC；VGG19 = 16 層 Conv ＋ 3 層 FC。</li>\n<li>「典型 CNN」的範本：<strong>全部用 3×3 卷積</strong>，多層 Conv 後接 Pooling，filter 數量逐漸增加，最後接 FC。</li>\n<li>優點：<strong>「深度」網路設計、規範的結構</strong>、準確率高。</li>\n<li>缺點：<strong>計算需求大、參數冗餘</strong>，VGG16 約 1.38 億參數，訓練很慢；參數大多在 FC 層（約 89%）。</li>\n</ul>"
     },
     {
      "at": "c4:3",
      "label": "VGG 全部用 3×3 的原因",
      "html": "<p>兩層 3×3 疊起來看到的範圍（感受野）等於一個 5×5，三層等於 7×7，但權重比較少（18 對 25、27 對 49），而且每層後面都有 ReLU，<strong>多了幾次非線性</strong>。<span class=\"tag add\">補充</span></p>"
     }
    ]
   },
   {
    "title": "梯度消失與梯度爆炸、ResNet（2.5）",
    "items": [
     {
      "at": "c4:4",
      "label": "梯度消失與梯度爆炸",
      "html": "<p>反向傳播時，N 層網路要把 N 個導數<strong>連乘</strong>（連鎖律）。</p>\n<ul>\n<li>每層導數小於 1 → 越往前乘越小，<strong>指數消失</strong>，前面的層幾乎不更新 → 梯度消失。例：每層 0.5，20 層 → \\(0.5^{20}\\approx10^{-6}\\)。</li>\n<li>每層導數大於 1 → <strong>指數成長</strong>，更新一次就跳太遠 → 梯度爆炸。例：每層 1.5，20 層 → 約 3,325。</li>\n</ul>\n<p>結果：網路很深時反而更難訓練。改善方法：ReLU（C2）、Batch Normalization（C3）、ResNet 的捷徑連接、DenseNet 的串接。</p>"
     },
     {
      "at": "c4:5",
      "label": "ResNet 與殘差連接",
      "html": "<p><strong>問題</strong>：一般 CNN 很深時效能反而下降（例如 50 層比 20 層還差），而且<strong>不是過擬合</strong>，是難以優化，原因之一是梯度消失／爆炸。</p>\n<p><strong>做法</strong>：殘差連接（Residual／Skip Connection）把前面的輸入直接加到後面的輸出：</p>\n$$H(x)=F(x)+x$$\n<ul>\n<li>堆疊的層只需學<strong>殘差</strong> \\(F(x)=H(x)-x\\)（小修正量），比從頭學整個 \\(H(x)\\) 容易。多出來的層若用不到，只要 \\(F(x)\\to0\\) 就等於「什麼都不做」（恆等映射）。</li>\n<li>反向傳播時梯度可以經由捷徑<strong>直接傳回前面的層</strong>（導數多了一個「+1」），緩解梯度消失。</li>\n<li>講義比喻：傳統網路要學生每次從空白紙重畫；ResNet 先給原圖，只改需要改的地方。</li>\n</ul>"
     },
     {
      "at": "c4:6",
      "label": "ResNet 的優缺點",
      "html": "<ul>\n<li>優點：能有效訓練<strong>深層網路</strong>（18～152 層，甚至 1202 層）、降低優化難度加快收斂、ImageNet 表現優於前代、廣泛當作 backbone（C5 最常用 ResNet-50）。使用 GAP，只需少量甚至不需要 FC 層。</li>\n<li>缺點：運算量與記憶體需求大，不利部署在行動裝置；許多 block 學到的殘差很小，<strong>參數使用效率不佳</strong>（DenseNet 的動機）。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "Inception Net（2.4）",
    "items": [
     {
      "at": "c4:7",
      "label": "Inception 的核心想法",
      "html": "<p>設計 CNN 時 filter size 最難選：小 kernel 擅長捕捉細節，大 kernel 擅長捕捉大範圍特徵。Inception 的想法是<strong>不必選</strong>：</p>\n<ul>\n<li>Inception module 在同一層<strong>並行使用 1×1、3×3、5×5 卷積與 max pooling</strong>，再把結果在通道方向<strong>串接（concatenate）</strong>，讓網路自己學要用哪個。</li>\n<li>不同 kernel 大小對應不同感受野，可同時擷取<strong>多尺度特徵</strong>。</li>\n<li>所有分支都用 same padding、stride 1，輸出寬高相同才能串接。</li>\n<li>Inception V1 又叫 GoogLeNet（Google，2014 年 ILSVRC 分類冠軍）。</li>\n</ul>"
     },
     {
      "at": "c4:8",
      "label": "1×1 卷積（瓶頸層 Bottleneck Layer）",
      "html": "<p>1×1 卷積不看鄰居（寬高不變），只在每個像素位置把所有通道加權相加，用來<strong>增減通道數</strong>。在昂貴的 3×3、5×5 卷積前先用它把通道壓少，就是瓶頸層，可以<strong>大幅降低運算量</strong>，只要壓縮比例合理，對準確率影響不大。</p>\n<p>講義例：28×28×192 → 5×5 → 32 通道，直接做約 <strong>120M</strong> 次乘法；先 1×1 壓到 16（2.4M）再 5×5（10M），合計約 <strong>12.4M，約 1/10</strong>。</p>"
     },
     {
      "at": "c4:9",
      "label": "輔助分類器與 Inception 的優缺點",
      "html": "<ul>\n<li>輔助分類器接在網路中間，Total Loss = Main Loss ＋ \\(w_1\\)×Aux Loss1 ＋ \\(w_2\\)×Aux Loss2，讓深層網路<strong>仍可訓練</strong>；<strong>只在訓練時使用，推論時移除</strong>。</li>\n<li>優點：多尺度特徵擷取、用 1×1 卷積高效利用運算資源、深層仍可訓練。</li>\n<li>缺點：結構複雜、難移植到資源有限的設備、參數與架構選擇複雜。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "Global Average Pooling（2.6）",
    "items": [
     {
      "at": "c4:10",
      "label": "Global Average Pooling（GAP）",
      "html": "<p>GAP 把<strong>每張特徵圖取平均成一個數</strong>：7×7×512 → 1×1×512，用來取代 Flatten ＋ 大型 FC 層。</p>\n<ul>\n<li><strong>大幅減少參數</strong>：GAP 本身沒有可學習參數。例：7×7×512 展平 25,088 維接 FC 4096 要 102,764,544 個參數；GAP 後 512 維接 1000 類只要 513,000。</li>\n<li><strong>降低過擬合、增強泛化</strong>：參數少、複雜度低，等於一種 Regularization。</li>\n<li><strong>對輸入尺寸更靈活</strong>：FC 要求固定長度，GAP 不論特徵圖 7×7 還是 10×10 都輸出同樣長度。</li>\n</ul>\n<p>缺點：<strong>丟失空間位置資訊</strong>（只知道特徵強度、不知道在哪），不適合直接用在物件偵測、語意分割；小物體的訊號會被大片背景稀釋（有時改用 Global Max Pooling）。</p>"
     }
    ]
   },
   {
    "title": "訓練效率 vs 計算成本（2.7）",
    "items": [
     {
      "at": "c4:11",
      "label": "計算成本與訓練效率",
      "html": "<ul>\n<li><strong>計算成本</strong>：完成一次運算（例如一個 batch 的前向＋反向傳播）要花多少資源。</li>\n<li><strong>訓練效率</strong>：需要多少訓練步數（或資料量）才能達到目標性能。</li>\n<li>總訓練成本 ≈ 計算成本 × 所需步數。</li>\n</ul>\n<p>直覺：通道數（寬度）或解析度加倍 → 運算量 ×4；層數（深度）加倍 → ×2。</p>"
     }
    ]
   },
   {
    "title": "SqueezeNet（2.8）",
    "items": [
     {
      "at": "c4:12",
      "label": "SqueezeNet 的目標與設計策略",
      "html": "<p>目標：<strong>維持 AlexNet 等級的準確率，大幅縮小模型</strong>（參數約 AlexNet 的 1/50，壓縮後可小於 0.5MB）。小模型方便分散式訓練、遠端更新（例如自駕車）、部署在嵌入式系統。</p>\n<ol>\n<li>把部分 3×3 filter <strong>換成 1×1</strong>，每個 filter 參數變 1/9。</li>\n<li><strong>減少輸入到 3×3 filter 的通道數</strong>。</li>\n<li><strong>延後下採樣</strong>，讓卷積在較大的特徵圖上運算，維持準確率。</li>\n</ol>\n<p>策略一、二減少參數（靠 Fire module 實現），策略三在參數有限下保持準確率。另外移除龐大的 FC，最後用 1×1 卷積輸出 1000 通道再接 GAP。</p>"
     },
     {
      "at": "c4:13",
      "label": "Fire module 與 SqueezeNet 的缺點",
      "html": "<p>Fire module = <strong>squeeze layer（只有 1×1）→ expand layer（1×1 與 3×3 並行）</strong>。先用少量 1×1 把通道壓少，再展開；squeeze 的 filter 數約為 expand 的 1/8。</p>\n<p>例（fire2）：輸入 96 通道、\\(s_{1\\times1}=16\\)、\\(e_{1\\times1}=e_{3\\times3}=64\\) → 11,920 個參數；直接用 3×3 做 96 → 128 要 110,720，約多 9 倍。</p>\n<p>缺點：準確率只有 AlexNet 水準，低於 VGG、ResNet；<strong>參數少不等於運算少</strong>，延後下採樣使運算量甚至高於 AlexNet。</p>"
     }
    ]
   },
   {
    "title": "MobileNet（2.9）",
    "items": [
     {
      "at": "c4:14",
      "label": "Depthwise Separable Convolution",
      "html": "<p>MobileNet（2017）目標是讓 CNN 能在<strong>手機、嵌入式裝置上即時執行</strong>。它把一般卷積拆成兩步：</p>\n<ol>\n<li><strong>Depthwise</strong>：每個通道各自用一個 k×k×1 的 kernel，只看空間、不混通道。</li>\n<li><strong>Pointwise</strong>：用 1×1 卷積把通道做線性組合，只混通道。</li>\n</ol>\n<p>一般卷積一個 filter 同時做「看空間」和「混通道」兩件事，拆開後乘法少很多。講義例：12×12×3、5×5、輸出 128 通道，一般卷積 614,400 次 vs 4,800 ＋ 24,576 = 29,376 次，約 <strong>1/20</strong>；3×3 kernel 時約省 8～9 倍。</p>"
     },
     {
      "at": "c4:15",
      "label": "MobileNet 的超參數 α、ρ",
      "html": "<ul>\n<li><strong>Width Multiplier α</strong>（0～1）：每層通道數都乘 α；運算量與參數量約變 <strong>α² 倍</strong>（輸入、輸出通道各乘一次）。</li>\n<li><strong>Resolution Multiplier ρ</strong>：縮小輸入解析度（224、192、160、128）；運算量約變 <strong>ρ² 倍，參數量不變</strong>（參數和圖片大小無關）。</li>\n</ul>\n<p>例：α = 0.5 → 約 0.25 倍；解析度 224 → 160 → 運算量約 0.51 倍。</p>"
     },
     {
      "at": "c4:16",
      "label": "MobileNet 的優缺點",
      "html": "<ul>\n<li>優點：約 420 萬參數（VGG16 的 1/32）、運算量約 VGG16 的 1/27、ImageNet 準確率接近 VGG16、可用 α、ρ 靈活調整。</li>\n<li>缺點：準確率低於 ResNet，α 或解析度太小時下降明顯；運算量減少不一定等比例變快（depthwise 在 GPU 上硬體利用率差）；沒有捷徑連接，難以加深（MobileNetV2 改進）。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "綜合比較",
    "items": [
     {
      "at": "c4:17",
      "label": "各模型要解決的問題",
      "html": "<div class=\"table-wrap\"><table>\n<thead><tr><th>模型</th><th>要解決的問題</th><th>關鍵做法</th></tr></thead>\n<tbody>\n<tr><td>VGGNet</td><td>怎麼把網路加深、提升準確率</td><td>規整地疊多層 3×3 ＋ Pooling</td></tr>\n<tr><td>Inception</td><td>filter 大小難選、運算量大</td><td>多種 filter 並行再串接；1×1 瓶頸層</td></tr>\n<tr><td>ResNet</td><td>太深反而變差、梯度消失</td><td>殘差連接 \\(H(x)=F(x)+x\\)</td></tr>\n<tr><td>GAP</td><td>Flatten ＋ FC 參數太多、易過擬合</td><td>每張特徵圖取平均</td></tr>\n<tr><td>SqueezeNet</td><td>模型太大（參數多）</td><td>Fire module（squeeze ＋ expand）</td></tr>\n<tr><td>MobileNet</td><td>運算太多，手機跑不動</td><td>Depthwise Separable ＋ α、ρ</td></tr>\n<tr><td>DenseNet（C4-2）</td><td>ResNet 參數效率不佳</td><td>Dense Block 通道串接</td></tr>\n</tbody>\n</table></div>"
     }
    ]
   }
  ]
 },
 {
  "id": "c4-2",
  "ch": "c4",
  "title": "C4-2 進階影像視覺模型（Part 2）：DenseNet",
  "groups": [
   {
    "title": "動機：從 ResNet 到 DenseNet（2.1～2.3）",
    "items": [
     {
      "at": "c4-2:1",
      "label": "DenseNet",
      "html": "<p>DenseNet（Densely Connected Convolutional Networks），2016 年提出，獲 CVPR 2017 最佳論文獎。在 ImageNet 上能以<strong>較少的參數量，達到與 ResNet 相近的準確率</strong>。</p>"
     },
     {
      "at": "c4-2:2",
      "label": "ResNet 的限制與 DenseNet 的改進",
      "html": "<p>ResNet 用<strong>逐元素相加</strong> \\(y=F(x)+x\\)，能緩解梯度消失，但有兩個限制：</p>\n<ol>\n<li>以相加合併特徵，<strong>前面層的特徵和新特徵混在一起</strong>，後面的層無法分別取用。</li>\n<li>許多層貢獻很小，卻各自擁有一組參數，<strong>參數使用效率不高</strong>。</li>\n</ol>\n<p>DenseNet 改用<strong>通道串接（concatenation）</strong>，讓每一層都能直接取用前面所有層的特徵圖（論文稱為「集體知識」），<strong>特徵可以重複利用</strong>，每層只需學少量新特徵。</p>\n<p>例：\\(x_0=(1,2)\\)、新特徵 \\(F=(3,-1)\\)。相加 → \\((4,1)\\)，分不出原本是什麼；串接 → \\((1,2,3,-1)\\)，全部保留。<span class=\"tag add\">補充</span></p>"
     }
    ]
   },
   {
    "title": "Dense Block 與組成層（2.4～2.5）",
    "items": [
     {
      "at": "c4-2:3",
      "label": "Dense Block 與增長率 k",
      "html": "<ul>\n<li>同一個 Dense Block 中，<strong>每一層都接收前面所有層的特徵圖</strong>作為輸入（通道串接）。</li>\n<li>每一層只輸出 \\(k\\) 個新的特徵圖，\\(k\\) 叫<strong>增長率</strong>，所以每層可以很「窄」。</li>\n<li>同一個 Block 內特徵圖<strong>長寬不變</strong>，串接才能進行。</li>\n<li>每層的輸出直接連到後面所有層，梯度也能走捷徑傳回淺層。</li>\n</ul>\n$$C^{(L)}_{in}=k_0+k\\,(L-1),\\qquad C_{\\text{block out}}=k_0+k\\,L$$\n<p>例：\\(k_0=64\\)、\\(k=32\\)、6 層 → 各層輸入 64、96、128、160、192、224，區塊輸出 \\(64+6\\times32=256\\)。</p>"
     },
     {
      "at": "c4-2:4",
      "label": "Dense Block 組成層的順序",
      "html": "<p><strong>BN → ReLU → 3×3 Conv</strong>，輸出 \\(k\\) 個特徵圖。這種「先正規化與激活，再卷積」的順序叫 <strong>pre-activation</strong>，和常見的 Conv → BN → ReLU 不同。</p>"
     }
    ]
   },
   {
    "title": "Bottleneck、過渡層、DenseNet-BC（2.6～2.7）",
    "items": [
     {
      "at": "c4-2:5",
      "label": "DenseNet-B 的 Bottleneck Layer",
      "html": "<p>串接讓輸入通道越來越多，3×3 卷積越來越貴。所以在 3×3 前先加 <strong>BN → ReLU → 1×1 Conv</strong>，把通道壓到 \\(4k\\) 再做 3×3，<strong>降低計算量與參數</strong>（DenseNet-121 從約 10.9M 降到約 8.0M）。加了 bottleneck 的版本叫 <strong>DenseNet-B</strong>。</p>\n<p>和 Inception 的瓶頸層是同一個想法：先用 1×1 壓通道，再做昂貴的卷積。</p>"
     },
     {
      "at": "c4-2:6",
      "label": "過渡層（Transition Layer）與 DenseNet-BC",
      "html": "<ul>\n<li>Dense Block 內長寬不能變，所以<strong>降採樣要在區塊之間</strong>由過渡層負責。</li>\n<li>組成：<strong>BN → 1×1 Conv → 2×2 Average Pooling</strong>。</li>\n<li>Average Pooling：<strong>長寬減半</strong>；1×1 Conv：用<strong>壓縮因子 θ</strong>（0 &lt; θ ≤ 1，論文用 0.5）<strong>減少通道數</strong>，避免通道無限增長。</li>\n<li>例：56×56×256 → 過渡層（θ = 0.5）→ 28×28×128。</li>\n<li>同時使用 bottleneck（B）和壓縮（C）的版本叫 <strong>DenseNet-BC</strong>。</li>\n</ul>"
     }
    ]
   },
   {
    "title": "效能與優缺點（2.8～2.9）",
    "items": [
     {
      "at": "c4-2:7",
      "label": "DenseNet 省參數的原因",
      "html": "<ul>\n<li><strong>特徵重用</strong>：每層都能直接用前面所有層的特徵，不必重複學相似的特徵，因此每層可以很窄。</li>\n<li><strong>增長率 k 限制每層輸出</strong>：ResNet 為了相加，輸出通道必須和輸入相同，各層較寬；DenseNet 每層只新增 \\(k\\)（ImageNet 上 \\(k=32\\)）個特徵圖。例：輸入 256 通道的一層 3×3，ResNet 輸出 256 要 589,824 個權重，DenseNet 輸出 32 只要 73,728，約 1/8。</li>\n<li>DenseNet-BC 再用 bottleneck 和過渡層壓縮通道。</li>\n</ul>\n<p>結果：在相近的錯誤率下，DenseNet 需要的參數量與計算量都比 ResNet 少（DenseNet-121 約 8.0M，ResNet-50 約 25.6M）。</p>"
     },
     {
      "at": "c4-2:8",
      "label": "DenseNet 的優缺點",
      "html": "<ul>\n<li>優點：<strong>緩解梯度消失、促進特徵重用、參數量較少</strong>。</li>\n<li>缺點：<strong>記憶體需求高</strong>（要保存同一區塊內所有先前層的輸出）；<strong>實際執行速度不一定較快</strong>（FLOPs 較少，但大量串接與記憶體存取會拖慢訓練與推論）。</li>\n</ul>"
     },
     {
      "at": "c4-2:9",
      "label": "ResNet 與 DenseNet 的比較",
      "html": "<div class=\"table-wrap\"><table>\n<thead><tr><th></th><th>ResNet</th><th>DenseNet</th></tr></thead>\n<tbody>\n<tr><td>合併方式</td><td>逐元素<strong>相加</strong> \\(F(x)+x\\)</td><td>通道<strong>串接</strong> \\([x_0,x_1,\\dots]\\)</td></tr>\n<tr><td>形狀要求</td><td>輸入輸出形狀完全相同</td><td>只要長寬相同，通道可不同</td></tr>\n<tr><td>連接</td><td>每個 block 一條捷徑</td><td>每層連到後面所有層（L 層有 \\(L(L+1)/2\\) 條）</td></tr>\n<tr><td>每層寬度</td><td>寬（要承載全部資訊）</td><td>窄（只新增 k 個）</td></tr>\n<tr><td>共同點</td><td colspan=\"2\">梯度都能走捷徑傳回淺層，緩解梯度消失</td></tr>\n</tbody>\n</table></div>"
     }
    ]
   }
  ]
 },
 {
  "id": "c5",
  "ch": "c5",
  "title": "C5 遷移學習與微調",
  "groups": [
   {
    "title": "遷移學習與預訓練模型（2.1～2.2）",
    "items": [
     {
      "at": "c5:1",
      "label": "遷移學習（Transfer Learning）",
      "html": "<p>從頭訓練 CNN 需要<strong>大量標註資料、強大運算資源、足夠訓練時間</strong>，多數實際任務只有幾百到幾千張影像，很難滿足。</p>\n<p>遷移學習借用在大型資料集（例如 ImageNet，約 120 萬張、1000 類）上訓練好的<strong>預訓練模型（Pretrained Model）</strong>。它的卷積層學到許多<strong>通用特徵</strong>（淺層的邊緣、色塊、紋理），也適用於新任務，所以能<strong>以較少的資料和較短的訓練時間</strong>取得好表現。兩種用法：特徵提取、微調。</p>"
     }
    ]
   },
   {
    "title": "特徵提取與微調（2.3～2.5）",
    "items": [
     {
      "at": "c5:2",
      "label": "特徵提取（Feature Extraction）",
      "html": "<p>把預訓練網路分成<strong>卷積基底</strong>（擷取特徵）和<strong>分類層</strong>（對應原資料集的類別）：</p>\n<ol>\n<li><strong>凍結（freeze）卷積基底</strong>，訓練時權重不更新。</li>\n<li>移除原本的分類層，<strong>換成新的分類層</strong>，輸出數量 = 新資料集的類別數。</li>\n<li>在新資料上訓練，<strong>只有新分類層的權重會更新</strong>。</li>\n</ol>\n<p>優點：訓練快、需要的資料少、不會破壞預訓練權重。</p>"
     },
     {
      "at": "c5:3",
      "label": "微調（Fine-tuning）",
      "html": "<p>微調是在特徵提取之後，再<strong>解凍部分或全部預訓練層（通常是較深的層）</strong>，以<strong>很小的學習率</strong>再訓練幾個 epoch，讓特徵更貼近新資料，準確率通常更高。</p>\n<p>CNN 的<strong>淺層學到通用特徵</strong>（邊緣、紋理），換任務也用得上；<strong>深層學到與原資料集相關的細節</strong>，才需要針對新資料調整。</p>"
     },
     {
      "at": "c5:4",
      "label": "先凍結再解凍的原因",
      "html": "<p>因為新分類層是<strong>隨機初始化</strong>的，一開始幾乎亂猜，Loss 很大、<strong>梯度也很大</strong>；若整個模型一起訓練，大梯度會流進預訓練層，<strong>把學好的特徵破壞掉</strong>。</p>\n<ol>\n<li><strong>先凍結、只訓練新分類層</strong>：讓它先學會用現有特徵分類，Loss 降下來、梯度穩定。</li>\n<li><strong>再解凍後面幾層、用很小的學習率</strong>（比初始訓練小一到兩個數量級）：輕輕調整深層。</li>\n</ol>\n<p>其他注意：小資料集時讓 <strong>BN 沿用預訓練的統計量</strong>（running mean／std），避免小 batch 估得不準打亂特徵。</p>"
     }
    ]
   },
   {
    "title": "CV 常見的微調方式（2.6～2.13）",
    "items": [
     {
      "at": "c5:5",
      "label": "Full Fine-tuning",
      "html": "<p><strong>所有參數都微調</strong>。優點：適應能力最大，<strong>資料夠多時通常效果最好</strong>，domain 差異大時也能調整。缺點：<strong>計算成本與 GPU 記憶體需求高；資料少時容易 overfitting</strong>。實務建議：先訓練新 head，再解凍全部，用很小的學習率。</p>"
     },
     {
      "at": "c5:6",
      "label": "Partial／Selective 與 Last-k Fine-tuning",
      "html": "<p><strong>Partial／Selective</strong>：只更新部分參數，例如依位置只解凍最後幾層，或依類型只更新 BN、bias。優點：成本比 Full 低、較不易 overfitting、保留通用特徵；缺點：要決定調哪些層，domain gap 大時凍太多會限制模型。</p>\n<p><strong>Last-k</strong>：只解凍<strong>最後 k 個 layer／block</strong>。假設越靠近輸入越通用、越靠近輸出越 task-specific。</p>\n<ul>\n<li>新資料<strong>少</strong> → k 小（例如 1～2）；資料<strong>多</strong> → k 大。</li>\n<li>和原資料<strong>相似</strong> → k 小；<strong>差異大</strong> → k 大。</li>\n</ul>"
     },
     {
      "at": "c5:7",
      "label": "PEFT",
      "html": "<p>Parameter-Efficient Fine-tuning：<strong>凍結大部分預訓練模型，只訓練非常少量的參數</strong>，常見方法有 LoRA、Adapter、VPT，主要用於 ViT、CLIP 等大型 Transformer。</p>\n<p>優點：可訓練參數極少、GPU 記憶體較省、<strong>多個任務共用同一個 backbone</strong>，每個任務只存小模組。缺點：適應能力可能受限；Adapter、VPT 會增加推論成本（LoRA 不會）。</p>"
     },
     {
      "at": "c5:8",
      "label": "LoRA",
      "html": "$$h=W_0x+BAx$$\n<ul>\n<li><strong>凍結預訓練權重 \\(W_0\\)</strong>，只訓練兩個<strong>低秩</strong>小矩陣 \\(B\\)（\\(d\\times r\\)）、\\(A\\)（\\(r\\times k\\)），rank \\(r\\) 遠小於 \\(d,k\\)。</li>\n<li>初始化 \\(B=0\\)，所以一開始 \\(BA=0\\)，模型和預訓練模型完全相同。</li>\n<li>例：768×768 的層有 589,824 個參數；\\(r=8\\) 時 LoRA 只要 \\(2\\times768\\times8=12{,}288\\) 個，約 2%。</li>\n<li>訓練完可把 \\(BA\\) <strong>合併回 \\(W_0\\)</strong>（\\(W=W_0+BA\\)），推論只算一次，<strong>不增加計算量</strong>。</li>\n<li>限制：r 太小學不夠、太大失去省參數的優勢；插入哪些層會影響效果。</li>\n</ul>"
     },
     {
      "at": "c5:9",
      "label": "Regularized Fine-tuning 與 L2-SP",
      "html": "<p><strong>Regularized Fine-tuning</strong>：參數可以動，但<strong>不要離預訓練模型太遠</strong>，降低 overfitting、保留預訓練知識；但來源與目標差太多時可能反而有害，成本也不比 Full 低。</p>\n<p><strong>L2-SP</strong>：在 Loss 加上 \\(\\frac{\\alpha}{2}\\lVert w-w^0\\rVert^2\\)，把權重<strong>拉向預訓練值 \\(w^0\\)</strong>；一般 L2 是 \\(\\frac{\\alpha}{2}\\lVert w\\rVert^2\\)，把權重<strong>拉向 0</strong>。新的分類 head 沒有 \\(w^0\\)，用一般 L2。小資料集上更穩定，但所有參數仍需訓練。</p>"
     }
    ]
   }
  ]
 }
];
