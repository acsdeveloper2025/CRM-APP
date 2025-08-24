const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'backend123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(function(hash) {
    console.log('Password:', password);
    console.log('Hash:', hash);
});