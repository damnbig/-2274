async function test() {
  const url = 'https://p42pg7ujyn.re.qweatherapi.com/v2/city/lookup?location=116.41,39.92&key=bc38746c3f444dcbae9d658bd2ae6d9a';
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (e) {
    console.error(e);
  }
}

test();
