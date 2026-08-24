from flask import Flask, render_template, request, jsonify, session
from pathlib import Path
import random


# =========================================================
# APP SETTINGS
# =========================================================

app = Flask(__name__)

app.secret_key = "change-this-secret-key"


# =========================================================
# GAME SETTINGS
# =========================================================

MAX_WRONG_GUESSES = 10


# =========================================================
# WORD FILE
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

WORDS_FILE = BASE_DIR / "data" / "words.txt"


# =========================================================
# LOAD WORDS
# =========================================================

def load_words():

    if not WORDS_FILE.exists():
        raise FileNotFoundError(
            "data/words.txt was not found."
        )

    words = []

    with open(
        WORDS_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            word = line.strip().lower()

            # Only alphabetic words
            if word.isalpha():
                words.append(word)

    # Remove duplicates
    words = sorted(set(words))

    if not words:
        raise ValueError(
            "No words found in data/words.txt"
        )

    return words


# =========================================================
# START NEW GAME
# =========================================================

def start_new_game():

    words = load_words()

    session.clear()

    session["answer"] = random.choice(words)

    session["guessed_letters"] = []

    session["wrong_letters"] = []

    session["wrong_guesses"] = 0

    session["score"] = 0

    session["game_over"] = False

    session["won"] = False


# =========================================================
# CHECK SESSION
# =========================================================

def ensure_game():

    required_keys = [
        "answer",
        "guessed_letters",
        "wrong_letters",
        "wrong_guesses",
        "score",
        "game_over",
        "won"
    ]

    for key in required_keys:

        if key not in session:

            start_new_game()

            return


# =========================================================
# GET GAME STATE
# =========================================================

def get_game_state():

    ensure_game()

    answer = session["answer"]

    guessed_letters = session[
        "guessed_letters"
    ]

    display_word = ""

    for letter in answer:

        if letter in guessed_letters:

            display_word += letter

        else:

            display_word += "_"


    remaining_chances = (
        MAX_WRONG_GUESSES
        - session["wrong_guesses"]
    )


    return {

        "word": display_word,

        "word_length": len(answer),

        "guessed_letters":
            session["guessed_letters"],

        "wrong_letters":
            session["wrong_letters"],

        "wrong_guesses":
            session["wrong_guesses"],

        "remaining_chances":
            remaining_chances,

        "max_wrong_guesses":
            MAX_WRONG_GUESSES,

        "score":
            session["score"],

        "game_over":
            session["game_over"],

        "won":
            session["won"]

    }


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def index():

    ensure_game()

    return render_template(
        "index.html"
    )


# =========================================================
# GET CURRENT GAME
# =========================================================

@app.route(
    "/api/game",
    methods=["GET"]
)
def api_game():

    ensure_game()

    return jsonify(
        get_game_state()
    )


# =========================================================
# GUESS LETTER
# =========================================================

@app.route(
    "/api/guess",
    methods=["POST"]
)
def api_guess():

    try:

        ensure_game()


        # -------------------------------------------------
        # GAME ALREADY FINISHED
        # -------------------------------------------------

        if session["game_over"]:

            return jsonify({

                "success": False,

                "message":
                    "The game is already over.",

                "game":
                    get_game_state()

            })


        # -------------------------------------------------
        # GET REQUEST DATA
        # -------------------------------------------------

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success": False,

                "message":
                    "Invalid request."

            })


        letter = str(
            data.get(
                "letter",
                ""
            )
        ).strip().lower()


        # -------------------------------------------------
        # VALIDATE LETTER
        # -------------------------------------------------

        if (
            len(letter) != 1
            or not letter.isalpha()
        ):

            return jsonify({

                "success": False,

                "message":
                    "Please enter one letter.",

                "game":
                    get_game_state()

            })


        answer = session["answer"]

        guessed_letters = (
            session["guessed_letters"]
        )

        wrong_letters = (
            session["wrong_letters"]
        )


        # -------------------------------------------------
        # DUPLICATE GUESS
        # -------------------------------------------------

        if letter in guessed_letters:

            return jsonify({

                "success": False,

                "message":
                    f"You already guessed "
                    f"'{letter.upper()}'.",

                "game":
                    get_game_state()

            })


        # -------------------------------------------------
        # SAVE GUESS
        # -------------------------------------------------

        guessed_letters.append(letter)

        session["guessed_letters"] = (
            guessed_letters
        )


        # -------------------------------------------------
        # CORRECT GUESS
        # -------------------------------------------------

        if letter in answer:

            # Every correct letter = 1 point
            session["score"] += 1

            message = "Correct! +1"


        # -------------------------------------------------
        # WRONG GUESS
        # -------------------------------------------------

        else:

            wrong_letters.append(letter)

            session["wrong_letters"] = (
                wrong_letters
            )

            session["wrong_guesses"] += 1

            # Wrong guess = 0 points
            message = "Wrong guess!"


        # -------------------------------------------------
        # CHECK WIN
        # -------------------------------------------------

        won = all(
            character in guessed_letters
            for character in answer
        )


        if won:

            session["game_over"] = True

            session["won"] = True

            message = "You found the word!"


        # -------------------------------------------------
        # CHECK LOSS
        # -------------------------------------------------

        elif (
            session["wrong_guesses"]
            >= MAX_WRONG_GUESSES
        ):

            session["game_over"] = True

            session["won"] = False

            message = "Game over!"


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        response = {

            "success": True,

            "message": message,

            "game":
                get_game_state()

        }


        # Reveal answer only after game ends
        if session["game_over"]:

            response["answer"] = answer


        return jsonify(
            response
        )


    except Exception as error:

        print()
        print("=" * 60)
        print("HANGMAN ERROR")
        print("=" * 60)
        print(error)
        print("=" * 60)
        print()


        return jsonify({

            "success": False,

            "message":
                "Server error. Check the Flask terminal."

        }), 500


# =========================================================
# RESTART GAME
# =========================================================

@app.route(
    "/api/restart",
    methods=["POST"]
)
def api_restart():

    start_new_game()

    return jsonify({

        "success": True,

        "message":
            "New game started.",

        "game":
            get_game_state()

    })


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
