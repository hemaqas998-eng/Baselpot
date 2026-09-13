import React from 'react';
import { AlertTriangle, RefreshCw, Sparkles, Code, CheckCircle, Wrench } from 'lucide-react';
import { ErrorBoundaryDiagnosis } from '../types';
import { geminiIntelligenceService } from '../services/geminiIntelligenceService';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  diagnosis: ErrorBoundaryDiagnosis | null;
  diagnosing: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    diagnosis: null,
    diagnosing: false
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.requestGeminiDiagnosis(error, errorInfo.componentStack ?? undefined);
  }

  private async requestGeminiDiagnosis(error: Error, componentStack?: string): Promise<void> {
    this.setState({ diagnosing: true });
    try {
      const diagnosis = await geminiIntelligenceService.reportAndDiagnoseError(error, componentStack);
      this.setState({ diagnosis, diagnosing: false });
    } catch (err) {
      console.error('Diagnosis failed in ErrorBoundary:', err);
      this.setState({ diagnosing: false });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, diagnosis: null, diagnosing: false });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      const { error, diagnosis, diagnosing } = this.state;

      return (
        <div className="bg-slate-900/95 border border-indigo-900/60 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto my-8 shadow-2xl backdrop-blur-md text-right space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {this.props.fallbackTitle || 'نظام استعادة تشغيل الواجهة الذكي'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  تم عزل الاستثناء البرمجي لحماية استقرار البوت ومحفظة التداول
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Gemini Diagnostics
            </span>
          </div>

          {/* Raw Error Info */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-rose-300 break-words">
            {error?.message || 'Unknown runtime error'}
          </div>

          {/* AI Diagnosis Area */}
          {diagnosing ? (
            <div className="p-5 bg-indigo-950/20 rounded-xl border border-indigo-800/40 text-center space-y-2">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-indigo-300 font-medium">جاري فحص سبب الخطأ وتقديم اقتراح الإصلاح الذكي عبر Gemini AI...</p>
            </div>
          ) : diagnosis ? (
            <div className="space-y-4 text-xs">
              {/* Root Cause */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                  <Wrench className="w-4 h-4" />
                  <span>التحليل الجذري للسبب (Root Cause Analysis):</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {diagnosis.rootCauseAnalysis}
                </p>
              </div>

              {/* Code Fix Suggestion */}
              {diagnosis.suggestedCodeFix && (
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Code className="w-4 h-4" />
                    <span>الكود المقترح للمعالجة:</span>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-black/40 p-2.5 rounded-lg overflow-x-auto text-left ltr">
                    {diagnosis.suggestedCodeFix}
                  </pre>
                </div>
              )}

              {/* Recovery Steps */}
              {diagnosis.recoverySteps && diagnosis.recoverySteps.length > 0 && (
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>خطوات الاستعادة التلقائية:</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                    {diagnosis.recoverySteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {/* Reset Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تحميل واستعادة الواجهة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
