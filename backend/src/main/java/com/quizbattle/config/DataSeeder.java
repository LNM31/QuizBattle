package com.quizbattle.config;

import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.Difficulty;
import com.quizbattle.model.enums.QuestionType;
import com.quizbattle.model.enums.QuizSource;
import com.quizbattle.repository.QuizRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    // populates the database with PREDEFINED quizzes
    private final QuizRepository quizRepository;

    public DataSeeder(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    @Override
    public void run(String @NonNull ... args) {
        if(quizRepository.count() > 0) return;

        seedComputerScience();
        seedIstorie();
        seedGeografie();
    }

    private void seedComputerScience() {
        Quiz quiz = new Quiz();
        quiz.setTitle("Computer Science: Fundamentals");
        quiz.setCategory("Computer Science");
        quiz.setSource(QuizSource.PREDEFINED);
        quiz.setDifficulty(Difficulty.MEDIUM);
        quiz.setQuestions(List.of(
                makeQuestion(quiz, "Care dintre acestea este un limbaj compilat?",
                        "[\"Python\", \"JavaScript\", \"Java\", \"Ruby\"]", "Java"),
                makeQuestion(quiz, "Ce înseamnă HTTP?",
                        "[\"HyperText Transfer Protocol\", \"High Tech Transfer Protocol\", \"Hyper Transfer Text Protocol\", \"HyperText Transmission Protocol\"]", "HyperText Transfer Protocol"),
                makeQuestion(quiz, "Ce structură de date folosește principiul LIFO?",
                        "[\"Coadă\", \"Stivă\", \"Listă\", \"Arbore\"]", "Stivă"),
                makeQuestion(quiz, "Care algoritm de sortare are complexitatea O(n log n) în cazul mediu?",
                        "[\"Bubble Sort\", \"Insertion Sort\", \"Merge Sort\", \"Selection Sort\"]", "Merge Sort"),
                makeQuestion(quiz, "Ce protocol operează la Layer 3 din modelul OSI?",
                        "[\"TCP\", \"HTTP\", \"IP\", \"Ethernet\"]", "IP"),
                makeQuestion(quiz, "Ce înseamnă SQL?",
                        "[\"Structured Query Language\", \"Simple Query Language\", \"Standard Query Logic\", \"Structured Question Language\"]", "Structured Query Language"),
                makeQuestion(quiz, "Care este baza sistemului binar?",
                        "[\"8\", \"10\", \"2\", \"16\"]", "2"),
                makeQuestion(quiz, "Ce este un deadlock?",
                        "[\"Un bug de memorie\", \"O situație în care 2 procese se blochează reciproc\", \"Un tip de atac cibernetic\", \"O eroare de compilare\"]", "O situație în care 2 procese se blochează reciproc"),
                makeQuestion(quiz, "Ce face comanda git commit?",
                        "[\"Trimite codul pe server\", \"Salvează modificările în istoricul local\", \"Creează un branch nou\", \"Șterge fișierele modificate\"]", "Salvează modificările în istoricul local"),
                makeQuestion(quiz, "Ce înseamnă OOP?",
                        "[\"Object Oriented Programming\", \"Open Oriented Protocol\", \"Operational Output Process\", \"Object Output Programming\"]", "Object Oriented Programming")
        ));
        quizRepository.save(quiz);
    }

    private void seedIstorie() {
        Quiz quiz = new Quiz();
        quiz.setTitle("Istorie — România și Europa");
        quiz.setCategory("Istorie");
        quiz.setSource(QuizSource.PREDEFINED);
        quiz.setDifficulty(Difficulty.MEDIUM);

        quiz.setQuestions(List.of(
                makeQuestion(quiz, "În ce an s-a format România Mare?",
                        "[\"1859\", \"1877\", \"1918\", \"1920\"]", "1918"),
                makeQuestion(quiz, "Cine a fost primul domnitor al Principatelor Unite?",
                        "[\"Mihai Viteazul\", \"Alexandru Ioan Cuza\", \"Carol I\", \"Ștefan cel Mare\"]", "Alexandru Ioan Cuza"),
                makeQuestion(quiz, "În ce an a avut loc Revoluția Franceză?",
                        "[\"1776\", \"1789\", \"1804\", \"1815\"]", "1789"),
                makeQuestion(quiz, "Ce eveniment a declanșat Primul Război Mondial?",
                        "[\"Invazia Poloniei\", \"Asasinarea arhiducelui Franz Ferdinand\", \"Atacul asupra Pearl Harbor\", \"Revoluția Rusă\"]", "Asasinarea arhiducelui Franz Ferdinand"),
                makeQuestion(quiz, "În ce an a căzut Zidul Berlinului?",
                        "[\"1985\", \"1987\", \"1989\", \"1991\"]", "1989"),
                makeQuestion(quiz, "Cine a fost Napoleon Bonaparte?",
                        "[\"Rege al Franței\", \"Împărat al Franței\", \"Președinte al Franței\", \"General englez\"]", "Împărat al Franței"),
                makeQuestion(quiz, "Ce civilizație a construit Colosseumul?",
                        "[\"Greacă\", \"Egipteană\", \"Romană\", \"Persană\"]", "Romană"),
                makeQuestion(quiz, "În ce an a început Al Doilea Război Mondial?",
                        "[\"1935\", \"1937\", \"1939\", \"1941\"]", "1939"),
                makeQuestion(quiz, "Care țară a fost prima care a acordat drept de vot femeilor?",
                        "[\"Franța\", \"Marea Britanie\", \"Noua Zeelandă\", \"SUA\"]", "Noua Zeelandă"),
                makeQuestion(quiz, "Cine a descoperit America în 1492?",
                        "[\"Vasco da Gama\", \"Amerigo Vespucci\", \"Cristofor Columb\", \"Ferdinand Magellan\"]", "Cristofor Columb")
        ));

        quizRepository.save(quiz);
    }

    private void seedGeografie() {
        Quiz quiz = new Quiz();
        quiz.setTitle("Geografie — Lumea");
        quiz.setCategory("Geografie");
        quiz.setSource(QuizSource.PREDEFINED);
        quiz.setDifficulty(Difficulty.EASY);

        quiz.setQuestions(List.of(
                makeQuestion(quiz, "Care este cel mai mare ocean?",
                        "[\"Atlantic\", \"Indian\", \"Arctic\", \"Pacific\"]", "Pacific"),
                makeQuestion(quiz, "Care este capitala Australiei?",
                        "[\"Sydney\", \"Melbourne\", \"Canberra\", \"Brisbane\"]", "Canberra"),
                makeQuestion(quiz, "Pe ce continent se află Sahara?",
                        "[\"Asia\", \"America de Sud\", \"Africa\", \"Australia\"]", "Africa"),
                makeQuestion(quiz, "Care este cel mai lung râu din lume?",
                        "[\"Amazon\", \"Nil\", \"Yangtze\", \"Mississippi\"]", "Nil"),
                makeQuestion(quiz, "Care este cea mai înaltă muntele din lume?",
                        "[\"K2\", \"Kilimanjaro\", \"Mont Blanc\", \"Everest\"]", "Everest"),
                makeQuestion(quiz, "Câte continente are Terra?",
                        "[\"5\", \"6\", \"7\", \"8\"]", "7"),
                makeQuestion(quiz, "Care țară are cea mai mare populație din lume?",
                        "[\"India\", \"China\", \"SUA\", \"Rusia\"]", "India"),
                makeQuestion(quiz, "Care este capitala Braziliei?",
                        "[\"Rio de Janeiro\", \"São Paulo\", \"Brasília\", \"Salvador\"]", "Brasília"),
                makeQuestion(quiz, "Pe ce continent se află România?",
                        "[\"Asia\", \"Africa\", \"Europa\", \"America\"]", "Europa"),
                makeQuestion(quiz, "Care este cel mai mic stat din lume?",
                        "[\"Monaco\", \"San Marino\", \"Vatican\", \"Liechtenstein\"]", "Vatican")
        ));

        quizRepository.save(quiz);
    }

    private @NonNull Question makeQuestion(Quiz quiz, String text, String options, String correctAnswer) {
        Question question = new Question();
        question.setQuiz(quiz);
        question.setText(text);
        question.setType(QuestionType.MCQ);
        question.setOptions(options);
        question.setCorrectAnswer(correctAnswer);
        question.setTimeLimitSeconds(20);
        return question;
    }
}
