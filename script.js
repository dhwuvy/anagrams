const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let tiles = [];

// generate 7 random letters
function generateTiles() {
  tiles = [];
  for (let i = 0; i < 7; i++) {
    let randomLetter = letters[Math.floor(Math.random() * letters.length)];
    tiles.push(randomLetter);
  }
  displayTiles();
}

function displayTiles() {
  const tilesDiv = document.getElementById("tiles");
  tilesDiv.innerHTML = "";
  tiles.forEach(letter => {
    const tileEl = document.createElement("div");
    tileEl.className = "tile";
    tileEl.textContent = letter;
    tilesDiv.appendChild(tileEl);
  });
}

function canFormWord(word) {
  let tempTiles = [...tiles];
  for (let char of word.toUpperCase()) {
    let index = tempTiles.indexOf(char);
    if (index === -1) return false;
    tempTiles.splice(index, 1); // remove used letter
  }
  return true;
}

document.getElementById("wordForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("wordInput");
  const word = input.value.trim();

  if (word && canFormWord(word)) {
    const foundList = document.getElementById("foundWords");
    const li = document.createElement("li");
    li.textContent = word;
    foundList.appendChild(li);
  } else {
    alert("Invalid word! (uses letters not in tiles)");
  }

  input.value = "";
});

// initialize game
generateTiles();
