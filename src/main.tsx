// AGENCYOS_FRESH_START
// AGENCYOS_DB_DONE
import {createRoot} from 'react-dom/client';
import './lib/freshStart';
import App from './App.tsx';
import { initDb } from './lib/dbSync';
import './index.css';

initDb().then(() => createRoot(document.getElementById('root')!).render(<App />)).catch((e) => console.error(e));
