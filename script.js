(function() {
            'use strict';

            // ===== STATE =====
            const state = {
                teamA: 'India',
                teamB: 'Australia',
                matchType: 't20',
                maxOvers: 20,
                tossWinner: 'teamA',
                battingFirst: 'teamA',
                striker: '',
                nonStriker: '',
                bowler: '',
                innings: 1,
                runs: 0,
                wickets: 0,
                balls: 0,
                overs: 0,
                overBallData: [],
                ballHistory: [],
                extras: 0,
                wideCount: 0,
                noBallCount: 0,
                byeCount: 0,
                legByeCount: 0,
                fours: 0,
                sixes: 0,
                strikerRuns: 0,
                bowlerWickets: 0,
                strikerBallsFaced: 0,
                history: [],
                isMatchSetup: false,
                innings2: {
                    runs: 0,
                    wickets: 0,
                    overs: 0,
                    balls: 0,
                    overBallData: [],
                    ballHistory: [],
                    extras: 0,
                    wideCount: 0,
                    noBallCount: 0,
                    byeCount: 0,
                    legByeCount: 0,
                    fours: 0,
                    sixes: 0,
                    strikerRuns: 0,
                    bowlerWickets: 0,
                    strikerBallsFaced: 0,
                    striker: '',
                    nonStriker: '',
                    bowler: '',
                },
                matches: [],
                tournaments: [],
                currentMatchId: null,
                teamAXI: [],
                teamBXI: [],
                bowlerOvers: 0,
                bowlerRuns: 0,
                bowlerWickets: 0,
                ballsInCurrentOver: 0,
                users: [],
                isLoggedIn: false,
                batsmenStats: {},
                targetRuns: 0,
                targetBalls: 0,
                bowlingStats: {},
                lastMatchId: null,
            };

            // ===== LOAD / SAVE =====
            function loadState() {
                try {
                    const saved = localStorage.getItem('brklive19_state');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (parsed.matches) state.matches = parsed.matches;
                        if (parsed.tournaments) state.tournaments = parsed.tournaments;
                        if (parsed.teamAXI) state.teamAXI = parsed.teamAXI;
                        if (parsed.teamBXI) state.teamBXI = parsed.teamBXI;
                        if (parsed.users) state.users = parsed.users;
                        if (parsed.isLoggedIn) state.isLoggedIn = parsed.isLoggedIn;
                        if (parsed.lastMatchId) state.lastMatchId = parsed.lastMatchId;
                    }
                } catch (e) { /* ignore */ }
            }

            function saveState() {
                try {
                    localStorage.setItem('brklive19_state', JSON.stringify({
                        matches: state.matches,
                        tournaments: state.tournaments,
                        teamAXI: state.teamAXI,
                        teamBXI: state.teamBXI,
                        users: state.users,
                        isLoggedIn: state.isLoggedIn,
                        lastMatchId: state.lastMatchId,
                    }));
                } catch (e) { /* ignore */ }
            }

            loadState();

            // ===== HELPERS =====
            function getMatch(id) {
                return state.matches.find(m => m.id === id);
            }

            function getTournament(id) {
                return state.tournaments.find(t => t.id === id);
            }

            function generateId() {
                return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            }

            // ===== TOAST =====
            let toastTimeout;

            function showToast(msg, type = 'info') {
                const el = document.getElementById('toast');
                el.textContent = msg;
                el.className = 'toast show ' + type;
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => { el.classList.remove('show'); }, 3000);
            }

            // ===== NAVIGATION =====
            const pages = {
                home: document.getElementById('page-home'),
                tournament: document.getElementById('page-tournament'),
                about: document.getElementById('page-about'),
                contact: document.getElementById('page-contact'),
            };

            const navLinks = document.querySelectorAll('#mainNav a');

            function navigate(pageId) {
                Object.keys(pages).forEach(key => {
                    if (pages[key]) {
                        pages[key].classList.toggle('active', key === pageId);
                    }
                });
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.dataset.page === pageId);
                });
                if (pageId === 'tournament') {
                    renderTournaments();
                    renderMatchList();
                    populateTournamentDropdown();
                    if (state.currentMatchId) {
                        const match = getMatch(state.currentMatchId);
                        if (match) {
                            updateTournamentLiveUI(match);
                            updateScorecard(match);
                            updateStreamView();
                            renderMatchSummary(match);
                        }
                    }
                }
            }

            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigate(link.dataset.page);
                });
            });

            document.querySelectorAll('[data-nav]').forEach(btn => {
                btn.addEventListener('click', () => navigate(btn.dataset.page));
            });

            // ===== LOGIN / REGISTER =====
            const loginModal = document.getElementById('loginModal');
            const registerModal = document.getElementById('registerModal');
            const loginBtn = document.getElementById('loginBtn');
            const loginSubmitBtn = document.getElementById('loginSubmitBtn');
            const loginCancelBtn = document.getElementById('loginCancelBtn');
            const loginUsername = document.getElementById('loginUsername');
            const loginPassword = document.getElementById('loginPassword');
            const showRegisterLink = document.getElementById('showRegisterLink');
            const showLoginLink = document.getElementById('showLoginLink');

            const registerFullName = document.getElementById('registerFullName');
            const registerUsername = document.getElementById('registerUsername');
            const registerEmail = document.getElementById('registerEmail');
            const registerPassword = document.getElementById('registerPassword');
            const registerConfirmPassword = document.getElementById('registerConfirmPassword');
            const registerSubmitBtn = document.getElementById('registerSubmitBtn');
            const registerCancelBtn = document.getElementById('registerCancelBtn');

            function updateLoginUI() {
                if (state.isLoggedIn) {
                    loginBtn.textContent = 'Log Out';
                    loginBtn.classList.add('btn-logout');
                    loginBtn.classList.remove('btn-login');
                    document.body.classList.remove('auth-required');
                } else {
                    loginBtn.textContent = 'Log in';
                    loginBtn.classList.remove('btn-logout');
                    loginBtn.classList.add('btn-login');
                    document.body.classList.add('auth-required');
                }
            }

            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (state.isLoggedIn) {
                    state.isLoggedIn = false;
                    saveState();
                    updateLoginUI();
                    loginModal.classList.add('active');
                    loginUsername.value = '';
                    loginPassword.value = '';
                    showToast('🔒 Logged out successfully.', 'info');
                } else {
                    loginModal.classList.add('active');
                    loginUsername.value = '';
                    loginPassword.value = '';
                }
            });

            loginCancelBtn.addEventListener('click', () => loginModal.classList.remove('active'));
            loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('active'); });

            loginSubmitBtn.addEventListener('click', () => {
                const user = loginUsername.value.trim();
                const pass = loginPassword.value.trim();
                if (!user || !pass) {
                    showToast('⚠️ Please enter username and password.', 'error');
                    return;
                }
                const foundUser = state.users.find(u => u.username === user && u.password === pass);
                if (foundUser) {
                    state.isLoggedIn = true;
                    saveState();
                    updateLoginUI();
                    loginModal.classList.remove('active');
                    showToast(`✅ Welcome back, ${foundUser.fullName || user}!`, 'success');
                } else {
                    showToast('❌ Invalid username or password.', 'error');
                }
            });

            loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginSubmitBtn.click(); });
            loginUsername.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginPassword.focus(); });

            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.classList.remove('active');
                registerModal.classList.add('active');
                registerFullName.value = '';
                registerUsername.value = '';
                registerEmail.value = '';
                registerPassword.value = '';
                registerConfirmPassword.value = '';
            });

            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerModal.classList.remove('active');
                loginModal.classList.add('active');
            });

            registerCancelBtn.addEventListener('click', () => registerModal.classList.remove('active'));
            registerModal.addEventListener('click', (e) => { if (e.target === registerModal) registerModal.classList.remove('active'); });

            registerSubmitBtn.addEventListener('click', () => {
                const fullName = registerFullName.value.trim();
                const username = registerUsername.value.trim();
                const email = registerEmail.value.trim();
                const password = registerPassword.value.trim();
                const confirm = registerConfirmPassword.value.trim();

                if (!fullName || !username || !email || !password || !confirm) {
                    showToast('⚠️ Please fill all fields.', 'error');
                    return;
                }
                if (password !== confirm) {
                    showToast('⚠️ Passwords do not match.', 'error');
                    return;
                }
                if (password.length < 4) {
                    showToast('⚠️ Password must be at least 4 characters.', 'error');
                    return;
                }
                if (state.users.find(u => u.username === username)) {
                    showToast('❌ Username already taken.', 'error');
                    return;
                }
                state.users.push({
                    fullName,
                    username,
                    email,
                    password,
                    registeredAt: new Date().toISOString()
                });
                saveState();
                registerModal.classList.remove('active');
                showToast('✅ Registration successful! Please login.', 'success');
                loginModal.classList.add('active');
                loginUsername.value = username;
                loginPassword.value = '';
            });

            registerConfirmPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') registerSubmitBtn.click(); });

            updateLoginUI();
            if (!state.isLoggedIn) {
                loginModal.classList.add('active');
            }

            // ===== XI MANAGEMENT =====
            function renderXI() {
                const listA = document.getElementById('xiTeamAList');
                const listB = document.getElementById('xiTeamBList');
                if (listA) {
                    listA.innerHTML = state.teamAXI.map(p => `<span class="xi-tag">${p} <span class="remove-xi" data-team="A" data-player="${p}">×</span></span>`).join('');
                }
                if (listB) {
                    listB.innerHTML = state.teamBXI.map(p => `<span class="xi-tag">${p} <span class="remove-xi" data-team="B" data-player="${p}">×</span></span>`).join('');
                }
                const labelA = document.getElementById('xiTeamALabel');
                const labelB = document.getElementById('xiTeamBLabel');
                const teamAName = document.getElementById('teamAName')?.value || 'Team A';
                const teamBName = document.getElementById('teamBName')?.value || 'Team B';
                if (labelA) labelA.textContent = `${teamAName} XI`;
                if (labelB) labelB.textContent = `${teamBName} XI`;
                document.querySelectorAll('.remove-xi').forEach(el => {
                    el.addEventListener('click', function() {
                        const team = this.dataset.team;
                        const player = this.dataset.player;
                        if (team === 'A') {
                            state.teamAXI = state.teamAXI.filter(p => p !== player);
                        } else {
                            state.teamBXI = state.teamBXI.filter(p => p !== player);
                        }
                        saveState();
                        renderXI();
                    });
                });
                populateStartSuggestions();
                populateWicketSuggestions();
            }

            function addXiPlayer(team, name) {
                name = name.trim();
                if (!name) return;
                if (team === 'A') {
                    if (!state.teamAXI.includes(name)) {
                        state.teamAXI.push(name);
                        saveState();
                        renderXI();
                    }
                } else {
                    if (!state.teamBXI.includes(name)) {
                        state.teamBXI.push(name);
                        saveState();
                        renderXI();
                    }
                }
            }

            document.getElementById('addXiTeamA').addEventListener('click', () => {
                const input = document.getElementById('xiTeamAInput');
                addXiPlayer('A', input.value);
                input.value = '';
            });
            document.getElementById('addXiTeamB').addEventListener('click', () => {
                const input = document.getElementById('xiTeamBInput');
                addXiPlayer('B', input.value);
                input.value = '';
            });
            document.getElementById('bulkXiTeamA').addEventListener('click', () => {
                const text = document.getElementById('xiTeamABulk');
                const names = text.value.split(',').map(s => s.trim()).filter(Boolean);
                names.forEach(n => addXiPlayer('A', n));
                text.value = '';
            });
            document.getElementById('bulkXiTeamB').addEventListener('click', () => {
                const text = document.getElementById('xiTeamBBulk');
                const names = text.value.split(',').map(s => s.trim()).filter(Boolean);
                names.forEach(n => addXiPlayer('B', n));
                text.value = '';
            });

            // ===== POPUP SUGGESTIONS =====
            function populateStartSuggestions() {
                const strikerSuggest = document.getElementById('startStrikerSuggestions');
                const nonStrikerSuggest = document.getElementById('startNonStrikerSuggestions');
                const bowlerSuggest = document.getElementById('startBowlerSuggestions');
                const battingFirst = document.getElementById('battingFirst')?.value || 'teamA';
                const battingTeam = battingFirst === 'teamA' ? state.teamAXI : state.teamBXI;
                const bowlingTeam = battingFirst === 'teamA' ? state.teamBXI : state.teamAXI;
                const allBatting = battingTeam.length ? battingTeam : ['Striker1', 'Striker2'];
                const allBowling = bowlingTeam.length ? bowlingTeam : ['Bowler1'];

                if (strikerSuggest) {
                    strikerSuggest.innerHTML = allBatting.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    strikerSuggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('startStriker').value = this.dataset.name;
                        });
                    });
                }
                if (nonStrikerSuggest) {
                    nonStrikerSuggest.innerHTML = allBatting.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    nonStrikerSuggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('startNonStriker').value = this.dataset.name;
                        });
                    });
                }
                if (bowlerSuggest) {
                    bowlerSuggest.innerHTML = allBowling.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    bowlerSuggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('startBowler').value = this.dataset.name;
                        });
                    });
                }
            }

            function populateWicketSuggestions() {
                const suggest = document.getElementById('newBatsmanSuggestions');
                const battingFirst = document.getElementById('battingFirst')?.value || 'teamA';
                const battingTeam = battingFirst === 'teamA' ? state.teamAXI : state.teamBXI;
                const all = battingTeam.length ? battingTeam : ['Batsman1', 'Batsman2'];
                if (suggest) {
                    suggest.innerHTML = all.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    suggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('newBatsmanInput').value = this.dataset.name;
                        });
                    });
                }
            }

            function populateSecondInningsSuggestions(match) {
                const battingTeam = match.battingFirst === match.team1 ? match.team2 : match.team1;
                const bowlingTeam = match.battingFirst === match.team1 ? match.team2 : match.team1;
                const battingXI = battingTeam === match.team1 ? match.team1Players : match.team2Players;
                const bowlingXI = bowlingTeam === match.team1 ? match.team1Players : match.team2Players;

                const strikerSuggest = document.getElementById('secondStrikerSuggestions');
                const nonStrikerSuggest = document.getElementById('secondNonStrikerSuggestions');
                const bowlerSuggest = document.getElementById('secondBowlerSuggestions');

                const allBats = battingXI.length ? battingXI : ['Batsman1', 'Batsman2'];
                const allBowlers = bowlingXI.length ? bowlingXI : ['Bowler1'];

                if (strikerSuggest) {
                    strikerSuggest.innerHTML = allBats.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    strikerSuggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('secondStriker').value = this.dataset.name;
                        });
                    });
                }
                if (nonStrikerSuggest) {
                    nonStrikerSuggest.innerHTML = allBats.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    nonStrikerSuggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('secondNonStriker').value = this.dataset.name;
                        });
                    });
                }
                if (bowlerSuggest) {
                    bowlerSuggest.innerHTML = allBowlers.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    bowlerSuggest.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            document.getElementById('secondBowler').value = this.dataset.name;
                        });
                    });
                }
            }

            // ===== START MATCH MODAL =====
            const startMatchModal = document.getElementById('startMatchModal');
            const startStriker = document.getElementById('startStriker');
            const startNonStriker = document.getElementById('startNonStriker');
            const startBowler = document.getElementById('startBowler');
            const startMatchConfirmBtn = document.getElementById('startMatchConfirmBtn');
            const startMatchCancelBtn = document.getElementById('startMatchCancelBtn');

            function showStartMatchModal() {
                populateStartSuggestions();
                if (startStriker) startStriker.value = '';
                if (startNonStriker) startNonStriker.value = '';
                if (startBowler) startBowler.value = '';
                if (startMatchModal) startMatchModal.classList.add('active');
            }

            if (startMatchConfirmBtn) {
                startMatchConfirmBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    try {
                        const striker = startStriker ? startStriker.value.trim() : '';
                        const nonStriker = startNonStriker ? startNonStriker.value.trim() : '';
                        const bowler = startBowler ? startBowler.value.trim() : '';

                        if (!striker || !nonStriker || !bowler) {
                            showToast('⚠️ Please fill all fields.', 'error');
                            return;
                        }

                        const teamAName = document.getElementById('teamAName')?.value || 'Team A';
                        const teamBName = document.getElementById('teamBName')?.value || 'Team B';
                        const matchType = document.getElementById('matchType')?.value || 't20';
                        const maxOvers = parseInt(document.getElementById('maxOvers')?.value) || 20;
                        const battingFirst = document.getElementById('battingFirst')?.value || 'teamA';

                        state.teamA = teamAName;
                        state.teamB = teamBName;
                        state.matchType = matchType;
                        state.maxOvers = maxOvers;
                        state.battingFirst = battingFirst;
                        state.striker = striker;
                        state.nonStriker = nonStriker;
                        state.bowler = bowler;

                        const resetInn = (inn) => {
                            inn.runs = 0;
                            inn.wickets = 0;
                            inn.overs = 0;
                            inn.balls = 0;
                            inn.overBallData = [];
                            inn.ballHistory = [];
                            inn.extras = 0;
                            inn.wideCount = 0;
                            inn.noBallCount = 0;
                            inn.byeCount = 0;
                            inn.legByeCount = 0;
                            inn.fours = 0;
                            inn.sixes = 0;
                            inn.strikerRuns = 0;
                            inn.bowlerWickets = 0;
                            inn.strikerBallsFaced = 0;
                        };
                        resetInn(state);
                        resetInn(state.innings2);
                        state.history = [];
                        state.isMatchSetup = true;
                        state.bowlerOvers = 0;
                        state.bowlerRuns = 0;
                        state.bowlerWickets = 0;
                        state.ballsInCurrentOver = 0;
                        state.batsmenStats = {};
                        state.bowlingStats = {};
                        if (striker) state.batsmenStats[striker] = { runs: 0, balls: 0 };
                        if (nonStriker) state.batsmenStats[nonStriker] = { runs: 0, balls: 0 };

                        state.innings2.striker = striker;
                        state.innings2.nonStriker = nonStriker;
                        state.innings2.bowler = bowler;
                        state.innings = 1;

                        if (startMatchModal) startMatchModal.classList.remove('active');

                        state.lastMatchId = 'live';
                        saveState();

                        updateAllViews();
                        navigate('tournament');

                        showToast('✅ Match started!', 'success');

                    } catch (err) {
                        console.error('Start match error:', err);
                        showToast('❌ Error starting match: ' + err.message, 'error');
                    }
                });
            }

            if (startMatchCancelBtn) {
                startMatchCancelBtn.addEventListener('click', () => {
                    if (startMatchModal) startMatchModal.classList.remove('active');
                });
            }

            // ===== WICKET MODAL =====
            const wicketModal = document.getElementById('wicketModal');
            const newBatsmanInput = document.getElementById('newBatsmanInput');
            const wicketConfirmBtn = document.getElementById('wicketConfirmBtn');
            const wicketCancelBtn = document.getElementById('wicketCancelBtn');

            function showWicketModal() {
                if (newBatsmanInput) newBatsmanInput.value = '';
                populateWicketSuggestions();
                if (wicketModal) wicketModal.classList.add('active');
            }

            if (wicketConfirmBtn) {
                wicketConfirmBtn.addEventListener('click', () => {
                    const name = newBatsmanInput ? newBatsmanInput.value.trim() : '';
                    if (!name) {
                        showToast('⚠️ Enter new batsman name.', 'error');
                        return;
                    }
                    state.striker = name;
                    if (state.innings === 2) {
                        state.innings2.striker = name;
                    }
                    if (!state.batsmenStats) state.batsmenStats = {};
                    if (!state.batsmenStats[name]) state.batsmenStats[name] = { runs: 0, balls: 0 };

                    if (wicketModal) wicketModal.classList.remove('active');
                    showToast(`🔄 New batsman: ${name}`, 'info');
                    updateAllViews();
                });
            }

            if (wicketCancelBtn) {
                wicketCancelBtn.addEventListener('click', () => {
                    if (wicketModal) wicketModal.classList.remove('active');
                });
            }

            // ===== OVER COMPLETE MODAL =====
            const overCompleteModal = document.getElementById('overCompleteModal');
            const overCompleteOkBtn = document.getElementById('overCompleteOkBtn');

            function showOverCompleteModal() {
                if (overCompleteModal) overCompleteModal.classList.add('active');
            }

            if (overCompleteOkBtn) {
                overCompleteOkBtn.addEventListener('click', () => {
                    if (overCompleteModal) overCompleteModal.classList.remove('active');
                });
            }

            // ===== INNINGS COMPLETE MODAL =====
            const inningsCompleteModal = document.getElementById('inningsCompleteModal');
            const startSecondInningsBtn = document.getElementById('startSecondInningsBtn');

            function showInningsCompleteModal() {
                if (inningsCompleteModal) inningsCompleteModal.classList.add('active');
            }

            if (startSecondInningsBtn) {
                startSecondInningsBtn.addEventListener('click', () => {
                    if (inningsCompleteModal) inningsCompleteModal.classList.remove('active');
                    if (state.innings === 1) {
                        endInnings();
                    } else {
                        showToast('🏆 Match Complete!', 'success');
                    }
                });
            }

            // ===== BOWLER CHANGE MODAL =====
            const bowlerChangeModal = document.getElementById('bowlerChangeModal');
            const newBowlerInput = document.getElementById('newBowlerInput');
            const newBowlerSuggestions = document.getElementById('newBowlerSuggestions');
            const bowlerConfirmBtn = document.getElementById('bowlerConfirmBtn');
            const bowlerCancelBtn = document.getElementById('bowlerCancelBtn');

            function showBowlerChangeModal(match) {
                if (!match) match = getMatch(state.currentMatchId);
                if (!match) return;
                const bowlingTeam = (match.battingFirst === match.team1 && match.innings === 1) ||
                    (match.battingFirst === match.team2 && match.innings === 2) ?
                    (match.battingFirst === match.team1 ? match.team2 : match.team1) :
                    match.battingFirst;
                const bowlingXI = bowlingTeam === match.team1 ? match.team1Players : match.team2Players;
                if (newBowlerSuggestions) {
                    newBowlerSuggestions.innerHTML = bowlingXI.map(p => `<div class="player-item" data-name="${p}">${p}</div>`).join('');
                    newBowlerSuggestions.querySelectorAll('.player-item').forEach(el => {
                        el.addEventListener('click', function() {
                            if (newBowlerInput) newBowlerInput.value = this.dataset.name;
                        });
                    });
                }
                if (newBowlerInput) newBowlerInput.value = '';
                if (bowlerChangeModal) bowlerChangeModal.classList.add('active');
            }

            if (bowlerConfirmBtn) {
                bowlerConfirmBtn.addEventListener('click', () => {
                    const name = newBowlerInput ? newBowlerInput.value.trim() : '';
                    if (!name) {
                        showToast('⚠️ Please enter a bowler name.', 'error');
                        return;
                    }
                    const match = getMatch(state.currentMatchId);
                    if (match) {
                        match.bowler = name;
                        match.bowlerOvers = 0;
                        match.bowlerRuns = 0;
                        match.bowlerWickets = 0;
                        match.ballsInCurrentOver = 0;
                        if (!match.bowlingStats) match.bowlingStats = {};
                        if (!match.bowlingStats[name]) match.bowlingStats[name] = { overs: 0, maidens: 0, runs: 0,
                            wickets: 0 };
                        saveState();
                        updateTournamentLiveUI(match);
                    }
                    if (bowlerChangeModal) bowlerChangeModal.classList.remove('active');
                    showToast(`🔄 New bowler: ${name}`, 'success');
                });
            }

            if (bowlerCancelBtn) {
                bowlerCancelBtn.addEventListener('click', () => {
                    if (bowlerChangeModal) bowlerChangeModal.classList.remove('active');
                });
            }

            // ===== 2ND INNINGS MODAL =====
            const secondInningsModal = document.getElementById('secondInningsModal');
            const secondStriker = document.getElementById('secondStriker');
            const secondNonStriker = document.getElementById('secondNonStriker');
            const secondBowler = document.getElementById('secondBowler');
            const secondInningsConfirmBtn = document.getElementById('secondInningsConfirmBtn');
            const secondInningsCancelBtn = document.getElementById('secondInningsCancelBtn');

            function showSecondInningsModal(match) {
                if (!match) match = getMatch(state.currentMatchId);
                if (!match) return;
                populateSecondInningsSuggestions(match);
                const battingTeam = match.battingFirst === match.team1 ? match.team2 : match.team1;
                const battingXI = battingTeam === match.team1 ? match.team1Players : match.team2Players;
                const bowlingXI = (match.battingFirst === match.team1 ? match.team2Players : match.team1Players);
                if (secondStriker) secondStriker.value = battingXI[0] || '';
                if (secondNonStriker) secondNonStriker.value = battingXI[1] || '';
                if (secondBowler) secondBowler.value = bowlingXI[0] || '';
                if (secondInningsModal) secondInningsModal.classList.add('active');
            }

            if (secondInningsConfirmBtn) {
                secondInningsConfirmBtn.addEventListener('click', function() {
                    const match = getMatch(state.currentMatchId);
                    if (!match) return;
                    const striker = secondStriker ? secondStriker.value.trim() : '';
                    const nonStriker = secondNonStriker ? secondNonStriker.value.trim() : '';
                    const bowler = secondBowler ? secondBowler.value.trim() : '';
                    if (!striker || !nonStriker || !bowler) {
                        showToast('⚠️ Please fill all fields.', 'error');
                        return;
                    }
                    match.striker = striker;
                    match.nonStriker = nonStriker;
                    match.bowler = bowler;
                    match.innings = 2;
                    match.score2 = { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [], ballHistory: [],
                        extras: 0, wideCount: 0, noBallCount: 0, byeCount: 0, legByeCount: 0,
                        fours: 0, sixes: 0, strikerRuns: 0, bowlerWickets: 0, strikerBallsFaced: 0
                    };
                    match.bowlerOvers = 0;
                    match.bowlerRuns = 0;
                    match.bowlerWickets = 0;
                    match.ballsInCurrentOver = 0;
                    match.batsmenStats = {};
                    match.bowlingStats = {};
                    if (!match.batsmenStats[striker]) match.batsmenStats[striker] = { runs: 0, balls: 0 };
                    if (!match.batsmenStats[nonStriker]) match.batsmenStats[nonStriker] = { runs: 0, balls: 0 };
                    if (!match.bowlingStats[bowler]) match.bowlingStats[bowler] = { overs: 0, maidens: 0, runs: 0,
                        wickets: 0 };

                    const firstInnScore = match.score1.runs;
                    match.targetRuns = firstInnScore + 1;
                    match.targetBalls = match.overs * 6;

                    // Show target at the top
                    const targetTop = document.getElementById('tourTargetTop');
                    if (targetTop) {
                        targetTop.textContent = `🎯 Target: ${match.targetRuns} runs`;
                        targetTop.style.color = 'var(--accent)';
                    }

                    if (secondInningsModal) secondInningsModal.classList.remove('active');
                    saveState();
                    updateTournamentLiveUI(match);
                    showToast('🏏 2nd Innings started!', 'success');
                });
            }

            if (secondInningsCancelBtn) {
                secondInningsCancelBtn.addEventListener('click', function() {
                    if (secondInningsModal) secondInningsModal.classList.remove('active');
                });
            }

            // ===== MATCH COMPLETE MODAL =====
            const matchCompleteModal = document.getElementById('matchCompleteModal');
            const matchCompleteMessage = document.getElementById('matchCompleteMessage');
            const matchCompleteOkBtn = document.getElementById('matchCompleteOkBtn');

            function showMatchCompleteModal(winner, margin, marginType) {
                if (matchCompleteMessage) {
                    if (winner === 'Match Tied') {
                        matchCompleteMessage.textContent = '🏏 Match Tied!';
                    } else {
                        matchCompleteMessage.textContent = `${winner} won by ${margin} ${marginType}`;
                    }
                }
                if (matchCompleteModal) matchCompleteModal.classList.add('active');
            }

            if (matchCompleteOkBtn) {
                matchCompleteOkBtn.addEventListener('click', function() {
                    if (matchCompleteModal) matchCompleteModal.classList.remove('active');
                    // Switch to summary tab after match complete
                    const summaryBtn = document.getElementById('tabSummaryBtn');
                    if (summaryBtn) {
                        summaryBtn.click();
                    }
                });
            }

            // ===== TOURNAMENT FUNCTIONS =====
            function renderTournaments() {
                const grid = document.getElementById('tournamentGrid');
                if (!grid) return;

                if (state.tournaments.length === 0) {
                    grid.innerHTML =
                        `<div class="empty-state" style="grid-column:1/-1;padding:20px 0;"><div class="icon" style="font-size:32px;">🏏</div><p style="font-size:14px;">No tournaments created yet</p></div>`;
                    return;
                }

                let html = '';
                state.tournaments.forEach((t) => {
                    const matchCount = state.matches.filter(m => m.tournamentId === t.id).length;
                    html += `
                        <div class="tournament-card" onclick="window.openCreateMatchForTournament('${t.id}')">
                            <div class="name">🏆 ${t.name}</div>
                            <div class="venue">📍 ${t.venue || 'Venue not set'}</div>
                            <div class="type">📋 ${t.type.toUpperCase()}</div>
                            <div class="match-count">${matchCount} matches</div>
                            <button class="delete-tournament" onclick="event.stopPropagation(); window.deleteTournament('${t.id}')">Delete</button>
                        </div>
                    `;
                });
                grid.innerHTML = html;
            }

            window.deleteTournament = function(id) {
                if (!confirm('Delete this tournament? All matches will also be deleted.')) return;
                state.matches = state.matches.filter(m => m.tournamentId !== id);
                state.tournaments = state.tournaments.filter(t => t.id !== id);
                saveState();
                renderTournaments();
                renderMatchList();
                populateTournamentDropdown();
                showToast('🗑️ Tournament deleted.', 'info');
            };

            function populateTournamentDropdown() {
                const select = document.getElementById('matchTournamentSelect');
                if (!select) return;
                const currentVal = select.value;
                select.innerHTML = '<option value="">— Select Tournament —</option>';
                state.tournaments.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name;
                    select.appendChild(opt);
                });
                if (currentVal && state.tournaments.find(t => t.id === currentVal)) {
                    select.value = currentVal;
                }
            }

            // ===== WORKFLOW MODALS =====
            const createTournamentModal = document.getElementById('createTournamentModal');
            const createMatchModal = document.getElementById('createMatchModal');
            const openCreateTournamentBtn = document.getElementById('openCreateTournamentBtn');
            const closeCreateTournamentBtn = document.getElementById('closeCreateTournamentBtn');
            const closeCreateMatchBtn = document.getElementById('closeCreateMatchBtn');

            openCreateTournamentBtn?.addEventListener('click', () => createTournamentModal?.classList.add('active'));
            closeCreateTournamentBtn?.addEventListener('click', () => createTournamentModal?.classList.remove('active'));
            closeCreateMatchBtn?.addEventListener('click', () => createMatchModal?.classList.remove('active'));
            [createTournamentModal, createMatchModal].forEach(modal => {
                modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
            });

            window.openCreateMatchForTournament = function(tournamentId) {
                const tournament = getTournament(tournamentId);
                if (!tournament) return;
                const select = document.getElementById('matchTournamentSelect');
                if (select) select.value = tournamentId;
                const ta = document.getElementById('teamAName');
                const tb = document.getElementById('teamBName');
                if (ta) ta.value = 'Team A';
                if (tb) tb.value = 'Team B';
                createMatchModal?.classList.add('active');
            };

            // ===== CREATE TOURNAMENT =====
            document.getElementById('createTournamentBtn').addEventListener('click', function() {
                const name = document.getElementById('tournamentName').value.trim();
                const venue = document.getElementById('tournamentVenue').value.trim();
                const type = document.getElementById('tournamentType').value;
                const startDate = document.getElementById('tournamentStartDate').value;
                const endDate = document.getElementById('tournamentEndDate').value;

                if (!name) {
                    showToast('⚠️ Please enter a tournament name.', 'error');
                    return;
                }

                const newTournament = {
                    id: generateId(),
                    name,
                    venue: venue || 'Not specified',
                    type,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    createdAt: new Date().toISOString(),
                };

                state.tournaments.push(newTournament);
                saveState();
                renderTournaments();
                populateTournamentDropdown();
                // Clear form
                document.getElementById('tournamentName').value = '';
                document.getElementById('tournamentVenue').value = '';
                document.getElementById('tournamentStartDate').value = '';
                document.getElementById('tournamentEndDate').value = '';
                createTournamentModal?.classList.remove('active');
                showToast(`✅ Tournament "${name}" created!`, 'success');
            });

            // ===== RESET MATCH SETUP =====
            document.getElementById('resetMatchSetupBtn').addEventListener('click', () => {
                if (confirm('Reset all match setup data?')) {
                    state.teamAXI = [];
                    state.teamBXI = [];
                    state.striker = '';
                    state.nonStriker = '';
                    state.bowler = '';
                    state.isMatchSetup = false;
                    saveState();
                    renderXI();
                    updateAllViews();
                    showToast('🔄 Match setup reset', 'info');
                }
            });

            // ===== CREATE TOURNAMENT MATCH =====
            document.getElementById('createTournamentMatchBtn').addEventListener('click', function() {
                const tournamentId = document.getElementById('matchTournamentSelect').value;
                const matchNo = parseInt(document.getElementById('matchNo')?.value) || 1;
                const teamAName = document.getElementById('teamAName')?.value.trim() || 'Team A';
                const teamBName = document.getElementById('teamBName')?.value.trim() || 'Team B';
                const matchType = document.getElementById('matchType')?.value || 't20';
                const maxOvers = parseInt(document.getElementById('maxOvers')?.value) || 20;
                const tossWinner = document.getElementById('tossWinner')?.value || 'teamA';
                const tossDecision = document.getElementById('tossDecision')?.value || 'bat';
                const battingFirst = tossDecision === 'bat' ? tossWinner : (tossWinner === 'teamA' ? 'teamB' : 'teamA');

                if (!tournamentId) {
                    showToast('⚠️ Please select a tournament.', 'error');
                    return;
                }
                if (state.teamAXI.length === 0 || state.teamBXI.length === 0) {
                    showToast('⚠️ Please add players to both XIs.', 'error');
                    return;
                }

                const newMatch = {
                    id: generateId(),
                    tournamentId,
                    matchNo,
                    team1: teamAName,
                    team2: teamBName,
                    overs: maxOvers,
                    tossWinner: tossWinner === 'teamA' ? teamAName : (tossWinner === 'teamB' ? teamBName : ''),
                    tossDecision,
                    tossChoice: tossDecision,
                    matchTied: false,
                    matchType: matchType,
                    winner: null,
                    status: 'pending',
                    innings: 1,
                    striker: '',
                    nonStriker: '',
                    bowler: '',
                    team1Players: [...state.teamAXI],
                    team2Players: [...state.teamBXI],
                    battingFirst: battingFirst === 'teamA' ? teamAName : teamBName,
                    score1: { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [], ballHistory: [],
                        extras: 0, wideCount: 0, noBallCount: 0, byeCount: 0, legByeCount: 0,
                        fours: 0, sixes: 0, strikerRuns: 0, bowlerWickets: 0, strikerBallsFaced: 0 },
                    score2: { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [], ballHistory: [],
                        extras: 0, wideCount: 0, noBallCount: 0, byeCount: 0, legByeCount: 0,
                        fours: 0, sixes: 0, strikerRuns: 0, bowlerWickets: 0, strikerBallsFaced: 0 },
                    bowlerOvers: 0,
                    bowlerRuns: 0,
                    bowlerWickets: 0,
                    ballsInCurrentOver: 0,
                    batsmenStats: {},
                    bowlingStats: {},
                    targetRuns: 0,
                    targetBalls: 0,
                };

                state.matches.push(newMatch);
                saveState();
                renderMatchList();
                renderTournaments();
                createMatchModal?.classList.remove('active');
                showToast(`✅ Match "${teamAName} vs ${teamBName}" created!`, 'success');
                window.openMatchDetail(newMatch.id);
            });

            // ===== MATCH LIST =====
            function renderMatchList() {
                const container = document.getElementById('matchListContainer');
                if (!container) return;
                if (state.matches.length === 0) {
                    container.innerHTML =
                        `<div class="empty-state" id="emptyMatchState"><div class="icon">🏏</div><p>No Matches Created</p><span class="text-muted" style="font-size:13px;">Use the form above to create a new match.</span></div>`;
                    return;
                }

                let html = '';
                state.matches.forEach((match) => {
                    const tossInfo = match.tossWinner ? `${match.tossWinner} won toss and chose to ${match.tossChoice}` :
                        'Toss pending';
                    let winnerText = match.winner || 'MATCH NOT FINISH YET';
                    if (match.status === 'completed' && match.matchWinner) {
                        winnerText = `${match.matchWinner} won by ${match.winMargin} ${match.winMarginType}`;
                    }
                    const statusText = match.status === 'live' ? '🟢 LIVE' : (match.status === 'completed' ?
                        '✅ Completed' : '⚪ Pending');
                    let scoreSummary = '';
                    if (match.status === 'live' || match.status === 'completed') {
                        const inn = match.innings === 1 ? match.score1 : match.score2;
                        if (inn) {
                            scoreSummary = ` ${match.team1} ${match.score1.runs}/${match.score1.wickets}`;
                            if (match.innings === 2 || match.status === 'completed') {
                                scoreSummary += `, ${match.team2} ${match.score2.runs}/${match.score2.wickets}`;
                            }
                        }
                    }
                    const tournament = getTournament(match.tournamentId);
                    const tourName = tournament ? tournament.name : 'No Tournament';
                    html += `
                        <div class="match-list-item" onclick="window.openMatchDetail('${match.id}')">
                            <div class="match-info">
                                <div class="teams">${match.team1} vs ${match.team2}</div>
                                <div class="meta">
                                    <span>🏏 ${match.matchType || 'Group Stage'}</span>
                                    <span>📋 Match ${match.matchNo || 'N/A'}</span>
                                    <span>🏆 ${tourName}</span>
                                    <span>🔄 ${tossInfo}</span>
                                    <span>🏆 ${winnerText}</span>
                                    <span>${statusText}</span>
                                    ${scoreSummary ? `<span style="color:var(--accent);">${scoreSummary}</span>` : ''}
                                </div>
                            </div>
                            <div class="match-actions">
                                <button class="btn-sm btn-sm-danger" onclick="event.stopPropagation(); window.deleteMatch('${match.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            }

            window.deleteMatch = function(id) {
                if (!confirm('Delete this match?')) return;
                state.matches = state.matches.filter(m => m.id !== id);
                saveState();
                renderMatchList();
                renderTournaments();
                if (state.currentMatchId === id) {
                    state.currentMatchId = null;
                    document.getElementById('matchDetailView').classList.add('hidden');
                    document.getElementById('matchListContainer').classList.remove('hidden');
                    document.getElementById('matchSetupForm').classList.remove('hidden');
                }
                showToast('🗑️ Match deleted.', 'info');
            };

            // ===== OPEN FULL SCORER PAGE =====
            function launchFullScorer(match) {
                if (!match) return;
                const bridge = {
                    id: match.id,
                    tournament: (getTournament(match.tournamentId) || {}).name || '',
                    venue: (getTournament(match.tournamentId) || {}).venue || '',
                    matchName: `Match ${match.matchNo || 1}`,
                    teamA: match.team1 || 'Team A',
                    teamB: match.team2 || 'Team B',
                    maxOvers: Number(match.overs) || 20,
                    tossWinner: match.tossWinner === match.team1 ? 'A' : (match.tossWinner === match.team2 ? 'B' : ''),
                    tossDecision: match.tossDecision || 'bat',
                    xiA: match.team1Players || [],
                    xiB: match.team2Players || []
                };
                localStorage.setItem('brklive19_score_bridge', JSON.stringify(bridge));
                localStorage.setItem('brklive19_last_match_id', match.id);
                window.location.href = './scorer.html?match=' + encodeURIComponent(match.id);
            }

            // ===== OPEN MATCH DETAIL =====
            window.openMatchDetail = function(id) {
                const match = getMatch(id);
                if (!match) { showToast('Match not found.', 'error'); return; }
                state.currentMatchId = id;
                state.lastMatchId = id;
                localStorage.setItem('brklive19_last_match_id', id);
                saveState();

                if (!match.striker || !match.bowler) {
                    const battingFirst = match.battingFirst === match.team1 ? 'teamA' : 'teamB';
                    document.getElementById('battingFirst').value = battingFirst;
                    state.teamAXI = match.team1Players || [];
                    state.teamBXI = match.team2Players || [];
                    renderXI();
                    showStartMatchModal();

                    const origConfirm = startMatchConfirmBtn.onclick;
                    startMatchConfirmBtn.onclick = function(e) {
                        e.preventDefault();
                        const striker = startStriker.value.trim();
                        const nonStriker = startNonStriker.value.trim();
                        const bowler = startBowler.value.trim();
                        if (!striker || !nonStriker || !bowler) {
                            showToast('⚠️ Please fill all fields.', 'error');
                            return;
                        }
                        const match = getMatch(state.currentMatchId);
                        if (match) {
                            match.striker = striker;
                            match.nonStriker = nonStriker;
                            match.bowler = bowler;
                            match.status = 'live';
                            match.score1 = { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [],
                                ballHistory: [], extras: 0, wideCount: 0, noBallCount: 0,
                                byeCount: 0, legByeCount: 0, fours: 0, sixes: 0, strikerRuns: 0,
                                bowlerWickets: 0, strikerBallsFaced: 0 };
                            match.score2 = { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [],
                                ballHistory: [], extras: 0, wideCount: 0, noBallCount: 0,
                                byeCount: 0, legByeCount: 0, fours: 0, sixes: 0, strikerRuns: 0,
                                bowlerWickets: 0, strikerBallsFaced: 0 };
                            match.bowlerOvers = 0;
                            match.bowlerRuns = 0;
                            match.bowlerWickets = 0;
                            match.ballsInCurrentOver = 0;
                            match.batsmenStats = {};
                            match.bowlingStats = {};
                            if (!match.batsmenStats[striker]) match.batsmenStats[striker] = { runs: 0,
                                balls: 0 };
                            if (!match.batsmenStats[nonStriker]) match.batsmenStats[nonStriker] = { runs: 0,
                                balls: 0 };
                            if (!match.bowlingStats[bowler]) match.bowlingStats[bowler] = { overs: 0,
                                maidens: 0, runs: 0, wickets: 0 };
                            match.innings = 1;
                            match.targetRuns = 0;
                            match.targetBalls = 0;
                            state.lastMatchId = match.id;
                            localStorage.setItem('brklive19_last_match_id', match.id);
                            saveState();
                            startMatchModal.classList.remove('active');
                            renderMatchDetail(match);
                            const detailView = document.getElementById('matchDetailView');
                            const listContainer = document.getElementById('matchListContainer');
                            const setupForm = document.getElementById('matchSetupForm');
                            if (detailView) detailView.classList.remove('hidden');
                            if (listContainer) listContainer.classList.add('hidden');
                            if (setupForm) setupForm.classList.add('hidden');
                            showToast('✅ Match started!', 'success');
                        }
                    };
                    startMatchConfirmBtn._origOnClick = origConfirm;
                    return;
                }

                renderMatchDetail(match);
                const detailView = document.getElementById('matchDetailView');
                const listContainer = document.getElementById('matchListContainer');
                const setupForm = document.getElementById('matchSetupForm');
                if (detailView) detailView.classList.remove('hidden');
                if (listContainer) listContainer.classList.add('hidden');
                if (setupForm) setupForm.classList.add('hidden');
                showToast(`📋 Loaded match: ${match.team1} vs ${match.team2}`, 'info');
            };

            // ===== RENDER MATCH DETAIL =====
            function renderMatchDetail(match) {
                if (!match) return;
                if (!match.score1) match.score1 = { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [],
                    ballHistory: [], extras: 0, wideCount: 0, noBallCount: 0, byeCount: 0, legByeCount: 0,
                    fours: 0, sixes: 0, strikerRuns: 0, bowlerWickets: 0, strikerBallsFaced: 0 };
                if (!match.score2) match.score2 = { runs: 0, wickets: 0, overs: 0, balls: 0, overBallData: [],
                    ballHistory: [], extras: 0, wideCount: 0, noBallCount: 0, byeCount: 0, legByeCount: 0,
                    fours: 0, sixes: 0, strikerRuns: 0, bowlerWickets: 0, strikerBallsFaced: 0 };
                if (!match.batsmenStats) match.batsmenStats = {};
                if (!match.bowlingStats) match.bowlingStats = {};
                if (match.striker && !match.batsmenStats[match.striker]) {
                    match.batsmenStats[match.striker] = { runs: 0, balls: 0 };
                }
                if (match.nonStriker && !match.batsmenStats[match.nonStriker]) {
                    match.batsmenStats[match.nonStriker] = { runs: 0, balls: 0 };
                }
                if (match.bowler && !match.bowlingStats[match.bowler]) {
                    match.bowlingStats[match.bowler] = { overs: 0, maidens: 0, runs: 0, wickets: 0 };
                }
                updateTournamentLiveUI(match);
                updateScorecard(match);
                updateStreamView();
                renderMatchSummary(match);
                // Activate live tab by default, but if match is completed, show summary
                if (match.status === 'completed') {
                    document.getElementById('tabSummaryBtn').click();
                } else {
                    document.getElementById('tabLiveBtn').click();
                }
            }

            // ===== TAB SWITCHING =====
            document.getElementById('tabLiveBtn').addEventListener('click', function() {
                document.querySelectorAll('.match-tabs .btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tabLive').classList.add('active');
                document.getElementById('tabScorecard').classList.remove('active');
                document.getElementById('tabStream').classList.remove('active');
                document.getElementById('tabSummary').classList.remove('active');
            });
            document.getElementById('tabScorecardBtn').addEventListener('click', function() {
                document.querySelectorAll('.match-tabs .btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tabScorecard').classList.add('active');
                document.getElementById('tabLive').classList.remove('active');
                document.getElementById('tabStream').classList.remove('active');
                document.getElementById('tabSummary').classList.remove('active');
                const match = getMatch(state.currentMatchId);
                if (match) updateScorecard(match);
            });
            document.getElementById('tabStreamBtn').addEventListener('click', function() {
                document.querySelectorAll('.match-tabs .btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tabStream').classList.add('active');
                document.getElementById('tabLive').classList.remove('active');
                document.getElementById('tabScorecard').classList.remove('active');
                document.getElementById('tabSummary').classList.remove('active');
                updateStreamView();
            });
            document.getElementById('tabSummaryBtn').addEventListener('click', function() {
                document.querySelectorAll('.match-tabs .btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tabSummary').classList.add('active');
                document.getElementById('tabLive').classList.remove('active');
                document.getElementById('tabScorecard').classList.remove('active');
                document.getElementById('tabStream').classList.remove('active');
                const match = getMatch(state.currentMatchId);
                if (match) renderMatchSummary(match);
            });

            // ===== RENDER MATCH SUMMARY (Detailed Scorecard) =====
            function renderMatchSummary(match) {
                if (!match) return;
                const container = document.getElementById('matchSummaryContainer');
                if (!container) return;

                const team1 = match.team1;
                const team2 = match.team2;
                const score1 = match.score1 || { runs: 0, wickets: 0, overs: 0, balls: 0 };
                const score2 = match.score2 || { runs: 0, wickets: 0, overs: 0, balls: 0 };
                const batsmen = match.batsmenStats || {};
                const bowlers = match.bowlingStats || {};

                // Determine innings order
                const isTeam1First = match.battingFirst === team1;
                const firstInnTeam = isTeam1First ? team1 : team2;
                const secondInnTeam = isTeam1First ? team2 : team1;
                const firstInnScore = isTeam1First ? score1 : score2;
                const secondInnScore = isTeam1First ? score2 : score1;

                // Determine bowling teams (opposition)
                const firstInnBowlingTeam = isTeam1First ? team2 : team1;
                const secondInnBowlingTeam = isTeam1First ? team1 : team2;

                // Build result banner
                let resultText = '';
                let resultClass = 'pending';
                if (match.status === 'completed' && match.matchWinner) {
                    resultText = `🏆 ${match.matchWinner} won by ${match.winMargin} ${match.winMarginType}`;
                    resultClass = 'completed';
                } else if (match.status === 'live') {
                    resultText = '🔴 Match in Progress';
                    resultClass = 'live';
                } else {
                    resultText = '⏳ Match Pending';
                    resultClass = 'pending';
                }

                // Build innings blocks
                let html = `
                    <div class="summary-title">
                        MATCH SUMMARY
                        <button class="undo-btn" id="summaryUndoBtn">UNDO</button>
                    </div>
                    <div class="summary-result-banner ${resultClass}">${resultText}</div>
                `;

                // --- 1st Innings ---
                html += `
                    <div class="innings-block">
                        <div class="innings-header">
                            <span class="team-name">${firstInnTeam}</span>
                            <span class="score-summary">${firstInnScore.runs || 0} - ${firstInnScore.wickets || 0}</span>
                            <span class="overs-info">Overs: ${firstInnScore.overs || 0}.${firstInnScore.balls || 0}</span>
                        </div>
                        <div class="scorecard-grid">
                            <div class="batting-card">
                                <h5>Batting</h5>
                                <table>
                                    <thead><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                                    <tbody>
                `;

                // Add batsmen from first innings (all batsmen, show all)
                const allBatsmen = Object.entries(batsmen);
                if (allBatsmen.length === 0) {
                    html += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No batting data</td></tr>`;
                } else {
                    // Sort by runs descending
                    allBatsmen.sort((a, b) => b[1].runs - a[1].runs);
                    allBatsmen.forEach(([name, stats]) => {
                        const isOut = stats.isOut !== false;
                        const suffix = isOut ? '' : '<span class="not-out">*</span>';
                        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0';
                        html += `
                            <tr>
                                <td>${name}${suffix}</td>
                                <td>${stats.runs || 0}</td>
                                <td>${stats.balls || 0}</td>
                                <td>${stats.fours || 0}</td>
                                <td>${stats.sixes || 0}</td>
                                <td>${sr}</td>
                            </tr>
                        `;
                    });
                }

                // Add extras row
                const firstInnExtras = firstInnScore.extras || 0;
                html += `
                                    <tr class="extras-row"><td colspan="6">Extras: ${firstInnExtras} (b ${firstInnScore.byeCount || 0}, lb ${firstInnScore.legByeCount || 0}, w ${firstInnScore.wideCount || 0}, nb ${firstInnScore.noBallCount || 0})</td></tr>
                                    <tr class="total-row"><td colspan="2">Total: ${firstInnScore.runs || 0} / ${firstInnScore.wickets || 0}</td><td colspan="4">Overs: ${firstInnScore.overs || 0}.${firstInnScore.balls || 0}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="bowling-card">
                            <h5>Bowling (${firstInnBowlingTeam})</h5>
                            <table>
                                <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
                                <tbody>
                `;

                // Bowling stats for first innings
                const bowlingEntries = Object.entries(bowlers);
                if (bowlingEntries.length === 0) {
                    html += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No bowling data</td></tr>`;
                } else {
                    // Sort by wickets descending
                    bowlingEntries.sort((a, b) => b[1].wickets - a[1].wickets);
                    bowlingEntries.forEach(([name, stats]) => {
                        const econ = stats.overs > 0 ? (stats.runs / stats.overs).toFixed(2) : '0.00';
                        html += `
                            <tr>
                                <td>${name}</td>
                                <td>${stats.overs || 0}</td>
                                <td>${stats.maidens || 0}</td>
                                <td>${stats.runs || 0}</td>
                                <td>${stats.wickets || 0}</td>
                                <td>${econ}</td>
                            </tr>
                        `;
                    });
                }

                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                `;

                // --- 2nd Innings ---
                html += `
                    <div class="innings-block">
                        <div class="innings-header">
                            <span class="team-name">${secondInnTeam}</span>
                            <span class="score-summary">${secondInnScore.runs || 0} - ${secondInnScore.wickets || 0}</span>
                            <span class="overs-info">Overs: ${secondInnScore.overs || 0}.${secondInnScore.balls || 0}</span>
                        </div>
                        <div class="scorecard-grid">
                            <div class="batting-card">
                                <h5>Batting</h5>
                                <table>
                                    <thead><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                                    <tbody>
                `;

                // Same batsmen list for second innings (show all again, but they are the same players)
                const allBatsmen2 = Object.entries(batsmen);
                if (allBatsmen2.length === 0) {
                    html += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No batting data</td></tr>`;
                } else {
                    allBatsmen2.sort((a, b) => b[1].runs - a[1].runs);
                    allBatsmen2.forEach(([name, stats]) => {
                        const isOut = stats.isOut !== false;
                        const suffix = isOut ? '' : '<span class="not-out">*</span>';
                        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0';
                        html += `
                            <tr>
                                <td>${name}${suffix}</td>
                                <td>${stats.runs || 0}</td>
                                <td>${stats.balls || 0}</td>
                                <td>${stats.fours || 0}</td>
                                <td>${stats.sixes || 0}</td>
                                <td>${sr}</td>
                            </tr>
                        `;
                    });
                }

                const secondInnExtras = secondInnScore.extras || 0;
                html += `
                                    <tr class="extras-row"><td colspan="6">Extras: ${secondInnExtras} (b ${secondInnScore.byeCount || 0}, lb ${secondInnScore.legByeCount || 0}, w ${secondInnScore.wideCount || 0}, nb ${secondInnScore.noBallCount || 0})</td></tr>
                                    <tr class="total-row"><td colspan="2">Total: ${secondInnScore.runs || 0} / ${secondInnScore.wickets || 0}</td><td colspan="4">Overs: ${secondInnScore.overs || 0}.${secondInnScore.balls || 0}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="bowling-card">
                            <h5>Bowling (${secondInnBowlingTeam})</h5>
                            <table>
                                <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
                                <tbody>
                `;

                // Same bowling stats for second innings
                const bowlingEntries2 = Object.entries(bowlers);
                if (bowlingEntries2.length === 0) {
                    html += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No bowling data</td></tr>`;
                } else {
                    bowlingEntries2.sort((a, b) => b[1].wickets - a[1].wickets);
                    bowlingEntries2.forEach(([name, stats]) => {
                        const econ = stats.overs > 0 ? (stats.runs / stats.overs).toFixed(2) : '0.00';
                        html += `
                            <tr>
                                <td>${name}</td>
                                <td>${stats.overs || 0}</td>
                                <td>${stats.maidens || 0}</td>
                                <td>${stats.runs || 0}</td>
                                <td>${stats.wickets || 0}</td>
                                <td>${econ}</td>
                            </tr>
                        `;
                    });
                }

                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                `;

                // --- Footer ---
                html += `
                    <div class="summary-footer">
                        <span>Match: ${team1} vs ${team2}</span>
                        <span class="mvp">${match.mvp ? 'MVP: ' + match.mvp : ''}</span>
                    </div>
                    <div class="edit-short-name">Edit Team Short Name ✨</div>
                `;

                container.innerHTML = html;

                // Attach undo button event
                const undoBtn = document.getElementById('summaryUndoBtn');
                if (undoBtn) {
                    undoBtn.addEventListener('click', function() {
                        window.undoLastBall();
                    });
                }
            }

            // ===== UNDO FUNCTION =====
            window.undoLastBall = function() {
                const match = getMatch(state.currentMatchId);
                if (!match) {
                    showToast('No match found.', 'error');
                    return;
                }
                if (match.status === 'completed') {
                    showToast('Match is already completed. Cannot undo.', 'error');
                    return;
                }

                const history = match.history || [];
                if (history.length === 0) {
                    showToast('Nothing to undo.', 'info');
                    return;
                }

                const snap = history.pop();
                match.history = history;

                const inn = match.innings === 1 ? match.score1 : match.score2;
                if (!inn) return;

                inn.runs = snap.runs || 0;
                inn.wickets = snap.wickets || 0;
                inn.overs = snap.overs || 0;
                inn.balls = snap.balls || 0;
                inn.overBallData = snap.overBallData || [];
                inn.ballHistory = snap.ballHistory || [];
                inn.extras = snap.extras || 0;
                inn.wideCount = snap.wideCount || 0;
                inn.noBallCount = snap.noBallCount || 0;
                inn.byeCount = snap.byeCount || 0;
                inn.legByeCount = snap.legByeCount || 0;
                inn.fours = snap.fours || 0;
                inn.sixes = snap.sixes || 0;
                inn.strikerRuns = snap.strikerRuns || 0;
                inn.bowlerWickets = snap.bowlerWickets || 0;
                inn.strikerBallsFaced = snap.strikerBallsFaced || 0;

                match.striker = snap.striker || match.striker;
                match.nonStriker = snap.nonStriker || match.nonStriker;
                match.bowler = snap.bowler || match.bowler;
                match.bowlerOvers = snap.bowlerOvers || 0;
                match.bowlerRuns = snap.bowlerRuns || 0;
                match.bowlerWickets = snap.bowlerWickets || 0;
                match.ballsInCurrentOver = snap.ballsInCurrentOver || 0;
                match.batsmenStats = snap.batsmenStats || {};
                match.bowlingStats = snap.bowlingStats || {};
                match.targetRuns = snap.targetRuns || match.targetRuns;
                match.targetBalls = snap.targetBalls || match.targetBalls;

                // If match was completed, revert status
                if (snap.status === 'live' || snap.status === 'pending') {
                    match.status = snap.status || 'live';
                    match.matchWinner = null;
                    match.winMargin = 0;
                    match.winMarginType = '';
                }

                saveState();
                updateAllViews();
                showToast('↩ Undo successful!', 'success');
            };

            // ===== UPDATE SCORECARD =====
            function updateScorecard(match) {
                if (!match) return;
                const battingBody = document.getElementById('battingBody');
                const bowlingBody = document.getElementById('bowlingBody');
                if (!battingBody || !bowlingBody) return;

                let summaryHtml = '';
                if (match.status === 'completed' && match.matchWinner) {
                    summaryHtml =
                        `<tr style="background:rgba(46,204,113,0.1);"><td colspan="6" style="font-weight:700;color:var(--success);text-align:center;">🏆 ${match.matchWinner} won by ${match.winMargin} ${match.winMarginType}</td></tr>`;
                }
                battingBody.innerHTML = summaryHtml;

                const batsmen = match.batsmenStats || {};
                const sortedBatsmen = Object.entries(batsmen).sort((a, b) => b[1].runs - a[1].runs);
                if (sortedBatsmen.length === 0) {
                    battingBody.innerHTML +=
                        '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No batting data yet</td></tr>';
                } else {
                    sortedBatsmen.forEach(([name, stats]) => {
                        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0';
                        const fours = stats.fours || 0;
                        const sixes = stats.sixes || 0;
                        const isOut = stats.isOut !== false;
                        const suffix = isOut ? '' : '*';
                        battingBody.innerHTML +=
                            `<tr><td>${name}${suffix}</td><td>${stats.runs}</td><td>${stats.balls}</td><td>${fours}</td><td>${sixes}</td><td>${sr}</td></tr>`;
                    });
                }

                bowlingBody.innerHTML = '';
                const bowlers = match.bowlingStats || {};
                const sortedBowlers = Object.entries(bowlers).sort((a, b) => b[1].wickets - a[1].wickets);
                if (sortedBowlers.length === 0) {
                    bowlingBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No bowling data yet</td></tr>';
                } else {
                    sortedBowlers.forEach(([name, stats]) => {
                        const econ = stats.overs > 0 ? (stats.runs / stats.overs).toFixed(2) : '0.00';
                        bowlingBody.innerHTML +=
                            `<tr><td>${name}</td><td>${stats.overs}</td><td>${stats.maidens || 0}</td><td>${stats.runs}</td><td>${stats.wickets}</td><td>${econ}</td></tr>`;
                    });
                }
            }

            // ===== UPDATE STREAM VIEW =====
            function updateStreamView() {
                let match = null;
                if (state.currentMatchId) {
                    match = getMatch(state.currentMatchId);
                }
                if (!match && state.lastMatchId) {
                    if (state.lastMatchId === 'live' && state.isMatchSetup) {
                        match = {
                            team1: state.teamA,
                            team2: state.teamB,
                            battingFirst: state.battingFirst === 'teamA' ? state.teamA : state.teamB,
                            innings: state.innings,
                            striker: state.striker,
                            nonStriker: state.nonStriker,
                            bowler: state.bowler,
                            score1: state,
                            score2: state.innings2,
                            matchType: state.matchType,
                            overs: state.maxOvers,
                            bowlerOvers: state.bowlerOvers,
                            bowlerRuns: state.bowlerRuns,
                            bowlerWickets: state.bowlerWickets,
                            ballsInCurrentOver: state.ballsInCurrentOver,
                            batsmenStats: state.batsmenStats,
                            bowlingStats: state.bowlingStats,
                            status: state.isMatchSetup ? 'live' : 'pending',
                            matchWinner: state.matchWinner || null,
                            winMargin: state.winMargin || 0,
                            winMarginType: state.winMarginType || '',
                            targetRuns: state.targetRuns,
                        };
                    } else {
                        match = getMatch(state.lastMatchId);
                    }
                }
                if (!match) {
                    const storedId = localStorage.getItem('brklive19_last_match_id');
                    if (storedId === 'live' && state.isMatchSetup) {
                        match = {
                            team1: state.teamA,
                            team2: state.teamB,
                            battingFirst: state.battingFirst === 'teamA' ? state.teamA : state.teamB,
                            innings: state.innings,
                            striker: state.striker,
                            nonStriker: state.nonStriker,
                            bowler: state.bowler,
                            score1: state,
                            score2: state.innings2,
                            matchType: state.matchType,
                            overs: state.maxOvers,
                            bowlerOvers: state.bowlerOvers,
                            bowlerRuns: state.bowlerRuns,
                            bowlerWickets: state.bowlerWickets,
                            ballsInCurrentOver: state.ballsInCurrentOver,
                            batsmenStats: state.batsmenStats,
                            bowlingStats: state.bowlingStats,
                            status: state.isMatchSetup ? 'live' : 'pending',
                            matchWinner: state.matchWinner || null,
                            winMargin: state.winMargin || 0,
                            winMarginType: state.winMarginType || '',
                            targetRuns: state.targetRuns,
                        };
                    } else if (storedId) {
                        match = getMatch(storedId);
                        if (match) {
                            state.lastMatchId = storedId;
                            saveState();
                        }
                    }
                }

                if (!match) {
                    const elements = ['streamTeamA', 'streamTeamB', 'streamScoreA', 'streamScoreB',
                        'streamOversA', 'streamOversB', 'streamBatsman', 'streamBowler',
                        'streamRR', 'streamOversTotal', 'streamStriker', 'streamNonStriker', 'streamMatchLabel'
                    ];
                    elements.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            if (id === 'streamScoreA' || id === 'streamScoreB') {
                                el.innerHTML = '0 <small>/ 0</small>';
                            } else if (id === 'streamOversA' || id === 'streamOversB') {
                                el.textContent = '(0.0 ov)';
                            } else if (id === 'streamRR') {
                                el.textContent = '0.00';
                            } else if (id === 'streamOversTotal') {
                                el.textContent = '0.0';
                            } else if (id === 'streamMatchLabel') {
                                el.textContent = '🏏 No match selected';
                            } else {
                                el.textContent = '—';
                            }
                        }
                    });
                    return;
                }

                const inn = match.innings === 1 ? match.score1 : match.score2;
                if (!inn) return;

                const isTeamABatting = (match.battingFirst === match.team1 && match.innings === 1) ||
                    (match.battingFirst === match.team2 && match.innings === 2);
                const battingTeam = isTeamABatting ? match.team1 : match.team2;
                const bowlingTeam = isTeamABatting ? match.team2 : match.team1;
                const runs = inn.runs || 0;
                const wickets = inn.wickets || 0;
                const overs = (inn.overs || 0) + ((inn.balls || 0) / 10);

                const strikerStats = match.batsmenStats ? match.batsmenStats[match.striker] : null;
                const nonStrikerStats = match.batsmenStats ? match.batsmenStats[match.nonStriker] : null;
                const strikerRuns = strikerStats ? strikerStats.runs : 0;
                const strikerBalls = strikerStats ? strikerStats.balls : 0;
                const nonStrikerRuns = nonStrikerStats ? nonStrikerStats.runs : 0;
                const nonStrikerBalls = nonStrikerStats ? nonStrikerStats.balls : 0;

                const streamTeamA = document.getElementById('streamTeamA');
                const streamTeamB = document.getElementById('streamTeamB');
                const streamScoreA = document.getElementById('streamScoreA');
                const streamScoreB = document.getElementById('streamScoreB');
                const streamOversA = document.getElementById('streamOversA');
                const streamOversB = document.getElementById('streamOversB');
                const streamBatsman = document.getElementById('streamBatsman');
                const streamBowler = document.getElementById('streamBowler');
                const streamRR = document.getElementById('streamRR');
                const streamOversTotal = document.getElementById('streamOversTotal');
                const streamStriker = document.getElementById('streamStriker');
                const streamNonStriker = document.getElementById('streamNonStriker');
                const streamMatchLabel = document.getElementById('streamMatchLabel');

                if (streamTeamA) streamTeamA.textContent = battingTeam;
                if (streamTeamB) streamTeamB.textContent = bowlingTeam;
                if (streamScoreA) streamScoreA.innerHTML = `${runs} <small>/ ${wickets}</small>`;
                if (streamScoreB) streamScoreB.innerHTML = `0 <small>/ 0</small>`;
                if (streamOversA) streamOversA.textContent = `(${overs.toFixed(1)} ov)`;
                if (streamOversB) streamOversB.textContent = `(0.0 ov)`;
                if (streamBatsman) {
                    streamBatsman.textContent = match.striker ? `${match.striker} ${strikerRuns}(${strikerBalls})` : '—';
                }
                if (streamBowler) {
                    streamBowler.textContent = match.bowler || '—';
                }
                const rr = overs > 0 ? (runs / overs) : 0;
                if (streamRR) streamRR.textContent = rr.toFixed(2);
                if (streamOversTotal) streamOversTotal.textContent = overs.toFixed(1);
                if (streamStriker) {
                    streamStriker.textContent = match.striker ? `${match.striker} ${strikerRuns}(${strikerBalls})` : '—';
                }
                if (streamNonStriker) {
                    streamNonStriker.textContent = match.nonStriker ? `${match.nonStriker} ${nonStrikerRuns}(${nonStrikerBalls})` :
                        '—';
                }
                let matchStatusText = '';
                if (match.status === 'completed' && match.matchWinner) {
                    matchStatusText = `🏆 ${match.matchWinner} won by ${match.winMargin} ${match.winMarginType}`;
                } else if (match.innings === 2 && match.targetRuns) {
                    const runsNeeded = Math.max(0, match.targetRuns - runs);
                    const ballsRemaining = match.targetBalls - (inn.balls + inn.overs * 6);
                    matchStatusText =
                        `🎯 Need ${runsNeeded} runs in ${Math.max(0, ballsRemaining)} balls • Target: ${match.targetRuns}`;
                } else {
                    matchStatusText = `🏏 ${match.team1} vs ${match.team2} • ${match.matchType || 'T20'} • Innings ${match.innings}`;
                }
                if (streamMatchLabel) {
                    streamMatchLabel.textContent = matchStatusText;
                }
            }

            // ===== TOURNAMENT LIVE UI =====
            function updateTournamentLiveUI(match) {
                if (!match) return;
                const inn = match.innings === 1 ? match.score1 : match.score2;
                if (!inn) return;
                const totalOvers = inn.overs + (inn.balls / 10);
                const battingTeam = match.innings === 1 ? match.battingFirst : (match.battingFirst === match.team1 ? match
                    .team2 : match.team1);

                const tourBattingTeamName = document.getElementById('tourBattingTeamName');
                const tourMatchTypeDisplay = document.getElementById('tourMatchTypeDisplay');
                const tourBatsman1Name = document.getElementById('tourBatsman1Name');
                const tourBatsman1Runs = document.getElementById('tourBatsman1Runs');
                const tourBatsman1Balls = document.getElementById('tourBatsman1Balls');
                const tourBatsman2Name = document.getElementById('tourBatsman2Name');
                const tourBatsman2Runs = document.getElementById('tourBatsman2Runs');
                const tourBatsman2Balls = document.getElementById('tourBatsman2Balls');
                const tourTotalScore = document.getElementById('tourTotalScore');
                const tourTotalOvers = document.getElementById('tourTotalOvers');
                const tourTargetDisplay = document.getElementById('tourTargetDisplay');
                const tourTargetTop = document.getElementById('tourTargetTop');
                const tourBowlerName = document.getElementById('tourBowlerName');
                const tourBowlerFigures = document.getElementById('tourBowlerFigures');
                const tourOverTrackerMini = document.getElementById('tourOverTrackerMini');

                if (tourBattingTeamName) tourBattingTeamName.textContent = battingTeam || 'Team A';
                if (tourMatchTypeDisplay) tourMatchTypeDisplay.textContent = match.matchType || 'T20';

                // Show target at the top during 2nd innings
                if (tourTargetTop) {
                    if (match.innings === 2 && match.targetRuns) {
                        tourTargetTop.textContent = `🎯 Target: ${match.targetRuns} runs`;
                        tourTargetTop.style.color = 'var(--accent)';
                        tourTargetTop.style.display = 'block';
                    } else {
                        tourTargetTop.style.display = 'none';
                    }
                }

                const strikerName = match.striker || '—';
                const strikerStats = match.batsmenStats ? match.batsmenStats[strikerName] : null;
                const strikerRuns = strikerStats ? strikerStats.runs : 0;
                const strikerBalls = strikerStats ? strikerStats.balls : 0;
                if (tourBatsman1Name) tourBatsman1Name.textContent = strikerName;
                if (tourBatsman1Runs) tourBatsman1Runs.textContent = strikerRuns;
                if (tourBatsman1Balls) tourBatsman1Balls.textContent = `(${strikerBalls})`;

                const nonStrikerName = match.nonStriker || '—';
                const nonStrikerStats = match.batsmenStats ? match.batsmenStats[nonStrikerName] : null;
                const nonStrikerRuns = nonStrikerStats ? nonStrikerStats.runs : 0;
                const nonStrikerBalls = nonStrikerStats ? nonStrikerStats.balls : 0;
                if (tourBatsman2Name) tourBatsman2Name.textContent = nonStrikerName;
                if (tourBatsman2Runs) tourBatsman2Runs.textContent = nonStrikerRuns;
                if (tourBatsman2Balls) tourBatsman2Balls.textContent = `(${nonStrikerBalls})`;

                if (tourTotalScore) tourTotalScore.innerHTML = `${inn.runs} <small>/ ${inn.wickets}</small>`;
                if (tourTotalOvers) tourTotalOvers.textContent = `${totalOvers.toFixed(1)} ov`;

                // ===== TARGET DISPLAY =====
                if (tourTargetDisplay) {
                    if (match.status === 'completed' && match.matchWinner) {
                        tourTargetDisplay.textContent = `🏆 ${match.matchWinner} won by ${match.winMargin} ${match.winMarginType}`;
                        tourTargetDisplay.style.color = 'var(--success)';
                        tourTargetDisplay.style.fontWeight = '700';
                    } else if (match.innings === 2 && match.targetRuns) {
                        const target = match.targetRuns;
                        const runsNeeded = Math.max(0, target - inn.runs);
                        const ballsRemaining = match.targetBalls - (inn.balls + inn.overs * 6);
                        if (ballsRemaining >= 0 && runsNeeded > 0) {
                            tourTargetDisplay.textContent = `🔴 Need ${runsNeeded} runs in ${Math.max(0, ballsRemaining)} balls`;
                            tourTargetDisplay.style.color = runsNeeded <= 0 ? 'var(--success)' : 'var(--danger)';
                            tourTargetDisplay.style.fontWeight = '700';
                        } else if (runsNeeded <= 0) {
                            // Target achieved! Show result
                            const team1Score = match.score1.runs;
                            const team2Score = match.score2.runs;
                            let winner = '';
                            let margin = 0;
                            let marginType = '';
                            if (team2Score > team1Score) {
                                winner = match.team2;
                                margin = 10 - match.score2.wickets;
                                marginType = 'wickets';
                            } else if (team1Score > team2Score) {
                                winner = match.team1;
                                margin = team1Score - team2Score;
                                marginType = 'runs';
                            } else {
                                winner = 'Match Tied';
                            }
                            tourTargetDisplay.textContent = `🏆 ${winner} won by ${margin} ${marginType}`;
                            tourTargetDisplay.style.color = 'var(--success)';
                            tourTargetDisplay.style.fontWeight = '700';
                        } else {
                            tourTargetDisplay.textContent = `🎯 Target: ${target}`;
                            tourTargetDisplay.style.color = 'var(--text-secondary)';
                            tourTargetDisplay.style.fontWeight = '400';
                        }
                    } else if (match.innings === 1) {
                        tourTargetDisplay.textContent = `🏏 1st Innings - ${match.overs} overs`;
                        tourTargetDisplay.style.color = 'var(--text-secondary)';
                        tourTargetDisplay.style.fontWeight = '400';
                    } else {
                        tourTargetDisplay.textContent = '';
                    }
                }

                if (tourBowlerName) tourBowlerName.textContent = match.bowler || '—';
                if (tourBowlerFigures) {
                    const currentBowlerStats = match.bowlingStats ? match.bowlingStats[match.bowler] : null;
                    if (currentBowlerStats) {
                        const bowlerOvers = currentBowlerStats.overs || 0;
                        const bowlerRuns = currentBowlerStats.runs || 0;
                        const bowlerWkts = currentBowlerStats.wickets || 0;
                        const partialOvers = bowlerOvers + (match.ballsInCurrentOver / 10);
                        const figs = `${bowlerWkts}-${bowlerRuns} (${partialOvers.toFixed(1)})`;
                        tourBowlerFigures.textContent = figs;
                    } else {
                        tourBowlerFigures.textContent = '0-0 (0.0)';
                    }
                }

                if (tourOverTrackerMini) {
                    tourOverTrackerMini.innerHTML = '';
                    if (inn.overBallData.length === 0) {
                        tourOverTrackerMini.innerHTML =
                            '<span class="text-muted" style="font-size:12px;width:100%;text-align:center;">No balls</span>';
                    } else {
                        inn.overBallData.forEach((ball) => {
                            const div = document.createElement('div');
                            div.className = 'ball';
                            if (ball.type === 'run') {
                                const r = parseInt(ball.label);
                                if (r === 4) div.classList.add('four');
                                else if (r === 6) div.classList.add('six');
                                else div.classList.add('run');
                            } else if (ball.type === 'wicket') { div.classList.add('wicket'); } else if (ball
                                .type === 'extra') { div.classList.add('extra'); }
                            div.textContent = ball.label;
                            tourOverTrackerMini.appendChild(div);
                        });
                        const legalBalls = inn.overBallData.filter(b => b.type !== 'extra' || (b.sub !== 'wide' && b
                            .sub !== 'noball'));
                        for (let i = legalBalls.length; i < 6; i++) {
                            const div = document.createElement('div');
                            div.className = 'ball empty';
                            div.textContent = '•';
                            tourOverTrackerMini.appendChild(div);
                        }
                    }
                }
            }

            // ===== TOURNAMENT SCORING =====
            function recordTournamentBall(match, ballType, runs, isExtra = false, extraType = '') {
                if (!match) return;
                const inn = match.innings === 1 ? match.score1 : match.score2;
                if (!inn) return;

                // Save history snapshot
                if (!match.history) match.history = [];
                const snap = {
                    runs: inn.runs,
                    wickets: inn.wickets,
                    overs: inn.overs,
                    balls: inn.balls,
                    overBallData: [...inn.overBallData],
                    ballHistory: [...inn.ballHistory],
                    extras: inn.extras,
                    wideCount: inn.wideCount,
                    noBallCount: inn.noBallCount,
                    byeCount: inn.byeCount,
                    legByeCount: inn.legByeCount,
                    fours: inn.fours,
                    sixes: inn.sixes,
                    strikerRuns: inn.strikerRuns,
                    bowlerWickets: inn.bowlerWickets,
                    strikerBallsFaced: inn.strikerBallsFaced,
                    striker: match.striker,
                    nonStriker: match.nonStriker,
                    bowler: match.bowler,
                    bowlerOvers: match.bowlerOvers,
                    bowlerRuns: match.bowlerRuns,
                    bowlerWickets: match.bowlerWickets,
                    ballsInCurrentOver: match.ballsInCurrentOver,
                    batsmenStats: JSON.parse(JSON.stringify(match.batsmenStats || {})),
                    bowlingStats: JSON.parse(JSON.stringify(match.bowlingStats || {})),
                    status: match.status,
                    targetRuns: match.targetRuns,
                    targetBalls: match.targetBalls,
                };
                match.history.push(snap);

                if (!match.batsmenStats) match.batsmenStats = {};
                if (!match.bowlingStats) match.bowlingStats = {};

                let ballLabel = '';

                if (isExtra) {
                    if (extraType === 'wide') {
                        inn.extras += 1 + runs;
                        inn.wideCount += 1;
                        inn.ballHistory.push({ type: 'wide', runs: 1 + runs, label: 'WD' + (runs > 0 ? '+' + runs : '') });
                        ballLabel = 'WD' + (runs > 0 ? '+' + runs : '');
                        inn.overBallData.push({ label: ballLabel, type: 'extra', sub: 'wide' });
                        if (runs > 0) { inn.runs += runs; if (runs === 4) inn.fours += 1; if (runs === 6) inn.sixes += 1; }
                        match.bowlerRuns = (match.bowlerRuns || 0) + 1 + runs;
                        if (match.bowler && match.bowlingStats[match.bowler]) {
                            match.bowlingStats[match.bowler].runs += 1 + runs;
                        }
                    } else if (extraType === 'noball') {
                        inn.extras += 1 + runs;
                        inn.noBallCount += 1;
                        inn.ballHistory.push({ type: 'noball', runs: 1 + runs, label: 'NB' + (runs > 0 ? '+' + runs : '') });
                        ballLabel = 'NB' + (runs > 0 ? '+' + runs : '');
                        inn.overBallData.push({ label: ballLabel, type: 'extra', sub: 'noball' });
                        if (runs > 0) { inn.runs += runs; if (runs === 4) inn.fours += 1; if (runs === 6) inn.sixes += 1; }
                        match.bowlerRuns = (match.bowlerRuns || 0) + 1 + runs;
                        if (match.bowler && match.bowlingStats[match.bowler]) {
                            match.bowlingStats[match.bowler].runs += 1 + runs;
                        }
                    } else if (extraType === 'bye') {
                        inn.extras += runs;
                        inn.byeCount += 1;
                        inn.ballHistory.push({ type: 'bye', runs: runs, label: 'B' + runs });
                        ballLabel = 'B' + runs;
                        inn.overBallData.push({ label: ballLabel, type: 'extra', sub: 'bye' });
                        inn.runs += runs;
                        inn.balls += 1;
                        inn.strikerBallsFaced += 1;
                    } else if (extraType === 'legbye') {
                        inn.extras += runs;
                        inn.legByeCount += 1;
                        inn.ballHistory.push({ type: 'legbye', runs: runs, label: 'LB' + runs });
                        ballLabel = 'LB' + runs;
                        inn.overBallData.push({ label: ballLabel, type: 'extra', sub: 'legbye' });
                        inn.runs += runs;
                        inn.balls += 1;
                        inn.strikerBallsFaced += 1;
                    }
                } else {
                    inn.runs += runs;
                    inn.ballHistory.push({ type: 'run', runs: runs, label: '' + runs });
                    ballLabel = '' + runs;
                    inn.overBallData.push({ label: ballLabel, type: 'run' });
                    inn.balls += 1;
                    inn.strikerBallsFaced += 1;
                    if (runs === 4) inn.fours += 1;
                    if (runs === 6) inn.sixes += 1;
                    if (match.striker) {
                        if (!match.batsmenStats[match.striker]) match.batsmenStats[match.striker] = { runs: 0, balls: 0 };
                        match.batsmenStats[match.striker].runs += runs;
                        match.batsmenStats[match.striker].balls += 1;
                        if (runs === 4) match.batsmenStats[match.striker].fours = (match.batsmenStats[match.striker]
                            .fours || 0) + 1;
                        if (runs === 6) match.batsmenStats[match.striker].sixes = (match.batsmenStats[match.striker]
                            .sixes || 0) + 1;
                        match.batsmenStats[match.striker].isOut = false;
                    }
                    inn.strikerRuns = match.batsmenStats[match.striker]?.runs || 0;
                    match.bowlerRuns = (match.bowlerRuns || 0) + runs;
                    if (match.bowler && match.bowlingStats[match.bowler]) {
                        match.bowlingStats[match.bowler].runs += runs;
                    }
                }

                const isLegal = !isExtra || (extraType !== 'wide' && extraType !== 'noball');
                if (isLegal && runs % 2 === 1) {
                    const temp = match.striker;
                    match.striker = match.nonStriker;
                    match.nonStriker = temp;
                }

                // ===== CHECK IF TARGET ACHIEVED (2nd innings only) =====
                if (match.innings === 2 && match.targetRuns) {
                    if (inn.runs >= match.targetRuns) {
                        // Target achieved! Match over.
                        const team1Score = match.score1.runs;
                        const team2Score = match.score2.runs;
                        let winner = '';
                        let margin = 0;
                        let marginType = '';
                        if (team2Score > team1Score) {
                            winner = match.team2;
                            margin = 10 - match.score2.wickets;
                            marginType = 'wickets';
                            match.mvp = match.team2 + ' batsman';
                        } else if (team1Score > team2Score) {
                            winner = match.team1;
                            margin = team1Score - team2Score;
                            marginType = 'runs';
                            match.mvp = match.team1 + ' batsman';
                        } else {
                            winner = 'Match Tied';
                            margin = 0;
                            marginType = '';
                            match.mvp = 'No MVP';
                        }
                        match.winner = winner;
                        match.matchWinner = winner;
                        match.winMargin = margin;
                        match.winMarginType = marginType;
                        match.status = 'completed';

                        // Mark current batsmen as not out
                        if (match.striker && match.batsmenStats[match.striker]) {
                            match.batsmenStats[match.striker].isOut = false;
                        }
                        if (match.nonStriker && match.batsmenStats[match.nonStriker]) {
                            match.batsmenStats[match.nonStriker].isOut = false;
                        }

                        saveState();
                        updateTournamentLiveUI(match);
                        showMatchCompleteModal(winner, margin, marginType);
                        renderMatchList();
                        renderTournaments();
                        // Switch to summary
                        document.getElementById('tabSummaryBtn').click();
                        return;
                    }
                }

                const legalBalls = inn.overBallData.filter(b => b.type !== 'extra' || (b.sub !== 'wide' && b.sub !==
                    'noball'));
                if (legalBalls.length >= 6) {
                    inn.overs += 1;
                    inn.balls = 0;
                    inn.overBallData = [];
                    match.bowlerOvers = (match.bowlerOvers || 0) + 1;
                    match.ballsInCurrentOver = 0;
                    if (match.bowler && match.bowlingStats[match.bowler]) {
                        match.bowlingStats[match.bowler].overs = (match.bowlingStats[match.bowler].overs || 0) + 1;
                    }
                    const temp = match.striker;
                    match.striker = match.nonStriker;
                    match.nonStriker = temp;
                    showBowlerChangeModal(match);
                    if (inn.overs >= match.overs) {
                        if (match.innings === 1) {
                            const target = inn.runs + 1;
                            match.targetRuns = target;
                            match.targetBalls = match.overs * 6;
                            // Update target display
                            const targetDisplay = document.getElementById('tourTargetDisplay');
                            if (targetDisplay) {
                                targetDisplay.textContent = `🎯 Target: ${target} runs in ${match.overs} overs (${match.overs * 6} balls)`;
                                targetDisplay.style.color = 'var(--accent)';
                                targetDisplay.style.fontWeight = '700';
                            }
                            // Show target at top
                            const targetTop = document.getElementById('tourTargetTop');
                            if (targetTop) {
                                targetTop.textContent = `🎯 Target: ${target} runs`;
                                targetTop.style.color = 'var(--accent)';
                                targetTop.style.display = 'block';
                            }
                            showSecondInningsModal(match);
                        } else {
                            // Second innings ended without achieving target (all out or overs finished)
                            const team1Score = match.score1.runs;
                            const team2Score = match.score2.runs;
                            let winner = '';
                            let margin = 0;
                            let marginType = '';
                            if (team1Score > team2Score) {
                                winner = match.team1;
                                margin = team1Score - team2Score;
                                marginType = 'runs';
                                match.mvp = match.team1 + ' batsman';
                            } else if (team2Score > team1Score) {
                                winner = match.team2;
                                margin = team2Score - team1Score;
                                const wicketsLost = match.score2.wickets;
                                if (wicketsLost < 10) {
                                    marginType = 'wickets';
                                    margin = 10 - wicketsLost;
                                } else {
                                    marginType = 'runs';
                                }
                                match.mvp = match.team2 + ' batsman';
                            } else {
                                winner = 'Match Tied';
                                margin = 0;
                                marginType = '';
                                match.mvp = 'No MVP';
                            }
                            match.winner = winner;
                            match.matchWinner = winner;
                            match.winMargin = margin;
                            match.winMarginType = marginType;
                            match.status = 'completed';
                            saveState();
                            updateTournamentLiveUI(match);
                            if (winner !== 'Match Tied') {
                                showMatchCompleteModal(winner, margin, marginType);
                            } else {
                                showMatchCompleteModal('Match Tied', 0, '');
                            }
                            renderMatchList();
                            renderTournaments();
                        }
                        saveState();
                        updateTournamentLiveUI(match);
                        renderMatchSummary(match);
                        return;
                    }
                } else {
                    match.ballsInCurrentOver = (match.ballsInCurrentOver || 0) + 1;
                }

                if (match.striker && match.batsmenStats[match.striker]) {
                    inn.strikerRuns = match.batsmenStats[match.striker].runs;
                } else {
                    inn.strikerRuns = 0;
                }

                saveState();
                updateTournamentLiveUI(match);
                if (document.getElementById('tabScorecard').classList.contains('active')) {
                    updateScorecard(match);
                }
                if (document.getElementById('tabStream').classList.contains('active')) {
                    updateStreamView();
                }
                if (document.getElementById('tabSummary').classList.contains('active')) {
                    renderMatchSummary(match);
                }
            }

            // ===== TOURNAMENT CONTROLLER EVENT LISTENERS =====
            function initTournamentControllers() {
                document.querySelectorAll('[data-tour-runs]').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const runs = parseInt(this.dataset.tourRuns);
                        const match = getMatch(state.currentMatchId);
                        if (!match) { showToast('Match not found.', 'error'); return; }
                        if (match.status === 'completed') {
                            showToast('Match is already completed.', 'error');
                            return;
                        }
                        const inn = match.innings === 1 ? match.score1 : match.score2;
                        if (!inn) return;
                        const legalBalls = inn.overBallData.filter(b => b.type !== 'extra' || (b.sub !== 'wide' && b
                            .sub !== 'noball'));
                        if (legalBalls.length >= 6) { showToast('⛔ Over complete! End the over first.',
                            'error'); return; }
                        recordTournamentBall(match, 'run', runs, false, '');
                    });
                });

                document.querySelectorAll('[data-tour-extra]').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const type = this.dataset.tourExtra;
                        const runs = prompt(`Enter runs for ${type}:`, '0');
                        if (runs === null) return;
                        const r = parseInt(runs) || 0;
                        if (r < 0) { showToast('Invalid runs', 'error'); return; }
                        const match = getMatch(state.currentMatchId);
                        if (!match) return;
                        if (match.status === 'completed') {
                            showToast('Match is already completed.', 'error');
                            return;
                        }
                        recordTournamentBall(match, type, r, true, type);
                    });
                });

                const tourWicketBtn = document.getElementById('tourWicketBtn');
                if (tourWicketBtn) {
                    tourWicketBtn.addEventListener('click', function() {
                        const match = getMatch(state.currentMatchId);
                        if (!match) { showToast('Match not found.', 'error'); return; }
                        if (match.status === 'completed') {
                            showToast('Match is already completed.', 'error');
                            return;
                        }
                        const inn = match.innings === 1 ? match.score1 : match.score2;
                        if (!inn) return;
                        if (inn.wickets >= 10) { showToast('⛔ All out! No more wickets.', 'error'); return; }

                        if (!match.history) match.history = [];
                        const snap = {
                            runs: inn.runs,
                            wickets: inn.wickets,
                            overs: inn.overs,
                            balls: inn.balls,
                            overBallData: [...inn.overBallData],
                            ballHistory: [...inn.ballHistory],
                            extras: inn.extras,
                            wideCount: inn.wideCount,
                            noBallCount: inn.noBallCount,
                            byeCount: inn.byeCount,
                            legByeCount: inn.legByeCount,
                            fours: inn.fours,
                            sixes: inn.sixes,
                            strikerRuns: inn.strikerRuns,
                            bowlerWickets: inn.bowlerWickets,
                            strikerBallsFaced: inn.strikerBallsFaced,
                            striker: match.striker,
                            nonStriker: match.nonStriker,
                            bowler: match.bowler,
                            bowlerOvers: match.bowlerOvers,
                            bowlerRuns: match.bowlerRuns,
                            bowlerWickets: match.bowlerWickets,
                            ballsInCurrentOver: match.ballsInCurrentOver,
                            batsmenStats: JSON.parse(JSON.stringify(match.batsmenStats || {})),
                            bowlingStats: JSON.parse(JSON.stringify(match.bowlingStats || {})),
                            status: match.status,
                            targetRuns: match.targetRuns,
                            targetBalls: match.targetBalls,
                        };
                        match.history.push(snap);

                        inn.wickets += 1;
                        inn.bowlerWickets += 1;
                        match.bowlerWickets = (match.bowlerWickets || 0) + 1;
                        if (match.bowler && match.bowlingStats[match.bowler]) {
                            match.bowlingStats[match.bowler].wickets = (match.bowlingStats[match.bowler].wickets ||
                                0) + 1;
                        }
                        inn.balls += 1;
                        inn.strikerBallsFaced += 1;
                        inn.ballHistory.push({ type: 'wicket', label: 'W' });
                        inn.overBallData.push({ label: 'W', type: 'wicket' });

                        if (match.striker && match.batsmenStats[match.striker]) {
                            match.batsmenStats[match.striker].isOut = true;
                        }

                        if (inn.wickets >= 10) {
                            showToast('🪓 All out! Innings over.', 'error');
                            if (match.innings === 1) {
                                const target = inn.runs + 1;
                                match.targetRuns = target;
                                match.targetBalls = match.overs * 6;
                                const targetDisplay = document.getElementById('tourTargetDisplay');
                                if (targetDisplay) {
                                    targetDisplay.textContent =
                                        `🎯 Target: ${target} runs in ${match.overs} overs (${match.overs * 6} balls)`;
                                    targetDisplay.style.color = 'var(--accent)';
                                    targetDisplay.style.fontWeight = '700';
                                }
                                const targetTop = document.getElementById('tourTargetTop');
                                if (targetTop) {
                                    targetTop.textContent = `🎯 Target: ${target} runs`;
                                    targetTop.style.color = 'var(--accent)';
                                    targetTop.style.display = 'block';
                                }
                                showSecondInningsModal(match);
                            } else {
                                const team1Score = match.score1.runs;
                                const team2Score = match.score2.runs;
                                let winner = '';
                                let margin = 0;
                                let marginType = '';
                                if (team1Score > team2Score) {
                                    winner = match.team1;
                                    margin = team1Score - team2Score;
                                    marginType = 'runs';
                                    match.mvp = match.team1 + ' batsman';
                                } else if (team2Score > team1Score) {
                                    winner = match.team2;
                                    margin = team2Score - team1Score;
                                    const wicketsLost = match.score2.wickets;
                                    if (wicketsLost < 10) {
                                        marginType = 'wickets';
                                        margin = 10 - wicketsLost;
                                    } else {
                                        marginType = 'runs';
                                    }
                                    match.mvp = match.team2 + ' batsman';
                                } else {
                                    winner = 'Match Tied';
                                    margin = 0;
                                    marginType = '';
                                    match.mvp = 'No MVP';
                                }
                                match.winner = winner;
                                match.matchWinner = winner;
                                match.winMargin = margin;
                                match.winMarginType = marginType;
                                match.status = 'completed';
                                saveState();
                                updateTournamentLiveUI(match);
                                if (winner !== 'Match Tied') {
                                    showMatchCompleteModal(winner, margin, marginType);
                                } else {
                                    showMatchCompleteModal('Match Tied', 0, '');
                                }
                                renderMatchList();
                                renderTournaments();
                            }
                        } else {
                            const newBatsman = prompt('Enter new batsman name:');
                            if (newBatsman && newBatsman.trim()) {
                                match.striker = newBatsman.trim();
                                if (!match.batsmenStats) match.batsmenStats = {};
                                if (!match.batsmenStats[newBatsman]) match.batsmenStats[newBatsman] = { runs: 0,
                                    balls: 0 };
                                match.batsmenStats[newBatsman].isOut = false;
                                saveState();
                                updateTournamentLiveUI(match);
                                showToast(`🔄 New batsman: ${match.striker}`, 'info');
                            }
                        }
                        saveState();
                        updateTournamentLiveUI(match);
                        if (document.getElementById('tabScorecard').classList.contains('active')) {
                            updateScorecard(match);
                        }
                        if (document.getElementById('tabStream').classList.contains('active')) {
                            updateStreamView();
                        }
                        if (document.getElementById('tabSummary').classList.contains('active')) {
                            renderMatchSummary(match);
                        }
                    });
                }

                const tourEndOverBtn = document.getElementById('tourEndOverBtn');
                if (tourEndOverBtn) {
                    tourEndOverBtn.addEventListener('click', function() {
                        const match = getMatch(state.currentMatchId);
                        if (!match) return;
                        if (match.status === 'completed') {
                            showToast('Match is already completed.', 'error');
                            return;
                        }
                        const inn = match.innings === 1 ? match.score1 : match.score2;
                        if (!inn) return;
                        if (inn.overBallData.length === 0) { showToast('No balls in this over yet.',
                            'info'); return; }
                        inn.overs += 1;
                        inn.balls = 0;
                        inn.overBallData = [];
                        match.bowlerOvers = (match.bowlerOvers || 0) + 1;
                        match.ballsInCurrentOver = 0;
                        if (match.bowler && match.bowlingStats[match.bowler]) {
                            match.bowlingStats[match.bowler].overs = (match.bowlingStats[match.bowler].overs || 0) +
                            1;
                        }
                        const temp = match.striker;
                        match.striker = match.nonStriker;
                        match.nonStriker = temp;
                        showBowlerChangeModal(match);
                        if (inn.overs >= match.overs) {
                            if (match.innings === 1) {
                                const target = inn.runs + 1;
                                match.targetRuns = target;
                                match.targetBalls = match.overs * 6;
                                const targetDisplay = document.getElementById('tourTargetDisplay');
                                if (targetDisplay) {
                                    targetDisplay.textContent =
                                        `🎯 Target: ${target} runs in ${match.overs} overs (${match.overs * 6} balls)`;
                                    targetDisplay.style.color = 'var(--accent)';
                                    targetDisplay.style.fontWeight = '700';
                                }
                                const targetTop = document.getElementById('tourTargetTop');
                                if (targetTop) {
                                    targetTop.textContent = `🎯 Target: ${target} runs`;
                                    targetTop.style.color = 'var(--accent)';
                                    targetTop.style.display = 'block';
                                }
                                showSecondInningsModal(match);
                            } else {
                                const team1Score = match.score1.runs;
                                const team2Score = match.score2.runs;
                                let winner = '';
                                let margin = 0;
                                let marginType = '';
                                if (team1Score > team2Score) {
                                    winner = match.team1;
                                    margin = team1Score - team2Score;
                                    marginType = 'runs';
                                    match.mvp = match.team1 + ' batsman';
                                } else if (team2Score > team1Score) {
                                    winner = match.team2;
                                    margin = team2Score - team1Score;
                                    const wicketsLost = match.score2.wickets;
                                    if (wicketsLost < 10) {
                                        marginType = 'wickets';
                                        margin = 10 - wicketsLost;
                                    } else {
                                        marginType = 'runs';
                                    }
                                    match.mvp = match.team2 + ' batsman';
                                } else {
                                    winner = 'Match Tied';
                                    margin = 0;
                                    marginType = '';
                                    match.mvp = 'No MVP';
                                }
                                match.winner = winner;
                                match.matchWinner = winner;
                                match.winMargin = margin;
                                match.winMarginType = marginType;
                                match.status = 'completed';
                                saveState();
                                updateTournamentLiveUI(match);
                                if (winner !== 'Match Tied') {
                                    showMatchCompleteModal(winner, margin, marginType);
                                } else {
                                    showMatchCompleteModal('Match Tied', 0, '');
                                }
                                renderMatchList();
                                renderTournaments();
                            }
                        }
                        saveState();
                        updateTournamentLiveUI(match);
                        if (document.getElementById('tabScorecard').classList.contains('active')) {
                            updateScorecard(match);
                        }
                        if (document.getElementById('tabStream').classList.contains('active')) {
                            updateStreamView();
                        }
                        if (document.getElementById('tabSummary').classList.contains('active')) {
                            renderMatchSummary(match);
                        }
                    });
                }

                document.getElementById('tourCtrlSwapBatter')?.addEventListener('click', function() {
                    const match = getMatch(state.currentMatchId);
                    if (!match) return;
                    if (match.status === 'completed') {
                        showToast('Match is already completed.', 'error');
                        return;
                    }
                    const temp = match.striker;
                    match.striker = match.nonStriker;
                    match.nonStriker = temp;
                    saveState();
                    updateTournamentLiveUI(match);
                    showToast('🔄 Batter swapped', 'info');
                });

                document.getElementById('tourCtrlRetireBatter')?.addEventListener('click', function() {
                    const match = getMatch(state.currentMatchId);
                    if (!match) return;
                    if (match.status === 'completed') {
                        showToast('Match is already completed.', 'error');
                        return;
                    }
                    const temp = match.striker;
                    match.striker = match.nonStriker;
                    match.nonStriker = temp + ' (retired)';
                    saveState();
                    updateTournamentLiveUI(match);
                    showToast('🚶 Batter retired.', 'info');
                });

                document.getElementById('tourCtrlChangeBowler')?.addEventListener('click', function() {
                    const match = getMatch(state.currentMatchId);
                    if (!match) return;
                    if (match.status === 'completed') {
                        showToast('Match is already completed.', 'error');
                        return;
                    }
                    const newBowler = prompt('Enter new bowler name:', match.bowler);
                    if (newBowler && newBowler.trim()) {
                        match.bowler = newBowler.trim();
                        match.bowlerOvers = 0;
                        match.bowlerRuns = 0;
                        match.bowlerWickets = 0;
                        match.ballsInCurrentOver = 0;
                        if (!match.bowlingStats) match.bowlingStats = {};
                        if (!match.bowlingStats[newBowler]) match.bowlingStats[newBowler] = { overs: 0,
                            maidens: 0, runs: 0, wickets: 0 };
                        saveState();
                        updateTournamentLiveUI(match);
                        showToast(`🔄 Bowler changed to ${match.bowler}`, 'info');
                    }
                });

                document.getElementById('tourCtrlUndo')?.addEventListener('click', function() {
                    window.undoLastBall();
                });

                document.getElementById('tourCtrlDefault')?.addEventListener('click', () => showToast(
                    'Default view selected.', 'info'));
                document.getElementById('tourCtrlMiniScore')?.addEventListener('click', () => showToast(
                    'Mini-Score toggled.', 'info'));
                document.getElementById('tourCtrlTourName')?.addEventListener('click', () => showToast(
                    'Tour Name set.', 'info'));
                document.getElementById('tourCtrlB1')?.addEventListener('click', () => showToast('B1 view.',
                    'info'));
                document.getElementById('tourCtrlB2')?.addEventListener('click', () => showToast('B2 view.',
                    'info'));
                document.getElementById('tourCtrlBowler')?.addEventListener('click', () => showToast(
                    'Bowler view.', 'info'));
                document.getElementById('tourCtrlBatting')?.addEventListener('click', () => showToast(
                    'Batting view.', 'info'));
                document.getElementById('tourCtrlBowling')?.addEventListener('click', () => showToast(
                    'Bowling view.', 'info'));
                document.getElementById('tourCtrlPP')?.addEventListener('click', () => showToast('PP+ toggled.',
                    'info'));
                document.getElementById('tourCtrlEndInning')?.addEventListener('click', function() {
                    const match = getMatch(state.currentMatchId);
                    if (!match) return;
                    if (match.status === 'completed') {
                        showToast('Match is already completed.', 'error');
                        return;
                    }
                    if (match.innings === 1) {
                        const target = match.score1.runs + 1;
                        match.targetRuns = target;
                        match.targetBalls = match.overs * 6;
                        const targetDisplay = document.getElementById('tourTargetDisplay');
                        if (targetDisplay) {
                            targetDisplay.textContent =
                                `🎯 Target: ${target} runs in ${match.overs} overs (${match.overs * 6} balls)`;
                            targetDisplay.style.color = 'var(--accent)';
                            targetDisplay.style.fontWeight = '700';
                        }
                        const targetTop = document.getElementById('tourTargetTop');
                        if (targetTop) {
                            targetTop.textContent = `🎯 Target: ${target} runs`;
                            targetTop.style.color = 'var(--accent)';
                            targetTop.style.display = 'block';
                        }
                        showSecondInningsModal(match);
                    } else {
                        const team1Score = match.score1.runs;
                        const team2Score = match.score2.runs;
                        let winner = '';
                        let margin = 0;
                        let marginType = '';
                        if (team1Score > team2Score) {
                            winner = match.team1;
                            margin = team1Score - team2Score;
                            marginType = 'runs';
                            match.mvp = match.team1 + ' batsman';
                        } else if (team2Score > team1Score) {
                            winner = match.team2;
                            margin = team2Score - team1Score;
                            const wicketsLost = match.score2.wickets;
                            if (wicketsLost < 10) {
                                marginType = 'wickets';
                                margin = 10 - wicketsLost;
                            } else {
                                marginType = 'runs';
                            }
                            match.mvp = match.team2 + ' batsman';
                        } else {
                            winner = 'Match Tied';
                            margin = 0;
                            marginType = '';
                            match.mvp = 'No MVP';
                        }
                        match.winner = winner;
                        match.matchWinner = winner;
                        match.winMargin = margin;
                        match.winMarginType = marginType;
                        match.status = 'completed';
                        saveState();
                        updateTournamentLiveUI(match);
                        if (winner !== 'Match Tied') {
                            showMatchCompleteModal(winner, margin, marginType);
                        } else {
                            showMatchCompleteModal('Match Tied', 0, '');
                        }
                        renderMatchList();
                        renderTournaments();
                    }
                });
            }

            document.getElementById('openFullScorerBtn')?.addEventListener('click', function() {
                const match = getMatch(state.currentMatchId);
                if (!match) { showToast('⚠️ Please select a match first.', 'error'); return; }
                launchFullScorer(match);
            });

            // ===== BACK TO MATCH LIST =====
            document.getElementById('backToMatchListBtn')?.addEventListener('click', function() {
                const detailView = document.getElementById('matchDetailView');
                const listContainer = document.getElementById('matchListContainer');
                const setupForm = document.getElementById('matchSetupForm');
                if (detailView) detailView.classList.add('hidden');
                if (listContainer) listContainer.classList.remove('hidden');
                if (setupForm) setupForm.classList.remove('hidden');
                state.currentMatchId = null;
                renderMatchList();
                const confirmBtn = document.getElementById('startMatchConfirmBtn');
                if (confirmBtn && confirmBtn._origOnClick) {
                    confirmBtn.onclick = confirmBtn._origOnClick;
                }
            });

            // ===== UPDATE UI FUNCTIONS =====
            function updateAllViews() {
                if (state.currentMatchId) {
                    const match = getMatch(state.currentMatchId);
                    if (match) {
                        updateTournamentLiveUI(match);
                        updateScorecard(match);
                        updateStreamView();
                        renderMatchSummary(match);
                    }
                }
                const storageEl = document.getElementById('storageCount');
                if (storageEl) {
                    const used = Math.min(554 + state.ballHistory.length * 2 + state.matches.length * 5 + state
                        .tournaments.length * 3 + state.teamAXI.length + state.teamBXI.length + state.users.length *
                        2, 10000);
                    storageEl.textContent = used;
                }
                renderXI();
                populateTournamentDropdown();
            }

            // ===== COPY STREAM URL =====
            document.getElementById('copyStreamUrl')?.addEventListener('click', function() {
                let matchId = state.currentMatchId;
                if (!matchId && state.isMatchSetup) {
                    matchId = 'live';
                }
                if (!matchId) {
                    showToast('⚠️ No active match to share.', 'error');
                    return;
                }
                state.lastMatchId = matchId;
                localStorage.setItem('brklive19_last_match_id', matchId);
                saveState();
                const url = window.location.href.split('?')[0] + '#tournament';
                navigator.clipboard.writeText(url).then(() => showToast('📋 URL copied to clipboard!', 'success'))
                    .catch(() => {
                        const input = document.createElement('input');
                        input.value = url;
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand('copy');
                        document.body.removeChild(input);
                        showToast('📋 URL copied!', 'success');
                    });
            });

            document.getElementById('fullscreenView')?.addEventListener('click', function() {
                const el = document.getElementById('streamScoreboard');
                if (el) {
                    if (el.requestFullscreen) el.requestFullscreen();
                    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                    else showToast('Fullscreen not supported', 'error');
                }
            });

            document.getElementById('refreshScoreboard')?.addEventListener('click', function() {
                updateStreamView();
                showToast('🔄 Scoreboard refreshed', 'info');
            });

            // ===== HEADER LINKS =====
            document.getElementById('scoreboardLinksLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('📋 Scoreboard Links: /tournament', 'info');
            });
            document.getElementById('howToUseLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('❓ How To Use: Create Tournament -> Setup Match -> Start Scoring', 'info');
            });
            document.getElementById('otherSportsLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('⚽ Other Sports: Football, Basketball coming soon!', 'info');
            });

            // ===== INIT =====
            renderTournaments();
            renderMatchList();
            populateTournamentDropdown();
            renderXI();
            updateAllViews();
            showToast('🏏 Welcome to BRKLIVE19!', 'info');

            initTournamentControllers();

            setInterval(() => {
                if (document.querySelector('#page-tournament.active')) {
                    const match = getMatch(state.currentMatchId);
                    if (match && !document.getElementById('matchDetailView').classList.contains('hidden')) {
                        updateTournamentLiveUI(match);
                        if (document.getElementById('tabScorecard').classList.contains('active')) {
                            updateScorecard(match);
                        }
                        if (document.getElementById('tabStream').classList.contains('active')) {
                            updateStreamView();
                        }
                        if (document.getElementById('tabSummary').classList.contains('active')) {
                            renderMatchSummary(match);
                        }
                    }
                }
            }, 2000);

            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.replace('#', '');
                if (hash && pages[hash]) navigate(hash);
            });
            if (window.location.hash) {
                const hash = window.location.hash.replace('#', '');
                if (hash && pages[hash]) navigate(hash);
            }

            window.openMatchDetail = window.openMatchDetail;
            window.deleteMatch = window.deleteMatch;
            window.deleteTournament = window.deleteTournament;
            window.undoLastBall = window.undoLastBall;

        })();
