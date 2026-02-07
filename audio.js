/**
 * 背景音乐控制 - 支持多首 BGM 切换
 * 将音乐文件放在 audio/ 下，在 BGM_TRACKS 中配置路径与名称
 */
(function () {
  const BGM_TRACKS = [
    { id: 'spring', src: 'audio/spring.mp3', nameKey: 'trackSpring' },
    { id: 'summer', src: 'audio/summer.mp3', nameKey: 'trackSummer' },
    { id: 'autumn', src: 'audio/autumn.mp3', nameKey: 'trackAutumn' },
    { id: 'winter', src: 'audio/winter.mp3', nameKey: 'trackWinter' }
  ];

  const STORAGE_KEY = 'chess-bgm';
  const VOLUME_KEY = 'chess-bgm-volume';
  const TRACK_KEY = 'chess-bgm-track';

  let audio = null;
  let isPlaying = false;
  let currentTrackId = BGM_TRACKS[0].id;

  function getStored() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v !== 'false';
    } catch (e) {
      return true;
    }
  }

  function setStored(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (e) {}
  }

  function getStoredVolume() {
    try {
      const v = parseFloat(localStorage.getItem(VOLUME_KEY), 10);
      return typeof v === 'number' && !isNaN(v) && v >= 0 && v <= 1 ? v : 0.5;
    } catch (e) {
      return 0.5;
    }
  }

  function setStoredVolume(value) {
    try {
      localStorage.setItem(VOLUME_KEY, String(value));
    } catch (e) {}
  }

  function getStoredTrack() {
    try {
      const v = localStorage.getItem(TRACK_KEY);
      const found = BGM_TRACKS.some(t => t.id === v);
      return found ? v : BGM_TRACKS[0].id;
    } catch (e) {
      return BGM_TRACKS[0].id;
    }
  }

  function setStoredTrack(id) {
    try {
      localStorage.setItem(TRACK_KEY, id);
    } catch (e) {}
  }

  function getTrackById(id) {
    return BGM_TRACKS.find(t => t.id === id) || BGM_TRACKS[0];
  }

  function trackName(track) {
    return typeof window.t === 'function' ? window.t(track.nameKey) : track.nameKey;
  }

  function createAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = getStoredVolume();
    audio.addEventListener('error', function () {
      console.warn('Background music file not found: ' + audio.src);
    });
    return audio;
  }

  function switchTrack(trackId) {
    const track = getTrackById(trackId);
    if (!track || track.id === currentTrackId) return;
    const wasPlaying = isPlaying;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    currentTrackId = track.id;
    setStoredTrack(track.id);
    const a = createAudio();
    a.src = track.src;
    a.volume = getStoredVolume();
    if (wasPlaying) {
      const p = a.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
      isPlaying = true;
    }
    updateTrackSelect();
    updateButton();
  }

  function play() {
    const track = getTrackById(currentTrackId);
    const a = createAudio();
    if (a.src !== track.src || !a.src) {
      a.src = track.src;
      a.volume = getStoredVolume();
    }
    const p = a.play();
    if (p && typeof p.then === 'function') p.catch(() => {});
    isPlaying = true;
    setStored(true);
    updateButton();
  }

  function pause() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    isPlaying = false;
    setStored(false);
    updateButton();
  }

  function toggle() {
    if (isPlaying) pause();
    else play();
  }

  function setVolume(value) {
    const v = Math.max(0, Math.min(1, value));
    if (audio) audio.volume = v;
    setStoredVolume(v);
    const slider = document.getElementById('bgm-volume');
    if (slider) slider.value = String(v);
  }

  function updateButton() {
    const btn = document.getElementById('bgm-toggle');
    if (!btn) return;
    const label = typeof window.t === 'function'
      ? (isPlaying ? window.t('musicOn') : window.t('musicOff'))
      : (isPlaying ? '音乐 开' : '音乐 关');
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.classList.toggle('bgm-on', isPlaying);
    btn.classList.toggle('bgm-off', !isPlaying);
  }

  function updateTrackSelect() {
    const sel = document.getElementById('bgm-track');
    if (sel) sel.value = currentTrackId;
  }

  function render(container) {
    if (!container) return;
    container.innerHTML = '';
    container.className = 'audio-control';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'bgm-toggle';
    btn.className = 'bgm-btn bgm-off';
    btn.setAttribute('aria-label', 'Background music');
    btn.innerHTML = '<span class="bgm-icon" aria-hidden="true">♫</span>';
    btn.addEventListener('click', toggle);
    container.appendChild(btn);

    const trackWrap = document.createElement('div');
    trackWrap.className = 'bgm-track-wrap';
    const trackLabel = document.createElement('label');
    trackLabel.className = 'bgm-track-label';
    trackLabel.htmlFor = 'bgm-track';
    trackLabel.textContent = typeof window.t === 'function' ? window.t('musicTrack') : '曲目';
    trackWrap.appendChild(trackLabel);
    const select = document.createElement('select');
    select.id = 'bgm-track';
    select.className = 'bgm-track-select';
    select.setAttribute('aria-label', trackLabel.textContent);
    BGM_TRACKS.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = trackName(t);
      select.appendChild(opt);
    });
    select.value = currentTrackId;
    select.addEventListener('change', function () {
      switchTrack(this.value);
    });
    trackWrap.appendChild(select);
    container.appendChild(trackWrap);

    const volWrap = document.createElement('div');
    volWrap.className = 'bgm-volume-wrap';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'bgm-volume';
    slider.className = 'bgm-volume';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.05';
    slider.value = String(getStoredVolume());
    slider.setAttribute('aria-label', typeof window.t === 'function' ? window.t('musicVolume') : '音量');
    slider.addEventListener('input', function () {
      setVolume(parseFloat(this.value, 10));
    });
    volWrap.appendChild(slider);
    container.appendChild(volWrap);

    currentTrackId = getStoredTrack();
    createAudio();
    const track = getTrackById(currentTrackId);
    audio.src = track.src;
    audio.volume = getStoredVolume();
    isPlaying = false;
    updateTrackSelect();
    updateButton();
  }

  function init() {
    const container = document.getElementById('audio-control');
    render(container);
    if (typeof window.applyLanguage === 'function') {
      const orig = window.applyLanguage;
      window.applyLanguage = function () {
        orig.apply(this, arguments);
        updateButton();
        const label = document.querySelector('.bgm-track-label');
        if (label) label.textContent = typeof window.t === 'function' ? window.t('musicTrack') : '曲目';
        const sel = document.getElementById('bgm-track');
        if (sel) {
          BGM_TRACKS.forEach((t, i) => {
            if (sel.options[i]) sel.options[i].textContent = trackName(t);
          });
        }
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.chessBgm = {
    play,
    pause,
    toggle,
    setVolume,
    switchTrack,
    get isPlaying() { return isPlaying; },
    get tracks() { return BGM_TRACKS; },
    get currentTrackId() { return currentTrackId; }
  };
})();
