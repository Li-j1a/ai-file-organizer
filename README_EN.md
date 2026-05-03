# AI File Organizer

<div align="center">

![Electron](https://img.shields.io/badge/Electron-29.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

An intelligent desktop file management tool with integrated AI capabilities to help users quickly organize and manage files.

[Features](#features) • [Quick Start](#quick-start) • [User Guide](#user-guide) • [Development](#development) • [License](#license)

</div>

---

## 📋 Features

### 🤖 AI-Powered Capabilities
- **Smart File Classification** – Uses AI to analyze file content and automatically sort files into appropriate folders
- **Semantic Search** – Supports natural language queries to quickly locate files
- **Smart Renaming** – AI suggests more meaningful and descriptive file names
- **Content Analysis** – Supports content extraction and analysis across multiple file formats

### 📁 File Management
- **Fast Scanning** – Quickly scans Desktop and Downloads folders
- **Multi-dimensional Filtering** – Filter by file type, modified time, creation time, and more
- **Batch Operations** – Supports batch move, delete, rename, and other operations
- **File Preview** – Preview support for common file formats

### ⚙️ System Features
- **Offline Mode** – Core features are fully available without an internet connection
- **Multiple AI Providers** – Supports OpenAI, Claude, Gemini, and other AI services
- **Custom Configuration** – Flexible UI and feature configuration options
- **Data Privacy** – All data processing is done locally; user files are never uploaded

---

## 🚀 Quick Start

### System Requirements
- **OS**: Windows 10+ / macOS 10.13+ / Linux
- **Node.js**: 18.0 or higher
- **Memory**: Minimum 2GB RAM
- **Disk Space**: Minimum 500MB

### Installation

#### Option 1: Use Pre-built Binaries
Download the latest installer from the [Releases](https://github.com/yourusername/AiAssistant/releases) page.

#### Option 2: Build from Source

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/AiAssistant.git
cd AiAssistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Build the application**
```bash
npm run build
```

---

## 📖 User Guide

### Basic Operations

#### 1. File Scanning
- Click "File Organizer" in the sidebar
- Select the folder to scan (Desktop / Downloads / Documents)
- Click the "Start Scan" button

#### 2. File Classification
- **Basic Classification**: The system automatically categorizes files by type
- **AI Smart Classification**: Enable the "AI Smart Classification" option for more accurate categorization suggestions
- **Custom Classification**: Manually adjust file categories as needed

#### 3. Running the Organizer
- Review the file classification results in the preview window
- Click "Start Organizing" to execute file moves
- Files will be moved to their corresponding category folders

#### 4. Smart Search
- Enter keywords or a natural language description in the search box
- Filter results by file type, time range, and other conditions
- Enable AI Search for more intelligent search results

### Configuration Options

#### AI Provider Configuration
Configure your AI service in Settings:

```json
{
  "aiProvider": "openai",
  "apiKey": "your-api-key",
  "model": "gpt-4",
  "timeout": 60000
}
```

Supported providers:
- **OpenAI** – GPT-4, GPT-3.5-turbo
- **Claude** – Claude 3 series
- **Google Gemini** – Gemini Pro
- **Local Models** – Supports locally deployed models

#### UI Configuration
- **Theme Color** – Customize the application theme
- **Opacity** – Adjust window transparency
- **Blur Effect** – Enable/disable background blur

---

## 🛠️ Development

### Project Structure
```
AiAssistant/
├── src/
│   ├── main/              # Electron main process
│   │   └── index.js       # Main process entry point
│   ├── preload/           # Preload scripts
│   │   └── index.js       # IPC interface definitions
│   └── renderer/          # React renderer process
│       └── src/
│           ├── App.jsx    # Root application component
│           ├── pages/     # Page components
│           └── components/# Reusable components
├── public/                # Static assets
├── dist/                  # Build output
└── package.json           # Project configuration
```

### Core Tech Stack
- **Electron** – Cross-platform desktop application framework
- **React 18** – UI framework
- **Ant Design** – UI component library
- **Vite** – Build tool
- **fs-extra** – File system operations
- **axios** – HTTP client

### Development Commands

```bash
# Start development server
npm run dev

# Build the application
npm run build

# Package the application
npm run package

# Run tests
npm run test

# Lint code
npm run lint
```

### IPC Communication

The application uses Electron IPC for communication between the main and renderer processes. Key interfaces:

```javascript
// File operations
window.electronAPI.scanDirectory(path)
window.electronAPI.organizeFiles(dirPath, useAI)
window.electronAPI.executeOrganize(operations)

// AI features
window.electronAPI.callAI(prompt)
window.electronAPI.analyzeFile(filePath)

// System
window.electronAPI.getSpecialPaths()
window.electronAPI.checkDisclaimerAgreed()
```

### Adding New Features

1. **Implement logic in the main process** (`src/main/index.js`)
2. **Register an IPC handler**
```javascript
ipcMain.handle('feature-name', async (event, params) => {
  // Implementation
})
```

3. **Expose the interface in Preload** (`src/preload/index.js`)
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  featureName: (params) => ipcRenderer.invoke('feature-name', params)
})
```

4. **Use it in the renderer process**
```javascript
const result = await window.electronAPI.featureName(params)
```

---

## ⚠️ Disclaimer

- This software is provided "as is" without warranty of any kind
- All actions taken by the user within this software, and any resulting risks (such as file loss or accidental deletion), are the sole responsibility of the user
- When AI features are enabled, AI-generated content is provided by third-party services; users should independently verify the accuracy of any information
- Please refer to the full User Agreement presented at first launch for complete terms

---

## 📦 Dependencies

### Main Dependencies
- electron: ^29.0.0
- react: ^18.2.0
- react-dom: ^18.2.0
- antd: ^5.12.0
- axios: ^1.6.0
- fs-extra: ^11.2.0

### Dev Dependencies
- vite: ^5.0.0
- @vitejs/plugin-react: ^4.2.0
- electron-builder: ^24.6.0

See `package.json` for the full dependency list.

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Reporting Bugs
- Use [GitHub Issues](https://github.com/yourusername/AiAssistant/issues) to report bugs
- Please provide detailed reproduction steps and environment information

### Suggesting Improvements
- Email: wswwciljk@gmail.com
- Describe your idea or improvement suggestion

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Open Source Acknowledgements
This project makes use of the following excellent open source projects:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Vite](https://vitejs.dev/)

---

## 👨‍💻 Developer

**Li Jia**
- 📧 Email: wswwciljk@gmail.com
- 💬 For suggestions or feedback, feel free to reach out via email

---

## 📊 Project Stats

- 📝 Lines of Code: 5,000+
- 📦 Dependencies: 100+
- 🔧 Supported Platforms: Windows, macOS, Linux
- 🌍 Supported Languages: Chinese, English (planned)

---

<div align="center">

**[⬆ Back to Top](#ai-file-organizer)**

Made with ❤️ by Li Jia

</div>
