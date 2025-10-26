// components/recitation/AudioRecorder.jsx
import { useState } from 'react';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const playRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    }
  };

  return (
    <div className="mt-4">
      <button 
        onClick={isRecording ? stopRecording : startRecording} 
        className={`px-4 py-2 rounded ${isRecording ? 'bg-red-600' : 'bg-blue-600'} text-white`}
      >
        {isRecording ? 'إيقاف التسجيل' : 'ابدأ التسجيل'}
      </button>
      {audioBlob && (
        <div className="mt-2">
          <button 
            onClick={playRecording} 
            className="bg-green-600 text-white px-4 py-2 rounded ml-2"
          >
            تشغيل التسجيل
          </button>
          <a 
            href={audioBlob ? URL.createObjectURL(audioBlob) : '#'} 
            download="recording.webm"
            className="bg-gray-600 text-white px-4 py-2 rounded ml-2"
          >
            تحميل
          </a>
        </div>
      )}
    </div>
  );
}
