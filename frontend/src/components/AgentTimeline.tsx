'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { getJobStatus, JobStatusResponse, AgentLogItem } from '../lib/api';

interface AgentTimelineProps {
  jobId: string;
  datasetName: string;
  onInvestigationFinished: (jobId: string) => void;
}

const ALL_AGENTS = [
  { name: 'Data Detective', icon: '🔍', desc: 'Understanding schema & column roles' },
  { name: 'Data Quality Inspector', icon: '🩺', desc: 'Auditing data health & hygiene' },
  { name: 'Data Cleaning Agent', icon: '🧹', desc: 'Executing statistical imputation' },
  { name: 'Investigation Planner', icon: '🧠', desc: 'Formulating analytical hypotheses' },
  { name: 'Data Scientist Agent', icon: '🤖', desc: 'Running ML & correlation models' },
  { name: 'Visualization Architect', icon: '📊', desc: 'Assembling optimal Plotly visual layouts' },
  { name: 'Insight Analyst', icon: '💡', desc: 'Synthesizing plain-language insights' },
  { name: 'Fact Checker', icon: '✅', desc: 'Verifying facts against Python math ground truth' },
];

export default function AgentTimeline({ jobId, datasetName, onInvestigationFinished }: AgentTimelineProps) {
  const [jobData, setJobData] = useState<JobStatusResponse | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;

    async function pollStatus() {
      try {
        const data = await getJobStatus(jobId);
        if (!isMounted) return;
        setJobData(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            onInvestigationFinished(jobId);
          }, 800);
        } else if (data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }

    pollStatus();
    interval = setInterval(pollStatus, 800);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId, onInvestigationFinished]);

  const progress = jobData?.progress_percentage ?? 10;
  const currentAgent = jobData?.current_agent || 'Data Detective';
  const logs = jobData?.logs || [];

  return (
    <section className="w-full max-w-3xl mx-auto py-10 px-4 sm:px-6">
      {/* Investigation Status Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 mb-2">
              <Sparkles className="w-3 h-3" />
              Investigation In Progress
            </span>
            <h2 className="text-xl font-bold text-white">Autonomous Multi-Agent Runtime</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzing <span className="text-slate-200 font-medium">{datasetName}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-400">{progress}%</span>
            <p className="text-[11px] text-slate-400">Pipeline Completion</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 8 Agents Pipeline Visual Grid */}
      <div className="space-y-3">
        {ALL_AGENTS.map((agent, idx) => {
          const matchingLog = logs.find((l) => l.agent_name.toLowerCase().includes(agent.name.toLowerCase()));
          const isDone = Boolean(matchingLog && matchingLog.status === 'completed');
          const isActive = currentAgent.toLowerCase().includes(agent.name.toLowerCase()) || (!isDone && idx === logs.length);

          return (
            <div
              key={agent.name}
              className={`rounded-xl border transition-all duration-300 ${
                isDone
                  ? 'bg-slate-900/40 border-slate-800/80 text-slate-200'
                  : isActive
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5'
                  : 'bg-slate-900/20 border-slate-800/40 opacity-60 text-slate-500'
              }`}
            >
              <div
                onClick={() => matchingLog && setExpandedLogId(expandedLogId === matchingLog.id ? null : matchingLog.id)}
                className={`p-4 flex items-center justify-between gap-3 ${matchingLog ? 'cursor-pointer select-none' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                      isDone
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : isActive
                        ? 'bg-blue-500/20 border border-blue-500/40 animate-pulse'
                        : 'bg-slate-800/50'
                    }`}
                  >
                    {agent.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold ${isActive ? 'text-blue-300' : 'text-white'}`}>
                        {agent.name}
                      </h4>
                      {isDone && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                          Done
                        </span>
                      )}
                      {isActive && !isDone && (
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded animate-pulse">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {matchingLog ? matchingLog.description : agent.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {matchingLog?.duration_ms && (
                    <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                      {matchingLog.duration_ms}ms
                    </span>
                  )}
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  {matchingLog && (
                    <div className="text-slate-500 hover:text-slate-300">
                      {expandedLogId === matchingLog.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expandable Agent Telemetry / Log Details */}
              {matchingLog && expandedLogId === matchingLog.id && matchingLog.details && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs">
                  <p className="text-slate-400 font-medium mb-1.5">Agent Telemetry & Computed Facts:</p>
                  <pre className="p-2.5 rounded-lg bg-black/40 border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto max-h-48">
                    {JSON.stringify(matchingLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
