import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type Item, type Grid, type Position, GameStatus, Rarity } from './types';
import { GameOverModal } from './components/GameOverModal';
import { Leaderboard } from './components/Leaderboard';

const GRID_SIZE = 6;
const VISIBLE_DURATION_NORMAL = 1000; // Normal items are visible for 1 second
const VISIBLE_DURATION_LOW_TIER = 1500; // Low-tier items are visible for 1.5 seconds
const CLEAR_DURATION = 750;   // Grid is empty for 0.75 seconds
const GAME_DURATION = 100; // 100 seconds

type ItemPoolEntry = {
    emoji: string;
    points: number;
    rarity: Rarity;
    rarityClass: string;
};

const ITEM_POOL: { [key in Rarity]: ItemPoolEntry[] } = {
    [Rarity.Legendary]: [{ emoji: '🍌', points: 100000, rarity: Rarity.Legendary, rarityClass: 'rarity-legendary' }],
    [Rarity.Rare]: [
        { emoji: '🥝', points: 2000, rarity: Rarity.Rare, rarityClass: 'rarity-rare' },
        { emoji: '🪞', points: 2000, rarity: Rarity.Rare, rarityClass: 'rarity-rare' },
        { emoji: '👻', points: 2000, rarity: Rarity.Rare, rarityClass: 'rarity-rare' },
        { emoji: '🦖', points: 2000, rarity: Rarity.Rare, rarityClass: 'rarity-rare' },
    ],
    [Rarity.Uncommon]: [
        { emoji: '🚀', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' }, { emoji: '🍦', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' },
        { emoji: '🦎', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' }, { emoji: '🔔', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' },
        { emoji: '🍩', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' }, { emoji: '📱', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' },
        { emoji: '🥫', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' }, { emoji: '🧢', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' },
        { emoji: '🦫', points: 100, rarity: Rarity.Uncommon, rarityClass: 'rarity-uncommon' },
    ],
    [Rarity.Common]: [
        { emoji: '🐶', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' }, { emoji: '🐒', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' },
        { emoji: '🐍', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' }, { emoji: '🫖', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' },
        { emoji: '🕯️', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' }, { emoji: '🍭', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' },
        { emoji: '🥤', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' }, { emoji: '🍊', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' },
        { emoji: '🍋', points: 15, rarity: Rarity.Common, rarityClass: 'rarity-common' },
    ],
    [Rarity.VeryCommon]: [
        { emoji: '🪙', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' }, { emoji: '🧤', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' },
        { emoji: '⚔️', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' }, { emoji: '🎲', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' },
        { emoji: '🦡', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' }, { emoji: '🍰', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' },
        { emoji: '🎈', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' }, { emoji: '🔑', points: 5, rarity: Rarity.VeryCommon, rarityClass: 'rarity-verycommon' },
    ]
};

const RARITY_CHANCES = {
    [Rarity.Legendary]: 0.0005, // 0.05%
    [Rarity.Rare]: 0.05,       // 5%
    [Rarity.Uncommon]: 0.15,     // 15%
    [Rarity.Common]: 0.40,       // 40%
    [Rarity.VeryCommon]: 0.3995, // ~40%
};

const pickRandomItemByRarity = (): ItemPoolEntry => {
    const rand = Math.random();
    let cumulative = 0;

    for (const rarity of Object.keys(RARITY_CHANCES).map(Number)) {
        cumulative += RARITY_CHANCES[rarity as Rarity];
        if (rand < cumulative) {
            const items = ITEM_POOL[rarity as Rarity];
            return items[Math.floor(Math.random() * items.length)];
        }
    }
    // Fallback to very common
    const items = ITEM_POOL[Rarity.VeryCommon];
    return items[Math.floor(Math.random() * items.length)];
};

const Spider: React.FC<{ cranePos: Position }> = ({ cranePos }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        let timer: number;
        const scheduleToggle = () => {
             const randomInterval = isVisible
                ? Math.random() * 3000 + 2000 // Stay visible for 2-5s
                : Math.random() * 5000 + 5000; // Stay hidden for 5-10s
            
            timer = window.setTimeout(() => {
                setIsVisible(prev => !prev);
            }, randomInterval);
        };
        scheduleToggle();
        return () => clearTimeout(timer);
    }, [isVisible]);
    
    // Calculate pupil position based on crane position
    const pupilOffsetX = (cranePos.x / (GRID_SIZE - 1) - 0.5) * 4;
    const pupilOffsetY = (cranePos.y / (GRID_SIZE - 1) - 0.5) * 4;
    
    const pupilStyle: React.CSSProperties = {
        transform: `translate(${pupilOffsetX}px, ${pupilOffsetY}px)`
    };

    const Leg: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
        <div className="absolute w-8 h-1 bg-gray-900 rounded-full" style={style}></div>
    );

    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 transition-transform duration-1000 ease-in-out" style={{ transform: `translate(-50%, ${isVisible ? '0%' : '-80%'})` }}>
            <div className="relative flex flex-col items-center">
                <div className="w-0.5 h-16 bg-zinc-600/50" />
                 <div className="relative w-24 h-16">
                    {/* Legs */}
                    <Leg style={{ top: '0px', left: '10px', transform: 'rotate(-65deg)' }} />
                    <Leg style={{ top: '15px', left: '0px', transform: 'rotate(-25deg)' }} />
                    <Leg style={{ top: '32px', left: '0px', transform: 'rotate(25deg)' }} />
                    <Leg style={{ top: '47px', left: '10px', transform: 'rotate(65deg)' }} />

                    <Leg style={{ top: '0px', right: '10px', transform: 'rotate(65deg)' }} />
                    <Leg style={{ top: '15px', right: '0px', transform: 'rotate(25deg)' }} />
                    <Leg style={{ top: '32px', right: '0px', transform: 'rotate(-25deg)' }} />
                    <Leg style={{ top: '47px', right: '10px', transform: 'rotate(-65deg)' }} />

                    {/* Body on top */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-10 bg-gray-800 rounded-full border-2 border-gray-900">
                        {/* Eyes */}
                        <div className="absolute top-1/4 left-2 w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden">
                            <div className="w-2 h-2 bg-black rounded-full transition-transform duration-200" style={pupilStyle}></div>
                        </div>
                        <div className="absolute top-1/4 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden">
                            <div className="w-2 h-2 bg-black rounded-full transition-transform duration-200" style={pupilStyle}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const CraneHookIcon: React.FC<{ isDropping: boolean }> = ({ isDropping }) => (
     <svg className="w-full h-full overflow-visible" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 -500V150" stroke="#8D6E63" strokeWidth="8" strokeLinecap="round"/>
        <g transform="translate(0, 150)">
            <path d="M50 0 L 50 20" stroke="#C1A788" strokeWidth="12" />
            <path d="M44 20 L 56 20" stroke="#C1A788" strokeWidth="16" strokeLinecap="round" />
            
            <g style={{ transition: 'transform 0.2s ease-out', transformOrigin: '50px 20px', transform: isDropping ? 'rotate(0deg) scaleY(1.1)' : 'rotate(0deg) scaleY(1)' }}>
                <path d="M50 20 L 50 50" stroke="#FFB74D" strokeWidth="10" strokeLinecap="round"/>
            </g>
            <g style={{ transition: 'transform 0.2s ease-out', transformOrigin: '50px 20px', transform: isDropping ? 'rotate(35deg)' : 'rotate(15deg)' }}>
                 <path d="M50 20 C 40 40, 30 50, 20 60" stroke="#FFB74D" strokeWidth="10" strokeLinecap="round"/>
            </g>
             <g style={{ transition: 'transform 0.2s ease-out', transformOrigin: '50px 20px', transform: isDropping ? 'rotate(-35deg)' : 'rotate(-15deg)' }}>
                 <path d="M50 20 C 60 40, 70 50, 80 60" stroke="#FFB74D" strokeWidth="10" strokeLinecap="round"/>
            </g>
        </g>
    </svg>
);


const PixelCloud: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute w-24 h-12" style={style}>
        <div className="absolute bg-white rounded-full w-12 h-12 bottom-0 left-0"></div>
        <div className="absolute bg-white rounded-full w-16 h-16 bottom-0 left-6"></div>
        <div className="absolute bg-white rounded-full w-12 h-12 bottom-0 right-0"></div>
    </div>
);

// New decorative components
const Sparkle: React.FC<{ style: React.CSSProperties }> = ({ style }) => <div className="absolute text-yellow-300 sparkle-flash" style={style}>✦</div>;
const PeekingFriend: React.FC<{ style: React.CSSProperties }> = ({ style }) => <div className="absolute text-4xl peek-anim" style={style}>😻</div>;
const ActionLine: React.FC<{ style: React.CSSProperties }> = ({ style }) => ( <svg className="absolute wiggle-anim" width="50" height="20" viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}><path d="M2 18 C 15 2, 35 2, 48 18" stroke="#FF69B4" strokeWidth="4" strokeLinecap="round"/></svg>);


const createEmptyGrid = (): Grid => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

const App: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [cranePos, setCranePos] = useState<Position>({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.StartMenu);
  const [isDropping, setIsDropping] = useState(false);
  const [catchMessage, setCatchMessage] = useState<string | null>(null);
  
  const gameTimers = useRef<number[]>([]);
  const gameTimer = useRef<number | null>(null);
  const itemIdCounter = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCranePos({ x: Math.floor(GRID_SIZE / 2), y: 0 });
    setIsDropping(false);
    itemIdCounter.current = 0;
    setGameStatus(GameStatus.Playing);
  };

  const spawnItems = useCallback(() => {
    const newGrid = createEmptyGrid();
    const emptyCells: Position[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        emptyCells.push({ x, y });
      }
    }

    // Spawn 3 random rarity items
    for (let i = 0; i < 3; i++) {
        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const { x, y } = emptyCells.splice(randomIndex, 1)[0];
            const randomItemProto = pickRandomItemByRarity();
            newGrid[y][x] = { ...randomItemProto, id: itemIdCounter.current++ };
        }
    }
    
    // Spawn 3 VeryCommon (lowest tier) items
    const lowTierItems = ITEM_POOL[Rarity.VeryCommon];
    for (let i = 0; i < 3; i++) {
         if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const { x, y } = emptyCells.splice(randomIndex, 1)[0];
            const lowTierProto = lowTierItems[Math.floor(Math.random() * lowTierItems.length)];
            newGrid[y][x] = { ...lowTierProto, id: itemIdCounter.current++ };
        }
    }
    setGrid(newGrid);
  }, []);
  
  const gameLoop = useCallback(() => {
    spawnItems();

    const partialClearTimer = window.setTimeout(() => {
        setGrid(grid => grid.map(row => row.map(item => {
            if (item && item.rarity !== Rarity.VeryCommon) {
                return null; // Clear non-low-tier items
            }
            return item;
        })));
    }, VISIBLE_DURATION_NORMAL);
    gameTimers.current.push(partialClearTimer);

    const fullClearTimer = window.setTimeout(() => {
        setGrid(createEmptyGrid());
        
        const nextLoopTimer = window.setTimeout(gameLoop, CLEAR_DURATION);
        gameTimers.current.push(nextLoopTimer);

    }, VISIBLE_DURATION_LOW_TIER);
    gameTimers.current.push(fullClearTimer);
}, [spawnItems]);


  useEffect(() => {
    if (gameStatus === GameStatus.Playing) {
        gameLoop();
        gameTimer.current = window.setInterval(() => {
            setTimeLeft(prev => {
            if (prev <= 1) {
                setGameStatus(GameStatus.GameOver);
                return 0;
            }
            return prev - 1;
            });
        }, 1000);
    }
    return () => {
      gameTimers.current.forEach(clearTimeout);
      gameTimers.current = [];
      if (gameTimer.current) clearInterval(gameTimer.current);
    };
  }, [gameStatus, gameLoop]);

  const updateCranePosition = (clientX: number, clientY: number) => {
    if (!gridRef.current || gameStatus !== GameStatus.Playing || isDropping) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cellPixelWidth = rect.width / GRID_SIZE;
    const cellPixelHeight = rect.height / GRID_SIZE;

    const gridX = Math.floor(x / cellPixelWidth);
    const gridY = Math.floor(y / cellPixelHeight);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
        if (gridX !== cranePos.x || gridY !== cranePos.y) {
            setCranePos({ x: gridX, y: gridY });
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCranePosition(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateCranePosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateCranePosition(touch.clientX, touch.clientY);
    }
  };

  const dropCrane = () => {
    if (gameStatus !== GameStatus.Playing || isDropping) return;

    setIsDropping(true);
    setTimeout(() => {
      const caughtItem = grid[cranePos.y][cranePos.x];
      if (caughtItem) {
        setScore(s => s + caughtItem.points);
        setCatchMessage(`+${caughtItem.points}!`);
        setGrid(g => {
          const newGrid = g.map(r => [...r]);
          newGrid[cranePos.y][cranePos.x] = null;
          return newGrid;
        });
      } else {
          setCatchMessage('Miss!');
      }
      setTimeout(() => setCatchMessage(null), 800);
      setIsDropping(false);
    }, 300); // 300ms drop animation
  };

  const handleGridClick = () => {
    dropCrane();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent mouse event from also firing
    dropCrane();
  };


  const cellWidth = 'min(12vw, 64px)';
  const gridWidth = `calc(${GRID_SIZE} * ${cellWidth} + ${GRID_SIZE - 1} * 4px)`;

  if (gameStatus === GameStatus.StartMenu) {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden gap-8">
             <PixelCloud style={{ top: '10%', left: '5%', opacity: 0.7, animation: 'float 8s ease-in-out infinite' }} />
             <PixelCloud style={{ top: '20%', right: '10%', transform: 'scale(0.8)', opacity: 0.6, animation: 'float 12s ease-in-out infinite' }} />
            <div className="text-center z-10">
                <h1 className="text-5xl md:text-7xl text-pink-500 text-shadow-cute mb-4">Cute Crane</h1>
                <h1 className="text-5xl md:text-7xl text-yellow-500 text-shadow-cute mb-12">Catcher</h1>
                <button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white text-2xl px-12 py-6 rounded-lg animate-pulse pixel-shadow">
                    START GAME
                </button>
                 <div className="mt-12 text-lg text-pink-800 space-y-2">
                    <p>Mouse or Touch to Aim</p>
                    <p>Click/Tap to Grab!</p>
                </div>
            </div>
            <Leaderboard />
        </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
       <div className="relative w-full max-w-4xl">
        <Spider cranePos={cranePos} />
        {/* Decorations */}
        <PixelCloud style={{ top: '-10%', left: '-5%', opacity: 0.3, transform: 'scale(0.7)', animation: 'float 10s ease-in-out infinite' }} />
        <PixelCloud style={{ bottom: '-15%', right: '-5%', opacity: 0.3, animation: 'float 15s ease-in-out infinite backwards' }} />
        <div className="absolute top-10 -left-8 text-4xl text-yellow-300">⭐</div>
        <div className="absolute top-20 -right-8 text-5xl text-pink-400">💖</div>
        <div className="absolute bottom-10 -right-4 text-3xl text-yellow-300">✨</div>
        <div className="absolute bottom-2 -left-8 text-6xl text-pink-400 z-10">🎀</div>

        {/* MORE DISTRACTIONS! */}
        <Sparkle style={{ top: '5%', right: '5%', fontSize: '2rem', animationDelay: '0.2s' }} />
        <Sparkle style={{ top: '50%', left: '-2%', fontSize: '3rem' }} />
        <Sparkle style={{ bottom: '2%', right: '25%', fontSize: '1.5rem', animationDelay: '0.5s' }} />
        <PeekingFriend style={{ bottom: '0', left: '10%' }} />
        <ActionLine style={{ top: '15%', left: '2%' }} />
        <ActionLine style={{ top: '80%', right: '5%', transform: 'rotate(80deg)' }} />
        <div className="absolute top-1/2 -right-10 text-cyan-300 text-3xl zoom-in-out">WOW!</div>


        <div className="relative w-full bg-gradient-to-br from-pink-400 via-yellow-300 to-cyan-300 rounded-2xl border-8 border-white shadow-2xl p-4 sm:p-6 pixel-shadow">
            {/* Screen Bezel */}
            <div className="bg-pink-900/30 rounded-lg p-4 border-2 border-white/50 flex flex-col md:flex-row gap-4">
            
            <div className="flex-grow">
                <h1 className="text-xl sm:text-3xl text-white text-shadow-cute mb-4 text-center">Quick Grab</h1>
                {/* Game Area */}
                <div
                ref={gridRef}
                onMouseMove={handleMouseMove}
                onClick={handleGridClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative bg-black/20 rounded-md p-1 cursor-crosshair overflow-hidden touch-none"
                style={{ width: gridWidth, margin: '0 auto'}}
                >
                    <div className={`grid grid-cols-6 gap-1`}>
                    {grid.map((row, y) =>
                        row.map((item, x) => (
                        <div key={`${x}-${y}`} className="aspect-square bg-black/30 rounded-sm flex items-center justify-center" style={{ width: cellWidth, height: cellWidth }}>
                            {item && <div className={`text-4xl select-none ${item.rarityClass} item-rotate`}>{item.emoji}</div>}
                        </div>
                        ))
                    )}
                    </div>
                    {/* Crane */}
                    <div 
                        className="absolute pointer-events-none"
                        style={{ 
                            width: cellWidth,
                            height: cellWidth,
                            left: `calc(${cranePos.x} * (${cellWidth} + 4px) - ${cranePos.x * 4}px)`, 
                            top: `calc(${cranePos.y} * (${cellWidth} + 4px) - ${cranePos.y * 4}px)`,
                            transition: 'top 0.1s ease-out, left 0.1s ease-out',
                        }}>
                        <CraneHookIcon isDropping={isDropping} />
                        {catchMessage && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-300 font-bold text-lg animate-ping">
                                {catchMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Side Panel */}
            <div className="w-full md:w-48 flex-shrink-0 text-center md:text-left text-white">
                <div className="bg-black/40 p-4 rounded-lg">
                    <div className="mb-4">
                        <p className="text-xl text-yellow-200">SCORE</p>
                        <p className="text-4xl text-green-400 font-bold break-words">{score}</p>
                    </div>
                    <div>
                        <p className="text-xl text-yellow-200">TIME</p>
                        <p className="text-5xl text-red-400 font-bold">{timeLeft}</p>
                    </div>
                </div>
                 <div className="absolute bottom-8 right-8 text-6xl pixelated">🕹️</div>
            </div>
            </div>
            
            <div className="absolute bottom-48 right-12 text-yellow-300 text-shadow-cute text-xs sm:text-sm text-center hidden md:block">
                <p>Grab rare items</p>
                <p>for big points!!</p>
            </div>

            <div className="mt-4 text-center text-pink-800/80 text-xs sm:text-sm">
                <p>Drag to Aim & Tap to Grab!</p>
            </div>
        </div>
      </div>
      {gameStatus === GameStatus.GameOver && <GameOverModal score={score} onRestart={startGame} />}
    </div>
  );
};

export default App;
