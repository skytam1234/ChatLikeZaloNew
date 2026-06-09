import { sendPasswordResetEmail } from '../services/email.service.js';

const sendPasswordResetEmailTask = async (payload) => {
  const { email, resetToken, userName } = payload;
  await sendPasswordResetEmail(email, resetToken, userName);
};

export default sendPasswordResetEmailTask;