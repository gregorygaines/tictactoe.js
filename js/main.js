// Constants
const BOX_CLASS_SELECTOR = ".box";
const BOX_ID_SELECTOR_PREFIX = "box";
const RESET_BUTTON_ID_SELECTOR = "#resetButton";
const STATUS_ID_SELECTOR = "status";

const MAX_BOARD_MOVES = 9;

const SpaceIdentifier = {
    PLAYER: 1,
    AI: 2,
    EMPTY: 0,
};

// Game board state
let gameBoard;

// Wither the player can click on the board
let playerTurn = false;

// Current moves on the board
let moveCount = 0;

const statusElement = document.getElementById(STATUS_ID_SELECTOR);

function attachBoxOnClickListeners() {
    const boxes = document.querySelectorAll(BOX_CLASS_SELECTOR);

    for (let boxIndex = 0; boxIndex < boxes.length; ++boxIndex) {
        const box = boxes[boxIndex];

        box.addEventListener("click", function (e) {
            handleBoxOnClick(e.target);
        });
    }
}

function attachResetButtonOnClickListener() {
    document.getElementById("resetButton").addEventListener("click", function () {
        reset();
    });
}

let aiTurnDelay;

function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

function handleBoxOnClick(boxElement) {
    const boxId = boxElement.id;

    if (playerTurn) {
        runGameFlow(boxId);
    }
}

function runGameFlow(boxId) {
    const playerTookTurn = handlePlayerTurn(boxId);

    // If player did not take turn by not filling in a valid space,
    // stop turn flow till the player clicks another space
    if (!playerTookTurn) {
        return;
    }

    moveCount++;

    // Completes the players turn
    playerTurn = false;

    if (checkGameState()) {
        return;
    }

    statusElement.innerHTML = "AI Turn";

    aiTurnDelay = setTimeout(function () {
        playAITurn();

        moveCount++;

        if (checkGameState()) {
            return;
        }
    }, 500);

    // // Handle the AI's turn
    // setTimeout(playAITurn, 500);
    //
    // moveCount++;
}

function handlePlayerTurn(boxId) {
    const [row, col] = convertIdToCord(boxId);

    if (isBoxFilled(row, col)) {
        showBoxAlreadyFilledStatus();
        return false;
    }

    fillBoxById(boxId, true);
    return true;
}

function hasSpacesRemaining() {
    return moveCount < MAX_BOARD_MOVES;
}

// Check if the game is won and declare the winner based on who last made a turn,
// if no on won check if the game has spaces remaining and declare a draw if needed.
function checkGameState() {
    if (declareWinnerIfWon()) {
        return true;
    }

    if (!hasSpacesRemaining()) {
        declareDraw();
    }
}

function declareWinnerIfWon() {
    var count = 0;

    // Check Rows
    for (var i = 0; i < 3; ++i) {
        count = 0;

        for (var j = 0; j < 3; ++j) {
            if (gameBoard[i][j] === SpaceIdentifier.PLAYER) {
                count++;
            } else if (gameBoard[i][j] === SpaceIdentifier.AI) {
                count--;
            }
        }

        if (count === 3) {
            declareWinner(true);
            return true;
        } else if (count === -3) {
            declareWinner(false);
            return true;
        }
    }

    // Check Cols
    for (var i = 0; i < 3; ++i) {
        count = 0;

        for (var j = 0; j < 3; ++j) {
            if (gameBoard[j][i] === SpaceIdentifier.PLAYER) {
                count++;
            } else if (gameBoard[j][i] === SpaceIdentifier.AI) {
                count--;
            }
        }

        if (count === 3) {
            declareWinner(true);
            return true;
        } else if (count === -3) {
            declareWinner(false);
            return true;
        }
    }

    count = 0;

    // Check Diag
    for (var i = 0; i < 3; ++i) {
        if (gameBoard[i][i] === SpaceIdentifier.PLAYER) {
            count++;
        } else if (gameBoard[i][i] === SpaceIdentifier.AI) {
            count--;
        }

        if (count === 3) {
            declareWinner(true);
            return true;
        } else if (count === -3) {
            declareWinner(false);
            return true;
        }
    }

    count = 0;

    // Check Anti-Diag
    for (var i = 0; i < 3; ++i) {

        if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.PLAYER) {
            count++;
        } else if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.AI) {
            count--;
        }

        if (count === 3) {
            declareWinner(true);
            return true;
        } else if (count === -3) {
            declareWinner(false);
            return true;
        }
    }

    if (moveCount === MAX_BOARD_MOVES) {
        declareDraw();
        return true;
    }
}

function declareWinner(isPlayer) {
    statusElement.innerHTML = isPlayer ? "Player Won" : "AI Won";
    playerTurn = false;
}

function declareDraw() {
    console.log("GAME IS DRAW");
    statusElement.innerHTML = "DRAW";
    playerTurn = false;
}

function isBoxFilled(row, col) {
    return gameBoard[row][col] !== SpaceIdentifier.EMPTY;
}

function convertIdToCord(boxId) {
    const row = Math.floor(boxId / 3);
    const col = Math.floor(boxId % 3);
    return [row, col];
}

function fillBoxById(boxId, isPlayer) {
    const box = document.getElementById(boxId);

    const textWrapper = document.createElement("div");
    textWrapper.classList.add("text-wrapper");
    box.appendChild(textWrapper);

    textWrapper.classList.add(isPlayer ? "x-color" : "o-color");

    const [row, col] = convertIdToCord(boxId);

    textWrapper.innerHTML = isPlayer ? "X" : "O";

    gameBoard[row][col] = isPlayer ? SpaceIdentifier.PLAYER : SpaceIdentifier.AI;
}

function fillBoxByCord(row, col, isPlayer) {
    const boxId = (row * 3) + col;
    fillBoxById(boxId, isPlayer);
}

function showBoxAlreadyFilledStatus() {
    statusElement.innerHTML = "Box already filled";
}

function reset() {
    clearTimeout(aiTurnDelay);

    gameBoard = [];

    gameBoard.push(new Array(3).fill(SpaceIdentifier.EMPTY));
    gameBoard.push(new Array(3).fill(SpaceIdentifier.EMPTY));
    gameBoard.push(new Array(3).fill(SpaceIdentifier.EMPTY));

    moveCount = 0;

    // State player turn
    playerTurn = true;

    // Reset html
    document.querySelectorAll(".box").forEach(function (element) {
        element.innerHTML = "";
    });

    statusElement.innerHTML = "Player Turn";
}

// Run minimax algorithm for AI
function playAITurn() {
    // Win
    if (aiCanWin()) {
        console.log("Ai Winning")
    } else if (aiCanBlock()) {
        console.log("Ai Blocking")
    } else if (aiCanBlockFork()) {
        console.log("Ai Forking")
    } else if (aiCanCenter()) {
        console.log("Ai Centering")
    } else if (aiCanFillOppositeCorner()) {
        console.log("Ai Opposite Corner")
    } else if (aiCanFillEmptyCorner()) {
        console.log("Ai Empty Corner")
    } else if (aiCanFillEmptySide()) {
        console.log("Ai Empty Side")
    } else {
        console.log("Ai STUCK move count " + moveCount);
    }

    if (checkGameState()) {
        return;
    }

    statusElement.innerHTML = "Player Turn";
    // Activate the players turn
    playerTurn = true;
}

/**
  * Ai checks if it can win
  * @returns Can ai win
  */
function aiCanWin() {
    var count = 0;
    var row, col;

    // Check Rows
    for (var i = 0; i < 3; ++i) {
        count = 0;

        for (var j = 0; j < 3; ++j) {
            if (gameBoard[i][j] === SpaceIdentifier.AI) {
                count++;
            } else if (gameBoard[i][j] === SpaceIdentifier.PLAYER) {
                count--;
            } else if (gameBoard[i][j] === SpaceIdentifier.EMPTY) {
                row = i;
                col = j;
            }
        }

        if (count === 2) {
            fillBoxByCord(row, col, false);
            return true;
        }
    }

    // Check Cols
    for (var i = 0; i < 3; ++i) {
        count = 0;

        for (var j = 0; j < 3; ++j) {
            if (gameBoard[j][i] === SpaceIdentifier.AI) {
                count++;
            } else if (gameBoard[j][i] === SpaceIdentifier.PLAYER) {
                count--;
            } else if (gameBoard[j][i] === SpaceIdentifier.EMPTY) {
                row = j;
                col = i;
            }
        }

        if (count === 2) {
            fillBoxByCord(row, col, false);
            return true;
        }
    }

    count = 0;

    // Check Diag
    for (var i = 0; i < 3; ++i) {
        if (gameBoard[i][i] === SpaceIdentifier.AI) {
            count++;
        } else if (gameBoard[i][i] === SpaceIdentifier.PLAYER) {
            count--;
        } else if (gameBoard[i][i] === SpaceIdentifier.EMPTY) {
            row = i;
            col = i;
        }
    }

    if (count === 2) {
        fillBoxByCord(row, col, false);
        return true;
    }

    count = 0;

    // Check Anti-Diag
    for (var i = 0; i < 3; ++i) {
        if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.AI) {
            count++;
        } else if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.PLAYER) {
            count--;
        } else if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.EMPTY) {
            row = i;
            col = (3 - 1) - i;
        }
    }

    if (count === 2) {
        fillBoxByCord(row, col, false);
        return true;
    }

    return false;
}

/**
  * Ai checks if it can block opponents win
  * @returns Can ai block opponent
  */
function aiCanBlock() {
    var count = 0;
    var row, col;

    // Check Rows
    for (var i = 0; i < 3; ++i) {
        count = 0;

        for (var j = 0; j < 3; ++j) {
            if (gameBoard[i][j] === SpaceIdentifier.PLAYER) {
                count++;
            } else if (gameBoard[i][j] === SpaceIdentifier.AI) {
                count--;
            } else if (gameBoard[i][j] === SpaceIdentifier.EMPTY) {
                row = i;
                col = j;
            }
        }

        if (count === 2) {
            fillBoxByCord(row, col, false);
            return true;
        }
    }

    // Check Cols
    for (var i = 0; i < 3; ++i) {
        count = 0;

        for (var j = 0; j < 3; ++j) {
            if (gameBoard[j][i] === SpaceIdentifier.PLAYER) {
                count++;
            } else if (gameBoard[j][i] === SpaceIdentifier.AI) {
                count--;
            } else if (gameBoard[j][i] === SpaceIdentifier.EMPTY) {
                row = j;
                col = i;
            }
        }

        if (count === 2) {
            fillBoxByCord(row, col, false);
            return true;
        }
    }

    count = 0;

    // Check Diag
    for (var i = 0; i < 3; ++i) {
        if (gameBoard[i][i] === SpaceIdentifier.PLAYER) {
            count++;
        } else if (gameBoard[i][i] === SpaceIdentifier.AI) {
            count--;
        } else if (gameBoard[i][i] === SpaceIdentifier.EMPTY) {
            row = i;
            col = i;
        }
    }

    if (count === 2) {
        fillBoxByCord(row, col, false);
        return true;
    }

    count = 0;

    // Check Anti-Diag
    for (var i = 0; i < 3; ++i) {
        if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.PLAYER) {
            count++;
        } else if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.AI) {
            count--;
        } else if (gameBoard[i][(3 - 1) - i] === SpaceIdentifier.EMPTY) {
            row = i;
            col = (3 - 1) - i;
        }
    }

    if (count === 2) {
        fillBoxByCord(row, col, false);
        return true;
    }

    return false;
}

/**
  * Ai checks if it can block a fork
  * @returns Can ai block opponent
  */
function aiCanBlockFork() {
    console.log("At fork move count " + moveCount);
    if (moveCount === 3) {
        if (gameBoard[0][0] === SpaceIdentifier.PLAYER && gameBoard[1][1] === SpaceIdentifier.AI && gameBoard[2][2] === SpaceIdentifier.PLAYER) {
            aiCanFillEmptySide();
            return true;
        }
        if (gameBoard[2][0] === SpaceIdentifier.PLAYER && gameBoard[1][1] === SpaceIdentifier.AI && gameBoard[0][2] === SpaceIdentifier.PLAYER) {
            aiCanFillEmptySide();
            return true;
        }
        if (gameBoard[2][1] === SpaceIdentifier.PLAYER && gameBoard[1][2] === SpaceIdentifier.PLAYER) {
            fillBoxByCord(2, 2, false);
            return true;
        }
    }
    return false;
}

/**
  * Ai checks if it can fill center box
  * @returns Can ai fill center box
  */
function aiCanCenter() {
    console.log("Game board center is " + gameBoard[1][1]);
    if (gameBoard[1][1] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(1, 1, false);
        return true;
    }
    return false;
}

/**
  * Ai checks if it can fill opposite corner
  * @returns Can ai fill opposite corner
  */
function aiCanFillOppositeCorner() {
    if (gameBoard[0][0] === SpaceIdentifier.PLAYER && gameBoard[2][2] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(2, 2, false);
        return true;
    }

    if (gameBoard[2][2] === SpaceIdentifier.PLAYER && gameBoard[0][0] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(0, 0, false);
        return true;
    }

    if (gameBoard[0][2] === SpaceIdentifier.PLAYER && gameBoard[2][0] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(2, 0, false);
        return true;
    }

    if (gameBoard[2][0] === SpaceIdentifier.PLAYER && gameBoard[0][2] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(0, 2, false);
        return true;
    }
    return false;
}

/**
  * Ai checks if it can fill empty corner
  * @returns Can ai fill empty corner
  */
function aiCanFillEmptyCorner() {
    if (gameBoard[0][0] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(0, 0, false);
        return true;
    }

    if (gameBoard[0][2] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(0, 2, false);
        return true;
    }

    if (gameBoard[2][0] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(2, 0, false);
        return true;
    }

    if (gameBoard[2][2] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(2, 2, false);
        return true;
    }

    return false;
}

/**
  * Ai checks if it can fill empty side
  * @returns Can ai fill empty side
  */
function aiCanFillEmptySide() {
    if (gameBoard[0][1] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(0, 1, false);
        return true;
    }

    if (gameBoard[1][0] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(1, 0, false);
        return true;
    }

    if (gameBoard[1][2] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(1, 2, false);
        return true;
    }

    if (gameBoard[2][1] === SpaceIdentifier.EMPTY) {
        fillBoxByCord(2, 1, false);
        return true;
    }
    return false;
}

attachBoxOnClickListeners();
attachResetButtonOnClickListener();
reset();
