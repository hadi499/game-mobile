<script>
  import { Link } from "svelte-routing";
  let gameState = $state("start");
  let countdown = $state(0);
  let message = $state("");
  let targetCard = $state(null);
  let cards = $state([]);
  let selectedTime = $state(10);
  let isCorrect = $state(null); // State baru untuk melacak benar/salah

  const images = [
    "/images/tayo/t1.png",
    "/images/tayo/t2.png",
    "/images/tayo/t3.png",
    "/images/tayo/t4.png",
  ];

  function startGame() {
    let shuffled = [...images];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    cards = shuffled.map((img, index) => ({
      id: index + 1,
      number: index + 1,
      imageUrl: img,
    }));

    targetCard = cards[Math.floor(Math.random() * cards.length)];
    gameState = "memorize";
    countdown = selectedTime;
    message = "Hafalkan posisi gambar-gambar ini!";
    isCorrect = null; // Reset status saat mulai ulang
  }

  $effect(() => {
    if (gameState === "memorize" && countdown > 0) {
      const timer = setTimeout(() => countdown--, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "memorize" && countdown === 0) {
      gameState = "guessing";
      message = "Di nomor berapakah gambar ini berada?";
    }
  });

  function guess(card) {
    if (gameState !== "guessing") return;

    if (card.id === targetCard.id) {
      message = `Benar sekali, gambar itu ada di nomor ${card.number}.`;
      isCorrect = true; // Tandai benar
    } else {
      message = `Salah, Gambar yang benar ada di nomor ${targetCard.number}.`;
      isCorrect = false; // Tandai salah
    }
    gameState = "result";
  }
</script>

<div class="max-w-xl mx-auto mt-4 sm:mt-12 p-4 sm:p-6">
  <div class="flex items-center justify-between mb-4 sm:mb-8">
    <Link
      to="/"
      class="p-2 bg-white rounded-full shadow-sm text-blue-500 hover:text-blue-600 hover:shadow transition-all border border-pink-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
      >
    </Link>
  </div>
  <div
    class="bg-gray-50 rounded-2xl shadow-lg text-center select-none p-4 sm:p-6 border border-slate-200"
  >
    <h1 class="text-xl sm:text-2xl font-bold">Game 4 Gambar</h1>
    <h2 class="text-base sm:text-lg text-blue-700 font-semibold">Doraemon</h2>

    <div class="min-h-[220px] flex flex-col items-center justify-center">
      {#if gameState === "start"}
        <div class="flex flex-col items-center gap-4 sm:gap-5 w-full">
          <p class="text-base sm:text-lg font-bold text-gray-700">
            Sudah siap bermain?
          </p>

          <!-- Time selector -->
          <div class="bg-blue-100 p-3 sm:p-4 rounded-xl w-full">
            <p class="mb-2 text-sm sm:text-base font-bold text-blue-700">
              Pilih Waktu Menghafal:
            </p>

            <div class="flex justify-center gap-2">
              {#each [10, 7, 5] as time}
                <button
                  class={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-full font-bold border-2 transition
                  ${
                    selectedTime === time
                      ? "bg-blue-600 text-white border-blue-600 scale-105 shadow-md"
                      : "bg-white text-blue-700 border-blue-300 hover:bg-blue-200"
                  }`}
                  onclick={() => (selectedTime = time)}
                >
                  {time} Detik
                </button>
              {/each}
            </div>
          </div>

          <button
            class="bg-orange-500 hover:bg-orange-600 active:translate-y-1 text-white px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg font-bold rounded-full shadow-md"
            onclick={startGame}
          >
            ▶ MULAI MAIN
          </button>
        </div>
      {:else if gameState === "memorize"}
        <p class="text-base sm:text-lg font-bold text-gray-700">
          {message} <br />
          <span class="text-red-500 text-xl sm:text-2xl">
            Waktu: {countdown} detik
          </span>
        </p>
      {:else}
        <!-- Logika warna diubah di baris ini -->
        <p
          class={`text-base sm:text-lg font-bold mb-2 ${
            gameState === "result"
              ? isCorrect
                ? "text-blue-600"
                : "text-red-600"
              : "text-gray-700"
          }`}
        >
          {message}
        </p>

        {#if targetCard}
          <div class="my-3">
            <img
              src={targetCard.imageUrl}
              class="w-20 h-20 sm:w-28 sm:h-28 mx-auto bg-white border-4 border-dashed border-yellow-400 rounded-xl p-2"
              draggable="false"
              alt=""
            />
          </div>
        {/if}

        {#if gameState === "result"}
          <button
            class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-bold mb-4 transition"
            onclick={startGame}
          >
            Main Lagi
          </button>
        {/if}
      {/if}
    </div>

    {#if gameState !== "start"}
      <div class="grid grid-cols-2 gap-3 sm:gap-4 justify-items-center mt-4">
        {#each cards as card}
          <button
            class="w-32 h-32 sm:w-40 sm:h-40 [perspective:1000px]"
            onclick={() => guess(card)}
            disabled={gameState !== "guessing"}
          >
            <div
              class={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]
              ${gameState === "guessing" ? "rotate-y-180" : ""}`}
            >
              <!-- Front -->
              <div
                class="absolute w-full h-full flex items-center justify-center bg-white border-[3px] sm:border-4 border-gray-200 rounded-xl shadow-md backface-hidden"
              >
                <img
                  src={card.imageUrl}
                  class="w-[70%] h-[70%] object-contain"
                  draggable="false"
                  alt=""
                />
              </div>

              <!-- Back -->
              <div
                class="absolute w-full h-full flex items-center justify-center bg-yellow-400 border-[3px] sm:border-4 border-yellow-500 rounded-xl shadow-md text-white text-4xl sm:text-5xl font-bold rotate-y-180 backface-hidden"
              >
                {card.number}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Tambahan kecil karena Tailwind belum support full 3D */
  .backface-hidden {
    backface-visibility: hidden;
  }
</style>
