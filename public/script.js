document.getElementById('fetch-btn').addEventListener('click', function() {
    const id = document.getElementById('id-input').value;
    if (id) {
      fetch(`/api/token/${id}`)
        .then(response => response.json())
        .then(data => {
          displayResult(data);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          displayError('Failed to fetch data. Please try again.');
        });
    } else {
      alert('Please enter a valid ID');
    }
  });
  
  function displayResult(data) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
      <p><strong>ID:</strong> ${data.id}</p>
      <p><strong>Score:</strong> ${data.score}</p>
      <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
      <p><strong>Sender Email:</strong> ${data.senderMail}</p>
    `;
    resultDiv.style.display = 'block';
  }
  
  function displayError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<p>${message}</p>`;
    resultDiv.style.display = 'block';
  }
  