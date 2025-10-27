'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-webgl';
import * as fp from 'fingerpose';
import { uploadAvatar } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Camera, RefreshCw, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface WebcamCaptureProps {
  onCapture: (url: string) => void;
}

// Define "Three Fingers Up" gesture
const threeFingersUpGesture = new fp.GestureDescription('three_fingers_up');
for (const finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  threeFingersUpGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
  threeFingersUpGesture.addDirection(finger, fp.FingerDirection.VerticalUp, 1.0);
}
for (const finger of [fp.Finger.Thumb, fp.Finger.Pinky]) {
  threeFingersUpGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('Loading models...');
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();

  const loadHandposeModel = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      setStatus('Ready to capture. Show 3 fingers!');
    } catch (error) {
      console.error('Failed to load handpose model', error);
      setStatus('Error loading AI model. Please refresh.');
    }
  }, []);

  useEffect(() => {
    loadHandposeModel();
  }, [loadHandposeModel]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      setStatus('Photo captured!');
    }
  }, [webcamRef]);

  const detect = useCallback(async (net: handpose.HandPose) => {
    if (
      webcamRef.current &&
      typeof webcamRef.current.getScreenshot === 'function' &&
      webcamRef.current.video?.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const hands = await net.estimateHands(video);

      if (hands.length > 0) {
        const GE = new fp.GestureEstimator([threeFingersUpGesture]);
        const gesture = await GE.estimate(hands[0].landmarks, 8);
        if (gesture.gestures && gesture.gestures.length > 0) {
          const topGesture = gesture.gestures.reduce((prev, current) =>
            prev.score > current.score ? prev : current
          );
          if (topGesture.name === 'three_fingers_up' && topGesture.score > 0.9) {
            setIsDetecting(false); // Stop detection loop
            let count = 3;
            setCountdown(count);
            const countdownInterval = setInterval(() => {
              count--;
              setCountdown(count);
              if (count === 0) {
                clearInterval(countdownInterval);
                capture();
                setCountdown(null);
              }
            }, 1000);
          }
        }
      }
    }
  }, [capture]);
  
  useEffect(() => {
    if (model && isDetecting) {
      const detectionInterval = setInterval(() => {
        detect(model);
      }, 200); // Check for gesture every 200ms
      return () => clearInterval(detectionInterval);
    }
  }, [model, isDetecting, detect]);


  const handleUpload = async () => {
    if (!imgSrc) return;
    setIsUploading(true);
    setStatus('Uploading...');
    try {
      const blob = await (await fetch(imgSrc)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      const result = await uploadAvatar(formData);

      if (result.error || !result.data?.publicUrl) {
        throw new Error(result.error?.message || 'Upload failed.');
      }
      onCapture(result.data.publicUrl);
      setStatus('Upload complete!');
      toast({ title: 'Success', description: 'Your photo has been uploaded.' });
    } catch (error: any) {
      setStatus('Upload failed. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setImgSrc(null);
    setStatus('Ready to capture. Show 3 fingers!');
    setIsDetecting(false);
  };
  
  if (!model) {
      return (
          <div className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-muted-foreground" />
              <p className="font-medium">Loading AI Model</p>
              <p className="text-sm text-muted-foreground">Please wait a moment...</p>
          </div>
      )
  }

  return (
    <div className="w-full space-y-2">
      <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt="capture" className="h-full w-full object-cover" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="h-full w-full object-cover"
            mirrored
          />
        )}
        {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white text-8xl font-bold">{countdown}</p>
            </div>
        )}
      </div>
      <div className="text-center text-sm text-muted-foreground h-5">{status}</div>
      {imgSrc ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="w-full" disabled={isUploading}>
            <RefreshCw /> Retake
          </Button>
          <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            Upload
          </Button>
        </div>
      ) : (
        <Button onClick={() => setIsDetecting(true)} disabled={isDetecting} className="w-full">
          <Camera />
          {isDetecting ? 'Detecting Gesture...' : 'Start Gesture Capture'}
        </Button>
      )}
    </div>
  );
}
