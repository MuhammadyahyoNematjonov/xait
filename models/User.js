import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: String,
  username: String,
  name: String,
  phoneNumber: String
});

const User = mongoose.model('User', userSchema);
export default User;
