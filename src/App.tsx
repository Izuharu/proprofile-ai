import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Download,
  Check,
  User,
  Briefcase,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  X,
  Maximize2,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Cropper from 'react-easy-crop';
import { Attire, Background, Mood, AspectRatio, CameraAngle, EyeContact, GenerationPreset, GeneratedImage } from './types';
import { getCroppedImg } from './canvasUtils';
import { ATTIRE_IMAGES, BACKGROUND_IMAGES } from './constants';

const ATTIRE_PROMPTS: Record<Attire, string> = {
  [Attire.FORMAL_SUIT]: "Formal Suit",
  [Attire.BUSINESS_CASUAL]: "Business Casual",
  [Attire.SMART_CASUAL]: "Smart Casual",
  [Attire.TECH_FOUNDER]: "Hoodie and t-shirt",
};

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [step, setStep] = useState<'upload' | 'crop' | 'presets' | 'generating' | 'results'>('upload');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [selectedPreset, setSelectedPreset] = useState<GenerationPreset>({
    attire: Attire.FORMAL_SUIT,
    background: Background.OFFICE,
    mood: Mood.CONFIDENT,
    cameraAngle: CameraAngle.FRONT,
    eyeContact: EyeContact.LOOKING_AT_CAMERA,
    aspectRatio: AspectRatio.SQUARE,
  });

  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const camInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setStep('crop');
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      const cropped = await getCroppedImg(sourceImage!, croppedAreaPixels);
      setCroppedImage(cropped);
      setStep('presets');
    } catch (e) {
      console.error(e);
    }
  };

  const triggerCamera = () => camInputRef.current?.click();
  const triggerUpload = () => fileInputRef.current?.click();

  const generateProfilePictures = async () => {
    if (!croppedImage) return;

    setStep('generating');
    setIsGenerating(true);
    setError(null);

    try {
      const base64Data = croppedImage.split(',')[1];
      const prompt = `Transform this person into a professional business profile picture. 
        Attire: ${ATTIRE_PROMPTS[selectedPreset.attire]}. 
        Background: ${selectedPreset.background}. 
        Mood: ${selectedPreset.mood}. 
        Camera Angle: ${selectedPreset.cameraAngle}.
        Eye Contact: ${selectedPreset.eyeContact}.
        Ensure the face remains recognizable but enhanced for a professional look. 
        The output should be a single, high-quality, centered headshot.`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: selectedPreset.aspectRatio as any,
            imageSize: '1K',
          }
        }
      });

      const newResults: GeneratedImage[] = [];

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          newResults.push({
            id: Math.random().toString(36).substr(2, 9),
            url: `data:image/png;base64,${part.inlineData.data}`,
            preset: { ...selectedPreset },
          });
        }
      }

      if (newResults.length === 0) {
        throw new Error("No image was generated. Please try again.");
      }

      setResults(newResults);
      setStep('results');
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate images. Please check your API key and try again.");
      setStep('presets');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setSourceImage(null);
    setCroppedImage(null);
    setResults([]);
    setStep('upload');
    setError(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const getAspectRatioValue = (ratio: AspectRatio) => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-linkedin/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-linkedin/5 rounded-full blur-2xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="shadow-sm">
            <img src="/img/favicon.svg" alt="ProProfile AI Logo" className="w-8 h-8 rounded-lg" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">ProProfile <span className="text-linkedin">AI</span></h1>
        </div>
        {(sourceImage || results.length > 0) && (
          <button
            onClick={reset}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="flex-1 px-6 py-8 relative z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900">Elevate Your Presence</h2>
                <p className="text-slate-500">Transform a simple selfie into a world-class business portrait in seconds.</p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={triggerCamera}
                  className="w-full aspect-[2/1] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white/50 hover:bg-white hover:border-linkedin transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-12 h-12 bg-linkedin/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-linkedin" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Take a Selfie</p>
                    <p className="text-xs text-slate-400">Use your camera</p>
                  </div>
                </button>

                <button
                  onClick={triggerUpload}
                  className="w-full aspect-[2/1] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white/50 hover:bg-white hover:border-linkedin transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-12 h-12 bg-linkedin/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-linkedin" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Upload a Photo</p>
                    <p className="text-xs text-slate-400">From your gallery</p>
                  </div>
                </button>

                <input
                  type="file"
                  ref={camInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="user"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex justify-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">LinkedIn Ready</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">AI Enhanced</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'crop' && (
            <motion.div
              key="crop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 flex flex-col h-full"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-slate-800">Adjust Photo</h2>
                <p className="text-sm text-slate-500">Move and scale to center your face</p>
              </div>

              <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-200 shadow-inner">
                <Cropper
                  image={sourceImage!}
                  crop={crop}
                  zoom={zoom}
                  aspect={getAspectRatioValue(selectedPreset.aspectRatio)}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-slate-400"><Move className="w-4 h-4" /></span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-linkedin h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-slate-400 font-mono text-xs">{zoom.toFixed(1)}x</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Object.values(AspectRatio).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setSelectedPreset(prev => ({ ...prev, aspectRatio: ratio }))}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${selectedPreset.aspectRatio === ratio
                        ? 'bg-linkedin text-white border-linkedin shadow-md'
                        : 'bg-white text-slate-500 border-slate-100'
                        }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <button
                  onClick={showCroppedImage}
                  className="w-full bg-linkedin text-white font-bold py-4 rounded-2xl shadow-xl shadow-linkedin/20 flex items-center justify-center gap-2"
                >
                  Continue to Styling
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                  <img src={croppedImage!} alt="Source" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Customize Style</h2>
                  <p className="text-sm text-slate-500">Select your professional look</p>
                </div>
              </div>

              <div className="space-y-6 pb-20">
                {/* Attire */}
                <section className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Attire
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(Attire).map((val) => (
                      <button
                        key={val}
                        onClick={() => setSelectedPreset(prev => ({ ...prev, attire: val }))}
                        className={`relative aspect-square rounded-2xl overflow-hidden transition-all group ${selectedPreset.attire === val
                          ? 'ring-4 ring-linkedin ring-offset-2'
                          : 'opacity-80 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={ATTIRE_IMAGES[val]}
                          alt={val}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 flex items-end p-3 bg-gradient-to-t ${selectedPreset.attire === val ? 'from-linkedin/90' : 'from-black/70'
                          } to-transparent`}>
                          <span className="text-white text-xs font-bold">{val}</span>
                        </div>
                        {selectedPreset.attire === val && (
                          <div className="absolute top-2 right-2 bg-linkedin text-white p-1 rounded-full shadow-lg">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Background */}
                <section className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Background
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(Background).map((val) => (
                      <button
                        key={val}
                        onClick={() => setSelectedPreset(prev => ({ ...prev, background: val }))}
                        className={`relative aspect-square rounded-2xl overflow-hidden transition-all group ${selectedPreset.background === val
                          ? 'ring-4 ring-linkedin ring-offset-2'
                          : 'opacity-80 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={BACKGROUND_IMAGES[val]}
                          alt={val}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 flex items-end p-3 bg-gradient-to-t ${selectedPreset.background === val ? 'from-linkedin/90' : 'from-black/70'
                          } to-transparent`}>
                          <span className="text-white text-xs font-bold">{val}</span>
                        </div>
                        {selectedPreset.background === val && (
                          <div className="absolute top-2 right-2 bg-linkedin text-white p-1 rounded-full shadow-lg">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Mood */}
                <section className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Mood
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(Mood).map((val) => (
                      <button
                        key={val}
                        onClick={() => setSelectedPreset(prev => ({ ...prev, mood: val }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all flex items-center justify-between ${selectedPreset.mood === val
                          ? 'bg-linkedin text-white shadow-md shadow-linkedin/20'
                          : 'bg-white text-slate-600 border border-slate-100 hover:border-linkedin/30'
                          }`}
                      >
                        {val}
                        {selectedPreset.mood === val && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Camera Angle */}
                <section className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera className="w-3 h-3" /> Camera Angle
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(CameraAngle).map((val) => (
                      <button
                        key={val}
                        onClick={() => setSelectedPreset(prev => ({ ...prev, cameraAngle: val }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedPreset.cameraAngle === val
                          ? 'bg-linkedin text-white shadow-md shadow-linkedin/20'
                          : 'bg-white text-slate-600 border border-slate-100 hover:border-linkedin/30'
                          }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Eye Contact */}
                <section className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Eye Contact
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(EyeContact).map((val) => (
                      <button
                        key={val}
                        onClick={() => setSelectedPreset(prev => ({ ...prev, eyeContact: val }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedPreset.eyeContact === val
                          ? 'bg-linkedin text-white shadow-md shadow-linkedin/20'
                          : 'bg-white text-slate-600 border border-slate-100 hover:border-linkedin/30'
                          }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 glass border-t border-white/20 z-20 max-w-md mx-auto">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-100">
                    <X className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                <button
                  onClick={generateProfilePictures}
                  className="w-full bg-linkedin hover:bg-linkedin-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-linkedin/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  Generate Professional Photo
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center space-y-8 py-20"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-linkedin/10 border-t-linkedin animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-linkedin animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Crafting Your Profile</h2>
                <p className="text-slate-500 max-w-[250px] mx-auto">Our AI is enhancing your photo with professional attire and studio lighting...</p>
              </div>

              <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-1/2 h-full bg-linkedin"
                />
              </div>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-slate-800">Your New Look</h2>
                <p className="text-sm text-slate-500">Ready for LinkedIn and your CV</p>
              </div>

              <div className="space-y-4">
                {results.map((img) => (
                  <div key={img.id} className="group relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                    <img src={img.url} alt="Result" className="w-full object-cover" style={{ aspectRatio: getAspectRatioValue(img.preset.aspectRatio) }} />
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between">
                      <div className="text-white">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Style</p>
                        <p className="font-medium">{img.preset.attire}</p>
                      </div>
                      <a
                        href={img.url}
                        download={`pro-profile-${img.id}.png`}
                        className="bg-white text-linkedin p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform active:scale-95"
                      >
                        <Download className="w-6 h-6" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('presets')}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Try Different Style
                </button>
                <button
                  onClick={reset}
                  className="flex-1 bg-linkedin text-white font-bold py-4 rounded-2xl shadow-lg shadow-linkedin/20 hover:bg-linkedin-dark transition-colors"
                >
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center space-y-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
          Powered by Gemini 3.1 Flash Image
        </p>
        <div className="h-px w-8 bg-slate-200 mx-auto" />
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
          © 2026 ProProfile AI. Build by <span className="text-linkedin">Vangart Lab.</span>
        </p>
      </footer>
    </div>
  );
}
