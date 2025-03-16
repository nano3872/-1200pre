const titleScreen = document.getElementById('title-screen');
const cardScreen = document.getElementById('card-screen');
const resultScreen = document.getElementById('result-screen');
const english = document.getElementById('english');
const japanese = document.getElementById('japanese');
const knownButton = document.getElementById('known');
const unknownButton = document.getElementById('unknown');
const returnTitleCardButton = document.getElementById("return-title-card");
const retryButton = document.getElementById('retry-button');
const retryIncorrectButton = document.getElementById('retry-incorrect-button');
const correctCountDisplay = document.getElementById('correct-count');
const correctPercentageDisplay = document.getElementById('correct-percentage');
const totalCountDisplay = document.getElementById('total-count');
const englishArea = document.getElementById("english-area");
const japaneseArea = document.getElementById("japanese-area");
const navigation = document.getElementById("navigation");
const progressDisplay = document.getElementById("progress");
const returnTitleButton = document.getElementById("return-title");
const rangeButtons = document.getElementById('range-buttons');
const setButtonContainer = document.getElementById('set-button-container');
const showHistoryButton = document.getElementById('show-history');
const historyScreen = document.getElementById('history-screen');
const returnTitleHistory = document.getElementById('return-title-history');

let currentWordIndex = 0;
let buttonClicked = false;
let currentWords = [];
let correctCount = 0;
let incorrectWords = [];
let totalCount = 0;
let learningRange = ""; // 学習範囲を保存する変数
let currentSetId = ""; // 現在の学習セットのID

let words = [];

// 学習履歴を保存するオブジェクト
const historyManager = {
    // 履歴を読み込む
    loadHistory: function() {
        const historyString = localStorage.getItem('wordLearningHistory');
        if (historyString) {
            return JSON.parse(historyString);
        }
        return {};
    },
    
    // 履歴を保存する
    saveHistory: function(history) {
        localStorage.setItem('wordLearningHistory', JSON.stringify(history));
    },
    
    // セットの履歴を更新する
    updateSetHistory: function(setId, correct, total) {
        const history = this.loadHistory();
        if (!history[setId]) {
            history[setId] = {
                setId: setId,
                attempts: []
            };
        }
        
        // 新しい学習記録を追加
        history[setId].attempts.push({
            date: new Date().toISOString(),
            correct: correct,
            total: total
        });
        
        this.saveHistory(history);
    },
    
    // セットの平均正解率を計算する
    getSetPerformance: function(setId) {
        const history = this.loadHistory();
        if (!history[setId] || history[setId].attempts.length === 0) {
            return null;
        }
        
        const attempts = history[setId].attempts;
        let totalCorrect = 0;
        let totalQuestions = 0;
        
        attempts.forEach(attempt => {
            totalCorrect += attempt.correct;
            totalQuestions += attempt.total;
        });
        
        return {
            percentage: Math.round((totalCorrect / totalQuestions) * 100),
            attempts: attempts.length
        };
    },
    
    // すべてのセットの履歴を取得
    getAllHistory: function() {
        return this.loadHistory();
    }
};

async function loadWords() {
    try {
        const response = await fetch('words.json');
        words = await response.json();
    } catch (error) {
        console.error('単語データの読み込みに失敗しました:', error);
        alert('単語データの読み込みに失敗しました。ページをリロードしてください。');
    }
}

loadWords();

rangeButtons.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        let start, end;
        switch (event.target.id) {
            case 'range-1-400':
                start = 0;
                end = 400;
                break;
            case 'range-401-800':
                start = 400;
                end = 800;
                break;
            case 'range-801-1200':
                start = 800;
                end = 1200;
                break;
            case 'range-1201-1600':
                start = 1200;
                end = 1600;
                break;
            case 'range-1601-1700':
                start = 1600;
                end = 1700;
                break;
        }
        generateSetButtons(start, end);
        rangeButtons.style.display = 'none';
        setButtonContainer.style.display = 'block';
    }
});

function generateSetButtons(startIndex, endIndex) {
    setButtonContainer.innerHTML = '';
    const wordsPerPage = 20;
    const pageCount = Math.ceil((endIndex - startIndex) / wordsPerPage);

    setButtonContainer.classList.add('button-grid');

    for (let i = 0; i < pageCount; i++) {
        const start = startIndex + i * wordsPerPage;
        const end = Math.min(startIndex + (i + 1) * wordsPerPage, endIndex);
        const setId = `set-${start + 1}-${end}`;
        
        const button = document.createElement("button");
        
        // セットIDに対する正解率データを取得
        const performance = historyManager.getSetPerformance(setId);
        
        // ボタンの内容を作成
        const mainText = document.createElement("div");
        mainText.textContent = `${start + 1}-${end}`;
        button.appendChild(mainText);
        
        // 正解率を表示（存在する場合）
        if (performance) {
            const statsText = document.createElement("div");
            statsText.className = "performance-stats";
            statsText.textContent = `${performance.percentage}% (${performance.attempts}回)`;
            button.appendChild(statsText);
            
            // 正解率に応じて色を変更
            if (performance.percentage >= 90) {
                button.classList.add("high-score");
            } else if (performance.percentage >= 70) {
                button.classList.add("medium-score");
            } else {
                button.classList.add("low-score");
            }
        }
        
        button.addEventListener('click', () => {
            startLearning(start, end, setId);
        });
        
        setButtonContainer.appendChild(button);
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startLearning(startIndex, endIndex, setId) {
    titleScreen.style.display = 'none';
    cardScreen.style.display = 'block';
    selectWords(startIndex, endIndex);

    shuffle(currentWords);

    currentWordIndex = 0;
    correctCount = 0;
    incorrectWords = [];
    totalCount = currentWords.length;
    buttonClicked = false;
    learningRange = `${startIndex + 1}-${endIndex}`; // 学習範囲を保存
    currentSetId = setId; // 現在のセットIDを保存
    showWord();
}

function selectWords(startIndex, endIndex) {
    const selectedWords = words.slice(startIndex, endIndex);
    currentWords = [...selectedWords];
}

function showWord() {
    const word = currentWords[currentWordIndex];
    english.textContent = word.english;
    japanese.textContent = word.japanese;
    japaneseArea.style.display = 'none';
    navigation.style.display = 'none';
    adjustFontSize();
    updateProgress();
    buttonClicked = false;
    setTimeout(showJapanese, 1000);
}

function showJapanese() {
    japaneseArea.style.display = 'block';
    navigation.style.display = 'block';
    buttonClicked = true;
}

function showResult() {
    cardScreen.style.display = 'none';
    resultScreen.style.display = 'block';
    correctCountDisplay.textContent = correctCount;
    totalCountDisplay.textContent = totalCount;
    correctPercentageDisplay.textContent = Math.round((correctCount / totalCount) * 100);

    // セットの学習履歴を更新
    historyManager.updateSetHistory(currentSetId, correctCount, totalCount);
}

function updateProgress() {
    const current = currentWordIndex + 1;
    const total = currentWords.length;
    progressDisplay.textContent = `${current}/${total}`;
}

function adjustFontSize() {
    const containerWidth = englishArea.clientWidth - 20;

    english.style.fontSize = '4em';

    const wordWidth = english.scrollWidth;

    if (wordWidth > containerWidth) {
        const ratio = containerWidth / wordWidth;
        const newFontSize = Math.max(ratio * 4, 0.8);
        english.style.fontSize = newFontSize + 'em';
    }

    const englishHeight = english.offsetHeight;
    japaneseArea.style.top = (200 + englishHeight + 20) + 'px';

    navigation.style.top = (japaneseArea.offsetTop + japaneseArea.offsetHeight + 20) + 'px';
}

function nextWord(isKnown) {
    if (isKnown) {
        correctCount++;
    } else {
        incorrectWords.push(currentWords[currentWordIndex]);
    }
    currentWordIndex++;
    if (currentWordIndex < currentWords.length) {
        showWord();
    } else {
        showResult();
    }
}

knownButton.addEventListener('click', () => {
    nextWord(true);
});

unknownButton.addEventListener('click', () => {
    nextWord(false);
});

returnTitleButton.addEventListener('click', () => {
    titleScreen.style.display = 'block';
    cardScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    rangeButtons.style.display = 'block';
    setButtonContainer.style.display = 'none';
});

retryButton.addEventListener('click', () => {
    cardScreen.style.display = 'block';
    resultScreen.style.display = 'none';
    currentWordIndex = 0;
    correctCount = 0;
    incorrectWords = [];
    totalCount = currentWords.length;
    showWord();
});

retryIncorrectButton.addEventListener('click', () => {
    if (incorrectWords.length === 0) {
        const message = "不正解の単語はありません。";
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        const closeButton = document.createElement("button");
        closeButton.textContent = "閉じる";
        closeButton.addEventListener("click", () => {
            resultScreen.removeChild(messageElement);
            resultScreen.removeChild(closeButton);
        });
        resultScreen.appendChild(messageElement);
        resultScreen.appendChild(closeButton);
        return;
    }
    cardScreen.style.display = 'block';
    resultScreen.style.display = 'none';
    currentWords = [...incorrectWords];
    currentWordIndex = 0;
    correctCount = 0;
    totalCount = currentWords.length;
    showWord();
});

returnTitleCardButton.addEventListener('click', () => {
    titleScreen.style.display = 'block';
    cardScreen.style.display = 'none';
    rangeButtons.style.display = 'block';
    setButtonContainer.style.display = 'none';
});

showHistoryButton.addEventListener('click', () => {
    showHistory();
});

returnTitleHistory.addEventListener('click', () => {
    titleScreen.style.display = 'block';
    historyScreen.style.display = 'none';
});

function showHistory() {
    const historyData = historyManager.getAllHistory();
    historyList.innerHTML = '';
    
    // 履歴がない場合
    if (Object.keys(historyData).length === 0) {
        historyList.innerHTML = '<p>学習履歴はまだありません。</p>';
    } else {
        // 履歴データをセットID順にソート
        const sortedSets = Object.values(historyData).sort((a, b) => {
            const aStart = parseInt(a.setId.split('-')[1]);
            const bStart = parseInt(b.setId.split('-')[1]);
            return aStart - bStart;
        });
        
        // 各セットの履歴を表示
        sortedSets.forEach(set => {
            const setDiv = document.createElement('div');
            setDiv.className = 'history-set';
            
            // セット範囲のヘッダー
            const header = document.createElement('h3');
            header.textContent = `単語セット: ${set.setId.replace('set-', '')}`;
            setDiv.appendChild(header);
            
            // 総合成績
            let totalCorrect = 0;
            let totalQuestions = 0;
            set.attempts.forEach(attempt => {
                totalCorrect += attempt.correct;
                totalQuestions += attempt.total;
            });
            
            const overallStats = document.createElement('p');
            overallStats.className = 'overall-stats';
            overallStats.textContent = `総合成績: ${Math.round((totalCorrect / totalQuestions) * 100)}% (正解: ${totalCorrect}/${totalQuestions})`;
            setDiv.appendChild(overallStats);
            
            // 直近の学習履歴
            const recentAttempts = document.createElement('div');
            recentAttempts.className = 'recent-attempts';
            
            // 最大5件の最新の学習記録を表示
            const latestAttempts = [...set.attempts].reverse().slice(0, 5);
            
            if (latestAttempts.length > 0) {
                const attemptsHeader = document.createElement('h4');
                attemptsHeader.textContent = '最近の学習:';
                recentAttempts.appendChild(attemptsHeader);
                
                const attemptsList = document.createElement('ul');
                latestAttempts.forEach(attempt => {
                    const date = new Date(attempt.date);
                    const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    const listItem = document.createElement('li');
                    listItem.textContent = `${formattedDate} - ${Math.round((attempt.correct / attempt.total) * 100)}% (正解: ${attempt.correct}/${attempt.total})`;
                    attemptsList.appendChild(listItem);
                });
                
                recentAttempts.appendChild(attemptsList);
            }
            
            setDiv.appendChild(recentAttempts);
            historyList.appendChild(setDiv);
        });
    }
    
    titleScreen.style.display = 'none';
    historyScreen.style.display = 'block';
}