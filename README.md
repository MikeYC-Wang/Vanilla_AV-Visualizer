# Vanilla AV-Visualizer

純前端、零依賴的即時影音視覺化引擎。完全使用原生 Web API（Web Audio API + Canvas 2D）打造，不引入任何繪圖框架或建置工具。VHS 暖色復古視覺風格。

[GitHub](https://github.com/MikeYC-Wang/Vanilla_AV-Visualizer)

---

## 特色

- **零依賴 / 零建置**：純 HTML + CSS + ES6，直接用瀏覽器開啟即可
- **即時音訊頻譜分析**：FFT 頻域 / 時域 + RMS + 能量法 Beat Detection
- **像素級影片特效**：RGB 通道分離、數位故障 (Glitch)、綠幕去背 (Chroma Key)
- **物件池粒子系統**：1000 顆粒子用 SoA + Float32Array 預配置，無 GC 抖動
- **VHS 復古視覺**：掃描線、顆粒雜訊、色差、暖色琥珀調
- **繁中 / 英文** 即時切換
- **CodePen 友善**：附單檔 `bundle.js`，可直接貼到 CodePen 的 JS panel

## 快速開始

需要靜態 HTTP 伺服器（不能用 `file://` 協定，會被 CORS 擋）：

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

然後打開 `http://localhost:8000/`。

### 在 CodePen 上使用

1. **HTML panel** ← 複製 `index.html` 的 `<body>` 內容
2. **CSS panel** ← 複製 `style.css`
3. **JS panel** ← 複製 `bundle.js`

## 使用方式

| 操作 | 說明 |
|---|---|
| **載入網址** | 貼上**直連** `.mp3` / `.mp4` 媒體檔 URL（須允許 CORS） |
| **範例按鈕** | 預載 MDN 託管的 CORS-enabled 範例音訊，可直接播放 |
| **上傳檔案** | 從本機選擇音訊或影片檔（最穩定，無 CORS 問題） |
| **麥克風** | 即時擷取麥克風串流（需授權） |
| **參數面板** | 調整低頻增益、粒子數、故障強度、RGB 偏移、綠幕閾值 |
| **模組開關** | 隨時開關五個視覺模組 |
| **中 / EN** | 右上角切換語言 |

## 已知限制

- **YouTube / Spotify / SoundCloud / Bilibili / Vimeo / TikTok 等串流網址無法使用**。它們是 HTML 頁面 + DRM 封裝的串流，瀏覽器禁止 JS 跨來源讀取其音訊數據（這是 Web 安全限制，純前端無解）。系統會在輸入此類網址時直接跳出友善提示。
- 任意第三方音訊 URL 須伺服器回傳 `Access-Control-Allow-Origin` header，否則 `<audio crossOrigin="anonymous">` 會載入失敗。最穩定的方式是**上傳本地檔案**或**使用範例按鈕**。

## 系統架構

四層分離，高內聚低耦合：

```
輸入源管理層 (Input Layer)
  └─ sourceManager.js  → URL / File / Microphone

數據解析層 (Data Extraction Layer)
  ├─ analyser.js       → AudioContext + AnalyserNode + Beat Detection
  └─ frameExtractor.js → 隱藏 canvas + getImageData

渲染與運算層 (Rendering Layer)
  ├─ renderer.js       → rAF 主迴圈 + Z-order
  ├─ particlePool.js   → SoA 物件池
  └─ modules/          → circularSpectrum, particles,
                          rgbShift, glitch, chroma

介面控制層 (UI Control Layer)
  ├─ controlPanel.js   → 浮動參數面板 + 模組開關
  └─ i18n.js           → 中英文字串字典
```

## 檔案結構

```
.
├── index.html              # 入口，CodePen 友善
├── style.css               # VHS 暖色主題 + 掃描線 + 雜訊
├── bundle.js               # 單檔打包版（CodePen / 線上分享用）
├── src/                    # ES Modules 開發版
│   ├── main.js             # 啟動 + rAF loop
│   ├── state.js            # 中央狀態
│   ├── i18n.js             # zh-TW / en
│   ├── input/sourceManager.js
│   ├── audio/analyser.js
│   ├── video/frameExtractor.js
│   ├── render/renderer.js
│   ├── render/particlePool.js
│   ├── modules/circularSpectrum.js
│   ├── modules/particles.js
│   ├── modules/rgbShift.js
│   ├── modules/glitch.js
│   ├── modules/chroma.js
│   └── ui/controlPanel.js
└── 系統規格書.txt           # 原始需求規格
```

## 效能優化策略

- **物件池 + Struct of Arrays**：粒子用 `Float32Array` 預配置，無 per-frame allocation
- **位元運算**：熱迴圈用 `(i+1)|0`、`x|0` 取代 `Math.floor` / `+1`
- **離屏渲染**：VHS 雜訊背景在 256×256 離屏 canvas 渲染後 tile，每 10 frame 才更新一次
- **三角函數預計算**：環狀頻譜的 96 個 bar 預先建好 `cosT` / `sinT` 表
- **平滑頻譜**：`AnalyserNode.smoothingTimeConstant = 0.82` 避免閃爍
- **像素掃描節流**：Chroma Key 每隔一幀才重新處理像素
- **影片解析度上限**：`frameExtractor` 將內部 canvas 限制在 640px 寬

## 技術規格

| 項目 | 值 |
|---|---|
| 語言 | HTML5 + CSS3 + ES6+（純原生，無 npm） |
| 繪圖核心 | `<canvas>` 2D Rendering Context |
| 音訊 | Web Audio API (AudioContext + AnalyserNode, fftSize 2048) |
| 渲染迴圈 | `requestAnimationFrame`，目標 60 fps |
| 粒子預設數 | 1000 |
| 預設 FFT smoothing | 0.82 |

## License

MIT
