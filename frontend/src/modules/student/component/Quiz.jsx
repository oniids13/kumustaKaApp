import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("userData"));

  // Check if quiz was already completed today
  const checkDailyCompletion = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const res = await axios.get(
        "http://localhost:3000/api/quizzes/attempts/today",
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.data.completed) {
        setDailyCompleted(true);
      }
    } catch (err) {
      console.error("Error checking completion:", err);
    }
  };

  // Fetch daily questions
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        await checkDailyCompletion();

        if (!dailyCompleted) {
          const questionsRes = await axios.get(
            "http://localhost:3000/api/quizzes/dailyQuestions",
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          setQuestions(questionsRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [dailyCompleted]);

  const handleOptionSelect = (optionIndex) => {
    if (!feedback) {
      setSelectedOption(optionIndex);
    }
  };

  const handleNextQuestion = async () => {
    if (selectedOption === null || isSubmitting) return;

    setIsSubmitting(true);
    const currentQuestion = questions[currentQuestionIndex];

    try {
      const response = await axios.post(
        "http://localhost:3000/api/quizzes/attempts",
        {
          quizId: currentQuestion.id,
          selectedAnswer: selectedOption,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { isCorrect, explanation } = response.data;

      setFeedback({
        isCorrect,
        explanation,
      });

      if (isCorrect) {
        setScore((prev) => prev + currentQuestion.points);
      }

      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedOption(null);
          setFeedback(null);
        } else {
          setQuizCompleted(true);
          setDailyCompleted(true);
        }
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit answer");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <FaSpinner className="spinner-icon" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (dailyCompleted) {
    return (
      <div className="container mt-5 text-center">
        <div className="card p-4">
          <FaCheckCircle
            className="text-success mb-3"
            style={{ fontSize: "3rem" }}
          />
          <h3>
            {quizCompleted
              ? "Quiz Completed!"
              : "You've completed today's quiz!"}
          </h3>
          {quizCompleted && (
            <>
              <p className="display-6">Your score: {score} points</p>
              <p>
                You answered{" "}
                {Math.round(
                  (score / questions.reduce((acc, q) => acc + q.points, 0)) *
                    100
                )}
                % correctly
              </p>
            </>
          )}
          <p>Come back tomorrow for new questions.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mt-4">
      <div className="card p-4">
        <div className="d-flex justify-content-between mb-3">
          <span className="badge bg-primary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="badge bg-secondary">
            Points: {currentQuestion.points}
          </span>
        </div>

        <h3 className="mb-4">{currentQuestion.question}</h3>

        <div className="list-group mb-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`list-group-item list-group-item-action text-start ${
                selectedOption === index ? "active" : ""
              } ${feedback ? "disabled" : ""}`}
              onClick={() => handleOptionSelect(index)}
            >
              {option}
            </button>
          ))}
        </div>

        {feedback && (
          <div
            className={`alert ${
              feedback.isCorrect ? "alert-success" : "alert-danger"
            } mb-3`}
          >
            {feedback.isCorrect ? (
              <FaCheckCircle className="me-2" />
            ) : (
              <FaTimesCircle className="me-2" />
            )}
            {feedback.explanation}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleNextQuestion}
          disabled={
            selectedOption === null || feedback !== null || isSubmitting
          }
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="spinner-icon me-2" />
              Processing...
            </>
          ) : currentQuestionIndex < questions.length - 1 ? (
            "Next Question"
          ) : (
            "Finish Quiz"
          )}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
