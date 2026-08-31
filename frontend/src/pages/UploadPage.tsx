import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, FileSpreadsheet, Play, ArrowRight, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { simulateUploadFile } from '../services/mock/services.mock';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'loan_tape' | 'servicer_update' | 'document_manifest'>('loan_tape');
  
  // Progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [pct, setPct] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    processed: number;
    failed: number;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      showToast(`Selected file: ${file.name}`, 'info');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const isUnsupportedType = selectedFile
    ? !['.csv', '.xlsx', '.xls'].some((ext) => selectedFile.name.toLowerCase().endsWith(ext))
    : false;

  const startIngestion = async () => {
    if (!selectedFile || isUnsupportedType) return;

    setIsProcessing(true);
    setIsFinished(false);
    setPct(0);

    try {
      const job = await simulateUploadFile(
        selectedFile as any,
        fileType,
        'operator@demo.local',
        (phase, percent) => {
          setCurrentPhase(phase);
          setPct(percent);
        }
      );

      setResults({
        total: job.totalRecords,
        processed: job.processedRecords,
        failed: job.failedRecords
      });

      setIsFinished(true);
      showToast('File ingested and verified successfully', 'success');
    } catch (err) {
      showToast('Data validation check aborted', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setIsFinished(false);
    setResults(null);
    setPct(0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Import Loan Tape</h1>
        <p className="text-slate-400 text-sm mt-1">
          Simulate importing data tapes, updating records, or document manifests.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-indigo-500 to-indigo-500 opacity-80" />

        {!isProcessing && !isFinished && (
          <div className="space-y-6">
            {/* Form settings */}
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                File Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="block w-full px-3 py-2.5 border border-slate-700 rounded-lg bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold"
              >
                <option value="loan_tape">Primary Loan Tape</option>
                <option value="servicer_update">Servicer Update</option>
                <option value="document_manifest">Document Manifest</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Expected schema format: <strong className="text-slate-450 font-mono">{fileType === 'loan_tape' ? 'loan_tape.csv' : fileType === 'servicer_update' ? 'servicer_update.csv' : 'document_manifest.csv'}</strong>
              </p>
            </div>

            {/* Dropzone / Ingest block */}
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition cursor-pointer ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/10'
                }`}
              >
                <input
                  type="file"
                  id="file-upload-input"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <UploadCloud className="h-12 w-12 mb-4 text-slate-600" />

                <div className="text-center">
                  <span className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm block cursor-pointer">
                    Choose Data File
                  </span>
                  <span className="text-slate-500 text-xs mt-1 block">
                    Drag and drop your file here, or browse from your computer
                  </span>
                  <span className="text-[10px] text-slate-600 mt-3 font-semibold uppercase tracking-widest block">
                    CSV • XLSX • XLS
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="file"
                  id="file-upload-input"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {isUnsupportedType ? (
                  <div className="text-center p-6 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                    <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                    <span className="font-bold text-rose-455 block text-sm">Unsupported file type</span>
                    <span className="text-slate-500 text-xs mt-1 block font-medium">
                      Please select a CSV or Excel spreadsheet.
                    </span>
                  </div>
                ) : (
                  <div className="text-center p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Selected File</span>
                      <span className="font-mono text-sm font-bold text-slate-200 mt-2 block break-all">{selectedFile.name}</span>
                      <span className="text-xs text-slate-400 mt-1 block font-medium">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                      </span>
                      <span className="text-emerald-400 font-semibold text-xs mt-3 flex items-center gap-1 justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>✓ Supported file type</span>
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetUploader}
                    className="flex-1 py-2.5 px-4 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800/50 text-xs font-semibold transition"
                  >
                    Select Different File
                  </button>
                  <button
                    onClick={startIngestion}
                    disabled={isUnsupportedType}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 font-bold rounded-lg text-xs transition border border-transparent ${
                      isUnsupportedType
                        ? 'bg-slate-800 text-slate-650 cursor-not-allowed border border-slate-750'
                        : 'bg-indigo-500 hover:bg-indigo-400 text-slate-955'
                    }`}
                  >
                    <Play className="h-4 w-4" />
                    <span>Simulate Ingestion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="relative h-16 w-16 mb-6">
              {/* Outer circular spinner */}
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              {/* Center icon */}
              <div className="absolute inset-2 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-indigo-400">
                <FileSpreadsheet className="h-5 w-5 animate-pulse" />
              </div>
            </div>

            <span className="font-bold text-slate-200 text-sm mb-1">{currentPhase}</span>
            <span className="text-xs text-slate-500 mb-4">{pct}% complete</span>

            {/* Progress bar container */}
            <div className="w-64 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Finished Ingest Summary Screen */}
        {isFinished && results && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Import Completed</h3>
              <p className="text-slate-400 text-xs mt-1">
                Data tape successfully parsed and written to primary ledger.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/40 border border-slate-700 rounded-xl text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rows Read</span>
                <span className="text-xl font-extrabold text-slate-200 mt-1 block">{results.total}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valid Rows</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{results.processed}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Exceptions</span>
                <span className="text-xl font-extrabold text-rose-455 mt-1 block">{results.failed}</span>
              </div>
            </div>

            {/* Review warnings info widget */}
            {results.failed > 0 && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Exceptions Detected</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    The validation check found inconsistent inputs. These records require review, validation corrections, or waiver approvals.
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-700">
              <button
                onClick={resetUploader}
                className="flex-1 py-2.5 px-4 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800/50 transition font-semibold text-xs text-center"
              >
                Upload Another Sheet
              </button>
              
              <button
                onClick={() => navigate('/operator/history')}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>View Import History</span>
              </button>

              <button
                onClick={() => {
                  navigate('/operator');
                }}
                className="flex-1 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition border-transparent"
              >
                <span>View Corrections Needed</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default UploadPage;
