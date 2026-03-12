const state = {
  title: '학급 회장 선거',
  candidates: [],
  votes: new Map(),
  selectedCandidate: null,
  totalVotes: 0,
};

const pastelClasses = ['pastel-1', 'pastel-2', 'pastel-3', 'pastel-4', 'pastel-5', 'pastel-6'];
const fanfareSourceUrl =
  'https://store.soundeffectgenerator.org/instants/fanfare-sound-effect/5cffd6a0-item-fanfare.mp3';
const $ = (id) => document.getElementById(id);

const setupScreen = $('setup-screen');
const voteScreen = $('vote-screen');
const resultScreen = $('result-screen');
const candidateGrid = $('candidate-grid');
const rankingList = $('ranking-list');
const dramaticStage = $('dramatic-stage');
const candidateCountInput = $('candidate-count');
const candidateFields = $('candidate-fields');
const voteToastOverlay = $('vote-toast-overlay');
const voteToast = $('vote-toast');
const finishModal = $('finish-modal');
const confirmVoteBtn = $('confirm-vote');

let toastTimer = null;

function switchScreen(target) {
  [setupScreen, voteScreen, resultScreen].forEach((el) => el.classList.remove('active'));
  target.classList.add('active');
}

function updateConfirmButtonState() {
  confirmVoteBtn.disabled = !state.selectedCandidate;
}

function makeCandidateFields() {
  const count = Math.min(12, Math.max(2, Number(candidateCountInput.value) || 2));
  candidateCountInput.value = count;
  candidateFields.innerHTML = '';

  for (let i = 1; i <= count; i += 1) {
    const row = document.createElement('label');
    row.className = 'candidate-field';

    const caption = document.createElement('span');
    caption.textContent = `항목 ${i}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `항목 ${i} 이름 입력`;
    input.value = `${i}번 후보`;

    row.appendChild(caption);
    row.appendChild(input);
    candidateFields.appendChild(row);
  }
}

function getCandidatesFromFields() {
  const inputs = candidateFields.querySelectorAll('input');
  return [...inputs].map((input) => input.value.trim()).filter(Boolean);
}

function updateSelectedDisplay() {
  $('selected-display').textContent = `현재 선택: ${state.selectedCandidate || '없음'}`;
}

function hideVoteToast() {
  voteToast.classList.remove('show');
  voteToastOverlay.classList.remove('show');
  clearTimeout(toastTimer);
}

function showVoteToast() {
  voteToastOverlay.classList.add('show');
  voteToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideVoteToast, 3000);
}

function renderCandidates() {
  candidateGrid.innerHTML = '';

  state.candidates.forEach((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `candidate-card ${pastelClasses[index % pastelClasses.length]}`;
    button.textContent = name;

    button.addEventListener('click', () => {
      state.selectedCandidate = name;
      [...candidateGrid.children].forEach((child) => child.classList.remove('selected'));
      button.classList.add('selected');
      updateSelectedDisplay();
      updateConfirmButtonState();
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

function playFanfareSound() {
  const audio = new Audio(fanfareSourceUrl);
  audio.volume = 0.8;
  audio.play().catch(() => {
    playCountdownSound(880);
  });
}

function startElection() {
  const title = $('election-title').value.trim() || '학급 회장 선거';
  const candidates = getCandidatesFromFields();

  if (candidates.length < 2) {
    alert('항목을 2개 이상 입력해 주세요.');
    return;
  }

  state.title = title;
  state.candidates = candidates;
  state.votes = new Map(candidates.map((name) => [name, 0]));
  state.totalVotes = 0;
  state.selectedCandidate = null;

  $('vote-count').textContent = '0';
  $('vote-title').textContent = title;
  $('result-title').textContent = `${title} 결과 발표`;
  updateSelectedDisplay();
  updateConfirmButtonState();

  renderCandidates();
  switchScreen(voteScreen);
}

function confirmVote() {
  if (!state.selectedCandidate) return;

  const target = state.selectedCandidate;
  state.votes.set(target, (state.votes.get(target) || 0) + 1);
  state.totalVotes += 1;
  $('vote-count').textContent = state.totalVotes;
  playVoteSound();
  showVoteToast();

  state.selectedCandidate = null;
  [...candidateGrid.children].forEach((child) => child.classList.remove('selected'));
  updateSelectedDisplay();
  updateConfirmButtonState();
}

function resetSelection() {
  state.selectedCandidate = null;
  [...candidateGrid.children].forEach((child) => child.classList.remove('selected'));
  updateSelectedDisplay();
  updateConfirmButtonState();
}

function sortedResults() {
  return [...state.votes.entries()].sort((a, b) => b[1] - a[1]);
}

function revealResults(results) {
  rankingList.innerHTML = '';
  const maxVotes = Math.max(1, ...results.map(([, votes]) => votes));

  results.forEach(([name, votes], index) => {
    const item = document.createElement('article');
    item.className = 'ranking-item';

    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-etc';
    const graphPercent = Math.round((votes / maxVotes) * 100);

    item.innerHTML = `
      <div class="rank-badge ${rankClass}">${index + 1}</div>
      <div class="result-main">
        <strong>${name}</strong>
        <div class="result-bar-wrap">
          <div class="result-bar ${pastelClasses[index % pastelClasses.length]}" style="width: ${graphPercent}%"></div>
        </div>
      </div>
      <span class="result-vote">${votes}표 (${graphPercent}%)</span>
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
  playFanfareSound();
  await new Promise((resolve) => setTimeout(resolve, 1200));
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
  $('result-subtitle').textContent = `총 ${state.totalVotes}표 집계 완료`;
  switchScreen(resultScreen);
  await startDramaticReveal();
}

function openFinishModal() {
  finishModal.classList.remove('hidden');
}

function closeFinishModal() {
  finishModal.classList.add('hidden');
}

function restartVoteWithSameItems() {
  state.votes = new Map(state.candidates.map((name) => [name, 0]));
  state.totalVotes = 0;
  state.selectedCandidate = null;
  $('vote-count').textContent = '0';
  updateSelectedDisplay();
  updateConfirmButtonState();
  renderCandidates();
  switchScreen(voteScreen);
}

$('count-minus').addEventListener('click', () => {
  candidateCountInput.value = Math.max(2, Number(candidateCountInput.value || 2) - 1);
  makeCandidateFields();
});

$('count-plus').addEventListener('click', () => {
  candidateCountInput.value = Math.min(12, Number(candidateCountInput.value || 2) + 1);
  makeCandidateFields();
});

$('start-vote').addEventListener('click', startElection);
$('confirm-vote').addEventListener('click', confirmVote);
$('reset-current').addEventListener('click', resetSelection);
$('finish-vote').addEventListener('click', openFinishModal);
$('finish-cancel').addEventListener('click', closeFinishModal);
$('finish-confirm').addEventListener('click', async () => {
  closeFinishModal();
  await finishElection();
});
$('new-election').addEventListener('click', () => switchScreen(setupScreen));
$('revote').addEventListener('click', restartVoteWithSameItems);
voteToastOverlay.addEventListener('pointerdown', hideVoteToast);
finishModal.addEventListener('pointerdown', (event) => {
  if (event.target === finishModal) closeFinishModal();
});

makeCandidateFields();
updateSelectedDisplay();
updateConfirmButtonState();
