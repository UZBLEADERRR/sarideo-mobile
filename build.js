// Web ilova fayllarini Capacitor uchun dist/ papkasiga tayyorlaydi.
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

// HTML, CSS, JS va ularning papkalari bir xil tuzilishda ko‘chiriladi.
for (const item of ['index.html', 'css', 'js']) {
  cpSync(item, `dist/${item}`, { recursive: true });
}
console.log('Sarideo dist tayyor: index.html + css/ + js/');
