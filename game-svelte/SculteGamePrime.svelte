<script>
  import { onMount, onDestroy } from "svelte";
  import { Link } from "svelte-routing";

  // Array 25 bilangan prima pertama
  const primes = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
    73, 79, 83, 89, 97,
  ];

  let grid = $state([]);
  let currentIndex = $state(0); // Melacak urutan indeks (0-24)
  let currentTarget = $state(primes[0]); // Angka prima yang sedang dicari
  let time = $state(0);
  let isPlaying = $state(false);
  let isGameOver = $state(false);
  let timerInterval;
  let wrongShake = $state(-1); // Index kotak yang salah ditekan

  function startGame() {
    // Gunakan array bilangan prima dan acak
    grid = [...primes].sort(() => Math.random() - 0.5);

    currentIndex = 0;
    currentTarget = primes[0];
    time = 0;
    isPlaying = true;
    isGameOver = false;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      time++;
    }, 1000);
  }

  function handleCellClick(number, index) {
    if (!isPlaying || isGameOver) return;

    if (number === currentTarget) {
      // Benar
      currentIndex++;
      if (currentIndex >= primes.length) {
        // Selesai
        clearInterval(timerInterval);
        isGameOver = true;
        isPlaying = false;
      } else {
        // Lanjut ke bilangan prima berikutnya
        currentTarget = primes[currentIndex];
      }
    } else {
      // Salah
      wrongShake = index;
      setTimeout(() => {
        wrongShake = -1;
      }, 400);
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  onMount(() => {
    setTimeout(startGame, 300);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<div
  class="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans relative overflow-hidden"
>
  <div class="w-full max-w-md z-10">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <Link
        to="/"
        class="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-sky-500 hover:shadow transition-all border border-slate-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
        >
      </Link>
      <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">
        Tabel Schulte
      </h1>
      <button
        onclick={startGame}
        class="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-emerald-500 hover:shadow transition-all border border-slate-200"
        title="Ulangi Permainan"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
            d="M3 3v5h5"
          /></svg
        >
      </button>
    </div>

    <!-- Instruksi -->
    <div
      class="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-center shadow-sm"
    >
      <p class="text-amber-800 font-semibold text-sm">
        Temukan dan klik angka secara berurutan mulai dari <span
          class="font-black text-amber-900 text-base"
          >Bilangan Prima (2 - 97)</span
        > secepat mungkin!
      </p>
    </div>

    <!-- HUD -->
    <div
      class="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/60 flex justify-between items-center mb-8"
    >
      <div class="text-center px-4 w-1/2">
        <div
          class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
        >
          Cari Prima
        </div>
        <div class="text-3xl font-black text-emerald-500">
          {currentIndex < 25 ? currentTarget : "✅"}
        </div>
      </div>
      <div class="w-px h-10 bg-slate-200"></div>
      <div class="text-center px-4 w-1/2">
        <div
          class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"
        >
          Stopwatch
        </div>
        <div class="text-2xl font-black text-slate-700 font-mono">
          {formatTime(time)}
        </div>
      </div>
    </div>

    <!-- Grid 5x5 -->
    <div
      class="grid grid-cols-5 gap-2 md:gap-3 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200"
    >
      {#each grid as number, index}
        <!-- Pengecekan isFound disesuaikan ke array primes -->
        {@const isFound = primes.indexOf(number) < currentIndex}
        <button
          onclick={() => handleCellClick(number, index)}
          disabled={!isPlaying || isFound}
          class="aspect-square flex items-center justify-center text-xl md:text-2xl font-bold rounded-xl transition-all duration-200
            {isFound
            ? 'bg-slate-100 text-slate-300 shadow-inner'
            : 'bg-sky-50 text-sky-900 shadow-sm hover:bg-sky-100 border border-sky-100'} 
            {wrongShake === index
            ? 'bg-red-500 text-white animate-shake border-red-500'
            : ''}
          "
        >
          {number}
        </button>
      {/each}
    </div>

    <!-- Layar Hasil Akhir -->
    {#if isGameOver}
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      >
        <div
          class="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100 transform transition-all scale-100 animate-pop"
        >
          <div class="text-6xl mb-4">🏆</div>
          <h2 class="text-2xl font-black text-slate-900 mb-2">
            Terselesaikan!
          </h2>
          <p class="text-slate-500 font-medium mb-6">
            Hebat! Kamu berhasil mengurutkan 25 bilangan prima dalam waktu <strong
              class="text-emerald-600 text-lg">{formatTime(time)}</strong
            >.
          </p>

          <div class="flex flex-col gap-3">
            <button
              onclick={startGame}
              class="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
            >
              Main Lagi
            </button>
            <Link
              to="/"
              class="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    50% {
      transform: translateX(5px);
    }
    75% {
      transform: translateX(-5px);
    }
  }
  .animate-shake {
    animation: shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes pop {
    0% {
      transform: scale(0.9);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  .animate-pop {
    animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
</style>
