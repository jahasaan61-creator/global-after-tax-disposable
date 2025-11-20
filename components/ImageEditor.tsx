import React, { useState, useRef } from 'react';
import { editImageWithGemini } from '../services/geminiService';

export const ImageEditor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt.trim()) return;
    
    setLoading(true);
    try {
        // Extract base64 data without prefix
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];
        
        const resultBase64 = await editImageWithGemini(base64Data, prompt, mimeType);
        if (resultBase64) {
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);
        } else {
            alert("Failed to generate image. Please try a different prompt.");
        }
    } catch (e) {
        console.error(e);
        alert("Error connecting to Gemini. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `gemini_edit_${Date.now()}.png`;
        link.click();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-9 px-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border border-orange-300/50 text-[13px] font-bold text-white hover:brightness-110 transition shadow-sm flex items-center gap-2 active:scale-95 duration-150"
      >
        <i className="fas fa-magic"></i>
        <span className="hidden sm:inline">AI Editor</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
                        <i className="fas fa-wand-magic-sparkles text-white"></i>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Magic Image Editor</h3>
                        <p className="text-slate-400 text-xs font-medium">Powered by Gemini 2.5 Flash</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Source Image */}
                    <div className="space-y-3">
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Original Image</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all overflow-hidden relative ${!selectedImage ? 'bg-white' : ''}`}
                        >
                            {selectedImage ? (
                                <img src={selectedImage} alt="Original" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center p-4">
                                    <i className="fas fa-cloud-upload-alt text-3xl text-slate-300 mb-2"></i>
                                    <p className="text-sm text-slate-500 font-bold">Click to Upload</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                    </div>

                    {/* Result Image */}
                    <div className="space-y-3">
                        <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">Result</label>
                        <div className="aspect-square rounded-2xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden relative shadow-inner">
                            {loading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-orange-500 animate-pulse">Processing...</p>
                                </div>
                            ) : generatedImage ? (
                                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                            ) : (
                                <p className="text-xs text-slate-400 font-medium">AI Output will appear here</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Magic Prompt</label>
                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Add a retro filter, Remove the background..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={loading || !selectedImage || !prompt}
                            className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            Generate
                        </button>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                         <div className="flex gap-2">
                            {['Make it cyber-punk', 'Turn into a sketch', 'Add fireworks'].map((p, i) => (
                                <button key={i} onClick={() => setPrompt(p)} className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 hover:bg-slate-200 font-medium transition">
                                    {p}
                                </button>
                            ))}
                         </div>
                         {generatedImage && (
                             <button onClick={handleDownload} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                 <i className="fas fa-download"></i> Download
                             </button>
                         )}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
