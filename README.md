# Pokédex Web Application

A premium, responsive, and interactive Pokédex Progressive Web App (PWA) built with **React**, **Vite**, and **TypeScript**. This application features a beautiful glassmorphism design, real-time search, a dedicated Camera Tab for Pokémon classification, and a native Text-to-Speech (TTS) module for reading Pokémon descriptions.

## Prerequisites
- **Node.js** (v18 or higher recommended)
- **Python 3.x** (only if you wish to run the data scraper)

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/thechaos16/pokedex.git
cd pokedex
```

### 2. Install Frontend Dependencies
Since this project uses modern dependencies like `vite-plugin-pwa`, it is recommended to install using the legacy peer dependencies flag if you encounter Vite peer conflicts:
```bash
npm install --legacy-peer-deps
```

### 3. Start the Development Server
To run the app locally with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/` (or whichever port Vite assigns).

---

## 🐍 Data Scraper (Optional)

The application already comes with a pre-populated dataset for the 1st Generation Pokémon (including Alolan, Galarian, and Mega forms up to Mew) located at `src/data/pokemon.json`. 

If you ever want to re-scrape the official Korean Pokédex website to update the data, follow these steps:

1. Navigate to the scraper directory:
   ```bash
   cd scraper
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install requests beautifulsoup4
   ```
4. Run the scraper:
   ```bash
   python3 scrape.py
   ```
This will fetch the latest Pokémon data and automatically update the `src/data/pokemon.json` file.

---

## 📷 AI Vision Classification

The Pokédex includes a **Camera Tab** designed to classify Pokémon in the real world using your device's camera. 
It uses the `Xenova/clip-vit-base-patch32` vision embedding model running entirely locally in the browser via WebAssembly (`@xenova/transformers`). 

By converting the live camera feed into embeddings and comparing them (via cosine similarity) against a local IndexedDB of pre-computed Pokémon embeddings, the application accurately identifies the Pokémon in view. All inferences happen securely on your device!

## 🛠️ Building for Production
To build the app as an installable Progressive Web App (PWA):
```bash
npm run build
```
The optimized files, service workers, and PWA manifests will be generated inside the `dist/` folder.
