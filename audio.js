/**
 * 背景音乐控制
 * 将音乐文件放在 audio/bgm.mp3，或修改 BGM_SRC 指向你的文件
 */
(function () {
  const BGM_SRC = 'audio/Norwegian_Wood .mp3';
  const STORAGE_KEY = 'chess-bgm';
  const VOLUME_KEY = 'chess-bgm-volume';

  let audio = null;
  let isPlaying = false;
  let enabled = true;

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

  function createAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = getStoredVolume();
    audio.src = BGM_SRC;
    audio.addEventListener('error', () => {
      console.warn('Background music file not found: ' + BGM_SRC);
    });
    return audio;
  }

  function play() {
    const a = createAudio();
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.catch(() => {});
    }
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

    const wrap = document.createElement('div');
    wrap.className = 'bgm-volume-wrap';
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
    wrap.appendChild(slider);
    container.appendChild(wrap);

    createAudio();
    setVolume(getStoredVolume());
    isPlaying = false;
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
    get isPlaying() { return isPlaying; }
  };
})();
