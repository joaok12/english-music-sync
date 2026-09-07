// Keep old localhost links on the same origin that stores the user's music.
if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port === '3333') {
  location.replace(`http://localhost:3334${location.pathname}${location.search}${location.hash}`);
} else if (location.hostname === '127.0.0.1' && location.port === '3334') {
  location.replace(`http://localhost:3334${location.pathname}${location.search}${location.hash}`);
}
