import { parseFetXml } from './fet-parser.js';
import { parseSolutionXml } from './timetable-parser.js';
import { uniq } from './utils.js';

const app = {
    fetFile: null,
    solutionFile: null,
    convertedData: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('fetFile').addEventListener('change', (e) => this.onFetFileChange(e));
        document.getElementById('solutionFile').addEventListener('change', (e) => this.onSolutionFileChange(e));
        document.getElementById('convertBtn').addEventListener('click', () => this.convert());
        document.getElementById('downloadBtn').addEventListener('click', () => this.download());
        document.getElementById('uploadFirebaseBtn').addEventListener('click', () => this.uploadToFirebase());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    },

    onFetFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            this.fetFile = file;
            document.getElementById('fetInfo').textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            this.checkFilesReady();
        }
    },

    onSolutionFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            this.solutionFile = file;
            document.getElementById('solutionInfo').textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            this.checkFilesReady();
        }
    },

    checkFilesReady() {
        const btn = document.getElementById('convertBtn');
        btn.disabled = !(this.fetFile && this.solutionFile);
    },

    async convert() {
        try {
            this.showProgress(true);
            this.showError(false);
            this.showResult(false);

            this.updateProgress(10, 'Lettura file .fet...');
            const fetText = await this.readFile(this.fetFile);

            this.updateProgress(30, 'Parsing file .fet...');
            const parsed = parseFetXml(fetText);

            this.updateProgress(50, 'Lettura file XML soluzione...');
            const solutionText = await this.readFile(this.solutionFile);

            this.updateProgress(60, 'Parsing XML soluzione...');
            const placements = parseSolutionXml(solutionText, parsed.dayKeys);
            console.log('📊 Placements trovati:', placements.length);
            console.log('📊 Activities trovate:', parsed.activities?.length || 0);

            this.updateProgress(80, 'Generazione orario.json...');
            const orarioJson = this.generateOrarioJson(parsed, placements);

            this.updateProgress(100, 'Completato!');
            this.convertedData = orarioJson;

            setTimeout(() => {
                this.showProgress(false);
                this.showResult(true, orarioJson);
            }, 500);

        } catch (error) {
            console.error('Errore conversione:', error);
            this.showProgress(false);
            this.showError(true, error.message);
        }
    },

    generateOrarioJson(parsed, placements) {
        const schoolName = document.getElementById('schoolName').value || 'Orario Scolastico';
        const schoolYear = document.getElementById('schoolYear').value || '2024-2025';
        const availabilityInput = document.getElementById('availabilitySubjects').value || 'D';
        const availabilitySubjects = availabilityInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

        // Crea mappa activity ID -> activity
        const activityById = new Map();
        (parsed.activities || []).forEach(a => {
            if (a.id) activityById.set(a.id, a);
        });

        // Converti giorni in italiano
        const daysMap = {
            'mon': 'Lunedì',
            'tue': 'Martedì',
            'wed': 'Mercoledì',
            'thu': 'Giovedì',
            'fri': 'Venerdì',
            'sat': 'Sabato',
            'sun': 'Domenica'
        };

        // Estrai tutte le lezioni con informazioni complete
        const allLessons = [];
        let skippedCount = 0;
        for (const placement of placements) {
            const activity = activityById.get(placement.activityId);
            if (!activity) {
                skippedCount++;
                continue;
            }

            const dayName = daysMap[placement.dayKey] || placement.dayKey;
            const period = placement.periodIndex1;
            const duration = Number(activity.duration || 1);
            const className = (activity.students && activity.students[0]) || 'N/D';
            const subject = activity.subject || 'N/D';
            const teachers = activity.teachers && activity.teachers.length > 0 ? activity.teachers : ['N/D'];
            const room = placement.room || 'N/D';

            allLessons.push({
                giorno: dayName,
                period: period,
                ora_inizio: this.getTimeFromPeriod(period),
                ora_fine: this.getTimeFromPeriod(period + duration),
                durata_minuti: duration * 60,
                classe: className,
                materia: subject,
                docenti: teachers,
                aula: room
            });
        }

        console.log('📊 Lezioni totali create:', allLessons.length);
        console.log('⚠️ Placements saltati (activity non trovata):', skippedCount);

        // Raggruppa per laboratorio/aula
        const laboratoriMap = new Map();
        for (const lesson of allLessons) {
            const labName = lesson.aula;
            if (!labName || labName === 'N/D') continue;

            if (!laboratoriMap.has(labName)) {
                laboratoriMap.set(labName, []);
            }
            laboratoriMap.get(labName).push(lesson);
        }

        // Converti in array laboratori
        const laboratori = [];
        for (const [nome, lezioni] of laboratoriMap.entries()) {
            // Ordina lezioni per giorno e ora
            const sorted = lezioni.slice().sort((a, b) => {
                const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                const dayDiff = dayOrder.indexOf(a.giorno) - dayOrder.indexOf(b.giorno);
                if (dayDiff !== 0) return dayDiff;
                return a.period - b.period;
            });

            // Rimuovi campo period (solo per ordinamento)
            const cleanedLezioni = sorted.map(l => {
                const { period, ...rest } = l;
                return rest;
            });

            laboratori.push({
                nome: nome,
                lezioni: cleanedLezioni
            });
        }

        // Raggruppa per classe
        const classiMap = new Map();
        for (const lesson of allLessons) {
            const className = lesson.classe;
            if (!className || className === 'N/D') continue;

            if (!classiMap.has(className)) {
                classiMap.set(className, []);
            }
            classiMap.get(className).push(lesson);
        }

        // Converti in array classi
        const classi = [];
        for (const [nome, lezioni] of classiMap.entries()) {
            // Trova aula della classe (aula più frequente)
            const aulaCount = new Map();
            lezioni.forEach(l => {
                const aula = l.aula || 'N/D';
                aulaCount.set(aula, (aulaCount.get(aula) || 0) + 1);
            });
            let aulaClasse = 'N/D';
            let maxCount = 0;
            for (const [aula, count] of aulaCount.entries()) {
                if (count > maxCount && aula !== 'N/D') {
                    aulaClasse = aula;
                    maxCount = count;
                }
            }

            // Ordina lezioni per giorno e ora
            const sorted = lezioni.slice().sort((a, b) => {
                const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                const dayDiff = dayOrder.indexOf(a.giorno) - dayOrder.indexOf(b.giorno);
                if (dayDiff !== 0) return dayDiff;
                return a.period - b.period;
            });

            // Rimuovi campo period
            const cleanedLezioni = sorted.map(l => {
                const { period, classe, ...rest } = l;
                return rest;
            });

            classi.push({
                nome: nome,
                aula: aulaClasse,
                lezioni: cleanedLezioni
            });
        }

        // Raggruppa per docente
        const docentiMap = new Map();
        for (const lesson of allLessons) {
            for (const docente of lesson.docenti) {
                if (!docente || docente === 'N/D') continue;

                if (!docentiMap.has(docente)) {
                    docentiMap.set(docente, []);
                }
                docentiMap.get(docente).push(lesson);
            }
        }

        // Converti in array docenti
        const docenti = [];
        for (const [nome, lezioni] of docentiMap.entries()) {
            // Ordina lezioni per giorno e ora
            const sorted = lezioni.slice().sort((a, b) => {
                const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                const dayDiff = dayOrder.indexOf(a.giorno) - dayOrder.indexOf(b.giorno);
                if (dayDiff !== 0) return dayDiff;
                return a.period - b.period;
            });

            // Rimuovi campo period e determina tipo lezione
            const cleanedLezioni = sorted.map(l => {
                const { period, docenti, ...rest} = l;
                return {
                    ...rest,
                    tipo: availabilitySubjects.includes(l.materia) ? 'disposizione' : 'lezione'
                };
            });

            docenti.push({
                nome: nome,
                lezioni: cleanedLezioni
            });
        }

        // Raccogli statistiche e giorni effettivamente usati
        const classiSet = new Set();
        const giorniSet = new Set();
        allLessons.forEach(l => {
            if (l.classe && l.classe !== 'N/D') classiSet.add(l.classe);
            if (l.giorno) giorniSet.add(l.giorno);
        });

        // Ordina i giorni secondo l'ordine naturale della settimana
        const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        const giorniUsati = dayOrder.filter(day => giorniSet.has(day));

        // Genera orario.json finale
        return {
            istituto: schoolName,
            anno_scolastico: schoolYear,
            availability_subjects: availabilitySubjects,
            orario: {
                giorni: giorniUsati,
                inizio: '08:00',
                fine: this.getTimeFromPeriod((parsed.periods || []).length + 1),
                fasce_orarie: (parsed.periods || []).map((_, i) => 
                    `${this.getTimeFromPeriod(i + 1)}-${this.getTimeFromPeriod(i + 2)}`
                )
            },
            classi: classi,
            docenti: docenti,
            laboratori: laboratori,
            _stats: {
                totale_classi: classi.length,
                totale_docenti: docenti.length,
                totale_lezioni: allLessons.length
            }
        };
    },

    getTimeFromPeriod(period) {
        // Converte numero periodo in orario (08:00, 09:00, ecc.)
        const startHour = 8; // Inizio ore 8:00
        const hour = startHour + (period - 1);
        return `${String(hour).padStart(2, '0')}:00`;
    },

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Errore lettura file'));
            reader.readAsText(file);
        });
    },

    updateProgress(percent, text) {
        const fill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        fill.style.width = `${percent}%`;
        fill.textContent = `${percent}%`;
        progressText.textContent = text;
    },

    showProgress(show) {
        const section = document.getElementById('progressSection');
        if (show) {
            section.classList.add('active');
            this.updateProgress(0, 'Inizializzazione...');
        } else {
            section.classList.remove('active');
        }
    },

    showResult(show, data = null) {
        const section = document.getElementById('resultSection');
        if (show && data) {
            section.classList.add('active');
            document.getElementById('statClassi').textContent = data._stats.totale_classi;
            document.getElementById('statDocenti').textContent = data._stats.totale_docenti;
            document.getElementById('statLezioni').textContent = data._stats.totale_lezioni;
        } else {
            section.classList.remove('active');
        }
    },

    showError(show, message = '') {
        const section = document.getElementById('errorSection');
        const messageEl = document.getElementById('errorMessage');
        if (show) {
            section.classList.add('active');
            messageEl.textContent = message;
        } else {
            section.classList.remove('active');
            messageEl.textContent = '';
        }
    },

    download() {
        if (!this.convertedData) return;

        // Rimuovi stats prima del download
        const { _stats, ...cleanData } = this.convertedData;

        const json = JSON.stringify(cleanData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orario.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    async uploadToFirebase() {
        if (!this.convertedData) return;

        try {
            this.showFirebase(true, '⏳ Caricamento su Firebase in corso...');

            // Verifica connessione
            if (!window.FirebaseUploader) {
                throw new Error('Firebase non inizializzato correttamente');
            }

            // Rimuovi stats prima dell'upload
            const { _stats, ...cleanData } = this.convertedData;

            // Carica su Firebase
            await window.FirebaseUploader.uploadOrarioJson(cleanData);

            this.showFirebase(true, 
                `✅ Orario caricato con successo su Firebase!\n` +
                `📍 Path: /orario\n` +
                `🔄 Le app pwa_orario_completa e pwa_orario_completa_staff possono ora leggere i dati.\n\n` +
                `ℹ️ Ricorda di aggiornare le app per caricare il file orario.json da Firebase invece che localmente.`
            );

        } catch (error) {
            console.error('Errore upload Firebase:', error);
            this.showFirebase(true, `❌ Errore: ${error.message}`);
        }
    },

    showFirebase(show, message = '') {
        const section = document.getElementById('firebaseSection');
        const messageEl = document.getElementById('firebaseMessage');
        if (show) {
            section.classList.add('active');
            messageEl.textContent = message;
        } else {
            section.classList.remove('active');
            messageEl.textContent = '';
        }
    },

    reset() {
        this.fetFile = null;
        this.solutionFile = null;
        this.convertedData = null;

        document.getElementById('fetFile').value = '';
        document.getElementById('solutionFile').value = '';
        document.getElementById('fetInfo').textContent = 'Nessun file selezionato';
        document.getElementById('solutionInfo').textContent = 'Nessun file selezionato';
        document.getElementById('convertBtn').disabled = true;

        this.showProgress(false);
        this.showResult(false);
        this.showError(false);
        this.showFirebase(false);
    }
};

// Inizializza l'app
app.init();
