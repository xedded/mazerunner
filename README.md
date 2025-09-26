# 🏰 Mazerunner - NES-stil Labyrintspel

Ett retro-inspirerat labyrintspel i NES-stil där du navigerar genom mörka slottrum med endast en fackla som sällskap.

## 🎮 Spelöversikt

**Mazerunner** är ett browserbaserat labyrintspel som kombinerar klassisk NES-estetik med modern webbteknologi. Spelet fungerar på både desktop och mobila enheter med intuitiva kontroller.

### Spelmekanik
- **Mål**: Hitta utgången ur slottlabyrinten
- **Kontroller**:
  - Desktop: Piltangenter eller WASD
  - Mobil: Swipe-gester
- **Svårighetsgrader**:
  - Lätt: 5×5 rutnät
  - Medel: 10×10 rutnät
  - Svår: 15×15 rutnät

### Funktioner
- 🎨 Autentisk NES-färgpalett och pixelgrafik
- 🔥 Animerad fackeleffekt med dynamisk belysning
- 🌫️ Fog of war - utforska rummen ett i taget
- 🎵 Retro-ljudeffekter (kan stängas av)
- 📱 Responsiv design för alla enheter
- 🎯 Procedurellt genererade labyrinter med garanterad lösning

## 🚀 Demo

Spela direkt i webbläsaren: [Live Demo](https://mazerunner-vercel.app)

## 🛠️ Teknik

### Utvecklat med:
- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Hosting**: Vercel
- **Versionshantering**: GitHub

### Arkitektur:
- Objektsorienterad JavaScript-struktur
- Canvas-baserad rendering för pixelperfekt grafik
- Web Audio API för retro-ljudeffekter
- Responsive design med CSS Grid/Flexbox
- Touch-stöd för mobila enheter

## 🎯 Algoritmer

### Labyrintgenerering
Använder **Recursive Backtracking** algoritmen för att:
- Garantera att det finns exakt en lösning mellan start och mål
- Skapa naturligt utseende korridorer
- Lägga till strategiska extra öppningar för variation

### Spellogik
- Smooth transitions mellan rum
- Optimerad rendering-loop
- Effektiv kollisionsdetektering

## 🎨 Design

### NES-inspirerade element:
- 54-färgad autentisk NES-palett
- Pixel-perfect rendering
- Retro-typografi med skuggeffekter
- Klassiska menyanimationer
- Kvadratisk ljudgenerering

## 🔧 Installation & Utveckling

```bash
# Klona projektet
git clone https://github.com/[ditt-användarnamn]/mazerunner.git
cd mazerunner

# Öppna i webbläsare (ingen build-process behövs)
open index.html
# eller använd en lokal server:
python -m http.server 8000
```

## 📝 Utvecklingsroadmap

### Planerade funktioner:
- [ ] Flera karaktärer att välja mellan
- [ ] Powerups och specialföremål
- [ ] Tidsutmaning-läge
- [ ] Lokal highscore-lista
- [ ] Fler ljud- och musikspår
- [ ] Animerade fiender och hinder

## 🤝 Bidrag

Bidrag är välkomna! Skapa gärna en issue eller pull request.

### Utvecklingsmiljö:
1. Forka projektet
2. Skapa en feature-branch
3. Commita dina ändringar
4. Pusha till din fork
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är open source och tillgängligt under [MIT License](LICENSE).

## 🎮 Kontroller

### Desktop:
- **Piltangenter** eller **WASD** - Rörelse
- **ESC** - Pausa spel

### Mobil:
- **Swipe upp/ner/vänster/höger** - Rörelse
- **Tryck på pausknappen** - Pausa spel

## 🔊 Ljud

Spelet inkluderar autentiska NES-inspirerade ljudeffekter:
- Rörelseljud
- Framgångsmelodi
- Menynavigering

Ljud kan enkelt stängas av via inställningar.

---

**Utvecklad med ❤️ för retro-spelälskare**