from flask import Flask, render_template, request, jsonify, session
import random
import os


# =========================================================
# FLASK APP
# =========================================================

app = Flask(
    __name__,
    static_folder="static",
    static_url_path="/static",
    template_folder="templates"
)

app.secret_key = "hangman-secret-key-2026"

MAX_CHANCES = 10


# =========================================================
# LOAD WORDS
# =========================================================

def load_words():

    file_path = os.path.join(
        app.root_path,
        "data",
        "words.txt"
    )

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            words = [
                line.strip().lower()
                for line in file
                if (
                    line.strip()
                    and line.strip().isalpha()
                    and line.strip().isascii()
                )
            ]

        if not words:
            raise ValueError(
                "Word list is empty."
            )

        return words

    except Exception as error:

        print(
            "WORD LIST ERROR:",
            error
        )

        return [
            "apple",
            "orange",
            "banana",
            "coconut",
            "pineapple"
        ]


WORDS = load_words()


# =========================================================
# CREATE NEW GAME
# =========================================================

def create_game():

    session["answer"] = random.choice(
        WORDS
    )

    # IMPORTANT:
    # Create NEW lists for every new word.
    session["guessed_letters"] = []

    session["wrong_letters"] = []

    session["wrong_guesses"] = 0

    # Current word score
    session["score"] = 0

    # Persistent statistics
    if "total_score" not in session:
        session["total_score"] = 0

    if "games_played" not in session:
        session["games_played"] = 0

    session.modified = True


# =========================================================
# GET MASKED WORD
# =========================================================

def get_masked_word():

    answer = session["answer"]

    guessed_letters = session[
        "guessed_letters"
    ]

    return "".join(

        letter
        if letter in guessed_letters
        else "_"

        for letter in answer
    )


# =========================================================
# GET GAME DATA
# =========================================================

def get_game():

    required_keys = [
        "answer",
        "guessed_letters",
        "wrong_letters",
        "wrong_guesses",
        "score",
        "total_score",
        "games_played"
    ]


    # Protect old/incomplete sessions

    if any(
        key not in session
        for key in required_keys
    ):

        total_score = session.get(
            "total_score",
            0
        )

        games_played = session.get(
            "games_played",
            0
        )

        session.clear()

        session["total_score"] = \
            total_score

        session["games_played"] = \
            games_played

        create_game()


    answer = session["answer"]

    masked_word = get_masked_word()

    wrong_guesses = session[
        "wrong_guesses"
    ]


    # =====================================================
    # GAME STATUS
    # =====================================================

    won = (
        "_" not in masked_word
    )

    lost = (
        wrong_guesses >= MAX_CHANCES
    )

    game_over = (
        won or lost
    )


    # =====================================================
    # WIN RATE
    # =====================================================

    games_played = session[
        "games_played"
    ]

    total_score = session[
        "total_score"
    ]

    if games_played > 0:

        win_rate = round(
            (
                total_score /
                games_played
            ) * 100
        )

    else:

        win_rate = None


    # =====================================================
    # RETURN
    # =====================================================

    return {

        "word":
            masked_word,

        "remaining_chances":
            max(
                0,
                MAX_CHANCES -
                wrong_guesses
            ),

        "word_length":
            len(answer),

        "wrong_letters":
            list(
                session["wrong_letters"]
            ),

        "wrong_guesses":
            wrong_guesses,

        # IMPORTANT:
        # Return ALL guessed letters.
        "guessed_letters":
            list(
                session["guessed_letters"]
            ),

        "score":
            session["score"],

        "total_score":
            total_score,

        "games_played":
            games_played,

        "win_rate":
            win_rate,

        "game_over":
            game_over,

        "won":
            won
    }


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def index():

    if "answer" not in session:

        create_game()

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

    if "answer" not in session:

        create_game()

    return jsonify(
        get_game()
    )


# =========================================================
# GUESS LETTER
# =========================================================

@app.route(
    "/api/guess",
    methods=["POST"]
)
def guess():

    # Make sure a game exists

    if "answer" not in session:

        create_game()


    data = request.get_json(
        silent=True
    ) or {}


    letter = str(
        data.get(
            "letter",
            ""
        )
    ).lower().strip()


    # =====================================================
    # VALIDATION
    # =====================================================

    if (
        len(letter) != 1
        or not letter.isalpha()
        or not letter.isascii()
    ):

        return jsonify({

            "message":
                "Please enter one valid letter."

        }), 400


    # =====================================================
    # CHECK GAME STATUS
    # =====================================================

    current_game = get_game()

    if current_game["game_over"]:

        return jsonify({

            "message":
                "This game is already over.",

            "game":
                current_game,

            "answer":
                session["answer"]

        })


    # =====================================================
    # CHECK REPEATED LETTER
    # =====================================================

    guessed_letters = list(
        session["guessed_letters"]
    )

    if letter in guessed_letters:

        return jsonify({

            "message":
                f'"{letter.upper()}" was already guessed!',

            "game":
                get_game(),

            "answer":
                None

        })


    # =====================================================
    # SAVE GUESSED LETTER
    # =====================================================

    # IMPORTANT FIX:
    # Create a new list instead of modifying
    # the session list in-place.

    guessed_letters.append(
        letter
    )

    session["guessed_letters"] = \
        guessed_letters


    # =====================================================
    # CORRECT GUESS
    # =====================================================

    if letter in session["answer"]:

        message = (
            f'"{letter.upper()}" is correct!'
        )


    # =====================================================
    # WRONG GUESS
    # =====================================================

    else:

        wrong_letters = list(
            session["wrong_letters"]
        )

        wrong_letters.append(
            letter
        )

        # IMPORTANT FIX:
        # Reassign the complete list.

        session["wrong_letters"] = \
            wrong_letters

        session["wrong_guesses"] = (
            session["wrong_guesses"] + 1
        )

        message = (
            f'"{letter.upper()}" is not in the word.'
        )


    # Make sure Flask saves
    # every session change.

    session.modified = True


    # =====================================================
    # CHECK WORD
    # =====================================================

    masked_word = get_masked_word()


    # =====================================================
    # WIN
    # =====================================================

    if "_" not in masked_word:

        # Exactly 1 point
        # for completing the word.

        session["score"] = 1

        # Total score =
        # total words won.

        session["total_score"] = (
            session["total_score"] + 1
        )

        # Count completed game.

        session["games_played"] = (
            session["games_played"] + 1
        )

        message = (
            "🎉 You completed the word! +1 point"
        )


    # =====================================================
    # LOSE
    # =====================================================

    elif (
        session["wrong_guesses"]
        >= MAX_CHANCES
    ):

        # No point for losing.

        session["score"] = 0

        # Count completed game.

        session["games_played"] = (
            session["games_played"] + 1
        )

        message = (
            "Game over! Better luck next time."
        )


    # Make sure final state is saved.

    session.modified = True


    game = get_game()


    # =====================================================
    # RESPONSE
    # =====================================================

    return jsonify({

        "message":
            message,

        "game":
            game,

        "answer":
            session["answer"]
            if game["game_over"]
            else None

    })


# =========================================================
# RESTART
# =========================================================

@app.route(
    "/api/restart",
    methods=["POST"]
)
def restart():

    # Keep statistics.

    total_score = session.get(
        "total_score",
        0
    )

    games_played = session.get(
        "games_played",
        0
    )


    # Clear only the current game.

    session.clear()


    # Restore statistics.

    session["total_score"] = \
        total_score

    session["games_played"] = \
        games_played


    # Create fresh word.

    create_game()


    session.modified = True


    return jsonify({

        "game":
            get_game()

    })


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
