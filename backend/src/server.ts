import { criarApp } from './app.js';
import { env } from './config/env.js';

const porta = env().PORT;
criarApp().listen(porta, () => {
  console.log(`API no ar em http://localhost:${porta}`);
});
