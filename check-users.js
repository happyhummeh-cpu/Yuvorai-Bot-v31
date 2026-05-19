
const mongoose = require('mongoose');



mongoose.connect('mongodb://localhost:27017/yuvorai-bot', {

  useNewUrlParser: true,

  useUnifiedTopology: true

}).then(async () => {

  const userCount = await mongoose.connection.db.collection('users').countDocuments();

  console.log('Total Users:', userCount);

  process.exit(0);

}).catch(err => {

  console.error('Error:', err.message);

  process.exit(1);

});

