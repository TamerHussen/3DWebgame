document.addEventListener('DOMContentLoaded', () => {

    fetch('/get-score')
        .then(response => response.json())
        .then(data => {
            document.getElementById('score-display').innerText = `Your Score: ${data.score}`;
        })
        .catch(error => console.error('Error fetching score:', error));

    const score = 0;

    fetch('/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: score })
    })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error saving score:', error));
});
