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
                var storedQuestion = (await browser.storage.local.get())?.question || localStorage.getItem("question");
                if(storedQuestion) return allQuestions.find(([key, question, answer]) => key == JSON.parse(storedQuestion) || question == JSON.parse(storedQuestion));
            } catch(err) {}
        }
        return getRandomQuestion();
    }
    async function updateQuestion(newQuestion = false) {
        var [key, question, answer] = await getQuestion(newQuestion);

        await browser.storage.local.set({question: JSON.stringify(key)});

        flashcardContainer.classList.remove("revealed");
        while (questionText.firstChild)
            questionText.firstChild.remove();
        questionText.append(question);
    }
    showAnswer.addEventListener("click", async () => {
        var [key, question, answer] = await getQuestion();
        while (answerText.firstChild)
            answerText.firstChild.remove();
        answerText.append(answer);
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