import { useState, useRef, useEffect } from 'react';
import type { SandboxProject } from '../types';

const DEFAULT_GAME_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      background: #1a1a2e;
      font-family: sans-serif;
      overflow: hidden;
    }
    canvas { 
      border: 2px solid #7c6af7; 
      border-radius: 8px; 
      background: #16213e;
    }
    .info {
      position: absolute;
      bottom: 20px;
      color: #7c6af7;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <canvas id="game" width="600" height="400"></canvas>
  <div class="info">Use Arrow Keys to play</div>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    
    // Game state
    let player = { x: 50, y: 180, width: 20, height: 20, speed: 4 };
    let target = { x: 500, y: 180, width: 15, height: 15 };
    let score = 0;
    let keys = {};
    
    function draw() {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw player
      ctx.fillStyle = '#7c6af7';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // Draw target
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(target.x + target.width/2, target.y + target.height/2, target.width/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw score
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '16px sans-serif';
      ctx.fillText('Score: ' + score, 10, 25);
      
      // Draw controls hint
      ctx.fillStyle = 'rgba(122, 122, 142, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.fillText('Arrow keys to move', 10, canvas.height - 10);
    }
    
    function update() {
      if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
      if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
      if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
      if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
      
      // Check collision
      if (player.x < target.x + target.width &&
          player.x + player.width > target.x &&
          player.y < target.y + target.height &&
          player.y + player.height > target.y) {
        score++;
        target.x = Math.random() * (canvas.width - target.width);
        target.y = Math.random() * (canvas.height - target.height);
      }
    }
    
    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    
    document.addEventListener('keydown', e => keys[e.key] = true);
    document.addEventListener('keyup', e => keys[e.key] = false);
    
    loop();
  </script>
</body>
</html>`;

const SANDBOX_SYSTEM_PROMPT = `You are an expert HTML5 game developer. Create complete, playable games as a single HTML file with embedded CSS and JavaScript.

Rules:
- Output ONLY the complete HTML code, no markdown, no explanation text outside the code
- The game MUST be fully functional and playable
- Use HTML5 Canvas for rendering
- Include all CSS in a <style> tag
- Include all JS in a <script> tag
- Games should have: game loop, player controls, scoring/win condition, visual feedback
- Use keyboard controls (Arrow keys or WASD) unless touch is requested
- Add simple but polished visuals with colors
- Make sure the canvas fits within 800x600 max
- Respond ONLY with the raw HTML code, no markdown code blocks, no extra text`;

interface SandboxPanelProps {
  onSendToAi: (prompt: string, systemPrompt?: string) => Promise<string>;
  isStreaming: boolean;
}

export default function SandboxPanel({ onSendToAi, isStreaming }: SandboxPanelProps) {
  const [projects, setProjects] = useState<SandboxProject[]>(() => {
    try {
      const saved = localStorage.getItem('nexuschat_sandbox');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentProject = projects.find((p) => p.id === activeProject);

  useEffect(() => {
    if (currentProject) {
      setCode(currentProject.code);
    } else {
      setCode(DEFAULT_GAME_TEMPLATE);
    }
  }, [currentProject]);

  useEffect(() => {
    localStorage.setItem('nexuschat_sandbox', JSON.stringify(projects));
  }, [projects]);

  const handleNewProject = () => {
    const newProject: SandboxProject = {
      id: 'sandbox_' + Date.now(),
      name: 'Game ' + (projects.length + 1),
      code: DEFAULT_GAME_TEMPLATE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects([...projects, newProject]);
    setActiveProject(newProject.id);
    setCode(DEFAULT_GAME_TEMPLATE);
  };

  const handleGenerateGame = async () => {
    if (!prompt.trim() || isGenerating || isStreaming) return;
    setIsGenerating(true);
    try {
      const userPrompt = `Create a game: ${prompt}. Output ONLY the complete HTML file with embedded CSS and JS. No markdown, just raw HTML.`;
      const response = await onSendToAi(userPrompt, SANDBOX_SYSTEM_PROMPT);
      
      // Extract HTML from response if wrapped in markdown
      let htmlCode = response;
      const htmlMatch = response.match(/<html[\s\S]*<\/html>/i);
      const codeBlockMatch = response.match(/```html\n([\s\S]*?)```/);
      
      if (codeBlockMatch) {
        htmlCode = codeBlockMatch[1];
      } else if (htmlMatch) {
        htmlCode = '<!DOCTYPE html>\n' + htmlMatch[0];
      }

      setCode(htmlCode);
      
      // Save as new project
      const newProject: SandboxProject = {
        id: 'sandbox_' + Date.now(),
        name: prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
        code: htmlCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...projects, newProject];
      setProjects(updated);
      setActiveProject(newProject.id);
      setPreviewKey((k) => k + 1);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  const handleRun = () => {
    setPreviewKey((k) => k + 1);
    if (activeProject) {
      setProjects(projects.map((p) => (p.id === activeProject ? { ...p, code, updatedAt: Date.now() } : p)));
    }
  };

  const handleDelete = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    if (activeProject === id) {
      setActiveProject(null);
    }
  };

  const previewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;

  return (
    <div className="sandbox-layout">
      <div className="panel-info">
        <h3 style={{ color: 'var(--sandbox)' }}>🎮 Sandbox Mode</h3>
        <p>Buat game dengan AI. Deskripsikan game yang Anda inginkan, AI akan generate kode lengkap.</p>
      </div>

      {/* Prompt Input */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="input-box">
          <textarea
            className="msg-input"
            rows={2}
            placeholder="Deskripsikan game yang ingin dibuat... (misal: 'Buatkan game snake dengan scoring')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerateGame();
              }
            }}
          />
          <div className="input-toolbar">
            <span className="text-xs text-[var(--text-muted)]">AI akan generate kode HTML5 game lengkap</span>
            <button
              className="btn btn-sm ml-auto"
              style={{ background: 'var(--sandbox)', color: '#fff' }}
              onClick={handleGenerateGame}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <div className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1l6 6-6 6M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Generate Game
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Project List */}
      {projects.length > 0 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2 overflow-x-auto">
            <button className="btn btn-sm btn-ghost whitespace-nowrap" onClick={handleNewProject}>
              + Baru
            </button>
            {projects.map((p) => (
              <div
                key={p.id}
                className={`sandbox-project-item ${p.id === activeProject ? 'active' : ''}`}
                onClick={() => setActiveProject(p.id)}
              >
                🎮 {p.name}
                <button
                  className="text-[var(--text-dim)] hover:text-[var(--error)] ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor + Preview */}
      <div className="sandbox-editor">
        <div className="sandbox-code-panel">
          <div className="sandbox-code-header">
            <span>HTML Editor</span>
            <div className="flex gap-2">
              <button className="api-btn" onClick={handleRun}>
                ▶ Run
              </button>
              <button className="api-btn" onClick={handleNewProject}>
                + New
              </button>
            </div>
          </div>
          <textarea
            className="sandbox-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="relative bg-[#0d0d0f]">
          <div className="sandbox-code-header">
            <span>Preview</span>
            <button className="api-btn" onClick={handleRun}>
              ⟳ Refresh
            </button>
          </div>
          <iframe
            key={previewKey}
            ref={iframeRef}
            src={previewSrc}
            className="sandbox-preview"
            sandbox="allow-scripts allow-same-origin"
            title="sandbox-preview"
          />
        </div>
      </div>
    </div>
  );
}
