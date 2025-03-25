require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, { 
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());

// Importing route modules
const stkPushRoutes = require('./routes/stkPush');
const transactionRoutes = require('./routes/transaction');
const cashRoutes = require('./routes/cash');
const callbackRoutes = require('./routes/callback');

// Mount routes
app.use('/api/stkpush', stkPushRoutes);
app.use('/api/check-transaction', transactionRoutes);
app.use('/api/send-cash', cashRoutes);
app.use('/api/callback', callbackRoutes);

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
