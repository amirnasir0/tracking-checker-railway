async function check() {
  const url = document.getElementById('url').value;
  const response = await fetch('/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  const data = await response.json();
  document.getElementById('result').textContent = JSON.stringify(data, null, 2);
}
