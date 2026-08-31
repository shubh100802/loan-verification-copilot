import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLoanById,
  getExceptions,
  getAuditTrail,
  performReviewAction,
  explainExceptionAI,
  suggestCorrectionAI,
  compareRecordsAI,
  generateReviewerNoteAI
} from '../services/mock/services.mock';
import {
  Sparkles,
  CheckCircle,
  ArrowLeft,
  Edit2,
  FileText,
  AlertTriangle,
  History,
  Check,
  X,
  FileCheck2,
  Lock
} from 'lucide-react';
import { StatusBadge } from '../components/Badge';
import { useToast } from '../hooks/useToast';

export const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const userRole = localStorage.getItem('user_role') || 'operator';
  const userName = localStorage.getItem('user_name') || 'Lead Reviewer';

  const [notes, setNotes] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Fetch Loan Details
  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getLoanById(id || '')
  });

  // Fetch Exception Details
  const { data: exceptions } = useQuery({
    queryKey: ['loanExceptions', id],
    queryFn: () => getExceptions({ search: id }),
    enabled: !!id
  });

  const activeException = exceptions?.find((e) => e.status === 'open');

  // Copilot States
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiSuggestedValue, setAiSuggestedValue] = useState<string | null>(null);
  const [aiSuggestedAction, setAiSuggestedAction] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [editedNoteText, setEditedNoteText] = useState('');
  const [aiSuggestedSeverity, setAiSuggestedSeverity] = useState('');
  const [aiComparison, setAiComparison] = useState<any>(null);
  const [hasRunCopilot, setHasRunCopilot] = useState(false);
  const [noteEditable, setNoteEditable] = useState(false);

  React.useEffect(() => {
    setHasRunCopilot(false);
    setAiExplanation('');
    setAiSuggestedValue(null);
    setAiSuggestedAction(null);
    setAiConfidence(0);
    setEditedNoteText('');
    setAiSuggestedSeverity('');
    setAiComparison(null);
    setNoteEditable(false);
  }, [activeException?.id]);

  const handleAnalyzeException = async () => {
    if (!activeException) return;
    setCopilotLoading(true);
    try {
      const [explainRes, correctionRes, noteRes] = await Promise.all([
        explainExceptionAI(activeException.id),
        suggestCorrectionAI(activeException.id),
        generateReviewerNoteAI(activeException.id)
      ]);

      setAiExplanation(explainRes.explanation);
      setAiSuggestedValue(correctionRes.suggestedValue);
      setAiSuggestedAction(correctionRes.suggestedAction);
      setAiConfidence(explainRes.confidence || correctionRes.confidence || 85);
      setEditedNoteText(noteRes);
      setAiSuggestedSeverity(explainRes.severity || 'medium');

      if (activeException.ruleId === 'R015') {
        try {
          const compRes = await compareRecordsAI(activeException.id);
          setAiComparison(compRes);
        } catch (e) {
          console.warn('Comparison failed:', e);
        }
      }
      setHasRunCopilot(true);
      showToast('AI analysis completed successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI request failed', 'error');
    } finally {
      setCopilotLoading(false);
    }
  };

  // Fetch Audit Trail
  const { data: auditTrail, refetch: refetchAudit } = useQuery({
    queryKey: ['auditTrail', id],
    queryFn: () => getAuditTrail(id || ''),
    enabled: !!id
  });

  // Review Actions mutation
  const reviewMutation = useMutation({
    mutationFn: performReviewAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['loanExceptions', id] });
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      refetchAudit();
      setNotes('');
      setEditingField(null);
      showToast(`Action "${variables.action.replace('_', ' ').toUpperCase()}" applied successfully`, 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Action failed', 'error');
    }
  });

  if (loanLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-900 border border-slate-700 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px] bg-slate-900 border border-slate-700 rounded-xl" />
          <div className="h-[450px] bg-slate-900 border border-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-700 rounded-xl text-slate-400">
        Loan record with ID "{id}" was not found.
      </div>
    );
  }

  const handleApplyAI = () => {
    if (!activeException) return;

    if (aiSuggestedAction === 'EDIT') {
      const field = activeException.affectedField;
      const value = aiSuggestedValue;

      reviewMutation.mutate({
        loanId: loan.loanId,
        exceptionId: activeException.id,
        action: 'edit_record',
        notes: `AI Recommendation Accepted: Corrected "${field}" to "${value}". Justification: ${aiExplanation}`,
        reviewerName: userName,
        updatedFields: { [field]: value }
      });
    } else if (aiSuggestedAction === 'WAIVE') {
      reviewMutation.mutate({
        loanId: loan.loanId,
        exceptionId: activeException.id,
        action: 'waive_exception',
        notes: `AI Recommendation Accepted: Waived exception. Justification: ${aiExplanation}`,
        reviewerName: userName
      });
    } else if (aiSuggestedAction === 'REQUEST_CORRECTION') {
      reviewMutation.mutate({
        loanId: loan.loanId,
        exceptionId: activeException.id,
        action: 'request_correction',
        notes: `AI Recommendation Accepted: Requested correction. Justification: ${aiExplanation}`,
        reviewerName: userName
      });
    }
  };

  const handleInlineEdit = (field: string) => {
    setEditingField(field);
    setEditValue((loan as any)[field]?.toString() || '');
  };

  const saveInlineEdit = () => {
    if (!editingField || !activeException) return;

    const parsedVal =
      editingField === 'currentBalance' ||
      editingField === 'originalPrincipal' ||
      editingField === 'interestRate' ||
      editingField === 'dpd'
        ? parseFloat(editValue)
        : editValue;

    reviewMutation.mutate({
      loanId: loan.loanId,
      exceptionId: activeException.id,
      action: 'edit_record',
      notes: `${userRole === 'operator' ? 'Operator' : 'Reviewer'} manually modified field "${editingField}" to "${editValue}".`,
      reviewerName: userName,
      updatedFields: { [editingField]: parsedVal }
    });
  };

  const handleReviewAction = (action: 'approve_verification' | 'waive_exception' | 'request_correction') => {
    if (!activeException) return;

    reviewMutation.mutate({
      loanId: loan.loanId,
      exceptionId: activeException.id,
      action,
      notes: notes || `Manually applied action: ${action.replace('_', ' ')}`,
      reviewerName: userName
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reviewer/exceptions')}
            className="p-2 border border-slate-700 hover:border-slate-600 bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-100">{loan.loanId}</span>
              <StatusBadge status={loan.verificationStatus} />
            </div>
            <span className="text-slate-500 text-xs mt-1 block">
              Borrower: {loan.borrowerName} • Servicer: {loan.servicerName}
            </span>
          </div>
        </div>

        {/* Lock ledger validation badge */}
        {loan.verificationStatus === 'verified' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold shadow-lg">
            <Lock className="h-3.5 w-3.5" />
            <span>Immutable Blockchain Hash Pending</span>
          </div>
        )}
      </div>

      {/* Primary Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Loan fields & Source Comparisons */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Loan Fields */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-indigo-500/30 to-indigo-500/0" />
            <h2 className="text-slate-250 font-bold text-sm mb-4 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Normalized Tape Attributes</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {/* Fields */}
              {[
                { label: 'Borrower ID', key: 'borrowerId' },
                { label: 'Loan Type', key: 'loanType' },
                { label: 'Origination Date', key: 'originationDate' },
                { label: 'Maturity Date', key: 'maturityDate', hasException: activeException?.ruleId === 'R005' },
                { label: 'Original Principal', key: 'originalPrincipal', format: (v: number) => `₹${v.toLocaleString()}` },
                {
                  label: 'Current Balance',
                  key: 'currentBalance',
                  format: (v: number) => `₹${v.toLocaleString()}`,
                  hasException: activeException?.ruleId === 'R006' || activeException?.ruleId === 'R013'
                },
                { label: 'Interest Rate', key: 'interestRate', format: (v: number) => `${v}%` },
                { label: 'Payment Status', key: 'paymentStatus', hasException: activeException?.ruleId === 'R008' },
                { label: 'Days Past Due (DPD)', key: 'dpd' },
                { label: 'Property State', key: 'propertyState', hasException: activeException?.ruleId === 'R012' }
              ].map((field) => {
                const val = (loan as any)[field.key];
                const displayVal = field.format ? field.format(val) : val;
                const isEditing = editingField === field.key;

                return (
                  <div
                    key={field.key}
                    className={`p-3 rounded-lg border relative group transition duration-150 ${
                      field.hasException
                        ? 'bg-rose-500/5 border-rose-500/25 ring-1 ring-rose-500/10'
                        : 'bg-slate-950/20 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {field.label}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-xs text-slate-100 max-w-[120px] focus:outline-none"
                        />
                        <button
                          onClick={saveInlineEdit}
                          className="p-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/25"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="p-1 bg-slate-800 text-slate-400 border border-slate-700 rounded hover:bg-slate-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between mt-1">
                        <span className={`text-sm font-bold tracking-tight ${field.hasException ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
                          {displayVal}
                        </span>
                        {/* Only allow inline edits if exception is open */}
                        {activeException && (
                          <button
                            onClick={() => handleInlineEdit(field.key)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer ml-2 transition"
                          >
                            <Edit2 className="h-2.5 w-2.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    )}

                    {field.hasException && activeException && (
                      <div className="absolute top-1 right-2 flex items-center text-[10px] font-bold text-rose-500 gap-0.5 uppercase tracking-wider">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Issue</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conflict Source Comparison UI */}
          {activeException?.ruleId === 'R006' && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg">
              <h2 className="text-slate-250 font-bold text-sm mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-yellow-500" />
                <span>Reconciliation Source Discrepancies</span>
              </h2>
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-4 block">
                Comparing primary tape record with second-source servicer update sheet
              </span>

              <div className="border border-slate-700 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/40 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">Data Field</th>
                      <th className="p-3">Tape Value (Primary)</th>
                      <th className="p-3">Servicer Update Value</th>
                      <th className="p-3">Reconcile Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 bg-slate-950/10">
                    <tr className="hover:bg-slate-850/20 transition">
                      <td className="p-3 font-semibold text-slate-400">Current Balance</td>
                      <td className="p-3 font-bold text-rose-400 bg-rose-500/5">₹525,000</td>
                      <td className="p-3 font-bold text-emerald-400 bg-emerald-500/5">₹425,000</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => {
                            reviewMutation.mutate({
                              loanId: loan.loanId,
                              exceptionId: activeException.id,
                              action: 'edit_record',
                              notes: 'Manually reconciled: Accepted Primary Tape balance ₹525,000.',
                              reviewerName: userName,
                              updatedFields: { currentBalance: 525000 }
                            });
                          }}
                          className="px-2 py-1 border border-slate-700 hover:bg-slate-800/50 text-slate-200 font-bold rounded"
                        >
                          Use Tape
                        </button>
                        <button
                          onClick={() => {
                            reviewMutation.mutate({
                              loanId: loan.loanId,
                              exceptionId: activeException.id,
                              action: 'edit_record',
                              notes: 'Manually reconciled: Accepted Servicer Update balance ₹425,000.',
                              reviewerName: userName,
                              updatedFields: { currentBalance: 425000 }
                            });
                          }}
                          className="px-2 py-1 bg-indigo-500 hover:bg-indigo-400 text-slate-955 font-bold rounded border-transparent"
                        >
                          Use Servicer
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: AI Copilot Assistant & Final Action deck */}
        <div className="space-y-6">
          {/* AI Copilot Assistant & Final Action deck */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[420px]">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-indigo-500" />

            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                <span className="font-extrabold text-sm text-slate-200 tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span>✦ Loan Verification Copilot</span>
                </span>
                {hasRunCopilot && (
                  <span className="text-[10px] font-bold bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest rounded">
                    Ready
                  </span>
                )}
              </div>

              {/* Recommendation logic */}
              {!activeException ? (
                <div className="py-12 text-center text-xs text-slate-500 font-semibold flex flex-col items-center">
                  <FileCheck2 className="h-10 w-10 text-emerald-500/20 mb-2" />
                  <span>No exceptions detected. Copilot is idle.</span>
                </div>
              ) : copilotLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center space-y-3">
                  <Sparkles className="h-8 w-8 text-indigo-400 animate-spin" />
                  <span>Analyzing exception inconsistencies...</span>
                </div>
              ) : !hasRunCopilot ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Sparkles className="h-10 w-10 text-indigo-550/20 mb-3" />
                  <p className="text-xs text-slate-500 font-semibold mb-4 text-center">
                    Exception detected. Ready to trigger AI Copilot review.
                  </p>
                  <button
                    type="button"
                    onClick={handleAnalyzeException}
                    className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold rounded-lg text-xs transition border-transparent"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run AI Copilot Analysis</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-xs leading-relaxed">
                  {/* Exception Analysis */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Exception Analysis</span>
                    <p className="text-rose-400 mt-1 font-medium bg-rose-500/5 p-2 rounded border border-rose-500/10">
                      {activeException.description}
                    </p>
                  </div>

                  {/* Evidence */}
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Evidence Matrix</span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Target Field</span>
                        <span className="text-slate-300 font-bold">{activeException.affectedField}</span>
                      </div>
                      <div>
                        <span className="text-slate-550 block text-right">Tape Value</span>
                        <span className="text-rose-400 font-bold block text-right">{activeException.actualValue}</span>
                      </div>
                      <div className="col-span-2 border-t border-slate-800/80 pt-1 mt-1">
                        <span className="text-slate-500 block">Expected Assertions</span>
                        <span className="text-emerald-400 font-bold">{activeException.expectedValue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation explanation */}
                  <div className="border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Copilot Recommendation</span>
                      {aiSuggestedSeverity && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-rose-500/10 border border-rose-550/20 text-rose-400">
                          AI Severity: {aiSuggestedSeverity}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 mt-1.5 font-medium">{aiExplanation}</p>
                  </div>

                  {/* Discrepancy comparison deck (R015) */}
                  {activeException.ruleId === 'R015' && aiComparison && (
                    <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-[10px]">
                      <span className="font-extrabold text-[9px] uppercase tracking-widest text-indigo-400 block mb-2">✦ Discrepancy Comparison</span>
                      <div className="space-y-1.5 font-mono text-[9px]">
                        <div>
                          <span className="text-slate-500">Is Reconciled Match:</span>{' '}
                          <span className={aiComparison.isMatch ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {aiComparison.isMatch ? 'YES' : 'NO'}
                          </span>
                        </div>
                        {aiComparison.mismatchedFields?.map((m: any, idx: number) => (
                          <div key={idx} className="border-t border-slate-800/80 pt-1 mt-1 flex justify-between">
                            <div>
                              <span className="text-slate-500">Field:</span> <span className="text-slate-200 font-bold">{m.field}</span>
                            </div>
                            <div className="text-right text-slate-400">
                              <span>Tape: {m.sourceAValue} vs Servicer: {m.sourceBValue}</span>
                            </div>
                          </div>
                        ))}
                        {aiComparison.notes && (
                          <p className="text-slate-400 mt-2 italic leading-normal border-t border-slate-800/80 pt-2">
                            Notes: {aiComparison.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Note Preview / Editor */}
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Generated Reviewer Note Preview</span>
                    <div className="mt-1.5 p-2 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-450 relative space-y-2">
                      {noteEditable ? (
                        <textarea
                          rows={2}
                          value={editedNoteText}
                          onChange={(e) => setEditedNoteText(e.target.value)}
                          className="block w-full px-2 py-1 border border-slate-700 rounded bg-slate-900 text-slate-100 text-[10px] focus:outline-none"
                        />
                      ) : (
                        <p className="pr-12 text-slate-400">{editedNoteText}</p>
                      )}
                      
                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setNoteEditable(!noteEditable)}
                          className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-bold text-slate-400 hover:text-slate-300 transition"
                        >
                          {noteEditable ? 'Save' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNotes(editedNoteText);
                            showToast('AI note applied to review deck.', 'success');
                          }}
                          className="px-1.5 py-0.5 bg-slate-900 border border-indigo-750/30 rounded text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action values */}
                  <div className="border-t border-slate-700 pt-3">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-400 uppercase tracking-wider text-[9px] block">
                          Suggested Action: {aiSuggestedAction}
                        </span>
                        {aiSuggestedValue !== undefined && aiSuggestedValue !== null && (
                          <span className="text-slate-200 font-bold block mt-0.5 text-xs">
                            Set <span className="font-mono text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20">{activeException?.affectedField || 'value'}</span> → <strong className="text-emerald-400 font-extrabold">{aiSuggestedValue}</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-550 block font-semibold uppercase">Confidence</span>
                        <span className="text-lg font-extrabold text-slate-200 block">{aiConfidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI CTA Decision triggers */}
            {activeException && hasRunCopilot && userRole !== 'operator' && (
              <div className="pt-4 border-t border-slate-700 mt-4">
                <button
                  onClick={handleApplyAI}
                  disabled={reviewMutation.isPending}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-955 font-bold rounded-lg text-xs transition disabled:opacity-50 border-transparent"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Accept AI Recommendation</span>
                </button>
              </div>
            )}
          </div>

          {/* Human Review Decision Form */}
          {activeException && userRole !== 'operator' && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg">
              <h2 className="text-slate-250 font-bold text-sm mb-4 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Reviewer Decision Panel</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="notes" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Reviewer Notes / Justifications
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide resolution details or waiver reasons..."
                    className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReviewAction('waive_exception')}
                    disabled={reviewMutation.isPending}
                    className="py-2 px-3 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800/50 font-semibold text-xs text-center transition"
                  >
                    Waive exception
                  </button>
                  <button
                    onClick={() => handleReviewAction('request_correction')}
                    disabled={reviewMutation.isPending}
                    className="py-2 px-3 border border-rose-500 rounded-lg text-rose-400 hover:bg-rose-500/5 font-semibold text-xs text-center transition"
                  >
                    Request Correction
                  </button>
                </div>

                <button
                  onClick={() => handleReviewAction('approve_verification')}
                  disabled={reviewMutation.isPending}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold rounded-lg text-xs border-transparent transition"
                >
                  Verify Loan Record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ingestion Audit Trail Timeline */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg">
        <h2 className="text-slate-250 font-bold text-sm mb-5 flex items-center gap-1.5">
          <History className="h-4 w-4 text-slate-400" />
          <span>Audit Log Timeline</span>
        </h2>

        <div className="flow-root pl-2">
          <ul className="-mb-8">
            {auditTrail?.map((log, idx) => {
              const isLast = idx === auditTrail.length - 1;

              return (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-[1.5px] bg-slate-700" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3 items-start">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-slate-900 ${
                          (log.action || '').includes('INGEST') || (log.action || '').includes('IMPORT') ? 'bg-slate-800 text-slate-400' :
                          (log.action || '').includes('EXCEPTION') ? 'bg-rose-500/10 text-rose-400 border border-rose-550/20' :
                          (log.action || '').includes('RECOMMEND') ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-550/20' :
                          (log.action || '').includes('EDIT') ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-550/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-550/20'
                        }`}>
                          {(log.action || '').includes('INGEST') || (log.action || '').includes('IMPORT') ? <FileText className="h-4 w-4"/> :
                           (log.action || '').includes('EXCEPTION') ? <AlertTriangle className="h-4 w-4"/> :
                           (log.action || '').includes('RECOMMEND') ? <Sparkles className="h-4 w-4"/> :
                           <CheckCircle className="h-4 w-4"/>}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-slate-200">
                            {log.changeSummary}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 mt-1 block">
                          Actor: {log.actor} • Entity: {log.entityType}
                        </p>
                        
                        {/* Diff blocks */}
                        {log.diff && (
                          <div className="mt-2 text-[10px] font-mono p-2 bg-slate-950 border border-slate-700 rounded">
                            <span className="text-slate-500 block">Field: {log.diff.field}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-rose-450 line-through">before: {log.diff.before}</span>
                              <span className="text-slate-600">→</span>
                              <span className="text-emerald-400">after: {log.diff.after}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default LoanDetail;
