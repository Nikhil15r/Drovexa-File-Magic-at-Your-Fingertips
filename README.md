# Drovexa — File Magic at Your Fingertips
> **Universal File Toolkit: Modern, High-Speed Windows Desktop Application for Instant File Operations & Radial Actions**

Drovexa (Universal File Toolkit) is a native-feeling, modern Windows 10 & 11 desktop application designed for fast, frictionless file processing. Instead of navigating multiple complex applications, simply drag any image, document, or PDF into the interactive workspace or onto the window to instantly reveal a contextual **Radial Action Menu** tailored specifically to that file.

---

## 🌟 Key Features

### 1. 🎯 Signature Radial Action Menu
- **Contextual Orbital Ring**: Distributes actions in an interactive radial layout surrounding the central file preview.
- **Dynamic File Hub**: Displays live thumbnail, filename, extension badge, exact pixel dimensions, page count, and formatted file size.
- **Fluid Visual Feedback**: Interactive hover glows, expandable action pills, keyboard shortcut hints, and instant tooltips.
- **Accessibility & Preferences**: Seamless 1-click toggle between the signature **Radial Menu** and a clean **Grid Layout**.

### 2. 🖼️ Real High-Performance Image Processing (via Sharp)
- **Crop**:
  - Interactive crop frame with visual 3×3 grid lines.
  - Preset aspect ratios: Freeform, 1:1 (Square), 16:9 (Cinema), 4:3 (Standard), 9:16 (Story), 3:2 (Classic).
  - Real-time pixel width and height readout.
- **Resize & Scale**:
  - Exact width and height inputs with aspect ratio locking.
  - Quick percentage scaling: 25%, 50%, 75%, 150%, 200%.
  - Standard presets: Instagram Square (1080×1080), YouTube 720p (1280×720), Full HD (1920×1080), 4K UHD (3840×2160), App Icon / Avatar (512×512), Social Story (1080×1920).
  - Fit options: Inside, Cover, Fill.
- **Compress & Optimize**:
  - Quality slider (10% to 100%) with lossless options.
  - Live before vs. after file size calculation with savings percentage (e.g., `-78% reduction`).
  - Real-time preview of the compressed image before saving.
- **Convert**:
  - Non-destructive conversions across: **PNG, JPG/JPEG, WebP, AVIF, TIFF, BMP, ICO (Windows desktop icon), and PDF**.
  - Quality settings for lossy formats.
- **Background & Canvas Studio**:
  - Solid color backgrounds with curated palettes.
  - Vibrant linear gradients (Ocean Blue, Sunset Glow, Cyberpunk, Emerald Mint, Midnight Aurora, Dark Charcoal) with custom angles.
  - Adjustable canvas padding (0 to 120px).
  - Image corner radius (0 to 60px).
  - Drop shadow blur and opacity.
- **Adjustments & Artistic Filters**:
  - Real-time brightness (-100 to +100), contrast (-100 to +100), and saturation (-100 to +100).
  - Hue rotation (-180° to +180°).
  - Gaussian blur (0 to 20px) and sharpness (0 to 10).
  - One-click filters: Black & White / Greyscale, Sepia tone, Invert colors.
- **Annotate & Watermark**:
  - Stamp customizable text captions with font size, color, and contrast badges.
  - Security watermarks (e.g., "CONFIDENTIAL", "SAMPLE", copyright) with diagonal, center, or corner alignment and opacity sliders.
- **Rotate & Flip**:
  - 90° Clockwise, 90° Counter-Clockwise, 180° rotations.
  - Horizontal flip (mirror) and Vertical flip.
  - Fine arbitrary angle tilt slider (-180° to +180°).

---

### 3. 📄 Dedicated PDF & Document Tools (via PDF-Lib)
- **Image(s) to PDF**:
  - Convert single or multiple images into a multi-page PDF document.
  - Page sizing options: Fit to Image, A4, or US Letter, with customizable margins and auto-orientation.
- **PDF Merge**:
  - Merge multiple PDF files into one combined document.
  - Interactive reordering (Move Up / Move Down) and add more files.
- **PDF Split**:
  - Split entire document into individual single-page PDFs.
  - Custom page ranges (e.g., `1-3, 5, 7-10`).
- **PDF Viewer & Quick Actions**:
  - Stepper navigation across pages (`Page X of Y`).
  - One-click single page rotation (90°, 180°).
  - Extract active page to a new PDF document.
  - Open in default Windows PDF viewer.

---

### 4. ⚡ Batch Processing Engine
- Drag-and-drop multiple files to automatically activate the Batch Queue.
- **Batch Convert**: Convert hundreds of files simultaneously to WebP, PNG, JPEG, or PDF.
- **Batch Compress**: Optimize entire folders with uniform quality settings.
- **Batch Resize**: Resize collections to uniform dimensions.
- **Batch Images to PDF**: Merge all selected images in order into a single A4 PDF.
- Progress bars, individual status icons (Queued, Processing, Completed, Failed), error logs, and one-click "Show in Explorer".

---

### 5. 🪟 Windows Desktop Integration
- **Windows File Explorer Drag-and-Drop**: Drag any file or group of files from File Explorer directly into the application.
- **Native File & Folder Pickers**: Uses Windows native `dialog.showOpenDialog` and folder selectors.
- **Save Beside Original**: Automatically names output files with clean suffixes (`_cropped`, `_compressed_q80`, `_converted.webp`, `_rotated_90deg`) and handles collision avoidance (`_part_(1)`).
- **Custom Destination Folder**: Option to specify a central export directory in Settings.
- **Reveal in Explorer**: Automatic or on-demand `shell.showItemInFolder()` highlighting newly generated files.
- **Windows Explorer Context Menu**: Built-in 1-click option in Settings to install/uninstall `"Edit / Convert with Universal File Toolkit"` directly into the Windows right-click context menu!
- **Frameless Window with Windows 11 Styling**: Custom titlebar with minimize, maximize/restore, close, layout toggles, theme switcher, and batch indicator.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Desktop Framework** | Electron v31 (Main & Preload with secure ContextBridge IPC) |
| **Frontend Framework** | React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Bundler & Build** | Vite 5 (Renderer), esbuild (Electron Main & Preload) |
| **Image Engine** | Sharp v0.33 (Precompiled native Windows x64 binaries) |
| **PDF Engine** | PDF-Lib (Standard vector PDF generation, merge, split, rotate) |
| **Packaging** | Electron Builder (Windows unpacked directory, portable exe, NSIS installer) |

---

## 🚀 Getting Started & Build Instructions

### Prerequisites
- Windows 10 or Windows 11 (64-bit)
- Node.js `v20.9.0` or higher (verified on Node `v20.15.0`)
- npm `v10+`

### 1. Installation
Clone or navigate to the repository folder:
```bash
cd "E:\Nikhil's Personal\Image Editor"
npm install
```

### 2. Running in Development Mode
Launch Vite dev server and Electron simultaneously with live reloading:
```bash
npm run dev:app
```

Or run the built desktop application directly:
```bash
npm run build
npm start
```

### 3. Running Automated Tests
Verify all Sharp and PDF-Lib end-to-end file operations on real files:
```bash
node test-e2e.js
```

### 4. Packaging the Windows Application
Build the complete standalone Windows desktop executable:
```bash
# Generate unpacked Windows application directory in release/win-unpacked/
npm run dist:dir

# Generate portable standalone .exe
npm run dist:portable

# Generate standard Windows installer (NSIS setup .exe)
npm run dist
```

Output directory:
`release/win-unpacked/Universal File Toolkit.exe`

---

## 🔒 File Safety & Privacy
- **100% Local Execution**: All image transformations, conversions, and PDF manipulation occur entirely on your local CPU without sending any bytes to external cloud servers.
- **Non-Destructive by Default**: Original source files are preserved untouched; modified copies are saved with descriptive suffixes or to a designated folder.
- **Secure Architecture**: Context isolation is strictly enforced; renderer operates without direct filesystem access, communicating exclusively through typed, validated IPC channels.

---

## 📄 License
MIT License. Built for seamless productivity on Windows 10 and 11.
