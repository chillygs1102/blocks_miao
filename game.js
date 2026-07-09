const GRID_SIZE = 9;
const COLORS = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7'];
const POWER_UPS = ['remove-block', 'remove-row', 'remove-color', 'move-any'];
const POWER_UP_CHANCE = 0.05;

class Game {
    constructor() {
        this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        this.blocks = [];
        this.score = 0;
        this.round = 1;
        this.combo = 0;
        this.powerUpCounts = {
            'remove-block': 0,
            'remove-row': 0,
            'remove-color': 0,
            'move-any': 0
        };
        this.selectedBlock = null;
        this.selectedCell = null;
        this.gameOver = false;
        this.powerUpMode = null;
        this.powerUpTarget = null;
        this.isDragging = false;
        this.dragBlock = null;
        this.dragStartCol = 0;
        this.dragCurrentCol = 0;
        this.nextBlocks = [];
        this.isProcessing = false;
        this.lastColors = [];
        
        this.initDOM();
        this.startGame();
    }
    
    initDOM() {
        this.cells = document.querySelectorAll('.cell');
        this.previewCells = document.querySelectorAll('.preview-cell');
        this.scoreEl = document.getElementById('score');
        this.roundEl = document.getElementById('round');
        this.comboEl = document.getElementById('combo');
        this.messageEl = document.getElementById('message');
        this.gameOverEl = document.getElementById('game-over');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalRoundEl = document.getElementById('final-round');
        
        this.cells.forEach(cell => {
            cell.addEventListener('mousedown', (e) => this.handleMouseDown(e, cell));
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
        
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', () => this.handleMouseUp());
        
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        
        document.getElementById('pu-btn-remove-block').addEventListener('click', () => this.usePowerUp('remove-block'));
        document.getElementById('pu-btn-remove-row').addEventListener('click', () => this.usePowerUp('remove-row'));
        document.getElementById('pu-btn-remove-color').addEventListener('click', () => this.usePowerUp('remove-color'));
        document.getElementById('pu-btn-move-any').addEventListener('click', () => this.usePowerUp('move-any'));
    }
    
    startGame() {
        this.resetGrid();
        
        const blocks = [
            { row: 8, col: 0, length: 3, color: 'color-1' },
            { row: 8, col: 4, length: 2, color: 'color-2' },
            { row: 8, col: 7, length: 2, color: 'color-3' },
            { row: 7, col: 1, length: 2, color: 'color-4' },
            { row: 7, col: 4, length: 3, color: 'color-5' },
            { row: 6, col: 0, length: 4, color: 'color-6' },
            { row: 6, col: 5, length: 2, color: 'color-7' },
        ];
        
        blocks.forEach(b => {
            const block = {
                id: b.row + '-' + b.col,
                row: b.row,
                col: b.col,
                length: b.length,
                color: b.color,
                powerUp: null
            };
            this.blocks.push(block);
            for (let i = 0; i < block.length; i++) {
                this.grid[block.row][block.col + i] = block;
            }
        });
        
        this.generateNextBlocksPreview();
        this.render();
        this.updateUI();
        this.showMessage('点击积木选中，然后点击目标位置移动');
    }
    
    applyGravitySync() {
        const processedBlocks = new Set();
        
        for (let row = GRID_SIZE - 2; row >= 0; row--) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (this.grid[row][col] !== null) {
                    const block = this.grid[row][col];
                    
                    if (!processedBlocks.has(block.id)) {
                        processedBlocks.add(block.id);
                        
                        let maxDrop = 0;
                        
                        while (row + maxDrop + 1 < GRID_SIZE) {
                            let canDrop = true;
                            for (let i = 0; i < block.length; i++) {
                                const targetRow = row + maxDrop + 1;
                                const targetCol = block.col + i;
                                if (targetCol >= GRID_SIZE) {
                                    canDrop = false;
                                    break;
                                }
                                if (this.grid[targetRow][targetCol] !== null && this.grid[targetRow][targetCol] !== block) {
                                    canDrop = false;
                                    break;
                                }
                            }
                            
                            if (!canDrop) break;
                            maxDrop++;
                        }
                        
                        if (maxDrop > 0) {
                            this.removeBlockFromGrid(block);
                            block.row += maxDrop;
                            this.placeBlockOnGrid(block);
                        }
                    }
                }
            }
        }
    }
    
    resetGrid() {
        this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        this.blocks = [];
    }
    
    generateInitialBlocks() {
        const blocks = [
            { row: GRID_SIZE - 1, col: 0, length: 3, color: 'color-1' },
            { row: GRID_SIZE - 1, col: 4, length: 2, color: 'color-2' },
            { row: GRID_SIZE - 1, col: 7, length: 2, color: 'color-3' },
            { row: GRID_SIZE - 2, col: 1, length: 2, color: 'color-4' },
            { row: GRID_SIZE - 2, col: 4, length: 3, color: 'color-5' },
            { row: GRID_SIZE - 2, col: 8, length: 1, color: 'color-6' },
            { row: GRID_SIZE - 3, col: 0, length: 4, color: 'color-7' },
            { row: GRID_SIZE - 3, col: 5, length: 2, color: 'color-1' },
            { row: GRID_SIZE - 4, col: 3, length: 3, color: 'color-2' },
        ];
        
        blocks.forEach(b => {
            if (b.col + b.length <= GRID_SIZE && b.row >= 0) {
                let canPlace = true;
                for (let i = 0; i < b.length; i++) {
                    if (this.grid[b.row][b.col + i] !== null) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    const block = {
                        id: Date.now() + Math.random() + b.row + b.col,
                        row: b.row,
                        col: b.col,
                        length: b.length,
                        color: b.color,
                        powerUp: Math.random() < POWER_UP_CHANCE ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : null
                    };
                    this.blocks.push(block);
                    this.placeBlockOnGrid(block);
                }
            }
        });
    }
    
    generateBlock(row, length = null) {
        if (length === null) {
            length = Math.floor(Math.random() * 4) + 1;
        }
        let color = COLORS[Math.floor(Math.random() * COLORS.length)];
        if (this.lastColors.length >= 2) {
            while (this.lastColors.includes(color)) {
                color = COLORS[Math.floor(Math.random() * COLORS.length)];
            }
        }
        this.lastColors.push(color);
        if (this.lastColors.length > 3) {
            this.lastColors.shift();
        }
        const maxCol = GRID_SIZE - length;
        if (maxCol < 0) return;
        
        let col = Math.floor(Math.random() * (maxCol + 1));
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!this.canPlaceBlock(row, col, length) && attempts < maxAttempts) {
            col++;
            if (col > maxCol) {
                col = Math.floor(Math.random() * (maxCol + 1));
            }
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            return;
        }
        
        const hasPowerUp = Math.random() < POWER_UP_CHANCE;
        const powerUp = hasPowerUp ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : null;
        
        const block = {
            id: Date.now() + Math.random(),
            row,
            col,
            length,
            color,
            powerUp
        };
        
        this.blocks.push(block);
        this.placeBlockOnGrid(block);
    }
    
    canPlaceBlock(row, col, length) {
        for (let i = 0; i < length; i++) {
            if (this.grid[row][col + i] !== null) {
                return false;
            }
        }
        return true;
    }
    
    placeBlockOnGrid(block) {
        for (let i = 0; i < block.length; i++) {
            this.grid[block.row][block.col + i] = block;
        }
    }
    
    removeBlockFromGrid(block) {
        for (let i = 0; i < block.length; i++) {
            if (this.grid[block.row][block.col + i] === block) {
                this.grid[block.row][block.col + i] = null;
            }
        }
    }
    
    applyGravity() {
        return new Promise((resolve) => {
            let hasMoved = true;
            let iterations = 0;
            
            while (hasMoved && iterations < GRID_SIZE) {
                hasMoved = false;
                iterations++;
                
                for (let row = GRID_SIZE - 2; row >= 0; row--) {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        if (this.grid[row][col] !== null) {
                            const block = this.grid[row][col];
                            
                            let canDrop = true;
                            for (let i = 0; i < block.length; i++) {
                                const targetCol = block.col + i;
                                if (targetCol >= GRID_SIZE || this.grid[row + 1][targetCol] !== null) {
                                    canDrop = false;
                                    break;
                                }
                            }
                            
                            if (canDrop) {
                                this.removeBlockFromGrid(block);
                                block.row++;
                                this.placeBlockOnGrid(block);
                                hasMoved = true;
                            }
                        }
                    }
                }
            }
            
            this.render();
            
            setTimeout(() => {
                resolve();
            }, 250);
        });
    }
    
    handleMouseDown(e, cell) {
        if (this.gameOver || this.powerUpMode || this.isProcessing) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const block = this.grid[row][col];
        
        if (block) {
            e.preventDefault();
            this.isDragging = true;
            this.dragBlock = block;
            this.dragStartCol = col;
            this.dragCurrentCol = col;
            this.dragOriginalCol = block.col;
            this.selectedBlock = block;
            this.render();
            this.showMessage('拖拽积木到目标位置');
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.dragBlock) return;
        
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.classList.contains('cell')) {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);
            
            if (row === this.dragBlock.row) {
                this.dragCurrentCol = col;
                this.selectedBlock = this.dragBlock;
                this.render();
            }
        }
    }
    
    handleTouchStart(e) {
        if (this.gameOver || this.powerUpMode) return;
        
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (target && target.classList.contains('cell')) {
            e.preventDefault();
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);
            const block = this.grid[row][col];
            
            if (block) {
                this.isDragging = true;
                this.dragBlock = block;
                this.dragStartCol = col;
                this.selectedBlock = block;
                this.render();
                this.showMessage('拖拽积木到目标位置');
            }
        }
    }
    
    handleTouchMove(e) {
        if (!this.isDragging || !this.dragBlock) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (target && target.classList.contains('cell')) {
            const row = parseInt(target.dataset.row);
            const col = parseInt(target.dataset.col);
            
            if (row === this.dragBlock.row) {
                this.dragCurrentCol = col;
                this.selectedBlock = this.dragBlock;
                this.render();
            }
        }
    }
    
    handleMouseUp() {
        if (!this.isDragging || !this.dragBlock) {
            this.isDragging = false;
            this.dragBlock = null;
            return;
        }
        
        this.isDragging = false;
        const block = this.dragBlock;
        const targetCol = this.dragCurrentCol;
        this.dragBlock = null;
        this.selectedBlock = null;
        
        const previewCol = this.getDragPreviewCol();
        
        if (previewCol !== block.col) {
            this.tryMoveBlock(targetCol);
        } else {
            this.render();
            this.showMessage('点击积木选中，点击同行任意空格移动');
        }
    }
    
    handleCellClick(cell) {
        if (this.gameOver || this.isProcessing) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.powerUpMode) {
            this.handlePowerUpSelection(row, col);
            return;
        }
        
        const clickedBlock = this.grid[row][col];
        
        if (clickedBlock) {
            if (this.selectedBlock && this.selectedBlock.id === clickedBlock.id) {
                this.clearSelection();
                return;
            }
            
            this.selectedBlock = clickedBlock;
            this.selectedCell = { row: clickedBlock.row, col: clickedBlock.col };
            this.render();
            this.showMessage('已选中积木，点击同行任意空格移动');
        } else if (this.selectedBlock) {
            this.tryMoveBlock(col);
        }
    }
    
    async tryMoveBlock(targetCol) {
        if (this.isProcessing) return;
        if (!this.selectedBlock) return;
        
        this.isProcessing = true;
        
        const block = this.selectedBlock;
        const targetRow = block.row;
        
        const direction = targetCol > block.col ? 1 : -1;
        let newCol = block.col;
        
        if (direction === 1) {
            const maxEndCol = Math.min(targetCol + block.length - 1, GRID_SIZE - 1);
            const minEndCol = block.col + block.length - 1;
            
            for (let endCol = maxEndCol; endCol > minEndCol; endCol--) {
                const startCol = endCol - block.length + 1;
                let canPlace = true;
                for (let i = 0; i < block.length; i++) {
                    if (this.grid[targetRow][startCol + i] !== null && this.grid[targetRow][startCol + i] !== block) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    newCol = startCol;
                    break;
                }
            }
        } else {
            const minEndCol = Math.max(targetCol + block.length - 1, block.length - 1);
            const maxEndCol = block.col + block.length - 1;
            
            for (let endCol = minEndCol; endCol < maxEndCol; endCol++) {
                const startCol = endCol - block.length + 1;
                let canPlace = true;
                for (let i = 0; i < block.length; i++) {
                    if (this.grid[targetRow][startCol + i] !== null && this.grid[targetRow][startCol + i] !== block) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    newCol = startCol;
                    break;
                }
            }
        }
        
        if (newCol === block.col) {
            this.showMessage('无法移动到该位置！');
            return;
        }
        
        this.removeBlockFromGrid(block);
        block.col = newCol;
        this.placeBlockOnGrid(block);
        
        this.clearSelection();
        this.render();
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await this.applyGravity();
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const hasClear = await this.processRowClears();
        
        if (!hasClear) {
            this.combo = 0;
        }
        
        setTimeout(() => {
            this.endTurn();
        }, 200);
    }
    
    clearSelection() {
        this.selectedBlock = null;
        this.selectedCell = null;
        this.render();
    }
    
    async processRowClears() {
        let hasCleared = true;
        let anyCleared = false;
        
        while (hasCleared) {
            hasCleared = await this.checkRowClear();
            
            if (hasCleared) {
                anyCleared = true;
                await this.applyGravity();
                this.render();
            }
        }
        
        if (this.checkGameOver()) {
            this.endGame();
        } else {
            this.updateUI();
        }
        
        return anyCleared;
    }
    
    async checkRowClear() {
        let clearedRows = [];
        
        for (let row = 0; row < GRID_SIZE; row++) {
            let filledCells = 0;
            const processedBlocks = new Set();
            
            for (let col = 0; col < GRID_SIZE; col++) {
                if (this.grid[row][col] !== null) {
                    const block = this.grid[row][col];
                    
                    if (!processedBlocks.has(block.id)) {
                        filledCells += block.length;
                        processedBlocks.add(block.id);
                    }
                }
            }
            
            if (filledCells === GRID_SIZE) {
                clearedRows.push(row);
            }
        }
        
        if (clearedRows.length > 0) {
            await this.clearRows(clearedRows);
            this.calculateScore(clearedRows.length);
            return true;
        } else {
            return false;
        }
    }
    
    clearRows(rows) {
        return new Promise((resolve) => {
            const removedBlocks = new Set();
            
            rows.forEach(row => {
                for (let col = 0; col < GRID_SIZE; col++) {
                    if (this.grid[row][col] !== null) {
                        const block = this.grid[row][col];
                        
                        if (!removedBlocks.has(block.id)) {
                            if (block.powerUp) {
                                this.powerUpCounts[block.powerUp]++;
                                this.showMessage(`获得道具：${this.getPowerUpName(block.powerUp)}！`);
                            }
                            
                            removedBlocks.add(block.id);
                        }
                    }
                }
            });
            
            rows.forEach(row => {
                for (let col = 0; col < GRID_SIZE; col++) {
                    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('clearing');
                    }
                }
            });
            
            setTimeout(() => {
                removedBlocks.forEach(blockId => {
                    const block = this.blocks.find(b => b.id === blockId);
                    if (block) {
                        this.removeBlockFromGrid(block);
                    }
                });
                
                this.blocks = this.blocks.filter(block => !removedBlocks.has(block.id));
                
                rows.forEach(row => {
                    for (let col = 0; col < GRID_SIZE; col++) {
                        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.remove('clearing');
                        }
                    }
                });
                
                resolve();
            }, 400);
        });
    }
    
    calculateScore(rowCount) {
        const baseScore = rowCount * 1000;
        this.score += baseScore;
        
        this.combo++;
        if (this.combo >= 2) {
            const bonus = this.combo * 1000;
            this.score += bonus;
            this.showMessage(`连击奖励 +${bonus}！`);
        }
        
        this.updateUI();
    }
    
    async endTurn() {
        if (this.gameOver) return;
        
        this.isProcessing = true;
        this.round++;
        
        if (this.checkGameOver()) {
            this.render();
            this.endGame();
            return;
        }
        
        this.shiftBlocksUp();
        
        this.generateNewBlocks();
        await this.applyGravity();
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        await this.processRowClears();
        
        if (!this.gameOver) {
            this.render();
            this.updateUI();
            this.showMessage('回合开始！点击积木选中并移动');
        }
        
        this.isProcessing = false;
    }
    
    shiftBlocksUp() {
        this.blocks.forEach(block => {
            this.removeBlockFromGrid(block);
            block.row--;
        });
        
        this.blocks = this.blocks.filter(block => block.row >= 0);
        
        this.blocks.forEach(block => {
            this.placeBlockOnGrid(block);
        });
    }
    
    generateNewBlocks() {
        if (this.nextBlocks.length > 0) {
            this.nextBlocks.forEach(block => {
                const newBlock = {
                    id: Date.now() + Math.random(),
                    row: GRID_SIZE - 1,
                    col: block.col,
                    length: block.length,
                    color: block.color,
                    powerUp: Math.random() < POWER_UP_CHANCE ? POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)] : null
                };
                this.blocks.push(newBlock);
                this.placeBlockOnGrid(newBlock);
            });
        } else {
            let totalLength = 0;
            const blockCount = Math.floor(Math.random() * 4) + 1;
            
            for (let i = 0; i < blockCount; i++) {
                const maxLength = Math.min(4, GRID_SIZE - 1 - totalLength - (blockCount - i - 1));
                if (maxLength < 1) break;
                
                const length = Math.floor(Math.random() * maxLength) + 1;
                this.generateBlock(GRID_SIZE - 1, length);
                totalLength += length;
            }
        }
        
        this.generateNextBlocksPreview();
    }
    
    generateNextBlocksPreview() {
        this.nextBlocks = [];
        const blockCount = Math.floor(Math.random() * 4) + 1;
        
        let usedCols = new Set();
        let totalLength = 0;
        
        for (let i = 0; i < blockCount; i++) {
            const maxLength = Math.min(4, GRID_SIZE - 1 - totalLength - (blockCount - i - 1));
            if (maxLength < 1) break;
            
            const length = Math.floor(Math.random() * maxLength) + 1;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const maxCol = GRID_SIZE - length;
            if (maxCol < 0) continue;
            
            let col = Math.floor(Math.random() * (maxCol + 1));
            let attempts = 0;
            const maxAttempts = 100;
            
            while (attempts < maxAttempts) {
                let conflict = false;
                for (let j = 0; j < length; j++) {
                    if (usedCols.has(col + j)) {
                        conflict = true;
                        break;
                    }
                }
                
                if (!conflict) break;
                
                col++;
                if (col > maxCol) {
                    col = Math.floor(Math.random() * (maxCol + 1));
                }
                attempts++;
            }
            
            if (attempts >= maxAttempts) continue;
            
            for (let j = 0; j < length; j++) {
                usedCols.add(col + j);
            }
            totalLength += length;
            
            this.nextBlocks.push({
                col: col,
                length: length,
                color: color
            });
        }
    }
    
    checkGameOver() {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (this.grid[0][col] !== null) {
                return true;
            }
        }
        return false;
    }
    
    endGame() {
        this.gameOver = true;
        this.finalScoreEl.textContent = this.score;
        this.finalRoundEl.textContent = this.round;
        this.gameOverEl.classList.add('show');
    }
    
    restartGame() {
        this.gameOver = false;
        this.score = 0;
        this.round = 1;
        this.combo = 0;
        this.selectedBlock = null;
        this.selectedCell = null;
        this.powerUpMode = null;
        this.powerUpTarget = null;
        this.powerUpCounts = {
            'remove-block': 0,
            'remove-row': 0,
            'remove-color': 0,
            'move-any': 0
        };
        this.lastColors = [];
        this.isProcessing = false;
        
        this.gameOverEl.classList.remove('show');
        this.startGame();
    }
    
    usePowerUp(type) {
        if (this.gameOver) return;
        
        if (this.powerUpCounts[type] <= 0) {
            this.showMessage('该道具数量不足！');
            return;
        }
        
        this.powerUpMode = type;
        this.clearSelection();
        
        switch (type) {
            case 'remove-block':
                this.showMessage('点击要消除的积木');
                break;
            case 'remove-row':
                this.showMessage('点击要消除的行');
                break;
            case 'remove-color':
                this.showMessage('点击要消除的颜色');
                break;
            case 'move-any':
                this.showMessage('点击要移动的积木');
                break;
        }
    }
    
    async handlePowerUpSelection(row, col) {
        const block = this.grid[row][col];
        
        switch (this.powerUpMode) {
            case 'remove-block':
                if (block) {
                    this.removeBlockFromGrid(block);
                    this.blocks = this.blocks.filter(b => b.id !== block.id);
                    this.powerUpCounts['remove-block']--;
                    this.showMessage('积木已消除！');
                    await this.applyGravity();
                    await this.processRowClears();
                } else {
                    this.showMessage('请点击有积木的格子');
                    return;
                }
                break;
                
            case 'remove-row':
                await this.clearRows([row]);
                this.powerUpCounts['remove-row']--;
                this.showMessage('整行已消除！');
                await this.applyGravity();
                await this.processRowClears();
                break;
                
            case 'remove-color':
                if (block) {
                    const targetColor = block.color;
                    this.blocks.forEach(b => {
                        if (b.color === targetColor) {
                            if (b.powerUp) {
                                this.powerUpCounts[b.powerUp]++;
                            }
                            this.removeBlockFromGrid(b);
                        }
                    });
                    this.blocks = this.blocks.filter(b => b.color !== targetColor);
                    this.powerUpCounts['remove-color']--;
                    this.showMessage('同色积木已消除！');
                    await this.applyGravity();
                    await this.processRowClears();
                } else {
                    this.showMessage('请点击有积木的格子');
                    return;
                }
                break;
                
            case 'move-any':
                if (block) {
                    this.powerUpTarget = block;
                    this.powerUpMode = 'move-any-target';
                    this.showMessage('点击目标位置移动积木');
                    return;
                } else {
                    this.showMessage('请点击要移动的积木');
                    return;
                }
                break;
                
            case 'move-any-target':
                const targetBlock = this.powerUpTarget;
                const targetLength = targetBlock.length;
                
                if (col + targetLength > GRID_SIZE) {
                    this.showMessage('目标位置空间不足！');
                    return;
                }
                
                let canPlace = true;
                for (let i = 0; i < targetLength; i++) {
                    if (this.grid[row][col + i] !== null) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    this.removeBlockFromGrid(targetBlock);
                    targetBlock.row = row;
                    targetBlock.col = col;
                    this.placeBlockOnGrid(targetBlock);
                    this.powerUpCounts['move-any']--;
                    this.showMessage('积木已移动！');
                    await this.applyGravity();
                    await this.processRowClears();
                } else {
                    this.showMessage('目标位置空间不足！');
                    return;
                }
                break;
        }
        
        this.powerUpMode = null;
        this.powerUpTarget = null;
        this.render();
        this.updateUI();
    }
    
    getPowerUpName(type) {
        const names = {
            'remove-block': '🗑️ 消除积木',
            'remove-row': '➡️ 消除行',
            'remove-color': '🌈 消除同色',
            'move-any': '✈️ 任意移动'
        };
        return names[type] || type;
    }
    
    render() {
        this.cells.forEach(cell => {
            cell.className = 'cell';
            cell.innerHTML = '';
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            const block = this.grid[row][col];
            
            if (block) {
                if (this.isDragging && this.dragBlock && this.dragBlock.id === block.id) {
                    const dragPreviewCol = this.getDragPreviewCol();
                    if (col >= dragPreviewCol && col < dragPreviewCol + block.length) {
                        cell.classList.add('block', block.color);
                        if (col === dragPreviewCol) cell.classList.add('block-left');
                        if (col === dragPreviewCol + block.length - 1) cell.classList.add('block-right');
                        if (col === dragPreviewCol && block.powerUp) {
                            const icon = this.getPowerUpIcon(block.powerUp);
                            const iconEl = document.createElement('span');
                            iconEl.className = 'cell-powerup-icon';
                            iconEl.textContent = icon;
                            cell.appendChild(iconEl);
                            cell.classList.add('has-powerup');
                        }
                        cell.classList.add('dragging', 'preview');
                    } else if (col >= block.col && col < block.col + block.length) {
                        cell.classList.add('block', block.color, 'drag-source');
                        if (col === block.col && block.powerUp) {
                            const icon = this.getPowerUpIcon(block.powerUp);
                            const iconEl = document.createElement('span');
                            iconEl.className = 'cell-powerup-icon';
                            iconEl.textContent = icon;
                            cell.appendChild(iconEl);
                            cell.classList.add('has-powerup');
                        }
                    }
                } else {
                    cell.classList.add('block', block.color);
                    
                    if (col === block.col) cell.classList.add('block-left');
                    if (col === block.col + block.length - 1) cell.classList.add('block-right');
                    
                    if (col === block.col && block.powerUp) {
                        const icon = this.getPowerUpIcon(block.powerUp);
                        const iconEl = document.createElement('span');
                        iconEl.className = 'cell-powerup-icon';
                        iconEl.textContent = icon;
                        cell.appendChild(iconEl);
                        cell.classList.add('has-powerup');
                    }
                    
                    if (this.selectedBlock && this.selectedBlock.id === block.id) {
                        cell.classList.add('selected');
                    }
                }
            }
        });
        
        this.previewCells.forEach(cell => {
            cell.className = 'preview-cell';
            const col = parseInt(cell.dataset.col);
            
            if (this.nextBlocks.length > 0) {
                for (const nextBlock of this.nextBlocks) {
                    if (col >= nextBlock.col && col < nextBlock.col + nextBlock.length) {
                        cell.classList.add('has-block');
                        break;
                    }
                }
            }
        });
    }
    
    getDragPreviewCol() {
        if (!this.dragBlock || !this.dragCurrentCol) return this.dragBlock.col;
        
        const block = this.dragBlock;
        const targetCol = this.dragCurrentCol;
        
        const direction = targetCol > block.col ? 1 : -1;
        let newCol = block.col;
        
        if (direction === 1) {
            const maxEndCol = Math.min(targetCol + block.length - 1, GRID_SIZE - 1);
            const minEndCol = block.col + block.length - 1;
            
            for (let endCol = maxEndCol; endCol > minEndCol; endCol--) {
                const startCol = endCol - block.length + 1;
                let canPlace = true;
                for (let i = 0; i < block.length; i++) {
                    if (this.grid[block.row][startCol + i] !== null && this.grid[block.row][startCol + i] !== block) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    newCol = startCol;
                    break;
                }
            }
        } else {
            const minEndCol = Math.max(targetCol + block.length - 1, block.length - 1);
            const maxEndCol = block.col + block.length - 1;
            
            for (let endCol = minEndCol; endCol < maxEndCol; endCol++) {
                const startCol = endCol - block.length + 1;
                let canPlace = true;
                for (let i = 0; i < block.length; i++) {
                    if (this.grid[block.row][startCol + i] !== null && this.grid[block.row][startCol + i] !== block) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    newCol = startCol;
                    break;
                }
            }
        }
        
        return newCol;
    }
    
    getPowerUpIcon(type) {
        switch(type) {
            case 'remove-block': return '🗑️';
            case 'remove-row': return '➡️';
            case 'remove-color': return '🌈';
            case 'move-any': return '✈️';
            default: return '';
        }
    }
    
    updateUI() {
        this.scoreEl.textContent = this.score;
        this.roundEl.textContent = this.round;
        this.comboEl.textContent = this.combo;
        
        document.querySelector('#pu-remove-block .count').textContent = this.powerUpCounts['remove-block'];
        document.querySelector('#pu-remove-row .count').textContent = this.powerUpCounts['remove-row'];
        document.querySelector('#pu-remove-color .count').textContent = this.powerUpCounts['remove-color'];
        document.querySelector('#pu-move-any .count').textContent = this.powerUpCounts['move-any'];
        
        document.getElementById('pu-btn-remove-block').disabled = this.powerUpCounts['remove-block'] <= 0;
        document.getElementById('pu-btn-remove-row').disabled = this.powerUpCounts['remove-row'] <= 0;
        document.getElementById('pu-btn-remove-color').disabled = this.powerUpCounts['remove-color'] <= 0;
        document.getElementById('pu-btn-move-any').disabled = this.powerUpCounts['move-any'] <= 0;
    }
    
    showMessage(message) {
        this.messageEl.textContent = message;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});