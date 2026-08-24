"use strict";


// =========================================================
// ELEMENTS
// =========================================================

const wordElement =
    document.getElementById("word");

const keyboardInput =
    document.getElementById("keyboard-input");

const mobileKeyboard =
    document.getElementById("mobile-keyboard");

const keyboardButtons =
    document.querySelectorAll(
        "#mobile-keyboard button"
    );

const chancesElement =
    document.getElementById("chances");

const wordLengthElement =
    document.getElementById("word-length");

const wrongLettersElement =
    document.getElementById("wrong-letters");

const messageElement =
    document.getElementById("message");

const scoreElement =
    document.getElementById("score");

const bestScoreElement =
    document.getElementById("best-score");

const gameResult =
    document.getElementById("game-result");

const resultIcon =
    document.getElementById("result-icon");

const resultTitle =
    document.getElementById("result-title");

const resultText =
    document.getElementById("result-text");

const answerElement =
    document.getElementById("answer");

const finalScoreElement =
    document.getElementById("final-score");

const restartButton =
    document.getElementById("restart-button");

const keyboardStatus =
    document.getElementById("keyboard-status");


// =========================================================
// HANGMAN PARTS
// =========================================================

const bodyParts = [

    "head",

    "body",

    "left-arm",

    "right-arm",

    "left-leg",

    "right-leg"

];


// =========================================================
// STATE
// =========================================================

let gameFinished = false;

let submitting = false;


// =========================================================
// DEVICE CHECK
// =========================================================

function isMobileDevice() {

    return (
        window.matchMedia(
            "(max-width: 600px)"
        ).matches
    );

}


// =========================================================
// SET KEYBOARD MODE
// =========================================================

function setupKeyboardMode() {


    if (isMobileDevice()) {


        /*
            Mobile:

            Show website keyboard.
        */

        mobileKeyboard.style.display =
            "flex";


        keyboardStatus.textContent =
            "ON-SCREEN KEYBOARD";


        /*
            Completely prevent the
            mobile system keyboard.
        */

        keyboardInput.setAttribute(
            "inputmode",
            "none"
        );

        keyboardInput.setAttribute(
            "readonly",
            ""
        );


    } else {


        /*
            Desktop:

            Hide website keyboard.
        */

        mobileKeyboard.style.display =
            "none";


        keyboardStatus.textContent =
            "PHYSICAL KEYBOARD";

    }

}


// =========================================================
// BEST SCORE
// =========================================================

function getBestScore() {

    return Number(

        localStorage.getItem(
            "hangmanBestScore"
        ) || 0

    );

}


// =========================================================
// UPDATE SCORE
// =========================================================

function updateScore(score) {


    /*
        Never display 0.
    */

    if (score > 0) {

        scoreElement.textContent =
            score;

    } else {

        scoreElement.textContent =
            "—";

    }


    const oldBest =
        getBestScore();


    if (score > oldBest) {

        localStorage.setItem(
            "hangmanBestScore",
            score
        );

    }


    const best =
        Math.max(
            score,
            oldBest
        );


    if (best > 0) {

        bestScoreElement.textContent =
            best;

    } else {

        bestScoreElement.textContent =
            "—";

    }

}


// =========================================================
// LOAD GAME
// =========================================================

async function loadGame() {

    try {


        const response =
            await fetch(
                "/api/game",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load game."
            );

        }


        const game =
            await response.json();


        updateGame(
            game
        );


    } catch (error) {


        console.error(
            "LOAD ERROR:",
            error
        );


        showMessage(
            "Unable to connect to Flask."
        );

    }

}


// =========================================================
// UPDATE GAME
// =========================================================

function updateGame(game) {


    renderWord(
        game.word
    );


    chancesElement.textContent =
        game.remaining_chances;


    wordLengthElement.textContent =
        game.word_length;


    renderWrongLetters(
        game.wrong_letters
    );


    updateHangman(
        game.wrong_guesses
    );


    updateKeyboard(
        game.guessed_letters,
        game.wrong_letters
    );


    updateScore(
        game.score
    );


    gameFinished =
        game.game_over;


    if (game.game_over) {

        showResult(
            game
        );

    } else {

        gameResult.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// RENDER WORD
// =========================================================

function renderWord(word) {


    wordElement.innerHTML = "";


    for (
        const letter of word
    ) {


        const element =
            document.createElement(
                "span"
            );


        element.classList.add(
            "word-letter"
        );


        if (
            letter === "_"
        ) {

            element.textContent =
                "_";

            element.classList.add(
                "hidden-letter"
            );

        } else {

            element.textContent =
                letter.toUpperCase();

        }


        wordElement.appendChild(
            element
        );

    }

}


// =========================================================
// WRONG LETTERS
// =========================================================

function renderWrongLetters(
    letters
) {


    if (
        !letters ||
        letters.length === 0
    ) {

        wrongLettersElement.textContent =
            "None";

        return;

    }


    wrongLettersElement.textContent =

        letters

            .map(
                letter =>
                    letter.toUpperCase()
            )

            .join(" • ");

}


// =========================================================
// HANGMAN
// =========================================================

function updateHangman(
    wrongGuesses
) {


    const partsToShow =

        Math.ceil(

            (
                wrongGuesses / 10
            ) *
            bodyParts.length

        );


    bodyParts.forEach(

        (
            part,
            index
        ) => {


            const element =
                document.getElementById(
                    part
                );


            if (
                index < partsToShow
            ) {

                element.classList.add(
                    "visible"
                );

            } else {

                element.classList.remove(
                    "visible"
                );

            }

        }

    );

}


// =========================================================
// UPDATE ON-SCREEN KEYBOARD
// =========================================================

function updateKeyboard(
    guessedLetters,
    wrongLetters
) {


    const guessed =
        guessedLetters || [];

    const wrong =
        wrongLetters || [];


    keyboardButtons.forEach(
        button => {


            const letter =
                button.dataset.letter;


            button.classList.remove(
                "used",
                "correct",
                "wrong"
            );


            if (
                guessed.includes(letter)
            ) {


                button.classList.add(
                    "used"
                );


                if (
                    wrong.includes(letter)
                ) {

                    button.classList.add(
                        "wrong"
                    );

                } else {

                    button.classList.add(
                        "correct"
                    );

                }

            }

        }
    );

}


// =========================================================
// ON-SCREEN KEYBOARD BUTTONS
// =========================================================

keyboardButtons.forEach(
    button => {


        button.addEventListener(
            "click",
            function() {


                if (
                    gameFinished ||
                    submitting
                ) {

                    return;

                }


                const letter =
                    button.dataset.letter;


                submitGuess(
                    letter
                );

            }
        );

    }
);


// =========================================================
// DESKTOP PHYSICAL KEYBOARD
// =========================================================

document.addEventListener(
    "keydown",
    function(event) {


        /*
            Only allow physical keyboard
            on desktop.

            Mobile uses the website keyboard.
        */

        if (
            isMobileDevice()
        ) {

            return;

        }


        if (
            gameFinished ||
            submitting
        ) {

            return;

        }


        /*
            Ignore shortcuts,
            Ctrl combinations, etc.
        */

        if (
            event.ctrlKey ||
            event.altKey ||
            event.metaKey
        ) {

            return;

        }


        const letter =
            event.key.toLowerCase();


        if (
            /^[a-z]$/.test(letter)
        ) {


            event.preventDefault();


            submitGuess(
                letter
            );

        }

    }
);


// =========================================================
// SUBMIT GUESS
// =========================================================

async function submitGuess(
    letter
) {


    if (
        gameFinished ||
        submitting
    ) {

        return;

    }


    submitting = true;


    try {


        const response =
            await fetch(

                "/api/guess",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            letter:
                                letter

                        }),

                    cache:
                        "no-store"

                }

            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const result =
            await response.json();


        showMessage(
            result.message
        );


        if (result.game) {

            updateGame(
                result.game
            );

        }


        if (result.answer) {

            answerElement.textContent =
                result.answer.toUpperCase();

        }


    } catch (error) {


        console.error(
            "GUESS ERROR:",
            error
        );


        showMessage(
            "Something went wrong. Check Flask."
        );

    }


    submitting = false;

}


// =========================================================
// RESULT POPUP
// =========================================================

function showResult(game) {


    gameResult.classList.remove(
        "hidden"
    );


    if (
        game.score > 0
    ) {

        finalScoreElement.textContent =
            game.score;

    } else {

        finalScoreElement.textContent =
            "—";

    }


    if (
        game.won
    ) {


        resultIcon.textContent =
            "🎉";


        resultTitle.textContent =
            "You Win!";


        resultText.textContent =
            "Excellent! You found the word.";


    } else {


        resultIcon.textContent =
            "💀";


        resultTitle.textContent =
            "Game Over";


        resultText.textContent =
            "You used all 10 chances.";

    }

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message
) {

    messageElement.textContent =
        message;

}


// =========================================================
// RESTART
// =========================================================

restartButton.addEventListener(
    "click",
    async function() {


        try {


            const response =
                await fetch(

                    "/api/restart",

                    {

                        method: "POST",

                        cache:
                            "no-store"

                    }

                );


            if (!response.ok) {

                throw new Error(
                    "Restart failed."
                );

            }


            const result =
                await response.json();


            gameFinished =
                false;


            gameResult.classList.add(
                "hidden"
            );


            messageElement.textContent =
                "";


            updateGame(
                result.game
            );


        } catch (error) {


            console.error(
                "RESTART ERROR:",
                error
            );


            showMessage(
                "Unable to restart."
            );

        }

    }
);


// =========================================================
// DEVICE MODE
// =========================================================

setupKeyboardMode();


// =========================================================
// HANDLE SCREEN RESIZE
// =========================================================

window.addEventListener(
    "resize",
    setupKeyboardMode
);


// =========================================================
// START
// =========================================================

loadGame();
