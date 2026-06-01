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

import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    // populates the database with PREDEFINED quizzes
    private final QuizRepository quizRepository;

    public DataSeeder(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    // A "sized category" is seeded as several quizzes of increasing length, each being the
    // first N questions of a single 20-question pool. The host picks the category, then the
    // length (the Create dropdown shows "Category · N questions" per variant).
    private static final int[] SIZES = {5, 7, 10, 20};

    @Override
    public void run(String @NonNull ... args) {
        if (quizRepository.count() == 0) {
            seedComputerScience();
            seedIstorie();
            seedGeografie();
        }

        // T21 — deterministic quiz with all 5 question types, for testing/demo.
        // Seeded by category check (not the count guard above) so it also appears on
        // databases that were created before T21.
        if (quizRepository.findQuizByCategory("Mixed Demo").isEmpty()) {
            seedAllTypesDemo();
        }

        // Extra predefined categories (random domains). Each is category-checked individually
        // so it also seeds onto databases created before this change, without a wipe.
        seedIfAbsent("Muzică", () -> seedSizedCategory("Muzică", Difficulty.MEDIUM, muzicaPool()));
        seedIfAbsent("Filme", () -> seedSizedCategory("Filme", Difficulty.MEDIUM, filmePool()));
        seedIfAbsent("Sport", () -> seedSizedCategory("Sport", Difficulty.EASY, sportPool()));
        seedIfAbsent("Spațiu & Astronomie", () -> seedSizedCategory("Spațiu & Astronomie", Difficulty.MEDIUM, spatiuPool()));
        seedIfAbsent("Animale", () -> seedSizedCategory("Animale", Difficulty.EASY, animalePool()));
        seedIfAbsent("Curiozități generale", () -> seedSizedCategory("Curiozități generale", Difficulty.MEDIUM, curiozitatiPool()));
    }

    private void seedIfAbsent(String category, Runnable seeder) {
        if (quizRepository.findQuizByCategory(category).isEmpty()) {
            seeder.run();
        }
    }

    // Builds one quiz per size in SIZES, each containing the first N questions of the pool.
    private void seedSizedCategory(String category, Difficulty difficulty, List<Q> pool) {
        for (int size : SIZES) {
            if (size > pool.size()) continue;
            Quiz quiz = new Quiz();
            quiz.setTitle(category);
            quiz.setCategory(category);
            quiz.setSource(QuizSource.PREDEFINED);
            quiz.setDifficulty(difficulty);
            List<Question> questions = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                Q spec = pool.get(i);
                questions.add(makeQuestion(quiz, spec.text(), spec.options(), spec.answer()));
            }
            quiz.setQuestions(questions);
            quizRepository.save(quiz);
        }
    }

    // A single MCQ spec for a pool: options is a JSON array string, answer is the exact option text.
    private record Q(String text, String options, String answer) {}

    private static Q q(String text, String options, String answer) {
        return new Q(text, options, answer);
    }

    private List<Q> muzicaPool() {
        return List.of(
                q("Câte corzi are o chitară clasică standard?", "[\"4\", \"5\", \"6\", \"7\"]", "6"),
                q("Cine a compus „Simfonia a 9-a”?", "[\"Mozart\", \"Beethoven\", \"Bach\", \"Chopin\"]", "Beethoven"),
                q("Ce instrument are clape albe și negre?", "[\"Vioară\", \"Pian\", \"Trompetă\", \"Tobă\"]", "Pian"),
                q("Din ce oraș provine trupa The Beatles?", "[\"Londra\", \"Liverpool\", \"Manchester\", \"Dublin\"]", "Liverpool"),
                q("Câte note are gama muzicală (do, re, mi...)?", "[\"5\", \"6\", \"7\", \"8\"]", "7"),
                q("Cine este supranumit „Regele Pop”?", "[\"Elvis Presley\", \"Michael Jackson\", \"Prince\", \"Freddie Mercury\"]", "Michael Jackson"),
                q("Ce gen muzical a apărut în Jamaica?", "[\"Jazz\", \"Reggae\", \"Blues\", \"Country\"]", "Reggae"),
                q("Câte corzi are o vioară?", "[\"3\", \"4\", \"5\", \"6\"]", "4"),
                q("La ce instrument cântă un toboșar?", "[\"Chitară\", \"Tobe\", \"Pian\", \"Flaut\"]", "Tobe"),
                q("Care trupă a lansat melodia „Bohemian Rhapsody”?", "[\"The Rolling Stones\", \"Queen\", \"Led Zeppelin\", \"Pink Floyd\"]", "Queen"),
                q("Cum se numește persoana care conduce o orchestră?", "[\"Solist\", \"Dirijor\", \"Compozitor\", \"Acordor\"]", "Dirijor"),
                q("Ce instrument de suflat cu clape este des folosit în jazz?", "[\"Saxofon\", \"Vioară\", \"Pian\", \"Harpă\"]", "Saxofon"),
                q("Cine a compus „Pentru Elise”?", "[\"Mozart\", \"Bach\", \"Beethoven\", \"Vivaldi\"]", "Beethoven"),
                q("Care dintre acestea este un instrument de percuție?", "[\"Flaut\", \"Trompetă\", \"Xilofon\", \"Vioară\"]", "Xilofon"),
                q("Cum se numește vocea masculină cea mai înaltă?", "[\"Bas\", \"Tenor\", \"Bariton\", \"Alto\"]", "Tenor"),
                q("Ce litere se folosesc pentru note în sistemul anglo-saxon?", "[\"A-G\", \"A-H\", \"C-K\", \"X-Z\"]", "A-G"),
                q("Care instrument are 88 de clape?", "[\"Orga\", \"Pianul\", \"Acordeonul\", \"Clavecinul\"]", "Pianul"),
                q("Din ce țară provine muzica „flamenco”?", "[\"Italia\", \"Spania\", \"Portugalia\", \"Mexic\"]", "Spania"),
                q("Cum se numește un grup de 4 cântăreți?", "[\"Duet\", \"Trio\", \"Cvartet\", \"Cvintet\"]", "Cvartet"),
                q("Ce instrument are cele mai multe corzi: harpa sau ukulele?", "[\"Ukulele\", \"Harpa\", \"Au la fel\", \"Niciunul nu are corzi\"]", "Harpa")
        );
    }

    private List<Q> filmePool() {
        return List.of(
                q("Cine a regizat filmul „Titanic” (1997)?", "[\"Steven Spielberg\", \"James Cameron\", \"Christopher Nolan\", \"Martin Scorsese\"]", "James Cameron"),
                q("În ce serie de filme apare personajul Jack Sparrow?", "[\"Pirații din Caraibe\", \"Indiana Jones\", \"Star Wars\", \"Mad Max\"]", "Pirații din Caraibe"),
                q("Ce culoare are sabia laser a lui Yoda?", "[\"Roșie\", \"Albastră\", \"Verde\", \"Violet\"]", "Verde"),
                q("Ce actor joacă rolul lui Iron Man?", "[\"Chris Evans\", \"Robert Downey Jr.\", \"Chris Hemsworth\", \"Mark Ruffalo\"]", "Robert Downey Jr."),
                q("Ce studio a creat filmul „Toy Story”?", "[\"DreamWorks\", \"Pixar\", \"Warner Bros\", \"Universal\"]", "Pixar"),
                q("În „Matrix”, ce culoare are pilula pe care o alege Neo?", "[\"Albastră\", \"Verde\", \"Roșie\", \"Galbenă\"]", "Roșie"),
                q("Cine este regizorul filmului „Pulp Fiction”?", "[\"Quentin Tarantino\", \"Ridley Scott\", \"David Fincher\", \"James Cameron\"]", "Quentin Tarantino"),
                q("În „Stăpânul Inelelor”, unde trebuie distrus inelul?", "[\"Muntele Everest\", \"Muntele Osândei\", \"Muntele Olimp\", \"Muntele Fuji\"]", "Muntele Osândei"),
                q("Ce animal este Simba din „Regele Leu”?", "[\"Tigru\", \"Leu\", \"Leopard\", \"Ghepard\"]", "Leu"),
                q("Câte filme are trilogia originală „Star Wars”?", "[\"2\", \"3\", \"4\", \"5\"]", "3"),
                q("Cum se numește vrăjitorul tânăr cu cicatrice pe frunte?", "[\"Frodo\", \"Harry Potter\", \"Gandalf\", \"Dumbledore\"]", "Harry Potter"),
                q("Ce creaturi apar în filmul „Jurassic Park”?", "[\"Extratereștri\", \"Dinozauri\", \"Roboți\", \"Zombi\"]", "Dinozauri"),
                q("Ce univers de super-eroi conține echipa Avengers?", "[\"DC\", \"Marvel\", \"Pixar\", \"Looney Tunes\"]", "Marvel"),
                q("Cine este actorul principal din seria „Rocky”?", "[\"Arnold Schwarzenegger\", \"Sylvester Stallone\", \"Bruce Willis\", \"Tom Cruise\"]", "Sylvester Stallone"),
                q("Cu ce compară Forrest Gump viața?", "[\"Cu o cutie de bomboane\", \"Cu un râu\", \"Cu un drum\", \"Cu o carte\"]", "Cu o cutie de bomboane"),
                q("În ce film de animație apare Elsa, care îngheață totul?", "[\"Shrek\", \"Frozen\", \"Moana\", \"Encanto\"]", "Frozen"),
                q("Cine a regizat „Jurassic Park” și „E.T.”?", "[\"George Lucas\", \"Steven Spielberg\", \"James Cameron\", \"Tim Burton\"]", "Steven Spielberg"),
                q("În „Star Wars”, cine este tatăl lui Luke Skywalker?", "[\"Han Solo\", \"Darth Vader\", \"Obi-Wan\", \"Yoda\"]", "Darth Vader"),
                q("Ce super-erou este cunoscut drept „Omul Liliac”?", "[\"Superman\", \"Batman\", \"Spider-Man\", \"Hulk\"]", "Batman"),
                q("Cine a regizat filmul „Avatar” (2009)?", "[\"James Cameron\", \"Peter Jackson\", \"Ridley Scott\", \"J.J. Abrams\"]", "James Cameron")
        );
    }

    private List<Q> sportPool() {
        return List.of(
                q("Câți jucători are o echipă de fotbal pe teren?", "[\"9\", \"10\", \"11\", \"12\"]", "11"),
                q("În ce sport se folosește un coș la 3,05 m înălțime?", "[\"Volei\", \"Baschet\", \"Handbal\", \"Tenis\"]", "Baschet"),
                q("La câți ani se organizează Jocurile Olimpice de vară?", "[\"2\", \"3\", \"4\", \"5\"]", "4"),
                q("Câte inele are simbolul olimpic?", "[\"4\", \"5\", \"6\", \"7\"]", "5"),
                q("În tenis, cum se numește scorul „0”?", "[\"Love\", \"Deuce\", \"Ace\", \"Set\"]", "Love"),
                q("Ce țară a câștigat Cupa Mondială de fotbal din 2018?", "[\"Germania\", \"Brazilia\", \"Franța\", \"Argentina\"]", "Franța"),
                q("Ce sport se joacă la Wimbledon?", "[\"Golf\", \"Tenis\", \"Crichet\", \"Polo\"]", "Tenis"),
                q("Câți jucători are o echipă de baschet pe teren?", "[\"4\", \"5\", \"6\", \"7\"]", "5"),
                q("Cu ce se joacă tenisul de masă?", "[\"Minge de fotbal\", \"Paletă și minge mică\", \"Crosă\", \"Rachetă de badminton\"]", "Paletă și minge mică"),
                q("În ce probă a excelat Usain Bolt?", "[\"Înot\", \"Sprint (atletism)\", \"Box\", \"Ciclism\"]", "Sprint (atletism)"),
                q("Câte puncte valorează un „touchdown” în fotbalul american?", "[\"3\", \"6\", \"7\", \"2\"]", "6"),
                q("Ce sport practica Michael Jordan?", "[\"Fotbal\", \"Baschet\", \"Baseball\", \"Tenis\"]", "Baschet"),
                q("Câte cartonașe galbene duc la eliminare în fotbal?", "[\"1\", \"2\", \"3\", \"4\"]", "2"),
                q("Care sport se joacă pe gheață cu un puc?", "[\"Hochei\", \"Curling\", \"Patinaj\", \"Schi\"]", "Hochei"),
                q("Cât durează o repriză standard de fotbal?", "[\"30 minute\", \"45 minute\", \"60 minute\", \"90 minute\"]", "45 minute"),
                q("În ce sport auzi termenul „strike”?", "[\"Tenis\", \"Bowling\", \"Golf\", \"Înot\"]", "Bowling"),
                q("În ce țară a apărut fotbalul modern?", "[\"Brazilia\", \"Anglia\", \"Italia\", \"Spania\"]", "Anglia"),
                q("Câți jucători are o echipă de volei pe teren?", "[\"5\", \"6\", \"7\", \"8\"]", "6"),
                q("Care este cea mai cunoscută cursă de ciclism din lume?", "[\"Giro d'Italia\", \"Turul Franței\", \"Vuelta\", \"Paris-Roubaix\"]", "Turul Franței"),
                q("În box, cum se numește victoria în care adversarul nu se mai ridică?", "[\"Knockout (KO)\", \"Touché\", \"Set\", \"Gol\"]", "Knockout (KO)")
        );
    }

    private List<Q> spatiuPool() {
        return List.of(
                q("Care este cea mai mare planetă din Sistemul Solar?", "[\"Saturn\", \"Jupiter\", \"Neptun\", \"Pământ\"]", "Jupiter"),
                q("Ce planetă este cunoscută drept „Planeta Roșie”?", "[\"Venus\", \"Marte\", \"Mercur\", \"Jupiter\"]", "Marte"),
                q("Aproximativ cât durează ca lumina Soarelui să ajungă pe Pământ?", "[\"8 secunde\", \"8 minute\", \"8 ore\", \"8 zile\"]", "8 minute"),
                q("Ce stea se află în centrul Sistemului Solar?", "[\"Luna\", \"Soarele\", \"Sirius\", \"Steaua Polară\"]", "Soarele"),
                q("Câte planete are Sistemul Solar?", "[\"7\", \"8\", \"9\", \"10\"]", "8"),
                q("Care este satelitul natural al Pământului?", "[\"Phobos\", \"Luna\", \"Titan\", \"Europa\"]", "Luna"),
                q("În ce galaxie se află Sistemul Solar?", "[\"Andromeda\", \"Calea Lactee\", \"Triunghiulara\", \"Sombrero\"]", "Calea Lactee"),
                q("Care planetă are cele mai spectaculoase inele?", "[\"Jupiter\", \"Saturn\", \"Uranus\", \"Neptun\"]", "Saturn"),
                q("Ce forță ține planetele pe orbită în jurul Soarelui?", "[\"Magnetismul\", \"Gravitația\", \"Frecarea\", \"Inerția\"]", "Gravitația"),
                q("Ce corp ceresc a fost reclasificat ca „planetă pitică” în 2006?", "[\"Pluto\", \"Marte\", \"Venus\", \"Mercur\"]", "Pluto"),
                q("Care este planeta cea mai apropiată de Soare?", "[\"Venus\", \"Mercur\", \"Marte\", \"Pământ\"]", "Mercur"),
                q("Cum se numește o persoană care călătorește în spațiu?", "[\"Pilot\", \"Astronaut\", \"Cosmolog\", \"Aviator\"]", "Astronaut"),
                q("Cine a fost primul om care a pășit pe Lună?", "[\"Yuri Gagarin\", \"Neil Armstrong\", \"Buzz Aldrin\", \"Michael Collins\"]", "Neil Armstrong"),
                q("Ce instrument se folosește pentru a observa stelele de aproape?", "[\"Microscop\", \"Telescop\", \"Periscop\", \"Stetoscop\"]", "Telescop"),
                q("Cum se numește o stea care explodează?", "[\"Pulsar\", \"Supernovă\", \"Quasar\", \"Nebuloasă\"]", "Supernovă"),
                q("Care planetă este numită „geamăna Pământului” datorită dimensiunii?", "[\"Marte\", \"Venus\", \"Mercur\", \"Saturn\"]", "Venus"),
                q("Cine a fost primul om în spațiu?", "[\"Neil Armstrong\", \"Yuri Gagarin\", \"Alan Shepard\", \"John Glenn\"]", "Yuri Gagarin"),
                q("Ce obiect ceresc are o coadă luminoasă când se apropie de Soare?", "[\"Asteroid\", \"Cometă\", \"Meteorit\", \"Planetă\"]", "Cometă"),
                q("Câte luni (sateliți) are planeta Marte?", "[\"0\", \"1\", \"2\", \"4\"]", "2"),
                q("Ce agenție spațială a SUA a dus oameni pe Lună?", "[\"ESA\", \"NASA\", \"Roscosmos\", \"SpaceX\"]", "NASA")
        );
    }

    private List<Q> animalePool() {
        return List.of(
                q("Care este cel mai mare animal de pe Pământ?", "[\"Elefantul african\", \"Balena albastră\", \"Girafa\", \"Rechinul balenă\"]", "Balena albastră"),
                q("Câte picioare are un păianjen?", "[\"6\", \"8\", \"10\", \"12\"]", "8"),
                q("Care animal este cunoscut drept „regele junglei”?", "[\"Tigrul\", \"Leul\", \"Ursul\", \"Lupul\"]", "Leul"),
                q("Care este singurul mamifer care poate zbura?", "[\"Bufnița\", \"Liliacul\", \"Vulturul\", \"Fluturele\"]", "Liliacul"),
                q("Care este cel mai rapid animal terestru?", "[\"Leopardul\", \"Ghepardul\", \"Gazela\", \"Calul\"]", "Ghepardul"),
                q("Câte inimi are o caracatiță?", "[\"1\", \"2\", \"3\", \"4\"]", "3"),
                q("Ce mănâncă în principal ursul panda uriaș?", "[\"Carne\", \"Bambus\", \"Pește\", \"Fructe\"]", "Bambus"),
                q("Care dintre aceste păsări nu poate zbura?", "[\"Vrabia\", \"Pinguinul\", \"Rândunica\", \"Porumbelul\"]", "Pinguinul"),
                q("Care animal are gâtul foarte lung și pete pe corp?", "[\"Zebra\", \"Girafa\", \"Cămila\", \"Calul\"]", "Girafa"),
                q("Cum se numește puiul de broască?", "[\"Mormoloc\", \"Pui\", \"Larvă\", \"Năpârcă\"]", "Mormoloc"),
                q("Care animal este considerat „cel mai bun prieten al omului”?", "[\"Pisica\", \"Câinele\", \"Calul\", \"Hamsterul\"]", "Câinele"),
                q("Care animal își schimbă culoarea pielii pentru camuflaj?", "[\"Broasca\", \"Cameleonul\", \"Șarpele\", \"Crocodilul\"]", "Cameleonul"),
                q("Câte cocoașe are o cămilă dromader?", "[\"0\", \"1\", \"2\", \"3\"]", "1"),
                q("Ce mamifer marin inteligent sare des din apă?", "[\"Rechinul\", \"Delfinul\", \"Caracatița\", \"Meduza\"]", "Delfinul"),
                q("Care insectă construiește un stup?", "[\"Furnica\", \"Albina\", \"Greierele\", \"Libelula\"]", "Albina"),
                q("Care dintre aceste animale hibernează iarna?", "[\"Vulpea\", \"Ursul\", \"Lupul\", \"Cerbul\"]", "Ursul"),
                q("Ce animal mare are trompă și e cunoscut pentru memorie?", "[\"Hipopotamul\", \"Elefantul\", \"Rinocerul\", \"Bivolul\"]", "Elefantul"),
                q("Câte picioare are o insectă (de exemplu o furnică)?", "[\"4\", \"6\", \"8\", \"10\"]", "6"),
                q("Ce mic animal produce mătasea?", "[\"Albina\", \"Viermele de mătase\", \"Furnica\", \"Greierele\"]", "Viermele de mătase"),
                q("Ce reptilă are o carapace?", "[\"Șopârla\", \"Broasca țestoasă\", \"Crocodilul\", \"Șarpele\"]", "Broasca țestoasă")
        );
    }

    private List<Q> curiozitatiPool() {
        return List.of(
                q("Care este capitala Japoniei?", "[\"Beijing\", \"Seul\", \"Tokyo\", \"Bangkok\"]", "Tokyo"),
                q("Câte culori are curcubeul?", "[\"5\", \"6\", \"7\", \"8\"]", "7"),
                q("Care este cel mai mare deșert fierbinte din lume?", "[\"Gobi\", \"Sahara\", \"Kalahari\", \"Atacama\"]", "Sahara"),
                q("Ce metal este lichid la temperatura camerei?", "[\"Fier\", \"Mercur\", \"Aur\", \"Plumb\"]", "Mercur"),
                q("Care este simbolul chimic al aurului?", "[\"Ag\", \"Au\", \"Fe\", \"Go\"]", "Au"),
                q("Câte zile are un an bisect?", "[\"364\", \"365\", \"366\", \"367\"]", "366"),
                q("Care este cel mai înalt animal terestru?", "[\"Elefantul\", \"Girafa\", \"Cămila\", \"Ursul\"]", "Girafa"),
                q("Ce gaz respiră oamenii pentru a trăi?", "[\"Dioxid de carbon\", \"Oxigen\", \"Azot\", \"Heliu\"]", "Oxigen"),
                q("Care este cea mai vorbită limbă maternă din lume?", "[\"Engleza\", \"Spaniola\", \"Chineza mandarină\", \"Hindi\"]", "Chineza mandarină"),
                q("Câte continente există pe Pământ?", "[\"5\", \"6\", \"7\", \"8\"]", "7"),
                q("Ce instrument măsoară temperatura?", "[\"Barometru\", \"Termometru\", \"Higrometru\", \"Altimetru\"]", "Termometru"),
                q("Care este cea mai mare planetă din Sistemul Solar?", "[\"Pământ\", \"Jupiter\", \"Saturn\", \"Marte\"]", "Jupiter"),
                q("În ce țară se află Turnul Eiffel?", "[\"Italia\", \"Franța\", \"Spania\", \"Anglia\"]", "Franța"),
                q("Care ocean este cel mai mare?", "[\"Atlantic\", \"Indian\", \"Pacific\", \"Arctic\"]", "Pacific"),
                q("Ce vitamină ne oferă în principal expunerea la soare?", "[\"Vitamina A\", \"Vitamina B\", \"Vitamina C\", \"Vitamina D\"]", "Vitamina D"),
                q("Care este cel mai dur material natural cunoscut?", "[\"Aur\", \"Fier\", \"Diamant\", \"Granit\"]", "Diamant"),
                q("Câte minute are o oră?", "[\"30\", \"45\", \"60\", \"90\"]", "60"),
                q("Care este formula chimică a apei?", "[\"CO2\", \"H2O\", \"O2\", \"NaCl\"]", "H2O"),
                q("Care este capitala Italiei?", "[\"Milano\", \"Roma\", \"Veneția\", \"Napoli\"]", "Roma"),
                q("Care este cel mai lung fluviu din Europa?", "[\"Dunărea\", \"Volga\", \"Rinul\", \"Sena\"]", "Volga")
        );
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
        quiz.setTitle("Istorie - România și Europa");
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
        quiz.setTitle("Geografie - Lumea");
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

    // T21 — one quiz that exercises every question type, so the full flow can be tested
    // deterministically without depending on what Gemini happens to generate.
    private void seedAllTypesDemo() {
        Quiz quiz = new Quiz();
        quiz.setTitle("All Question Types - Demo");
        quiz.setCategory("Mixed Demo");
        quiz.setSource(QuizSource.PREDEFINED);
        quiz.setDifficulty(Difficulty.EASY);
        quiz.setQuestions(List.of(
                makeTyped(quiz, QuestionType.MCQ,
                        "Care planetă este cea mai apropiată de Soare?",
                        "[\"Venus\", \"Mercur\", \"Marte\", \"Pământ\"]", "Mercur"),
                makeTyped(quiz, QuestionType.TRUE_FALSE,
                        "Apa fierbe la 100°C la nivelul mării.",
                        "[\"True\", \"False\"]", "True"),
                makeTyped(quiz, QuestionType.ORDERING,
                        "Așază planetele de la cea mai apropiată la cea mai depărtată de Soare",
                        "[\"Pământ\", \"Mercur\", \"Marte\", \"Venus\"]", "Mercur,Venus,Pământ,Marte"),
                makeTyped(quiz, QuestionType.ESTIMATION,
                        "Estimează distanța medie dintre Pământ și Lună",
                        "{\"unit\":\"km\",\"hint\":\"distanța medie\"}", "384400"),
                makeTyped(quiz, QuestionType.ESTIMATION,
                        "În ce an a pășit primul om pe Lună?",
                        "{\"unit\":\"\",\"hint\":\"misiunea Apollo 11\"}", "1969"),
                makeTyped(quiz, QuestionType.FILL_BLANK,
                        "Protocolul folosit pentru a naviga pe web este _____",
                        "{\"accepted\":[\"HTTP\",\"http\"]}", "HTTP"),
                makeTyped(quiz, QuestionType.FILL_BLANK,
                        "Cel mai mare ocean de pe Pământ este Oceanul _____",
                        "{\"accepted\":[\"Pacific\",\"Pacificul\"]}", "Pacific")
        ));
        quizRepository.save(quiz);
    }

    private @NonNull Question makeTyped(Quiz quiz, QuestionType type, String text,
                                        String options, String correctAnswer) {
        Question question = new Question();
        question.setQuiz(quiz);
        question.setText(text);
        question.setType(type);
        question.setOptions(options);
        question.setCorrectAnswer(correctAnswer);
        question.setTimeLimitSeconds(20);
        return question;
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
