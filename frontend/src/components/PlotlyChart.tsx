'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PlotlyChartProps {
  data: any[];
  layout: Record<string, any>;
  className?: string;
}

export default function PlotlyChart({ data, layout, className }: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!containerRef.current || typeof window === 'undefined') return;

      try {
        const Plotly = (await import('plotly.js-dist-min')).default;
        if (!isMounted || !containerRef.current) return;

        const mergedLayout = {
          autosize: true,
          margin: { l: 50, r: 30, t: 40, b: 50 },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: {
            color: '#94a3b8',
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            size: 12,
          },
          xaxis: {
            gridcolor: '#1e2436',
            zerolinecolor: '#1e2436',
            tickfont: { color: '#94a3b8' },
            ...(layout.xaxis || {}),
          },
          yaxis: {
            gridcolor: '#1e2436',
            zerolinecolor: '#1e2436',
            tickfont: { color: '#94a3b8' },
            ...(layout.yaxis || {}),
          },
          ...layout,
        };

        const config: any = {
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        };

        await Plotly.react(containerRef.current, data, mergedLayout, config);
        if (isMounted) setLoading(false);
      } catch (err) {
        console.error('Failed to render Plotly chart:', err);
      }
    }

    renderChart();

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        import('plotly.js-dist-min').then((Plotly) => {
          if (containerRef.current) {
            Plotly.default.Plots.resize(containerRef.current);
          }
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
    };
  }, [data, layout]);

  return (
    <div className={`relative w-full h-[360px] ${className || ''}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm rounded-lg">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Rendering visual...
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
