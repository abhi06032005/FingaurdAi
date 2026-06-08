async function run() {
  try {
    const res = await fetch('http://127.0.0.1:5000/trades?userId=user_2test');
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('DATA:', data);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
