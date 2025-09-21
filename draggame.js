(() => {

// ================= Drag & Drop Game =================
const letters = "ABCDEFGHIKLMNOPRSTUVWY";
const rows = 9;
const cols = 8;
let board = Array(rows * cols).fill(null); // 72-cell board
let scoreDrag = 0;
let draggedIndex = null;

// ---------- Timer ----------
let timerInterval = null;
let secondsElapsed = 0;

function startTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    const timerEl = document.getElementById("timer");
    if (timerEl) timerEl.textContent = "Time: 0s";
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (timerEl) timerEl.textContent = `Time: ${secondsElapsed}s`;
    }, 1000);
}

// Shared dictionary
let dictionary = null;
fetch("https://raw.githubusercontent.com/dhwuvy/anagrams/main/words.txt")
    .then(res => res.text())
    .then(text => {
        const words = text.replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map(w => w.trim().toUpperCase())
            .filter(w => /^[A-Z]+$/.test(w));
        dictionary = new Set(words);
        const status = document.getElementById("status");
        if (status) status.textContent = "Dictionary loaded! Start playing!";
    })
    .catch(err => console.error("Failed to load dictionary:", err));

// ---------- Mode Switching ----------
function showClassic() {
    document.getElementById("classicGame").style.display = "block";
    document.getElementById("dragDropGame").style.display = "none";
    if (window.showAnagramsUI) window.showAnagramsUI();
}

function showDragDrop() {
    document.getElementById("classicGame").style.display = "none";
    document.getElementById("dragDropGame").style.display = "block";
    if (window.hideAnagramsUI) window.hideAnagramsUI();
    generateTiles16();
    const submitBtn = document.getElementById("submitWordBtn");
    if (submitBtn) submitBtn.style.display = "none";
    startTimer();
}

// ---------- Event Listeners ----------
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("dragDropBtn");
    if (btn) btn.addEventListener("click", showDragDrop);
    const classicBtn = document.querySelector("button[onclick='showClassic()']");
    if (classicBtn) classicBtn.addEventListener("click", showClassic);
    const newGameBtn = document.getElementById("newGameBtn");
    if (newGameBtn) newGameBtn.addEventListener("click", () => {
        if (window.generateTiles) window.generateTiles();
        document.getElementById("score").textContent = "Score: 0";
        document.getElementById("foundWords").innerHTML = "";
        document.getElementById("anagramsList").innerHTML = "";
        document.getElementById("message").textContent = "";
        document.getElementById("wordInput").value = "";
    });
});

// ---------- Drag & Drop Board ----------
function generateTiles16() {
    board.fill(null);
    const usedPositions = new Set();
    let mergesCreated = 0;

    // Create 5 merged tiles
    while (mergesCreated < 5) {
        const horizontal = Math.random() < 0.5;
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        let pos1 = r * cols + c;
        let pos2 = horizontal ? pos1 + 1 : pos1 + cols;

        // Check boundaries and overlap
        if (horizontal) {
            if (c + 1 >= cols || usedPositions.has(pos1) || usedPositions.has(pos2)) continue;
        } else {
            if (r + 1 >= rows || usedPositions.has(pos1) || usedPositions.has(pos2)) continue;
        }

        let letter1 = letters[Math.floor(Math.random() * letters.length)];
        let letter2;
        do { letter2 = letters[Math.floor(Math.random() * letters.length)]; } while (letter2 === letter1);

        board[pos1] = letter1;
        board[pos2] = letter2;
        usedPositions.add(pos1);
        usedPositions.add(pos2);
        mergesCreated++;
    }

    // Fill remaining tiles as 1x1
    while (usedPositions.size < 16) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        const pos = r * cols + c;
        if (usedPositions.has(pos)) continue;
        board[pos] = letters[Math.floor(Math.random() * letters.length)];
        usedPositions.add(pos);
    }

    scoreDrag = 0;
    document.getElementById("currentWord").textContent = "";
    document.getElementById("foundWordsDrag").innerHTML = "";
    document.getElementById("scoreDrag").textContent = `Score: ${scoreDrag}`;

    renderBoard();
}

function renderBoard() {
    const boardEl = document.getElementById("tileBoard");
    boardEl.innerHTML = "";
    const rendered = new Set();

    for (let index = 0; index < board.length; index++) {
        if (rendered.has(index)) continue;
        const letter = board[index];
        if (!letter) continue;

        let width = 1, height = 1;

        // Horizontal merge
        if (index % cols < cols - 1 && board[index + 1] && !rendered.has(index + 1)) {
            width = 2;
            rendered.add(index + 1);
        }
        // Vertical merge
        else if (Math.floor(index / cols) < rows - 1 && board[index + cols] && !rendered.has(index + cols)) {
            height = 2;
            rendered.add(index + cols);
        }

        const tile = document.createElement("div");
        tile.className = "drag-tile";
        tile.textContent = letter;
        tile.dataset.index = index;
        tile.draggable = true;
        tile.style.gridColumnStart = (index % cols) + 1;
        tile.style.gridRowStart = Math.floor(index / cols) + 1;
        tile.style.gridColumnEnd = `span ${width}`;
        tile.style.gridRowEnd = `span ${height}`;

        tile.addEventListener("dragstart", e => {
            draggedIndex = index;
            e.dataTransfer.setDragImage(new Image(), 0, 0);
        });

        tile.addEventListener("dragend", e => {
            draggedIndex = null;
        });

        boardEl.appendChild(tile);
        rendered.add(index);
    }

    // Enable dragging swapping
    const tiles = boardEl.querySelectorAll(".drag-tile");
    tiles.forEach(tile => {
        tile.addEventListener("dragover", e => e.preventDefault());
        tile.addEventListener("drop", e => {
            const targetIndex = parseInt(tile.dataset.index);
            if (draggedIndex === null || targetIndex === draggedIndex) return;
            [board[draggedIndex], board[targetIndex]] = [board[targetIndex], board[draggedIndex]];
            draggedIndex = null;
            renderBoard();
            checkBoardForWords();
        });
    });
}

// ---------- Points ----------
function calculatePoints(length) {
    switch(length) {
        case 3: return 100;
        case 4: return 400;
        case 5: return 800;
        case 6: return 1400;
        case 7: return 1800;
        case 8: return 2200;
        case 9: return 2600;
        default: return 0;
    }
}

// ---------- Automatic Word Checking ----------
function checkBoardForWords() {
    if (!dictionary) return;
    const foundList = document.getElementById("foundWordsDrag");
    let newWordsFound = [];

    function checkLine(line) {
        let start = 0;
        while (start < line.length) {
            if (!line[start]) { start++; continue; }
            let end = start;
            while (end < line.length && line[end]) end++;
            const segment = line.slice(start, end);
            const word = segment.join("");
            if (word.length >= 3 &&
                dictionary.has(word) &&
                ![...foundList.children].some(div => div.textContent.split(' ')[0] === word) &&
                !newWordsFound.includes(word)) {
                newWordsFound.push(word);
            }
            start = end;
        }
    }

    for (let r = 0; r < rows; r++) checkLine(board.slice(r*cols, r*cols + cols));
    for (let c = 0; c < cols; c++) {
        const col = [];
        for (let r = 0; r < rows; r++) col.push(board[r*cols + c]);
        checkLine(col);
    }

    newWordsFound.forEach(word => {
        const points = calculatePoints(word.length);
        scoreDrag += points;
        const wordDiv = document.createElement("div");
        wordDiv.textContent = `${word} (+${points} pts)`;
        foundList.appendChild(wordDiv);
    });

    // Sort descending points
    const wordDivs = Array.from(foundList.children);
    wordDivs.sort((a,b)=>parseInt(b.textContent.split('(+')[1])-parseInt(a.textContent.split('(+')[1]));
    foundList.innerHTML = "";
    wordDivs.forEach(div=>foundList.appendChild(div));

    if(newWordsFound.length>0) document.getElementById("scoreDrag").textContent=`Score: ${scoreDrag}`;
}

// ---------- Reset Board ----------
document.getElementById("resetBoardBtn").addEventListener("click", generateTiles16);

// ---------- Utility ----------
function shuffleArray(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } }

})();




