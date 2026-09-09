'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  Brain,
  Bot,
  BarChart3,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { getJobStatus, JobStatusResponse, AgentLogItem } from '../lib/api';

interface AgentTimelineProps {
  jobId: string;
  datasetName: string;
  onInvestigationFinished?: (jobId: string) => void;
}

const ALL_AGENTS = [
  { name: 'Data Detective', icon: Search, desc: 'Understanding schema & column roles' },
  { name: 'Data Quality Inspector', icon: Activity, desc: 'Auditing data health & hygiene' },
  { name: 'Data Cleaning Agent', icon: Sparkles, desc: 'Executing statistical imputation' },
  { name: 'Investigation Planner', icon: Brain, desc: 'Formulating analytical hypotheses' },
  { name: 'Data Scientist Agent', icon: Bot, desc: 'Running ML & correlation models' },
  { name: 'Visualization Architect', icon: BarChart3, desc: 'Assembling optimal Plotly visual layouts' },
  { name: 'Insight Analyst', icon: Lightbulb, desc: 'Synthesizing plain-language insights' },
  { name: 'Fact Checker', icon: ShieldCheck, desc: 'Verifying facts against Python math ground truth' },
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

        if (data.status === 'completed' && onInvestigationFinished) {
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
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 mb-1.5">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Autonomous 8-Agent Workflow
          </span>
          <h3 className="text-base font-bold text-slate-900">Agent Activity Timeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring active runtime execution for <span className="font-semibold text-slate-700">{datasetName}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">{progress}%</span>
          <p className="text-[11px] text-slate-400">Total Completion</p>
        </div>
      </div>

      {/* 8 Agents Pipeline Visual Grid */}
      <div className="space-y-3">
        {ALL_AGENTS.map((agent, idx) => {
          const matchingLog = logs.find((l) => l.agent_name.toLowerCase().includes(agent.name.toLowerCase()));
          const isDone = Boolean(matchingLog && matchingLog.status === 'completed');
          const isActive = currentAgent.toLowerCase().includes(agent.name.toLowerCase()) || (!isDone && idx === logs.length);
          const IconComponent = agent.icon;

          return (
            <div
              key={agent.name}
              className={`rounded-2xl border transition-all duration-200 ${
                isDone
                  ? 'bg-slate-50/70 border-slate-200/80 text-slate-800'
                  : isActive
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                  : 'bg-transparent border-slate-100 opacity-60 text-slate-400'
              }`}
            >
              <div
                onClick={() => matchingLog && setExpandedLogId(expandedLogId === matchingLog.id ? null : matchingLog.id)}
                className={`p-3.5 flex items-center justify-between gap-3 ${matchingLog ? 'cursor-pointer select-none' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-100/80 text-emerald-700'
                        : isActive
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs sm:text-sm font-bold ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {agent.name}
                      </h4>
                      {isDone && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded-full">
                          Completed
                        </span>
                      )}
                      {isActive && !isDone && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-200/80 px-2 py-0.2 rounded-full animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {matchingLog ? matchingLog.description : agent.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {matchingLog?.duration_ms && (
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      {matchingLog.duration_ms}ms
                    </span>
                  )}
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  {matchingLog && (
                    <div className="text-slate-400 hover:text-slate-600">
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
                <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 text-xs bg-white rounded-b-2xl">
                  <p className="text-slate-500 font-medium mb-1.5">Agent Telemetry & Computed Facts:</p>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto max-h-48">
                    {JSON.stringify(matchingLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
