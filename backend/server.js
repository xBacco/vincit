require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { router: eventsRouter, broadcastUpdate } = require('./routes/events.js');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/events',     eventsRouter);
app.use('/api/state',      require('./routes/state.js'));
app.use('/api/bets',       require('./routes/bets.js')(broadcastUpdate));
app.use('/api/profiles',   require('./routes/profiles.js')(broadcastUpdate));
app.use('/api/credits',    require('./routes/credits.js')(broadcastUpdate));
app.use('/api/categories', require('./routes/categories.js')(broadcastUpdate));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BetCouple backend running on http://0.0.0.0:${PORT}`);
});
