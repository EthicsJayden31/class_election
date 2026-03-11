const state = {
  title: '학급 회장 선거',
  candidates: [],
  votes: new Map(),
  selectedCandidate: null,
  totalVotes: 0,
};

const $ = (id) => document.getElementById(id);

const setupScreen = $('setup-screen');
const voteScreen = $('vote-screen');
const resultScreen = $('result-screen');
const candidateGrid = $('candidate-grid');
const rankingList = $('ranking-list');
const dramaticStage = $('dramatic-stage');

function switchScreen(target) {
  [setupScreen, voteScreen, resultScreen].forEach((el) => el.classList.remove('active'));
  target.classList.add('active');
}

function parseCandidates(rawText) {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderCandidates() {
  candidateGrid.innerHTML = '';

  state.candidates.forEach((name) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'candidate-card';
    button.textContent = name;

    button.addEventListener('click', () => {
      state.selectedCandidate = name;
      [...candidateGrid.children].forEach((child) => child.classList.remove('selected'));
      button.classList.add('selected');

      const ok = confirm(`"${name}" 에게 1표를 투표할까요?`);
      if (!ok) return;

      state.votes.set(name, (state.votes.get(name) || 0) + 1);
      state.totalVotes += 1;
      $('vote-count').textContent = state.totalVotes;
      playVoteSound();

      state.selectedCandidate = null;
      [...candidateGrid.children].forEach((child) => child.classList.remove('selected'));
    });

    candidateGrid.appendChild(button);
  });
}

function playVoteSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 523.25;
  gain.gain.value = 0.05;

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

function startElection() {
  const title = $('election-title').value.trim() || '학급 회장 선거';
  const candidates = parseCandidates($('candidate-input').value);

  if (candidates.length < 2) {
    alert('후보를 2명 이상 입력해 주세요.');
    return;
  }

  state.title = title;
  state.candidates = candidates;
  state.votes = new Map(candidates.map((name) => [name, 0]));
  state.totalVotes = 0;
  $('vote-count').textContent = '0';

  $('vote-title').textContent = title;
  $('result-title').textContent = `${title} 결과 발표`;

  renderCandidates();
  switchScreen(voteScreen);
}

function resetSelection() {
  state.selectedCandidate = null;
  [...candidateGrid.children].forEach((child) => child.classList.remove('selected'));
}

function sortedResults() {
  return [...state.votes.entries()].sort((a, b) => b[1] - a[1]);
}

function revealResults(results) {
  rankingList.innerHTML = '';
  results.forEach(([name, votes], index) => {
    const item = document.createElement('article');
    item.className = 'ranking-item';

    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-etc';

    item.innerHTML = `
      <div class="rank-badge ${rankClass}">${index + 1}</div>
      <strong>${name}</strong>
      <span>${votes}표</span>
    `;

    rankingList.appendChild(item);
    setTimeout(() => item.classList.add('reveal'), index * 400);
  });
}

async function startDramaticReveal() {
  dramaticStage.classList.remove('hidden');
  rankingList.innerHTML = '';

  for (let i = 3; i > 0; i -= 1) {
    $('countdown').textContent = i;
    playCountdownSound(240 + i * 110);
    await new Promise((resolve) => setTimeout(resolve, 850));
  }

  $('countdown').textContent = '결과 공개!';
  playCountdownSound(840);
  await new Promise((resolve) => setTimeout(resolve, 900));
  dramaticStage.classList.add('hidden');

  revealResults(sortedResults());
}

function playCountdownSound(freq) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  gain.gain.value = 0.06;

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

async function finishElection() {
  if (state.totalVotes === 0) {
    const proceed = confirm('아직 투표가 없습니다. 결과 화면으로 이동할까요?');
    if (!proceed) return;
  }

  $('result-subtitle').textContent = `총 ${state.totalVotes}표 집계 완료`;
  switchScreen(resultScreen);
  await startDramaticReveal();
}

$('start-vote').addEventListener('click', startElection);
$('reset-current').addEventListener('click', resetSelection);
$('finish-vote').addEventListener('click', finishElection);
$('new-election').addEventListener('click', () => switchScreen(setupScreen));
