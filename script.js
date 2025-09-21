const letters = "ABCDEFGHIKLMNOPRSTUVWY"; // removed Q, Z, X
let tiles = [];
let dictionary = null;
let score = 0;

// Stopwatch variables
let timerInterval = null;
let secondsElapsed = 0;

// Create a container for all anagrams-related UI
const anagramsSection = document.createElement("div");
anagramsSection.id = "anagramsSection";
document.body.appendChild(anagramsSection);

// Status message
const statusDiv = document.createElement("div");
statusDiv.id = "status";
anagramsSection.appendChild(statusDiv);

// Tiles container
const tilesDiv = document.createElement("div");
tilesDiv.id = "tiles";
anagramsSection.appendChild(tilesDiv);

// Timer
const timerDiv = document.createElement("div");
timerDiv.id = "timer";
anagramsSection.appendChild(timerDiv);

// Word input form
const wordForm = document.createElement("form");
wordForm.id = "wordForm";
wordForm.innerHTML = `
  <input type="text" id="wordInput" placeholder="Enter word" style="font-size:16px; padding:4px;">
  <button type="submit">Submit</button>
`;
anagramsSection.appendChild(wordForm);

// Message div
const messageDiv = document.createElement("div");
messageDiv.id = "message";
anagramsSection.appendChild(messageDiv);

// Score
const scoreDiv = document.createElement("div");
scoreDiv.id = "score";
scoreDiv.textContent = "Score: 0";
anagramsSection.appendChild(scoreDiv);

// Found words
const foundWordsDiv = document.createElement("ul");
foundWordsDiv.id = "foundWords";
anagramsSection.appendChild(foundWordsDiv);

// Show anagrams button
const showAnagramsBtn = document.createElement("button");
showAnagramsBtn.textContent = "Show Anagrams";
showAnagramsBtn.style.marginTop = "10px";
showAnagramsBtn.style.padding = "6px 10px";
showAnagramsBtn.style.fontSize = "16px";
showAnagramsBtn.style.cursor = "pointer";
anagramsSection.appendChild(showAnagramsBtn);

// Anagrams list
const anagramsDiv = document.createElement("div");
anagramsDiv.id = "anagramsList";
anagramsDiv.style.marginTop = "8px";
anagramsDiv.style.maxWidth = "320px";
anagramsDiv.style.marginLeft = "auto";
anagramsDiv.style.marginRight = "auto";
anagramsSection.appendChild(anagramsDiv);

// Custom letters input & button
const customDiv = document.createElement("div");
customDiv.style.marginTop = "10px";
customDiv.style.textAlign = "center";
customDiv.innerHTML = `
  <input type="text" id="customLettersInput" placeholder="Enter custom letters" maxlength="15" style="font-size:16px; padding:4px;">
  <button id="customLettersBtn" style="font-size:16px; padding:5px 10px; cursor:pointer;">Use Custom Letters</button>
`;
anagramsSection.appendChild(customDiv);

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

  const lengthInput = document.getElementById("wordLength");
  let targetLength = parseInt(lengthInput.value, 10);
  if (isNaN(targetLength) || targetLength < 3) {
    targetLength = 3;
    lengthInput.value = 3;
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

// Word submission logic (unchanged)
wordForm.addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("wordInput");
  const word = input.value.trim().toUpperCase();
  if (!dictionary || word.length < 3 || !canFormWord(word) || !dictionary.has(word)) {
    messageDiv.textContent = "Invalid word!";
    input.value = "";
    return;
  }
  const foundList = document.getElementById("foundWords");
  if ([...foundList.children].some(li => li.textContent.split(' ')[0] === word)) {
    messageDiv.textContent = "Word already used!";
    input.value = "";
    return;
  }
  const points = calculatePoints(word.length);
  const li = document.createElement("li");
  li.textContent = `${word} (+${points} pts)`;
  li.style.fontSize = "18px";
  li.style.fontWeight = "bold";

  let inserted = false;
  for (let existingLi of foundList.children) {
    const existingPoints = parseInt(existingLi.textContent.match(/\+(\d+) pts/)[1], 10);
    if (points > existingPoints) {
      foundList.insertBefore(li, existingLi);
      inserted = true;
      break;
    }
  }
  if (!inserted) foundList.appendChild(li);

  score += points;
  scoreDiv.textContent = `Score: ${score}`;
  messageDiv.textContent = `+${points} points for "${word}"!`;
  messageDiv.style.color = "red";
  input.value = "";
});

// Hide/show anagrams section functions
function hideAnagramsUI() {
  if (anagramsSection) anagramsSection.style.display = "none";
}
function showAnagramsUI() {
  if (anagramsSection) anagramsSection.style.display = "block";
}

// Export functions to global for drag & drop JS to call
window.hideAnagramsUI = hideAnagramsUI;
window.showAnagramsUI = showAnagramsUI;

// Custom letters button
document.getElementById("customLettersBtn").addEventListener("click", () => {
  const input = document.getElementById("customLettersInput");
  let lettersInput = input.value.trim().toUpperCase();
  const lengthInput = document.getElementById("wordLength");
  const targetLength = parseInt(lengthInput.value, 10);
  if (lettersInput.length !== targetLength || !/^[A-Z]+$/.test(lettersInput)) {
    messageDiv.textContent = `Invalid input!`;
    return;
  }

  const counts = {};
  for (let char of lettersInput) {
    counts[char] = (counts[char] || 0) + 1;
    if (counts[char] > 2) {
      messageDiv.textContent = "No letter > 2 times!";
      return;
    }
  }
  const doubleCount = Object.values(counts).filter(c => c === 2).length;
  if (doubleCount > 1) {
    messageDiv.textContent = "At most one double letter!";
    return;
  }

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

// Show anagrams button
showAnagramsBtn.addEventListener("click", () => {
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

// Tab + Enter reset (unchanged)
let tabPressed = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    tabPressed = true;
    e.preventDefault();
  } else if (e.key === "Enter" && tabPressed) {
    e.preventDefault();
    generateTiles();
    score = 0;
    scoreDiv.textContent = `Score: ${score}`;
    foundWordsDiv.innerHTML = "";
    messageDiv.textContent = "";
    anagramsDiv.innerHTML = "";
    document.getElementById("wordInput").value = "";
    document.getElementById("wordInput").focus();
    tabPressed = false;
  }
});
document.addEventListener("keyup", (e) => { if (e.key === "Tab") tabPressed = false; });
