const letters = "ABCDEFGHIKLMNOPRSTUVWY"; // removed Q, Z, X
let tiles = [];
let dictionary = null;
let score = 0;

// Stopwatch variables
let timerInterval = null;
let secondsElapsed = 0;

// Grab existing HTML elements
const statusDiv = document.getElementById("status");
const tilesDiv = document.getElementById("tiles");
const timerDiv = document.getElementById("timer");
const wordForm = document.getElementById("wordForm");
const messageDiv = document.getElementById("message");
const scoreDiv = document.getElementById("score");
const foundWordsDiv = document.getElementById("foundWords");
const anagramsDiv = document.getElementById("anagramsList");
const customLettersBtn = document.getElementById("customLettersBtn");
const customLettersInput = document.getElementById("customLettersInput");
const wordLengthInput = document.getElementById("wordLength");

// Load dictionary
fetch("https://raw.githubusercontent.com/dhwuvy/anagrams/main/words.txt")
  .then(response => {
    if (!response.ok) throw new Error("Failed to fetch dictionary");
    return response.text();
  })
  .then(text => {
    const words = text
      .replace(/^\uFEFF/, '')              
      .split(/\r?\n/)                      
      .map(w => w.trim().toUpperCase())    
      .filter(w => /^[A-Z]+$/.test(w));   
    dictionary = new Set(words);

    statusDiv.textContent = "Dictionary loaded! Start playing! (Tip: Press Tab + Enter to reset tiles)";
    console.log("Dictionary loaded with", dictionary.size, "words");

    generateTiles();
  })
  .catch(err => {
    console.error("Failed to load dictionary:", err);
    statusDiv.textContent = "Failed to load dictionary!";
  });

// Generate N random letters with last letter fixed
function generateTiles() {
  if (!dictionary) return;

  let targetLength = parseInt(wordLengthInput.value, 10);
  if (isNaN(targetLength) || targetLength < 3) {
    targetLength = 3;
    wordLengthInput.value = 3;
  }

  const candidateWords = [...dictionary].filter(word => {
    if (word.length !== targetLength) return false;
    const counts = {};
    for (let char of word) {
      counts[char] = (counts[char] || 0) + 1;
      if (counts[char] > 2) return false;
    }
    const doubleCount = Object.values(counts).filter(c => c === 2).length;
    if (doubleCount > 1) return false;
    return true;
  });

  if (candidateWords.length === 0) {
    statusDiv.textContent = `No words of length ${targetLength} available under these rules.`;
    return;
  }

  const chosenWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
  let lettersArray = [...chosenWord];
  const lastLetter = lettersArray.pop();

  for (let i = lettersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
  }
  lettersArray.push(lastLetter);
  tiles = lettersArray;

  displayTiles();
  anagramsDiv.innerHTML = "";
  startTimer();
}

// Display tiles
function displayTiles() {
  tilesDiv.innerHTML = "";
  tiles.forEach(letter => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    tileEl.textContent = letter;
    tilesDiv.appendChild(tileEl);
  });
}

// Timer
function startTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  timerDiv.textContent = `Time: 0s`;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timerDiv.textContent = `Time: ${secondsElapsed}s`;
  }, 1000);
}

// Word submission
wordForm.addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("wordInput");
  const word = input.value.trim().toUpperCase();
  if (!dictionary) { messageDiv.textContent = "Dictionary still loading..."; input.value = ""; return; }
  if (word.length < 3) { messageDiv.textContent = "Words must be at least 3 letters!"; input.value = ""; return; }
  if (!canFormWord(word)) { messageDiv.textContent = "Invalid word! Uses letters not in tiles."; input.value = ""; return; }
  if (!dictionary.has(word)) { messageDiv.textContent = "Not a valid word!"; input.value = ""; return; }

  if ([...foundWordsDiv.children].some(li => li.textContent.split(' ')[0] === word)) {
    messageDiv.textContent = "You already used that word!";
    input.value = "";
    return;
  }

  const points = calculatePoints(word.length);
  const li = document.createElement("li");
  li.textContent = `${word} (+${points} pts)`;
  li.style.fontSize = "18px";
  li.style.fontWeight = "bold";

  // Insert in score order
  let inserted = false;
  for (let existingLi of foundWordsDiv.children) {
    const existingPoints = parseInt(existingLi.textContent.match(/\+(\d+) pts/)[1], 10);
    if (points > existingPoints) {
      foundWordsDiv.insertBefore(li, existingLi);
      inserted = true;
      break;
    }
  }
  if (!inserted) foundWordsDiv.appendChild(li);

  score += points;
  scoreDiv.textContent = `Score: ${score}`;
  messageDiv.textContent = `+${points} points for "${word}"!`;
  messageDiv.style.color = "red";

  input.value = "";
});

// Check if word can be formed from tiles
function canFormWord(word) {
  let tempTiles = [...tiles];
  for (let char of word.toUpperCase()) {
    let index = tempTiles.indexOf(char);
    if (index === -1) return false;
    tempTiles.splice(index, 1);
  }
  return true;
}

// Points system
function calculatePoints(length) {
  if (length < 3) return 0;
  if (length === 3) return 100;
  if (length === 4) return 400;
  if (length === 5) return 1200;
  if (length === 6) return 2000;
  if (length === 7) return 3000;
  if (length === 8) return 4000;
  if (length === 9) return 5000;
  if (length === 10) return 6000;
  if (length === 11) return 7000;
  if (length === 12) return 8000;
  if (length === 13) return 9000;
  if (length === 14) return 10000;
  if (length === 15) return 11000;
  return 0;
}

// Custom letters
customLettersBtn.addEventListener("click", () => {
  let lettersInput = customLettersInput.value.trim().toUpperCase();
  const targetLength = parseInt(wordLengthInput.value, 10);

  if (lettersInput.length !== targetLength) { messageDiv.textContent = `Input must be exactly ${targetLength} letters!`; return; }
  if (!/^[A-Z]+$/.test(lettersInput)) { messageDiv.textContent = "Letters must be A-Z only!"; return; }

  const counts = {};
  for (let char of lettersInput) {
    counts[char] = (counts[char] || 0) + 1;
    if (counts[char] > 2) { messageDiv.textContent = "No letter can appear more than twice!"; return; }
  }
  const doubleCount = Object.values(counts).filter(c => c === 2).length;
  if (doubleCount > 1) { messageDiv.textContent = "At most one letter can appear twice!"; return; }

  let lettersArray = lettersInput.split("");
  const lastLetter = lettersArray.pop();
  for (let i = lettersArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lettersArray[i], lettersArray[j]] = [lettersArray[j], lettersArray[i]];
  }
  lettersArray.push(lastLetter);
  tiles = lettersArray;

  displayTiles();
  foundWordsDiv.innerHTML = "";
  anagramsDiv.innerHTML = "";
  messageDiv.textContent = "Custom letters set!";
  score = 0;
  scoreDiv.textContent = `Score: ${score}`;
  startTimer();
});

// Show anagrams
document.getElementById("showAnagramsBtn").addEventListener("click", () => {
  anagramsDiv.innerHTML = "";
  if (!dictionary) return;

  const tilesCount = {};
  tiles.forEach(c => tilesCount[c] = (tilesCount[c] || 0) + 1);

  const validWords = [...dictionary].filter(word => {
    if (word.length < 3) return false;
    const wordCount = {};
    for (let c of word) wordCount[c] = (wordCount[c] || 0) + 1;
    for (let c in wordCount) if (!tilesCount[c] || wordCount[c] > tilesCount[c]) return false;
    return true;
  });

  validWords.sort((a, b) => {
    const diff = calculatePoints(b.length) - calculatePoints(a.length);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  if (validWords.length === 0) {
    anagramsDiv.textContent = "No valid anagrams found.";
    return;
  }

  validWords.forEach(word => {
    const wEl = document.createElement("div");
    wEl.textContent = `${word} (+${calculatePoints(word.length)} pts)`;
    wEl.style.fontSize = "18px";
    wEl.style.fontWeight = "bold";
    anagramsDiv.appendChild(wEl);
  });
});

// Tab + Enter reset
let tabPressed = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") { tabPressed = true; e.preventDefault(); }
  else if (e.key === "Enter" && tabPressed) {
    e.preventDefault();
    generateTiles();
    score = 0;
    scoreDiv.textContent = `Score: ${score}`;
    foundWordsDiv.innerHTML = "";
    anagramsDiv.innerHTML = "";
    messageDiv.textContent = "";
    document.getElementById("wordInput").value = "";
    tabPressed = false;
  }
});
document.addEventListener("keyup", (e) => { if (e.key === "Tab") tabPressed = false; });

