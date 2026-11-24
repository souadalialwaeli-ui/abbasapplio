import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { analyzeAudioFile, formatDuration } from '../../services/audio/audioAnalysis';

interface WaveformPlayerProps {
  /** Audio blob to play (local file only). */
  blob: Blob;
  fileName: string;
  compact?: boolean;
}

/**
 * Canvas waveform player. Decodes the blob locally with the Web Audio API
 * to draw real peaks, and plays it with a plain <audio> element.
 * Progress is drawn over the waveform; tapping the waveform seeks.
 */
export function WaveformPlayer({ blob, fileName, compact = false }: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    setError(false);
    setCurrent(0);
    let cancelled = false;
    void analyzeAudioFile(blob)
      .then((a) => {
        if (!cancelled) {
          setPeaks(a.peaks);
          setDuration(a.durationSec);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    const barWidth = Math.max(2, width / peaks.length - 1);
    const progress = duration > 0 ? current / duration : 0;
    peaks.forEach((p, i) => {
      const x = (i / peaks.length) * width;
      const barHeight = Math.max(3, p * (height - 6));
      const y = (height - barHeight) / 2;
      const played = i / peaks.length <= progress;
      ctx.fillStyle = played ? '#a78bfa' : 'rgba(201, 198, 222, 0.35)';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });
  }, [peaks, current, duration]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const audio = audioRef.current;
      if (!canvas || !audio || duration <= 0) return;
      const rect = canvas.getBoundingClientRect();
      // RTL-aware: in RTL the waveform still starts at the visual left.
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
      setCurrent(audio.currentTime);
    },
    [duration],
  );

  if (error) {
    return (
      <div className="rounded-xl border border-white/5 bg-night-800 px-4 py-3 text-xs text-mist-500">
        {fileName}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-night-800 p-3">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-l from-iris-500 to-indigo-600 text-white shadow-lg shadow-iris-500/25 transition active:scale-95"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ps-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <p className="text-xs tabular-nums text-mist-500" dir="ltr">
            {formatDuration(current)} / {formatDuration(duration)}
          </p>
        </div>
      </div>
      {!compact && (
        <canvas
          ref={canvasRef}
          className="mt-3 h-14 w-full cursor-pointer"
          onClick={seek}
          aria-label="Waveform — tap to seek"
        />
      )}
    </div>
  );
}
