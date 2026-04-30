/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Trophy, 
  Gamepad2, 
  Music,
  RotateCcw,
  Ghost
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const MOVE_SPEED = 150;

type Point = { x: number; y: number };

interface Song {
  id: number;
  title: string;
  artist: string;
  url: string;
  color: string;
}

const SONGS: Song[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "Synthwave AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#00f2ff", // Cyan
  },
  {
    id: 2,
    title: "Midnight Drive",
    artist: "Cyber Runner",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#ff00ff", // Magenta
  },
  {
    id: 3,
    title: "Digital Ghost",
    artist: "Glitch Master",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#39ff14", // Neon Green
  }
];

// --- Components ---

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  // Music State
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = SONGS[currentSongIndex];

  // --- Music Logic ---

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = useCallback(() => {
    setCurrentSongIndex((prev) => (prev + 1) % SONGS.length);
    setIsPlaying(true);
  }, []);

  const prevSong = useCallback(() => {
    setCurrentSongIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = SONGS[currentSongIndex].url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      }
    }
  }, [currentSongIndex]);

  // --- Game Logic ---

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood!.x && segment.y === newFood!.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, isGameOver, isPaused, score, highScore]);

  // Game loop
  useEffect(() => {
    const interval = setInterval(moveSnake, MOVE_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ': // Space to pause
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPaused]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentSong.color} 0%, transparent 70%)`
        }}
      />
      
      {/* HUD / Header */}
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 group"
            style={{ borderColor: currentSong.color, boxShadow: `0 0 15px ${currentSong.color}44` }}
          >
            <Gamepad2 className="w-5 h-5" style={{ color: currentSong.color }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">Neon Slither</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Retro Arcade / AI Beats</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Current Score</p>
            <p className="text-2xl font-mono" style={{ color: currentSong.color }}>{score.toString().padStart(4, '0')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40">High Score</p>
            <div className="flex items-center gap-2 justify-end">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <p className="text-2xl font-mono text-white/80">{highScore.toString().padStart(4, '0')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Window */}
      <main className="h-screen flex items-center justify-center p-4">
        <div className="relative group">
          {/* Game Border Glow */}
          <div 
            className="absolute -inset-1 rounded-sm blur-md transition-all duration-1000 opacity-50"
            style={{ backgroundColor: currentSong.color }}
          />
          
          {/* Grid Container */}
          <div className="relative bg-[#111] border border-white/10 w-[min(80vw,500px)] aspect-square overflow-hidden">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            {/* Snake Engine */}
            {snake.map((segment, i) => (
              <motion.div
                key={`${i}-${segment.x}-${segment.y}`}
                initial={false}
                animate={{ x: segment.x * (100 / GRID_SIZE) + '%', y: segment.y * (100 / GRID_SIZE) + '%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute w-[5%] h-[5%] rounded-sm"
                style={{ 
                  backgroundColor: currentSong.color,
                  boxShadow: i === 0 ? `0 0 20px ${currentSong.color}` : 'none',
                  zIndex: 10 - i,
                  opacity: 1 - (i / (snake.length + 10))
                }}
              />
            ))}

            {/* Food */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                boxShadow: [`0 0 10px white`, `0 0 20px white`, `0 0 10px white`]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute w-[5%] h-[5%] bg-white rounded-full z-20"
              style={{ left: food.x * (100 / GRID_SIZE) + '%', top: food.y * (100 / GRID_SIZE) + '%' }}
            />

            {/* Overlays */}
            <AnimatePresence>
              {(isGameOver || isPaused) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                >
                  {isGameOver ? (
                    <>
                      <Ghost className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                      <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2 italic">System Crash</h2>
                      <p className="text-white/60 mb-8 max-w-xs">Your signal was lost in the grid. Reboot to try again.</p>
                      <button 
                        onClick={resetGame}
                        className="group flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                      >
                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        REBOOT SYSTEM
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center mb-4">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2 italic">Paused</h2>
                      <p className="text-white/60 mb-8 uppercase tracking-widest text-[10px]">Press Space or Click to Resume</p>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-colors border border-white/20"
                      >
                        RESUME SESSION
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Music Player Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-center justify-between gap-8 z-20 border-t border-white/5 bg-black/30 backdrop-blur-xl">
        {/* Track Info */}
        <div className="flex items-center gap-4 min-w-[240px]">
          <div className="relative group">
            <div 
              className={`w-16 h-16 rounded-lg overflow-hidden border transition-all duration-500 ${isPlaying ? 'rotate-3 scale-110 shadow-2xl' : ''}`}
              style={{ borderColor: currentSong.color, boxShadow: isPlaying ? `0 0 20px ${currentSong.color}33` : 'none' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <Music className="w-6 h-6 text-white/50" />
                <div className="flex gap-0.5 items-end h-3">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: isPlaying ? [4, 12, 6, 10, 4] : 4 }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-white/30 rounded-t-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight truncate max-w-[180px]">{currentSong.title}</h3>
            <p className="text-xs uppercase tracking-widest text-white/40 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-8">
            <button 
              onClick={prevSong}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
              style={{ backgroundColor: currentSong.color, boxShadow: `0 0 20px ${currentSong.color}66` }}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black fill-black" />
              ) : (
                <Play className="w-6 h-6 text-black fill-black ml-1" />
              )}
            </button>
            <button 
              onClick={nextSong}
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar (Visual Only) */}
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: isPlaying ? '100%' : '30%' }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="h-full"
              style={{ backgroundColor: currentSong.color }}
            />
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="hidden md:flex items-center gap-4 text-white/40">
           <Volume2 className="w-5 h-5" />
           <div className="w-24 h-1 bg-white/10 rounded-full relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-[70%] w-3 h-3 bg-white rounded-full border-2 border-black" />
              <div className="absolute h-full w-[70%] bg-white/40 rounded-full" />
           </div>
        </div>
      </footer>

      {/* Audio Engine */}
      <audio 
        ref={audioRef} 
        onEnded={nextSong}
        className="hidden"
      />

      {/* Styles */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
