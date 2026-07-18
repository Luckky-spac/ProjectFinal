require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');
const { startAutoCheckoutJob } = require('./jobs/autoCheckout');
const { startPhajaySocket } = require('./services/phajay');
const { confirmQrPaymentByTransactionId } = require('./controllers/paymentController');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api', routes);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database connected and synced');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startAutoCheckoutJob();
    startPhajaySocket((data) => {
      if (data?.status === 'PAYMENT_COMPLETED' && data?.transactionId) {
        confirmQrPaymentByTransactionId(data.transactionId).catch((err) =>
          console.error('[phajay] failed to confirm payment:', err.message)
        );
      }
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
