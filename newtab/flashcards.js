window.modules = window.modules || {};
modules.flashcards = async function() {
    var flashcardContainer = document.createElement("div");
    flashcardContainer.className = "flashcard";

    var questionContainer = document.createElement("div");
    questionContainer.className = "question-container";

    var questionText = document.createElement("span");
    questionText.className = "question";

    var showAnswer = document.createElement("input");
    showAnswer.type = "button";
    showAnswer.className = "show-answer";
    showAnswer.value = "→";

    var answerContainer = document.createElement("div");
    answerContainer.className = "answer-container";

    var answerText = document.createElement("span");
    answerText.className = "answer";

    var closeQuestion = document.createElement("input");
    closeQuestion.type = "button";
    closeQuestion.className = "close-question";
    closeQuestion.value = "×";

    questionContainer.appendChild(questionText);
    questionContainer.appendChild(showAnswer);

    answerContainer.appendChild(answerText);
    answerContainer.appendChild(closeQuestion);

    flashcardContainer.appendChild(questionContainer);
    flashcardContainer.appendChild(answerContainer);

    document.querySelector("main").appendChild(flashcardContainer);

    var allQuestions = getDepartementsQuestions();
    function getRandomQuestion() {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    async function getQuestion(newQuestion = false) {
        if(!newQuestion) {
            try {
                var question = (await browser.storage.local.get())?.question || localStorage.getItem("question");
                if(question) return JSON.parse(question);
            } catch(err) {}
        }
        return getRandomQuestion();
    }
    async function updateQuestion(newQuestion = false) {
        var question = await getQuestion(newQuestion);

        await browser.storage.local.set({question: JSON.stringify(question)});

        flashcardContainer.classList.remove("revealed");
        questionText.innerHTML = question[0];
    }
    showAnswer.addEventListener("click", async () => {
        answerText.innerHTML = await getQuestion()[1];
        flashcardContainer.classList.add("revealed");
    });
    closeQuestion.addEventListener("click", async () => {
        await updateQuestion(true);
    });
    await updateQuestion();

    return function() {
        flashcardContainer.remove();
    };
};