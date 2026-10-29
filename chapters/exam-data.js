/* 期中考題問答：依各章「❓ 問答閱讀筆記」改寫成考卷問法，答案寫成可以直接寫在考卷上的完整句子
   ch 是篩選用的章（C4-2 併入 c4），at 是題目放在哪一段內容整理下面（章:問答閱讀筆記的第幾題，見 exam-content.js），答案是純文字，換行用 \n */
window.EXAM_DATA = [
  /* ---------- C1 視覺機器學習模型 ---------- */
  { ch: 'c1', at: 'c1:1', q: `請說明傳統 Machine Learning 與 Deep Learning 在特徵擷取與分類流程上的差異。`,
    a: `傳統 Machine Learning 的流程包含 Input、Feature extraction、Classification 和 Output，特徵擷取是獨立階段；Deep Learning 則透過神經網路將 Feature extraction 與 Classification 整合在一起。` },
  { ch: 'c1', at: 'c1:4', q: `請比較 SVM 與 KNN 在大型資料集上各自面臨的計算效率問題。`,
    a: `SVM 的訓練過程在大型資料集上非常耗時，因為需要花費大量時間計算最佳超平面。KNN 則是在預測時，需要計算新樣本與所有樣本的距離，因此隨著資料量增加，預測的計算成本也會顯著提高。` },
  { ch: 'c1', at: 'c1:2', q: `請說明 SVM（Support Vector Machine）的目標，並解釋 Margin 的意義。`,
    a: `SVM 是監督式分類演算法，目標是找出一個最佳超平面（Hyperplane）來區分不同類別，同時最大化間隔（Margin）。Margin 是資料點與超平面之間的距離，最大化 Margin 就是讓兩類資料點離超平面越遠越好，新資料進來時才能維持高準確率。SVM 原本是為二分類設計，多分類時需要用「一對一」或「一對多」的方式轉換。` },
  { ch: 'c1', at: 'c1:3', q: `請說明 Kernel Trick 的用途與做法。`,
    a: `當資料無法用一條線（超平面）切開，也就是線性不可分時，Kernel Trick 會把資料投影到更高維度的空間，在高維空間中就能用超平面把不同類別分開。` },
  { ch: 'c1', at: 'c1:4', q: `請說明 KNN 的分類步驟，並解釋為什麼 K 通常設為奇數。`,
    a: `KNN（K-Nearest Neighbors）以距離判斷類別：(1) 計算新樣本與所有訓練樣本的距離（可用歐幾里得距離或曼哈頓距離）；(2) 取距離最近的 K 個鄰居；(3) 以多數決決定新樣本的類別。K 通常設為奇數，是為了避免票數各半、無法決定類別。KNN 的缺點是計算效率低、高維度資料表現不佳，且無法處理非線性關係。` },
  { ch: 'c1', at: 'c1:5', q: `請說明 PCA 的核心概念，並列出兩項投影片提及的限制。`,
    a: `PCA 是一種線性降維技術，將高維資料投影至較低維度的空間，並選取資料變異性最大的方向作為主成分，在減少特徵數量的同時保留主要資訊。限制包括：(1) 對非線性資料的處理能力有限；(2) 降維時可能遺失重要的細節與特徵。` },
  { ch: 'c1', at: 'c1:6', q: `請說明神經網路 Forward Propagation 的基本運作方式，並解釋 Activation Function 的作用。`,
    a: `輸入資料進入神經網路後，各神經元先將輸入乘上對應權重並加上 Bias，形成加權總和，接著透過 Activation Function 計算輸出，逐層向前傳遞直到 Output Layer。Activation Function 的作用是引入非線性（Non-linearity）。` },
  { ch: 'c1', at: 'c1:6', q: `為什麼神經網路需要 Activation Function？請列出常見的 Activation Function，並說明 ReLU 相較於 Sigmoid 的優點。`,
    a: `沒有 Activation Function 時，疊再多層也只等於一層線性模型，學不出彎曲的決策邊界，所以需要 Activation Function 引入非線性。常見的有 Sigmoid（輸出 0～1，用於二元分類的輸出層）、tanh、ReLU、Leaky ReLU、ELU；多類別分類的輸出層使用 Softmax，讓各類別機率加總為 1。ReLU 計算快，而且正值區的梯度為 1，比 Sigmoid 不容易發生梯度消失。` },
  { ch: 'c1', at: 'c1:7', q: `請說明 Loss Function 的用途，並說明分類問題與迴歸問題各常用哪些 Loss Function。`,
    a: `Loss Function 用來衡量預測值與真實值之間的差距，作為調整權重的依據，訓練的目標就是把 Loss 降到最小。分類問題常用交叉熵（Cross-Entropy），正確類別的預測機率越低，損失越大；迴歸問題常用均方誤差（MSE）或平均絕對誤差（MAE），MSE 對大誤差的懲罰較重，MAE 對離群值較不敏感。` },
  { ch: 'c1', at: 'c1:8', q: `請說明 Gradient Descent 如何更新權重，並說明 Learning Rate 太大或太小會造成什麼問題。`,
    a: `反向傳播算出 Loss 對每個權重的梯度後，沿著梯度的反方向更新權重：w ← w − α·∂L/∂w，讓 Loss 一步步變小。Learning Rate α 決定每一步走多大，是需要調整的超參數。Learning Rate 太大時更新過快，可能跳過最佳解、產生震盪甚至發散；太小時更新過慢，收斂很久，可能無法到達最佳解。` },
  { ch: 'c1', at: 'c1:9', q: `請說明 SGD、Momentum、RMSProp 與 Adam 這幾種 Optimizer 的特色。`,
    a: `Optimizer 根據訓練損失調整模型參數，是梯度下降的改良版。SGD（隨機梯度下降）每次用一筆或一個 batch 的資料計算梯度，更新快但波動大、收斂不穩定，而這個波動可能幫助跳出 local minima。Momentum 加上慣性（上一步的移動），在平坦處或梯度為 0 的地方仍會前進，有機會衝過小山丘，也能減少抖動。RMSProp 會自動調整每個參數的學習率。Adam 結合 Momentum 與 RMSProp，同時考慮動量方向與自適應學習率，是常用的預設選擇。` },

  /* ---------- C2 卷積神經網路 ---------- */
  { ch: 'c2', at: 'c2:1', q: `請說明 CNN 中 Filter（Kernel）扮演的角色，以及 Filter 的數值如何決定。`,
    a: `CNN 讓模型自己學會偵測特徵，不需要人工設計。每一個 Filter（Kernel）就是一個特徵偵測器，專門找一種形狀，例如上邊、左邊或垂直邊緣。Filter 裡的數值一開始是隨機的，透過反向傳播與梯度下降在訓練中學出來。` },
  { ch: 'c2', at: 'c2:2', q: `請說明 Convolution 的計算方式，以及輸出的 Feature Map 代表什麼。`,
    a: `Filter 在輸入圖上滑動，每到一個位置就把框住的區域與 Filter 對應位置的數值相乘，再全部相加，得到一個數字（逐格相乘再加總，不是矩陣乘法）。所有位置的結果組成 Feature Map，標示出輸入圖中「哪裡有這個特徵」。` },
  { ch: 'c2', at: 'c2:3', q: `垂直邊緣偵測器的每一列是 1、0、−1，請說明它為什麼能找到垂直邊緣。`,
    a: `每一列是 1、0、−1，等於「左邊減右邊」。框住的區域左亮右暗時，相減的差很大，輸出大值；整片一樣亮或一樣暗時，左右互相抵消，輸出 0。因此大值會出現在亮暗交界的位置，也就是垂直邊緣。例如輸入每列為 1、1、0、0、0（左亮右暗），輸出每列為 3、3、0。` },
  { ch: 'c2', at: 'c2:4', q: `彩色圖片（RGB）如何進行卷積？卷積輸出的深度由什麼決定？`,
    a: `Filter 的深度必須等於輸入的通道數，RGB 有 3 個通道，所以 3×3 的 Filter 實際上是 3×3×3。三個通道各自相乘後全部加總（再加上 bias），每個位置只輸出一個數，因此一個 Filter 產生一張 Feature Map。輸出的深度等於 Filter 的數量，例如 5×5×3 的輸入使用 2 個 3×3×3 的 Filter，輸出為 3×3×2。` },
  { ch: 'c2', at: 'c2:5', q: `卷積層需要事先設定哪些超參數？`,
    a: `卷積層有四個超參數：Kernel size（Filter 大小 k×k）、Depth（Filter 的數量，也就是輸出深度）、Padding（輸入外圍補幾圈 0）、Stride（Filter 每次移動幾格）。小 Filter（1×1、3×3）擷取邊緣、紋理等細節，參數少；大 Filter（5×5、7×7）看較大範圍，但參數較多。` },
  { ch: 'c2', at: 'c2:6', q: `為什麼需要使用 Padding？`,
    a: `Padding 是在輸入圖片外圍補 0，主要有兩個目的：
(1) 避免 Feature Map 越卷越小：沒有 Padding 時每做一次卷積尺寸就縮小（5×5 卷 3×3 → 3×3），模型較深時 Feature Map 會很快縮到太小；補一圈 0（5×5 → 7×7）後，輸出可以維持 5×5。
(2) 增加邊緣與角落像素的貢獻：沒有 Padding 時，角落像素只會被卷積到 1 次，中間像素卻會被卷積很多次，邊緣資訊容易被忽略；Padding 1 之後，角落像素會被卷積到 4 次。
常用的組合是 3×3 Filter、Stride 1 搭配 Padding 1，輸出與輸入同尺寸（same padding）。` },
  { ch: 'c2', at: 'c2:7', q: `請說明 Stride 的意義，以及 Stride 變大會有什麼效果。`,
    a: `Stride 是 Filter 每次移動的格數。Stride 越大，輸出的 Feature Map 越小。好處是增加訓練效率、減少重複使用相同的像素，並控制 Feature Map 的大小。例如 5×5 的輸入卷 3×3 的 Filter，Stride 1 時輸出 3×3，Stride 2 時輸出 2×2。` },
  { ch: 'c2', at: 'c2:8', q: `輸入大小為 28×28，使用 5×5 的 Filter，stride = 1、padding = 0，請計算輸出 Feature Map 的大小。`,
    a: `輸出邊長 m = ⌊(n + 2p − f) / s⌋ + 1，其中 n 為輸入邊長、f 為 Filter 邊長、p 為 padding、s 為 stride。
代入 n = 28、f = 5、p = 0、s = 1：m = (28 + 2×0 − 5) / 1 + 1 = 24。
輸出 Feature Map 為 24×24（使用 N 個 Filter 時，深度為 N）。` },
  { ch: 'c2', at: 'c2:9', q: `為什麼卷積之後要接 ReLU？ReLU 有什麼缺點？`,
    a: `ReLU(x) = max(0, x)，負數變 0、正數保留。卷積後接 ReLU 的理由：
(1) 把正負意義分開處理：正值代表「由暗到亮」、負值代表「由亮到暗」，若不處理，下一層只能乘同一個權重，一個加分另一個就自動扣分，兩種特徵被綁在一起。
(2) 引入非線性：沒有 Activation Function 時，疊再多層線性運算都能合併成一層。
(3) 計算快、訓練穩定：只需要比大小，正值區梯度永遠是 1，不像 Sigmoid、Tanh 容易梯度消失。
缺點：為了學負向特徵可能需要多佔用 Filter；另外有 Dying ReLU 問題，神經元一直輸出負值時梯度為 0，會永久停止學習，可改用 Leaky ReLU 或 ELU。` },
  { ch: 'c2', at: 'c2:10', q: `Pooling 的主要目的為何？`,
    a: `Pooling（又稱 Subsampling／Downsampling）的主要目的是縮小 Feature Map 的尺寸，在不丟失重要資訊的情況下，減少後續的計算量與訓練參數。原因是相鄰像素通常具有相似的特徵，用一個值（例如 Max Pooling 取最大值）代表一個區塊即可；Pooling 也讓模型不受微小特徵差異（例如些微位移）影響。常用設定為 2×2、stride 2、no padding，高與寬減半、深度不變，而且 Pooling 沒有可訓練的參數。注意 stride 太大會丟失重要資訊。種類有 Max Pooling（取最大值）、Average Pooling（取平均）、Sum Pooling（加總）。` },
  { ch: 'c2', at: 'c2:11', q: `在 CNN 中，Fully Connected Layer 扮演什麼角色？`,
    a: `Fully Connected Layer（又稱 Dense Layer）負責整合前面卷積層與池化層抽出的特徵，並據此完成分類。進入 Fully Connected Layer 前，要先把多維的 Feature Map 展平（Flatten）成一維向量；每個節點都與下一層的每個節點相連，把各處偵測到的局部特徵組合起來做整體判斷。最後一層的節點數等於類別數，接 Softmax 輸出各類別的機率。Fully Connected Layer 通常是 CNN 中參數最多的部分。` },
  { ch: 'c2', at: 'c2:12', q: `輸入為 28×28×1 的 MNIST 圖片，Conv_1 使用 32 個 3×3 的 Filter，Conv_2 使用 64 個 3×3 的 Filter（皆為 stride 1、padding 0），請計算兩層卷積層的參數量。`,
    a: `卷積層參數量 = (f × f × d + 1) × N，其中 d 為輸入深度、N 為 Filter 數量，+1 是每個 Filter 的 bias。
Conv_1：輸入深度 1，(3×3×1 + 1) × 32 = 320，輸出 26×26×32。
Conv_2：輸入深度已變成 32，(3×3×32 + 1) × 64 = 18,496，輸出 24×24×64。` },
  { ch: 'c2', at: 'c2:13', q: `請說明參數（Parameter）與超參數（Hyperparameter）的區別。`,
    a: `參數是訓練過程中由模型自己學習的變數，又稱可學習參數或權重，例如 Filter 的權重與 bias、Fully Connected Layer 的權重與 bias，由梯度下降與反向傳播更新。超參數是訓練前由人手動設定、模型不會自己學習的值，例如 Filter 大小與數量、stride、padding、節點數、Activation Function、Learning Rate、Batch Size、Epoch 數、Dropout Rate，通常依 Validation 的結果調整。ReLU、Max Pooling、Flatten 這些層沒有可訓練的參數。` },
  { ch: 'c2', at: 'c2:14', q: `為什麼處理影像時 CNN 比一般全連接網路更有效？請說明兩項優勢。`,
    a: `(1) 參數共享（Parameter Sharing）：同一個 Filter 的參數在整張圖的不同位置重複使用，偵測相同的特徵，參數量與輸入圖片大小無關。
(2) 連接稀疏性（Sparsity of Connections）：輸出的每個值只由輸入的一小塊像素（例如 3×3）計算，大幅減少參數量。例如 28×28 的圖用全連接產生 26×26×32 = 21,632 個節點，需要 784 × 21,632 = 16,959,488 個參數，CNN 的 Conv_1 只需要 320 個。參數少，訓練較快，也較不容易 Overfitting。
(3) 不變性（Invariance）：特徵不論出現在圖片的哪個位置都偵測得到，搭配 Pooling 對微小位移也不敏感。
此外，CNN 直接在二維上卷積，保留了影像的空間結構，並能自動學習特徵。` },

  /* ---------- C3 模型品質與改進 ---------- */
  { ch: 'c3', at: 'c3:1', q: `請說明 Training、Validation、Test 資料集各自扮演什麼角色。`,
    a: `Training set 讓模型學習參數，每個 epoch 用梯度下降與反向傳播更新權重。Validation set 在訓練期間用來公正評估模型（每個 epoch 結束時計算 loss 與 accuracy），用來調整超參數、挑選最佳模型、判斷 Overfitting 或決定 Early Stopping，不用來更新權重。Test set 是模型從未看過的資料，在訓練全部結束後只使用一次，評估模型最終的泛化能力；Test set 不能拿來調整模型，否則評估結果會過度樂觀。` },
  { ch: 'c3', at: 'c3:2', q: `如何從 Loss 與 Accuracy 曲線判斷 Overfitting？為什麼除了 Accuracy 還需要 Confusion Matrix？`,
    a: `Training loss 持續下降、Validation loss 卻開始上升（或 Training 與 Validation 的 Accuracy 差距拉大）時，表示模型開始 Overfitting。Accuracy 只有一個數字，看不出模型在每個類別上的表現；Confusion Matrix 列出「真實類別 vs 預測類別」的每一格，能找出表現較差的類別，以及模型容易把哪一類誤認成哪一類（例如 MNIST 的 4 常被判成 9）。` },
  { ch: 'c3', at: 'c3:3', q: `請根據 Confusion Matrix 解釋 Precision、Recall 與 Accuracy 的意義，並寫出三者的計算公式。`,
    a: `Precision 表示模型預測為 Positive 的結果中，真正為 Positive 的比例，公式為 TP/(TP+FP)。Recall 表示實際為 Positive 的資料中，模型成功辨識出的比例，公式為 TP/(TP+FN)。Accuracy 表示所有預測中正確預測的比例，公式為 (TP+TN)/(TP+FP+FN+TN)。` },
  { ch: 'c3', at: 'c3:4', q: `什麼是 Overfitting？有哪些改善方法？`,
    a: `Overfitting 是模型在訓練資料上表現很好，在新資料上表現很差，因為模型把訓練資料中的雜訊與細節也背了起來，泛化能力差。改善方法包括：增加資料（含資料擴增）、降低模型複雜度，以及使用正則化技術，例如 L1／L2 正則化、Dropout、Early Stopping、Batch Normalization。` },
  { ch: 'c3', at: 'c3:5', q: `L1 與 L2 正則化的主要差異是什麼？`,
    a: `兩者都在 Loss 加上 Penalty，迫使模型使用較小的權重，強度由 λ 控制。L1（Lasso）的 Penalty 是權重絕對值的總和（L + λΣ|θ|），會優先把不重要特徵的權重降為 0，結果較稀疏，具有特徵選取的效果。L2（Ridge）的 Penalty 是權重平方的總和（L + λΣθ²），會讓所有權重一起變小，大權重被懲罰得更重，結果權重小而平滑，避免少數節點主導。共同要注意的是 λ 太大時權重被壓得過小，會造成 Underfitting。` },
  { ch: 'c3', at: 'c3:6', q: `Dropout 是什麼技術？請說明它的運作原理，以及為什麼有助於提升模型表現。`,
    a: `Dropout 是正則化（Regularization）技術，用來防止 Overfitting。運作原理：
(1) 訓練時，每個 mini-batch 隨機關閉某一層的部分節點，比例由 Dropout Rate 控制（例如 0.5）。
(2) 前向與反向傳遞只經過開著的節點，也只更新它們的權重。
(3) 下一個 mini-batch 恢復所有節點，再重新隨機關閉一批。
(4) 測試（推論）時不關閉節點，使用所有節點。
因為每次訓練的都是不同的子網路，模型不能依賴少數特定節點，被迫學到更可靠、更具代表性的特徵，泛化能力較好。代價是收斂較慢，需要搭配更多 epoch。` },
  { ch: 'c3', at: 'c3:7', q: `請說明 Early Stopping 的運作方式與好處。`,
    a: `Early Stopping 在每個 epoch 結束時觀察 Validation loss，若連續 P 個 epoch（patience）都沒有進步，就停止訓練，並取回 Validation loss 最低那一輪的權重。好處是不需要事先決定 epoch 數，並能在模型開始 Overfitting 之前停下來。例如 P = 3，Validation loss 依序為 0.50、0.40、0.35、0.36、0.37、0.38，會在第 6 個 epoch 停止，並取回第 3 個 epoch 的權重。` },
  { ch: 'c3', at: 'c3:8', q: `請說明 Batch Normalization 的做法與效果，以及訓練與推論時有什麼不同。`,
    a: `Batch Normalization 對每個 mini-batch 計算平均值（mean）與標準差並進行標準化，再用可學習的 γ（縮放）與 β（平移）計算 y = γx̂ + β；在 CNN 中每個 channel 各有一組。它通常放在 Conv 與 Activation 之間，用來穩定每一層輸入的分布（緩解 Internal Covariate Shift）。效果是訓練更穩定、可以使用較大的 Learning Rate、收斂較快，也有輕微的正則化效果。訓練時使用當下 batch 的統計量；推論時改用訓練過程中以移動平均累積的 running mean 與 running STD，因為推論時 batch 可能只有一張圖。` },
  { ch: 'c3', at: 'c3:9', q: `資料擴增（Data Augmentation）為什麼能改善模型？基本的資料擴增方法有哪些？`,
    a: `Overfitting 的原因之一是訓練資料不足。資料擴增對訓練資料做各種變換，增加資料的多樣性，等於讓模型每次看到不同版本的圖片，可以減少 Overfitting、提升泛化能力。基本方法包括翻轉、調整亮度與對比、旋轉、縮放、裁切、扭曲。資料擴增一般只對訓練資料做，通常在 Data Loader 搬資料時即時產生。` },
  { ch: 'c3', at: 'c3:10', q: `請比較 CutOut、Random Erasing、Hide-and-Seek 與 GridMask 這四種遮擋式資料擴增的差異。`,
    a: `四者的共同目的都是遮住影像的一部分，強迫模型用多個特徵判斷，而不是只盯著最明顯的地方。CutOut 遮住一塊固定大小的正方形，填入 0（黑色）。Random Erasing 遮擋的矩形長寬比與面積都隨機，並填入隨機數值，比 CutOut 有更多變化。Hide-and-Seek 把圖片切成 S×S 網格，每格依機率獨立決定是否遮掉，主要區域被遮住時模型會學習次要區域，但可能一次遮太多或太少。GridMask 使用規律、等間距的網格遮擋，平衡「過度保留」與「過度刪除」的問題。` },
  { ch: 'c3', at: 'c3:11', q: `請說明 MixUp、CutMix、Copy-Paste 與 Mosaic 的做法。`,
    a: `MixUp 把兩張圖整張線性混合，標籤也依相同比例混合，例如 λ = 0.7 時標籤為「狗 0.7、貓 0.3」。CutMix 把 A 圖挖掉一塊、換成 B 圖的對應區塊，標籤依面積比例混合，例如 32×32 的圖貼上 16×16 的區塊，B 佔 0.25。Copy-Paste 把物件連同 mask 貼到另一張圖上，並同步更新 mask 與 bounding box。Mosaic 把多張（常見為 4 張）圖片拼成一張，讓一張圖中就包含不同的背景、尺度與位置。` },
  { ch: 'c3', at: 'c3:12', q: `請說明 Adaptive Data Augmentation 與 Targeted Data Generation 的概念。`,
    a: `Adaptive Data Augmentation 依訓練過程中的 loss 或梯度回饋，動態調整資料擴增的種類與強度，讓訓練樣本維持適當的挑戰性（擴增參數往讓 loss 變大的方向更新）。Targeted Data Generation（TDG）不是平均地增加資料，而是找出模型容易誤判的子群（subgroup），針對這些子群生成標註正確的合成樣本，把資料花在模型的弱點上。` },

  /* ---------- C4 進階影像視覺模型（Part 1） ---------- */
  { ch: 'c4', at: 'c4:1', q: `一層卷積的「參數量」與「運算量（乘法次數）」有什麼不同？請以 12×12×3 的輸入、128 個 5×5 的 Filter（stride 1、padding 0）為例計算。`,
    a: `參數量 = (k × k × C_in + 1) × C_out，只和 Filter 大小、輸入與輸出通道數有關，與圖片大小無關（同一個 Filter 掃全圖，權重共享）。乘法次數 = H × W × C_out × (k × k × C_in)，也就是輸出數值的個數乘上每個數值需要的乘法次數，圖越大次數越多。
例：輸出為 8×8×128。參數量 = (5×5×3 + 1) × 128 = 76 × 128 = 9,728；乘法次數 = 8 × 8 × 128 × 75 = 614,400。
所以「參數少」與「運算少」是兩回事。` },
  { ch: 'c4', at: 'c4:4', q: `什麼是梯度消失（Vanishing Gradient）與梯度爆炸（Exploding Gradient）？有哪些改善方法？`,
    a: `反向傳播時，N 層網路要依連鎖律把 N 個導數連乘。若每層的導數小於 1，越往前乘越小，梯度呈指數消失，前面的層幾乎不會更新，這就是梯度消失（例如每層 0.5、20 層，0.5²⁰ ≈ 10⁻⁶）。若每層的導數大於 1，梯度呈指數成長，更新一次就跳太遠，這就是梯度爆炸（例如每層 1.5、20 層，約 3,325）。結果是網路很深時反而更難訓練。改善方法有使用 ReLU、Batch Normalization、ResNet 的捷徑連接，以及 DenseNet 的串接。` },
  { ch: 'c4', at: 'c4:2', q: `請說明 VGGNet 的架構特徵與優缺點。`,
    a: `VGGNet 於 2014 年提出，VGG16 由 13 層卷積層與 3 層全連接層組成，VGG19 由 16 層卷積層與 3 層全連接層組成。它是「典型 CNN」的範本：全部使用 3×3 卷積，多層卷積之後接 Pooling，Filter 數量逐漸增加，最後接全連接層。優點是「深度」的網路設計、規範的結構，以及高準確率。缺點是計算需求大、參數冗餘，VGG16 約有 1.38 億個參數，訓練很慢，且參數大多集中在全連接層（約 89%）。` },
  { ch: 'c4', at: 'c4:3', q: `VGGNet 為什麼全部使用 3×3 的卷積，而不使用 5×5 或 7×7？`,
    a: `兩層 3×3 卷積疊起來看到的範圍（感受野）等於一個 5×5，三層等於一個 7×7，但權重比較少（18 對 25、27 對 49），而且每一層後面都接 ReLU，多了幾次非線性。` },
  { ch: 'c4', at: 'c4:7', q: `Inception 在同一層並行使用不同大小卷積核的主要目的為何？`,
    a: `設計 CNN 時 Filter 大小最難選擇：小的 kernel 擅長捕捉細節，大的 kernel 擅長捕捉大範圍的特徵。Inception module 在同一層並行使用 1×1、3×3、5×5 卷積與 max pooling，再把結果在通道方向串接（concatenate），讓網路自己學習要使用哪一種。不同大小的 kernel 對應不同的感受野，因此能同時擷取多尺度的特徵。所有分支都使用 same padding、stride 1，讓輸出的寬高相同才能串接。Inception V1 又稱為 GoogLeNet。` },
  { ch: 'c4', at: 'c4:8', q: `請說明 1×1 卷積（Bottleneck Layer）的作用，並以 28×28×192 的輸入、5×5 卷積輸出 32 個通道為例，說明它能省下多少運算量。`,
    a: `1×1 卷積不看鄰近像素（寬高不變），只在每個像素位置把所有通道加權相加，用來增加或減少通道數。在昂貴的 3×3、5×5 卷積之前先用 1×1 卷積把通道數壓少，就是瓶頸層（Bottleneck Layer），可以大幅降低運算量；只要壓縮比例合理，對準確率影響不大。
例：28×28×192 直接做 5×5 卷積輸出 32 個通道，約需 120M 次乘法；先用 1×1 卷積壓到 16 個通道（約 2.4M 次），再做 5×5 卷積（約 10M 次），合計約 12.4M 次，約只有原本的 1/10。` },
  { ch: 'c4', at: 'c4:9', q: `請說明 Inception 中輔助分類器（Auxiliary Classifier）的作用，以及 Inception 的優缺點。`,
    a: `輔助分類器接在網路中間，Total Loss = Main Loss + w₁ × Aux Loss1 + w₂ × Aux Loss2，讓很深的網路仍然可以訓練；輔助分類器只在訓練時使用，推論時會移除。Inception 的優點是能擷取多尺度特徵、用 1×1 卷積有效利用運算資源，深層網路仍可訓練；缺點是結構複雜、難以移植到資源有限的設備，參數與架構的選擇也較複雜。` },
  { ch: 'c4', at: 'c4:5', q: `ResNet 要解決什麼問題？請說明殘差連接（Residual Connection）的運作方式。`,
    a: `一般 CNN 層數很深時效能反而下降（例如 50 層比 20 層還差），這不是 Overfitting，而是網路難以優化，原因之一是梯度消失或梯度爆炸。ResNet 使用殘差連接（Skip Connection），把前面的輸入直接加到後面的輸出：H(x) = F(x) + x。堆疊的層只需要學習殘差 F(x) = H(x) − x，也就是小的修正量，比從頭學習整個 H(x) 容易；多出來的層若用不到，只要 F(x) 趨近 0，就等於恆等映射（什麼都不做）。反向傳播時，梯度也可以經由捷徑直接傳回前面的層，緩解梯度消失。` },
  { ch: 'c4', at: 'c4:6', q: `請說明 ResNet 的優缺點。`,
    a: `優點：能有效訓練深層網路（18～152 層，甚至 1202 層），降低優化難度、加快收斂，在 ImageNet 上表現優於前代模型，被廣泛當作 backbone；並使用 Global Average Pooling，只需要少量甚至不需要全連接層。缺點：運算量與記憶體需求大，不利於部署在行動裝置上；許多 block 學到的殘差很小，參數使用效率不佳。` },
  { ch: 'c4', at: 'c4:10', q: `請說明 Global Average Pooling（GAP）的運作方式，以及它對參數量與 Overfitting 的好處。`,
    a: `GAP 把每一張 Feature Map 取平均成一個數值，例如 7×7×512 變成 1×1×512，用來取代 Flatten 加上大型全連接層。好處：
(1) 大幅減少參數：GAP 本身沒有可學習的參數。例如 7×7×512 展平成 25,088 維後接 4096 個節點的全連接層需要 102,764,544 個參數；GAP 後 512 維接 1000 類只需要 513,000 個參數。
(2) 降低 Overfitting、增強泛化：參數少、模型複雜度低，相當於一種正則化。
(3) 對輸入尺寸更靈活：全連接層要求固定長度的輸入，GAP 不論 Feature Map 是 7×7 或 10×10 都輸出相同長度。
缺點是會丟失空間位置資訊，不適合直接用在物件偵測或語意分割。` },
  { ch: 'c4', at: 'c4:11', q: `請說明「計算成本」與「訓練效率」的差異。`,
    a: `計算成本是完成一次運算（例如一個 batch 的前向與反向傳播）需要花費的資源；訓練效率是需要多少訓練步數（或資料量）才能達到目標性能。總訓練成本約等於計算成本乘上所需的步數。` },
  { ch: 'c4', at: 'c4:12', q: `SqueezeNet 的目標是在維持準確率的前提下大幅縮小模型，請說明將 CNN 模型縮小在實務應用上有什麼好處？（舉出兩點即可）`,
    a: `1. 分散式訓練時，伺服器之間需要傳輸的資料量較少。 2. 透過網路更新模型時需要的頻寬較小（例如自駕車的遠端更新）。 3. 更容易部署在儲存空間有限的嵌入式系統上。（以上任答兩點即可）` },
  { ch: 'c4', at: 'c4:12', q: `請說明 SqueezeNet 的三個設計策略。`,
    a: `SqueezeNet 的目標是維持 AlexNet 等級的準確率，同時大幅縮小模型（參數約為 AlexNet 的 1/50）。三個設計策略：
(1) 把部分 3×3 的 Filter 換成 1×1，每個 Filter 的參數變成 1/9。
(2) 減少輸入到 3×3 Filter 的通道數。
(3) 延後下採樣，讓卷積在較大的 Feature Map 上運算，以維持準確率。
策略一、二用來減少參數（由 Fire module 實現），策略三在參數有限的情況下保持準確率。另外 SqueezeNet 移除龐大的全連接層，最後用 1×1 卷積輸出 1000 個通道，再接 Global Average Pooling。` },
  { ch: 'c4', at: 'c4:13', q: `請說明 SqueezeNet 的 Fire module 結構，以及 SqueezeNet 的缺點。`,
    a: `Fire module 由 squeeze layer 與 expand layer 組成：squeeze layer 只有 1×1 卷積，先用少量的 1×1 Filter 把通道數壓少；expand layer 再並行使用 1×1 與 3×3 卷積把通道展開。squeeze 的 Filter 數量約為 expand 的 1/8。例如 fire2 輸入 96 個通道、squeeze 16 個、expand 1×1 與 3×3 各 64 個，只需要 11,920 個參數，直接用 3×3 做 96 → 128 則需要 110,720 個，約多 9 倍。SqueezeNet 的缺點是準確率只有 AlexNet 的水準，低於 VGG、ResNet；而且參數少不等於運算少，延後下採樣使運算量甚至高於 AlexNet。` },
  { ch: 'c4', at: 'c4:14', q: `MobileNet 主要針對哪種使用情境設計？請說明 Depthwise Separable Convolution 的做法，以及它為什麼比一般卷積省運算。`,
    a: `MobileNet 的目標是讓 CNN 能在手機、嵌入式裝置上即時執行。Depthwise Separable Convolution 把一般卷積拆成兩步：(1) Depthwise：每個通道各自使用一個 k×k×1 的 kernel，只處理空間、不混合通道；(2) Pointwise：用 1×1 卷積把通道做線性組合，只混合通道。一般卷積的一個 Filter 同時做「看空間」與「混通道」兩件事，拆開後乘法次數少很多。例如 12×12×3 的輸入、5×5 kernel、輸出 128 個通道，一般卷積需要 614,400 次乘法，Depthwise Separable Convolution 只需要 4,800 + 24,576 = 29,376 次，約 1/20；使用 3×3 kernel 時約可省 8～9 倍。` },
  { ch: 'c4', at: 'c4:15', q: `MobileNet 的兩個超參數 Width Multiplier α 與 Resolution Multiplier ρ 各控制什麼？對運算量與參數量有什麼影響？`,
    a: `Width Multiplier α（0～1）讓每一層的通道數都乘上 α，因為輸入與輸出通道各乘一次，運算量與參數量都約變成 α² 倍，例如 α = 0.5 時約為 0.25 倍。Resolution Multiplier ρ 縮小輸入影像的解析度（例如 224、192、160、128），運算量約變成 ρ² 倍，但參數量不變，因為參數與圖片大小無關；例如解析度從 224 降到 160，運算量約為 0.51 倍。` },
  { ch: 'c4', at: 'c4:16', q: `請說明 MobileNet 的優缺點。`,
    a: `優點：約 420 萬個參數（約 VGG16 的 1/32），運算量約為 VGG16 的 1/27，ImageNet 準確率接近 VGG16，並能用 α、ρ 靈活調整模型大小。缺點：準確率低於 ResNet，α 或解析度太小時準確率下降明顯；運算量減少不一定等比例變快（Depthwise 卷積在 GPU 上的硬體利用率較差）；沒有捷徑連接，難以加深網路。` },

  /* ---------- C4-2 DenseNet ---------- */
  { ch: 'c4', at: 'c4-2:2', q: `ResNet 的捷徑連接有什麼限制？DenseNet 如何改進？`,
    a: `ResNet 以逐元素相加 y = F(x) + x 合併特徵，雖能緩解梯度消失，但有兩個限制：(1) 以相加合併時，前面層的特徵與新特徵混在一起，後面的層無法分別取用；(2) 許多層的貢獻很小，卻各自擁有一組參數，參數使用效率不高。DenseNet 改用通道串接（concatenation），讓每一層都能直接取用前面所有層的 Feature Map，特徵可以重複利用，每一層只需要學習少量的新特徵，因此能以較少的參數量達到與 ResNet 相近的準確率。` },
  { ch: 'c4', at: 'c4-2:3', q: `請說明 Dense Block 的運作方式，以及增長率（growth rate）k 的意義。`,
    a: `在同一個 Dense Block 中，每一層都接收前面所有層的 Feature Map 作為輸入（通道串接），每一層的輸出也直接連到後面所有層，梯度可以走捷徑傳回淺層。每一層只輸出 k 個新的 Feature Map，k 稱為增長率，所以每一層可以很「窄」。同一個 Block 內 Feature Map 的長寬不變，串接才能進行。第 L 層的輸入通道數為 k₀ + k(L − 1)，Block 的輸出通道數為 k₀ + kL；例如 k₀ = 64、k = 32、6 層，各層輸入為 64、96、128、160、192、224，Block 輸出為 64 + 6 × 32 = 256。Dense Block 中每一層的順序是 BN → ReLU → 3×3 Conv（pre-activation）。` },
  { ch: 'c4', at: 'c4-2:6', q: `請說明 DenseNet-B 的 Bottleneck Layer、過渡層（Transition Layer）的作用，以及什麼是 DenseNet-BC。`,
    a: `串接讓輸入通道越來越多，3×3 卷積的成本越來越高，因此 DenseNet-B 在 3×3 卷積前先加上 BN → ReLU → 1×1 Conv，把通道壓到 4k 再做 3×3 卷積，降低計算量與參數。Dense Block 內長寬不能改變，所以降採樣要在 Block 之間由過渡層負責，過渡層由 BN → 1×1 Conv → 2×2 Average Pooling 組成：Average Pooling 讓長寬減半，1×1 Conv 用壓縮因子 θ（0 < θ ≤ 1，論文使用 0.5）減少通道數，避免通道無限增長，例如 56×56×256 經過 θ = 0.5 的過渡層變成 28×28×128。同時使用 Bottleneck（B）與壓縮（C）的版本稱為 DenseNet-BC。` },
  { ch: 'c4', at: 'c4-2:8', q: `為什麼 DenseNet 比 ResNet 省參數？請說明 DenseNet 的優缺點。`,
    a: `(1) 特徵重用：每一層都能直接使用前面所有層的特徵，不必重複學習相似的特徵，因此每一層可以很窄。(2) 增長率 k 限制每層的輸出：ResNet 為了相加，輸出通道必須與輸入相同，各層較寬；DenseNet 每層只新增 k 個 Feature Map。(3) DenseNet-BC 再以 Bottleneck 與過渡層壓縮通道。結果在相近的錯誤率下，DenseNet 需要的參數量與計算量都比 ResNet 少（DenseNet-121 約 8.0M，ResNet-50 約 25.6M）。
優點：緩解梯度消失、促進特徵重用、參數量較少。缺點：記憶體需求高，因為要保存同一區塊內所有先前層的輸出；實際執行速度不一定較快，FLOPs 雖然較少，但大量的串接與記憶體存取會拖慢訓練與推論。` },
  { ch: 'c4', at: 'c4-2:9', q: `DenseNet 與 ResNet 在合併特徵的方式上，有何不同？`,
    a: `ResNet 以逐元素相加 F(x) + x 合併特徵，輸入與輸出的形狀必須完全相同，每個 block 有一條捷徑，每層較寬以承載全部資訊。DenseNet 以通道串接 [x₀, x₁, …] 合併特徵，只要長寬相同、通道數可以不同，每一層都連到後面所有層（L 層共有 L(L+1)/2 條連接），每層只新增 k 個 Feature Map，因此較窄。兩者的共同點是梯度都能經由捷徑傳回淺層，緩解梯度消失。` },

  /* ---------- C5 遷移學習與微調 ---------- */
  { ch: 'c5', at: 'c5:1', q: `為什麼需要遷移學習（Transfer Learning）？請說明它的原理。`,
    a: `從頭訓練 CNN 需要大量的標註資料、強大的運算資源與足夠的訓練時間，多數實際任務只有幾百到幾千張影像，很難滿足。遷移學習借用在大型資料集（例如 ImageNet，約 120 萬張、1000 類）上訓練好的預訓練模型（Pretrained Model），它的卷積層已學到許多通用特徵（淺層的邊緣、色塊、紋理），也適用於新任務，因此能以較少的資料與較短的訓練時間取得好的表現。遷移學習有兩種用法：特徵提取（Feature Extraction）與微調（Fine-tuning）。` },
  { ch: 'c5', at: 'c5:2', q: `使用預訓練模型進行 Feature Extraction 時，要如何處理卷積基底與原本的分類層？`,
    a: `把預訓練網路分成擷取特徵的卷積基底，以及對應原資料集類別的分類層。(1) 凍結（freeze）卷積基底，訓練時權重不更新；(2) 移除原本的分類層，換成新的分類層，輸出數量等於新資料集的類別數；(3) 在新資料上訓練，只有新分類層的權重會更新。優點是訓練快、需要的資料少，而且不會破壞預訓練權重。` },
  { ch: 'c5', at: 'c5:3', q: `Fine-tuning 與 Feature Extraction 有什麼不同？為什麼 Fine-tuning 通常解凍較深的層？`,
    a: `Fine-tuning 是在特徵提取之後，再解凍部分或全部的預訓練層（通常是較深的層），以很小的學習率再訓練幾個 epoch，讓特徵更貼近新資料，準確率通常更高。通常解凍深層，是因為 CNN 的淺層學到的是邊緣、紋理等通用特徵，換任務也用得上；深層學到的是與原資料集相關的細節，才需要針對新資料調整。` },
  { ch: 'c5', at: 'c5:4', q: `為什麼 Fine-tuning 時要先凍結預訓練層、只訓練新的分類層，之後再解凍後面幾層？`,
    a: `因為新的分類層是隨機初始化的，一開始幾乎是亂猜，Loss 很大、梯度也很大；若整個模型一起訓練，大的梯度會流進預訓練層，把已經學好的特徵破壞掉。所以先凍結預訓練層、只訓練新的分類層，讓它先學會用現有特徵分類，等 Loss 降下來、梯度穩定之後，再解凍後面幾層，並使用很小的學習率（比初始訓練小一到兩個數量級）輕輕調整深層。資料集較小時，Batch Normalization 也應沿用預訓練的統計量（running mean／std），避免小 batch 估計不準而打亂特徵。` },
  { ch: 'c5', at: 'c5:5', q: `請說明 Full Fine-tuning 的做法與優缺點。`,
    a: `Full Fine-tuning 微調模型的所有參數。優點是適應能力最大，資料夠多時通常效果最好，來源與目標的 domain 差異大時也能調整。缺點是計算成本與 GPU 記憶體需求高，資料少時容易 Overfitting。實務上建議先訓練新的分類 head，再解凍全部參數，並使用很小的學習率。` },
  { ch: 'c5', at: 'c5:6', q: `請說明 Partial／Selective Fine-tuning 與 Last-k Fine-tuning，以及 k 應如何選擇。`,
    a: `Partial／Selective Fine-tuning 只更新部分參數，例如依位置只解凍最後幾層，或依類型只更新 BN、bias。優點是成本比 Full Fine-tuning 低、較不容易 Overfitting，並能保留通用特徵；缺點是需要決定要調整哪些層，domain gap 大時凍結太多層會限制模型。Last-k Fine-tuning 只解凍最後 k 個 layer 或 block，核心假設是越靠近輸入的層越通用、越靠近輸出的層越 task-specific。選擇 k 時：新資料少則 k 小（例如 1～2），資料多則 k 大；與原資料相似則 k 小，差異大則 k 大。` },
  { ch: 'c5', at: 'c5:7', q: `什麼是 PEFT（Parameter-Efficient Fine-tuning）？請說明它的優缺點。`,
    a: `PEFT 凍結大部分的預訓練模型，只訓練非常少量的參數，常見方法有 LoRA、Adapter、VPT，主要用於 ViT、CLIP 等大型 Transformer。優點是可訓練參數極少、GPU 記憶體較省，多個任務可以共用同一個 backbone，每個任務只需要儲存小模組。缺點是適應能力可能受限；Adapter、VPT 會增加推論成本，LoRA 則不會。` },
  { ch: 'c5', at: 'c5:8', q: `請說明 LoRA 的運作方式，以及為什麼使用 LoRA 推論時不會變慢。`,
    a: `LoRA 凍結預訓練權重 W₀，只訓練兩個低秩的小矩陣 B（d×r）與 A（r×k），輸出為 h = W₀x + BAx，其中 rank r 遠小於 d 與 k。初始化時 B = 0，所以一開始 BA = 0，模型與預訓練模型完全相同。例如 768×768 的層有 589,824 個參數，r = 8 時 LoRA 只需要 2 × 768 × 8 = 12,288 個參數，約 2%。訓練完成後可以把 BA 合併回 W₀（W = W₀ + BA），推論時只需計算一次，因此不會增加計算量。限制是 r 太小學不夠、太大則失去節省參數的優勢，插入哪些層也會影響效果。` },
  { ch: 'c5', at: 'c5:9', q: `什麼是 Regularized Fine-tuning？請說明 L2-SP 與一般 L2 正則化（weight decay）的差異。`,
    a: `Regularized Fine-tuning 允許參數變動，但不讓它們離預訓練模型太遠，以降低 Overfitting、保留預訓練的知識；但來源與目標差異太大時可能反而有害，成本也不比 Full Fine-tuning 低。L2-SP 在 Loss 加上 (α/2)‖w − w⁰‖²，把權重拉向預訓練值 w⁰；一般 L2 正則化是 (α/2)‖w‖²，把權重拉向 0。新的分類 head 沒有預訓練值 w⁰，所以使用一般 L2。L2-SP 在小資料集上較穩定，但所有參數仍然需要訓練。` },
];
