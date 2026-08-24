"use strict";


// =========================================================
// ELEMENTS
// =========================================================

const wordElement =
    document.getElementById("word");

const keyboardInput =
    document.getElementById("keyboard-input");

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
// SCORE
// =========================================================

function updateScore(score) {


    /*
        Never show zero.
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
// OPEN SYSTEM KEYBOARD
// =========================================================

function openKeyboard() {


    if (gameFinished) {

        return;

    }


    keyboardInput.value = "";


    /*
        Focus happens because this function
        is triggered by a real user tap.
    */

    keyboardInput.focus();

}


// =========================================================
// CLICK BLANKS
// =========================================================

wordElement.addEventListener(
    "click",
    function() {

        openKeyboard();

    }
);


// =========================================================
// KEYBOARD INPUT
// =========================================================

keyboardInput.addEventListener(
    "input",
    function() {


        if (gameFinished) {

            keyboardInput.value = "";

            return;

        }


        let letter =
            keyboardInput.value
                .toLowerCase();


        /*
            Only English letters.
        */

        letter =
            letter.replace(
                /[^a-z]/g,
                ""
            );


        /*
            Only one character.
        */

        if (
            letter.length > 1
        ) {

            letter =
                letter.slice(-1);

        }


        keyboardInput.value =
            letter;


        /*
            Automatically submit.
        */

        if (
            letter.length === 1
        ) {

            submitGuess(
                letter
            );

        }

    }
);


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


    /*
        10 chances.

        The six body parts appear
        gradually as mistakes increase.
    */

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


    keyboardInput.value = "";


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

                            letter: letter

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


    /*
        Keep the system keyboard ready
        for the next letter.

        Do NOT do this after game ends.
    */

    if (!gameFinished) {

        setTimeout(
            function() {

                keyboardInput.focus();

            },
            50
        );

    }

}


// =========================================================
// RESULT
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


            /*
                Don't automatically open
                the keyboard after restart.

                User taps the blanks.
            */

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
// START
// =========================================================

loadGame();
