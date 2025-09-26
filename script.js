// Mazerunner - NES-stil Labyrintspel
class MazeRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.gameState = 'menu'; // menu, playing, paused, ended
        this.currentDifficulty = 'easy';
        this.soundEnabled = true;
        this.audioContext = null;
        this.sounds = {};

        this.mazeSize = { easy: 5, medium: 10, hard: 15 };
        this.cellSize = 32;
        this.roomSize = 16; // Storlek på varje rutnätsrum

        this.maze = null;
        this.player = {
            x: 0,
            y: 0,
            pixelX: 0,
            pixelY: 0,
            direction: 0, // 0=upp, 1=höger, 2=ner, 3=vänster
            animFrame: 0,
            moving: false,
            torchFlicker: 0
        };

        this.transition = {
            active: false,
            direction: null,
            progress: 0,
            duration: 300
        };

        this.visitedRooms = new Set();
        this.animationFrame = null;
        this.lastTime = 0;

        this.initializeAudio();
        this.initializeEventListeners();
        this.startMenuLoop();
    }

    // Labyrintgenerering med garanterad lösning
    generateMaze(size) {
        const maze = Array(size).fill().map(() => Array(size).fill().map(() => ({
            walls: { top: true, right: true, bottom: true, left: true },
            visited: false,
            isStart: false,
            isEnd: false
        })));

        // Använd recursive backtracking för att skapa labyrint
        const stack = [];
        const startX = 0;
        const startY = 0;
        let currentX = startX;
        let currentY = startY;

        maze[currentY][currentX].visited = true;
        maze[currentY][currentX].isStart = true;

        while (true) {
            const neighbors = this.getUnvisitedNeighbors(maze, currentX, currentY, size);

            if (neighbors.length > 0) {
                const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                stack.push({ x: currentX, y: currentY });

                this.removeWallBetween(maze, currentX, currentY, randomNeighbor.x, randomNeighbor.y);

                currentX = randomNeighbor.x;
                currentY = randomNeighbor.y;
                maze[currentY][currentX].visited = true;
            } else if (stack.length > 0) {
                const cell = stack.pop();
                currentX = cell.x;
                currentY = cell.y;
            } else {
                break;
            }
        }

        // Sätt slutposition längst bort från start
        const endX = size - 1;
        const endY = size - 1;
        maze[endY][endX].isEnd = true;

        // Lägg till några extra öppningar för intresse
        this.addExtraOpenings(maze, size);

        return maze;
    }

    getUnvisitedNeighbors(maze, x, y, size) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // upp
            { x: 1, y: 0 },  // höger
            { x: 0, y: 1 },  // ner
            { x: -1, y: 0 }  // vänster
        ];

        directions.forEach(dir => {
            const newX = x + dir.x;
            const newY = y + dir.y;

            if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
                if (!maze[newY][newX].visited) {
                    neighbors.push({ x: newX, y: newY });
                }
            }
        });

        return neighbors;
    }

    removeWallBetween(maze, x1, y1, x2, y2) {
        if (x1 === x2) {
            if (y1 < y2) {
                maze[y1][x1].walls.bottom = false;
                maze[y2][x2].walls.top = false;
            } else {
                maze[y1][x1].walls.top = false;
                maze[y2][x2].walls.bottom = false;
            }
        } else {
            if (x1 < x2) {
                maze[y1][x1].walls.right = false;
                maze[y2][x2].walls.left = false;
            } else {
                maze[y1][x1].walls.left = false;
                maze[y2][x2].walls.right = false;
            }
        }
    }

    addExtraOpenings(maze, size) {
        const numExtraOpenings = Math.floor(size * 0.3);

        for (let i = 0; i < numExtraOpenings; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            const walls = Object.keys(maze[y][x].walls);
            const randomWall = walls[Math.floor(Math.random() * walls.length)];

            if (Math.random() < 0.3) {
                maze[y][x].walls[randomWall] = false;

                // Ta också bort motsvarande vägg på grannen
                const directions = {
                    top: { x: 0, y: -1, opposite: 'bottom' },
                    right: { x: 1, y: 0, opposite: 'left' },
                    bottom: { x: 0, y: 1, opposite: 'top' },
                    left: { x: -1, y: 0, opposite: 'right' }
                };

                const dir = directions[randomWall];
                const neighborX = x + dir.x;
                const neighborY = y + dir.y;

                if (neighborX >= 0 && neighborX < size && neighborY >= 0 && neighborY < size) {
                    maze[neighborY][neighborX].walls[dir.opposite] = false;
                }
            }
        }
    }

    // Ljud-system
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        let frequency = 440;
        let duration = 0.1;

        switch (type) {
            case 'move':
                frequency = 220;
                duration = 0.05;
                break;
            case 'success':
                frequency = 523;
                duration = 0.3;
                break;
            case 'menu':
                frequency = 330;
                duration = 0.1;
                break;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Rendering
    render(timestamp) {
        // Rensa med ljusgrå bakgrund istället för svart
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing') {
            this.updatePlayer(timestamp);
            this.renderCurrentRoom();
            this.renderPlayer();

            if (this.transition.active) {
                this.renderTransition();
            }
        }

        this.animationFrame = requestAnimationFrame((ts) => this.render(ts));
    }

    renderCurrentRoom() {
        const room = this.maze[this.player.y][this.player.x];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const roomPixelSize = this.roomSize * this.cellSize;

        // Rita bakgrund (stenig golv) - mycket ljus beige
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillRect(centerX - roomPixelSize/2, centerY - roomPixelSize/2, roomPixelSize, roomPixelSize);

        // Lägg till textur på golvet
        this.ctx.fillStyle = '#E6E6FA';
        for (let i = 0; i < 20; i++) {
            const x = centerX - roomPixelSize/2 + Math.random() * roomPixelSize;
            const y = centerY - roomPixelSize/2 + Math.random() * roomPixelSize;
            this.ctx.fillRect(x, y, 2, 2);
        }

        // Rita väggar - mörka för stark kontrast
        this.ctx.fillStyle = '#8B4513';
        const wallThickness = 20;

        if (room.walls.top) {
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY - roomPixelSize/2, roomPixelSize, wallThickness);
            // Lägg till kantdetaljer
            this.ctx.fillStyle = '#D2691E';
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY - roomPixelSize/2, roomPixelSize, 4);
            this.ctx.fillStyle = '#8B4513';
        }
        if (room.walls.right) {
            this.ctx.fillRect(centerX + roomPixelSize/2 - wallThickness, centerY - roomPixelSize/2, wallThickness, roomPixelSize);
            this.ctx.fillStyle = '#D2691E';
            this.ctx.fillRect(centerX + roomPixelSize/2 - wallThickness, centerY - roomPixelSize/2, 4, roomPixelSize);
            this.ctx.fillStyle = '#8B4513';
        }
        if (room.walls.bottom) {
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY + roomPixelSize/2 - wallThickness, roomPixelSize, wallThickness);
            this.ctx.fillStyle = '#D2691E';
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY + roomPixelSize/2 - 4, roomPixelSize, 4);
            this.ctx.fillStyle = '#8B4513';
        }
        if (room.walls.left) {
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY - roomPixelSize/2, wallThickness, roomPixelSize);
            this.ctx.fillStyle = '#D2691E';
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY - roomPixelSize/2, 4, roomPixelSize);
            this.ctx.fillStyle = '#8B4513';
        }

        // Rita dörröppningar som mycket tydliga passager
        const doorWidth = 60;
        this.ctx.fillStyle = '#228B22';

        if (!room.walls.top) {
            this.ctx.fillRect(centerX - doorWidth/2, centerY - roomPixelSize/2, doorWidth, wallThickness);
            // Markera dörröppning med ljusare kanter
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(centerX - doorWidth/2, centerY - roomPixelSize/2, 3, wallThickness);
            this.ctx.fillRect(centerX + doorWidth/2 - 3, centerY - roomPixelSize/2, 3, wallThickness);
        }
        if (!room.walls.right) {
            this.ctx.fillStyle = '#505050';
            this.ctx.fillRect(centerX + roomPixelSize/2 - wallThickness, centerY - doorWidth/2, wallThickness, doorWidth);
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(centerX + roomPixelSize/2 - wallThickness, centerY - doorWidth/2, wallThickness, 3);
            this.ctx.fillRect(centerX + roomPixelSize/2 - wallThickness, centerY + doorWidth/2 - 3, wallThickness, 3);
        }
        if (!room.walls.bottom) {
            this.ctx.fillStyle = '#505050';
            this.ctx.fillRect(centerX - doorWidth/2, centerY + roomPixelSize/2 - wallThickness, doorWidth, wallThickness);
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(centerX - doorWidth/2, centerY + roomPixelSize/2 - wallThickness, 3, wallThickness);
            this.ctx.fillRect(centerX + doorWidth/2 - 3, centerY + roomPixelSize/2 - wallThickness, 3, wallThickness);
        }
        if (!room.walls.left) {
            this.ctx.fillStyle = '#505050';
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY - doorWidth/2, wallThickness, doorWidth);
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY - doorWidth/2, wallThickness, 3);
            this.ctx.fillRect(centerX - roomPixelSize/2, centerY + doorWidth/2 - 3, wallThickness, 3);
        }

        // Markera slutrum med tydlig gul markering
        if (room.isEnd) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(centerX - 35, centerY - 35, 70, 70);

            // Lägg till ram runt utgången
            this.ctx.fillStyle = '#FF8C00';
            this.ctx.fillRect(centerX - 35, centerY - 35, 70, 5);
            this.ctx.fillRect(centerX - 35, centerY + 30, 70, 5);
            this.ctx.fillRect(centerX - 35, centerY - 35, 5, 70);
            this.ctx.fillRect(centerX + 30, centerY - 35, 5, 70);

            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('UTGÅNG', centerX, centerY + 5);
        }
    }


    renderPlayer() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Räkna ut facklans flimmer för lågan
        const torchIntensity = 0.9 + Math.sin(this.player.torchFlicker) * 0.1;

        // Rita spelaren som en mycket synlig karaktär
        this.ctx.fillStyle = '#FF0000'; // Stark röd kropp
        this.ctx.fillRect(centerX - 12, centerY - 15, 24, 30);

        // Rita huvud
        this.ctx.fillStyle = '#FFB6C1'; // Ljusrosa huvud
        this.ctx.fillRect(centerX - 10, centerY - 25, 20, 15);

        // Rita facklan
        const torchX = centerX + (this.player.direction === 1 ? 15 : this.player.direction === 3 ? -15 : 0);
        const torchY = centerY - 10;

        this.ctx.fillStyle = '#8B4513'; // Brun pinne
        this.ctx.fillRect(torchX - 3, torchY - 8, 6, 16);

        // Rita lågan
        this.ctx.fillStyle = '#FF4500'; // Orange låga
        this.ctx.fillRect(torchX - 5, torchY - 18, 10, 12);

        // Rita ögon
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(centerX - 6, centerY - 22, 3, 3);
        this.ctx.fillRect(centerX + 3, centerY - 22, 3, 3);
    }

    updatePlayer(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Uppdatera övergångsanimation
        if (this.transition.active) {
            this.transition.progress += deltaTime;
            if (this.transition.progress >= this.transition.duration) {
                this.transition.active = false;
                this.transition.progress = 0;
            }
        }
    }

    renderTransition() {
        const progress = this.transition.progress / this.transition.duration;
        this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - progress})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Kontroller och rörelse
    movePlayer(direction) {
        if (this.transition.active) return;

        const room = this.maze[this.player.y][this.player.x];
        let canMove = false;
        let newX = this.player.x;
        let newY = this.player.y;

        switch (direction) {
            case 'up':
                if (!room.walls.top && this.player.y > 0) {
                    newY--;
                    canMove = true;
                }
                this.player.direction = 0;
                break;
            case 'right':
                if (!room.walls.right && this.player.x < this.mazeSize[this.currentDifficulty] - 1) {
                    newX++;
                    canMove = true;
                }
                this.player.direction = 1;
                break;
            case 'down':
                if (!room.walls.bottom && this.player.y < this.mazeSize[this.currentDifficulty] - 1) {
                    newY++;
                    canMove = true;
                }
                this.player.direction = 2;
                break;
            case 'left':
                if (!room.walls.left && this.player.x > 0) {
                    newX--;
                    canMove = true;
                }
                this.player.direction = 3;
                break;
        }

        if (canMove) {
            this.playSound('move');
            this.startTransition(direction);
            this.player.x = newX;
            this.player.y = newY;
            this.visitedRooms.add(`${newX},${newY}`);

            // Kolla om spelaren nått slutet
            if (this.maze[newY][newX].isEnd) {
                this.playSound('success');
                setTimeout(() => this.endGame(), 500);
            }
        }
    }

    startTransition(direction) {
        this.transition.active = true;
        this.transition.direction = direction;
        this.transition.progress = 0;
    }

    // Event-hantering
    initializeEventListeners() {
        // Tangentbordskontroller
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                switch (e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        e.preventDefault();
                        this.movePlayer('up');
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        e.preventDefault();
                        this.movePlayer('right');
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        e.preventDefault();
                        this.movePlayer('down');
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        e.preventDefault();
                        this.movePlayer('left');
                        break;
                    case 'Escape':
                        this.pauseGame();
                        break;
                }
            }
        });

        // Touch-kontroller för mobil
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing') return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const minSwipeDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    this.movePlayer(deltaX > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    this.movePlayer(deltaY > 0 ? 'down' : 'up');
                }
            }
        });

        // Meny-knappar
        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playSound('menu');
                this.currentDifficulty = e.target.dataset.difficulty;
                this.startGame();
            });
        });

        document.getElementById('sound-toggle').addEventListener('click', this.toggleSound.bind(this));
        document.getElementById('pause-btn').addEventListener('click', this.pauseGame.bind(this));
        document.getElementById('resume-btn').addEventListener('click', this.resumeGame.bind(this));
        document.getElementById('restart-btn').addEventListener('click', this.restartGame.bind(this));
        document.getElementById('quit-btn').addEventListener('click', this.quitToMenu.bind(this));
        document.getElementById('play-again').addEventListener('click', this.restartGame.bind(this));
        document.getElementById('main-menu-btn').addEventListener('click', this.quitToMenu.bind(this));
    }

    // Speltillstånd
    startGame() {
        this.gameState = 'playing';
        this.maze = this.generateMaze(this.mazeSize[this.currentDifficulty]);
        this.player.x = 0;
        this.player.y = 0;
        this.player.direction = 0;
        this.visitedRooms.clear();
        this.visitedRooms.add('0,0');

        document.getElementById('level-info').textContent = `NIVÅ: ${this.currentDifficulty.toUpperCase()}`;
        this.showScreen('game-screen');

        if (!this.animationFrame) {
            this.render(0);
        }
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pause-menu');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('game-screen');
        }
    }

    restartGame() {
        this.startGame();
    }

    endGame() {
        this.gameState = 'ended';
        this.showScreen('end-screen');
    }

    quitToMenu() {
        this.gameState = 'menu';
        this.showScreen('main-menu');
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('sound-toggle');
        btn.textContent = this.soundEnabled ? '🔊 LJUD: PÅ' : '🔇 LJUD: AV';
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    startMenuLoop() {
        this.showScreen('main-menu');
    }
}

// Starta spelet när DOM är laddat
document.addEventListener('DOMContentLoaded', () => {
    new MazeRunner();
});