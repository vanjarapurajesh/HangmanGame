"use strict";


// =========================================================
// ELEMENTS
// =========================================================

const wordElement =
    document.getElementById("word");

const chancesElement =
    document.getElementById("chances");

const wordLengthElement =
    document.getElementById("word-length");

const wrongLettersElement =
    document.getElementById("wrong-letters");

const messageElement =
    document.getElementById("message");

const progressBar =
    document.getElementById("progress-bar");

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


    // Never show zero

    if (score > 0) {

        scoreElement.textContent =
            score;

    } else {

        scoreElement.textContent =
            "—";

    }


    const oldBest =
        getBestScore();


    // Save new best score

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
            "Unable to connect to the game server."
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


    updateProgress(
        game
    );


    updateHangman(
        game.wrong_guesses
    );


    updateScore(
        game.score
    );


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


        if (letter === "_") {


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
    wrongLetters
) {


    if (

        !wrongLetters ||

        wrongLetters.length === 0

    ) {


        wrongLettersElement.textContent =
            "None";


        return;

    }


    wrongLettersElement.textContent =

        wrongLetters

            .map(
                letter =>
                    letter.toUpperCase()
            )

            .join(" • ");

}


// =========================================================
// PROGRESS BAR
// =========================================================

function updateProgress(game) {


    const percentage =

        (

            game.remaining_chances /

            game.max_wrong_guesses

        ) * 100;


    progressBar.style.width =
        `${percentage}%`;

}


// =========================================================
// HANGMAN
// =========================================================

function updateHangman(
    wrongGuesses
) {


    /*
        We have 6 visible body parts
        and 10 total chances.

        The person appears gradually.
    */

    const partsToShow =

        Math.ceil(

            (

                wrongGuesses /

                10

            ) * bodyParts.length

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
// MAKE GUESS
// =========================================================

async function makeGuess(
    letter
) {


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


        console.log(
            "Guess:",
            result
        );


        if (!result.success) {


            showMessage(
                result.message
            );


            if (result.game) {

                updateGame(
                    result.game
                );

            }


            return;

        }


        showMessage(
            result.message
        );


        updateGame(
            result.game
        );


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
            "Something went wrong. Check the Flask terminal."
        );

    }

}


// =========================================================
// PHYSICAL KEYBOARD ONLY
// =========================================================

document.addEventListener(

    "keydown",

    function(event) {


        /*
            Don't accept keyboard input
            when result popup is open.
        */

        if (

            !gameResult.classList.contains(
                "hidden"
            )

        ) {

            return;

        }


        /*
            Only A-Z characters.
        */

        if (

            event.key.length === 1 &&

            /^[a-zA-Z]$/.test(
                event.key
            )

        ) {


            event.preventDefault();


            makeGuess(

                event.key.toLowerCase()

            );

        }

    }

);


// =========================================================
// RESULT POPUP
// =========================================================

function showResult(game) {


    gameResult.classList.remove(
        "hidden"
    );


    // Don't display zero

    if (game.score > 0) {

        finalScoreElement.textContent =
            game.score;

    } else {

        finalScoreElement.textContent =
            "—";

    }


    // WIN

    if (game.won) {


        resultIcon.textContent =
            "🎉";


        resultTitle.textContent =
            "You Win!";


        resultText.textContent =
            "Excellent! You found the word.";


    }


    // LOSS

    else {


        resultIcon.textContent =
            "💀";


        resultTitle.textContent =
            "Game Over";


        resultText.textContent =
            "You used all 10 chances.";

    }

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
                "Unable to restart the game."
            );

        }

    }

);


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
// START GAME
// =========================================================

loadGame();